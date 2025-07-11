import os
import uuid
import requests
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from pydub import AudioSegment

# --- Basic Setup ---
app = Flask(__name__)
CORS(app)

# --- Securely Get API Key from Environment Variable (THE FAIL-FAST FIX) ---
# This is the most critical part. We check for the key immediately.
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
if not ELEVENLABS_API_KEY:
    # If the key isn't found, stop the server immediately and print a clear error.
    # This makes debugging on Render 100x easier.
    raise SystemExit("❌ FATAL: ELEVENLABS_API_KEY environment variable is NOT SET. The app cannot start.")
else:
    print("✅ SUCCESS: ElevenLabs API Key was found.")


# --- Define High-Quality Voice IDs ---
VOICE_ID_MALE = "pNInz6obpgDQGcFmaJgB"  # Adam
VOICE_ID_FEMALE = "21m00Tcm4TlvDq8ikWAM" # Rachel

# --- Folder for Storing Audio Files ---
AUDIO_FOLDER = os.path.join('static', 'audio')
os.makedirs(AUDIO_FOLDER, exist_ok=True)

# Helper function to generate speech from a single text block using ElevenLabs API
def generate_elevenlabs_speech(text, voice_id, output_path):
    print(f"Generating audio for voice {voice_id}...")
    tts_url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY  # The key is now guaranteed to exist here
    }
    data = {"text": text, "model_id": "eleven_multilingual_v2", "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}}

    response = requests.post(tts_url, json=data, headers=headers)
    if response.status_code == 200:
        with open(output_path, 'wb') as f:
            f.write(response.content)
        print(f"Successfully generated audio at {output_path}")
        return True
    else:
        # This will now clearly show the error from ElevenLabs in your logs
        print(f"❌ ElevenLabs API Error: {response.status_code} - {response.text}")
        return False

# Function to create the professionally paced audio
def create_paced_audio(text_question, text_answer, gender, unique_id):
    voice_id = VOICE_ID_MALE if gender == 'male' else VOICE_ID_FEMALE
    
    question_path = os.path.join(AUDIO_FOLDER, f"{unique_id}_question.mp3")
    answer_path = os.path.join(AUDIO_FOLDER, f"{unique_id}_answer.mp3")

    if not generate_elevenlabs_speech(text_question, voice_id, question_path): return None
    if not generate_elevenlabs_speech(text_answer, voice_id, answer_path): return None

    print("Combining audio files with pauses...")
    silence_1_sec = AudioSegment.silent(duration=1000)
    silence_2_sec = AudioSegment.silent(duration=2000)
    
    question_audio = AudioSegment.from_mp3(question_path)
    answer_audio = AudioSegment.from_mp3(answer_path)

    final_audio = silence_1_sec + question_audio + silence_2_sec + answer_audio
    final_output_path = os.path.join(AUDIO_FOLDER, f"{unique_id}_final.mp3")
    final_audio.export(final_output_path, format="mp3")
    print("Final MP3 exported.")

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
