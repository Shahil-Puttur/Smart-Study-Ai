import os
import uuid
import requests
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from pydub import AudioSegment

# --- Basic Setup ---
app = Flask(__name__)
CORS(app)

# --- Securely Get API Key from Environment Variable ---
# This is the professional way. Your key is safe on Render, not in your code.
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
if not ELEVENLABS_API_KEY:
    print("❌ FATAL: ELEVENLABS_API_KEY environment variable not set.")

# --- Define High-Quality Voice IDs ---
# These are excellent, standard voices from ElevenLabs.
# Male Voice: "Adam"
VOICE_ID_MALE = "pNInz6obpgDQGcFmaJgB"
# Female Voice: "Rachel"
VOICE_ID_FEMALE = "21m00Tcm4TlvDq8ikWAM"

# --- Folder for Storing Audio Files ---
AUDIO_FOLDER = os.path.join('static', 'audio')
os.makedirs(AUDIO_FOLDER, exist_ok=True)

# Helper function to generate speech from a single text block using ElevenLabs API
def generate_elevenlabs_speech(text, voice_id, output_path):
    print(f"Generating audio for voice {voice_id}...")
    tts_url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = { "Accept": "audio/mpeg", "Content-Type": "application/json", "xi-api-key": ELEVENLABS_API_KEY }
    data = { "text": text, "model_id": "eleven_multilingual_v2", "voice_settings": { "stability": 0.5, "similarity_boost": 0.75 } }

    response = requests.post(tts_url, json=data, headers=headers)
    if response.status_code == 200:
        with open(output_path, 'wb') as f:
            f.write(response.content)
        print(f"Successfully generated audio at {output_path}")
        return True
    else:
        print(f"❌ ElevenLabs API Error: {response.status_code} - {response.text}")
        return False

# Function to create the professionally paced audio
def create_paced_audio(text_question, text_answer, gender, unique_id):
    voice_id = VOICE_ID_MALE if gender == 'male' else VOICE_ID_FEMALE
    
    # Paths for the temporary audio files
    question_path = os.path.join(AUDIO_FOLDER, f"{unique_id}_question.mp3")
    answer_path = os.path.join(AUDIO_FOLDER, f"{unique_id}_answer.mp3")

    # Generate question and answer audio separately
    if not generate_elevenlabs_speech(text_question, voice_id, question_path):
        return None
    if not generate_elevenlabs_speech(text_answer, voice_id, answer_path):
        return None

    # Stitch audio with pydub
    print("Combining audio files with pauses...")
    silence_1_sec = AudioSegment.silent(duration=1000)
    silence_2_sec = AudioSegment.silent(duration=2000)
    
    question_audio = AudioSegment.from_mp3(question_path)
    answer_audio = AudioSegment.from_mp3(answer_path)

    final_audio = silence_1_sec + question_audio + silence_2_sec + answer_audio

    final_output_path = os.path.join(AUDIO_FOLDER, f"{unique_id}_final.mp3")
    final_audio.export(final_output_path, format="mp3")
    print("Final MP3 exported.")

    # Clean up temporary files
    os.remove(question_path)
    os.remove(answer_path)

    return final_output_path

# --- The Main API Endpoint ---
@app.route('/generate-tts', methods=['POST'])
def generate_tts_endpoint():
    try:
        data = request.json
        question = data.get('question')
        answer = data.get('answer')
        gender = data.get('gender', 'female')

        if not question or not answer:
            return jsonify({'error': 'Question and Answer are required'}), 400

        unique_id = str(uuid.uuid4())
        final_path = create_paced_audio(question, answer, gender, unique_id)
        
        if final_path:
            audio_url = f"{request.host_url}{final_path.replace(os.path.sep, '/')}"
            return jsonify({'audio_url': audio_url})
        else:
            raise Exception("Failed to create paced audio file.")

    except Exception as e:
        print(f"An error occurred in the endpoint: {e}")
        return jsonify({'error': 'Internal server error during audio generation.'}), 500

@app.route('/static/audio/<path:filename>')
def serve_audio(filename):
    return send_from_directory(AUDIO_FOLDER, filename)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
