import os
import uuid
import requests
import io # Required for in-memory file handling
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from pydub import AudioSegment

# --- Basic Setup ---
app = Flask(__name__)
CORS(app)

# --- Securely Get API Key from Environment Variable ---
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
if not ELEVENLABS_API_KEY:
    raise SystemExit("❌ FATAL: ELEVENLABS_API_KEY environment variable is NOT SET. The app cannot start.")
else:
    print("✅ SUCCESS: ElevenLabs API Key was found.")

# --- Define High-Quality Voice IDs ---
VOICE_ID_MALE = "pNInz6obpgDQGcFmaJgB"  # Adam
VOICE_ID_FEMALE = "21m00Tcm4TlvDq8ikWAM" # Rachel

# --- Folder for Storing Final Audio Files ---
AUDIO_FOLDER = os.path.join('static', 'audio')
os.makedirs(AUDIO_FOLDER, exist_ok=True)

# --- THE NEW, HIGH-PERFORMANCE FUNCTION ---
# This function generates speech and returns the audio data directly in memory.
def generate_speech_in_memory(text, voice_id):
    print(f"Streaming audio from ElevenLabs for voice {voice_id}...")
    tts_url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY
    }
    data = {"text": text, "model_id": "eleven_multilingual_v2", "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}}

    response = requests.post(tts_url, json=data, headers=headers)
    
    if response.status_code == 200:
        # Instead of saving to a file, we load the audio data into an in-memory buffer.
        audio_buffer = io.BytesIO(response.content)
        audio_segment = AudioSegment.from_mp3(audio_buffer)
        print("✅ Successfully created audio segment in memory.")
        return audio_segment
    else:
        print(f"❌ ElevenLabs API Error: {response.status_code} - {response.text}")
        return None

# The main function to create the final paced audio
def create_paced_audio(text_question, text_answer, gender, unique_id):
    voice_id = VOICE_ID_MALE if gender == 'male' else VOICE_ID_FEMALE
    
    # Generate both audio parts in memory
    question_audio = generate_speech_in_memory(text_question, voice_id)
    answer_audio = generate_speech_in_memory(text_answer, voice_id)

    # If either failed, stop the process.
    if not question_audio or not answer_audio:
        return None

    # Combine the in-memory audio segments with pauses
    print("Combining in-memory audio segments...")
    silence_1_sec = AudioSegment.silent(duration=1000)
    silence_2_sec = AudioSegment.silent(duration=2000)
    
    final_audio = silence_1_sec + question_audio + silence_2_sec + answer_audio
    
    # Now, save ONLY the final combined file to disk
    final_output_path = os.path.join(AUDIO_FOLDER, f"{unique_id}_final.mp3")
    final_audio.export(final_output_path, format="mp3")
    print(f"✅ Final combined audio saved to: {final_output_path}")

    return final_output_path

# --- The Main API Endpoint ---
@app.route('/generate-tts', methods=['POST'])
def generate_tts_endpoint():
    try:
        data = request.json
        question, answer, gender = data.get('question'), data.get('answer'), data.get('gender', 'female')

        if not question or not answer:
            return jsonify({'error': 'Question and Answer are required'}), 400

        unique_id = str(uuid.uuid4())
        final_path = create_paced_audio(question, answer, gender, unique_id)
        
        if final_path:
            audio_url = f"{request.host_url}{final_path.replace(os.path.sep, '/')}"
            return jsonify({'audio_url': audio_url})
        else:
            raise Exception("Failed to create the final audio file.")

    except Exception as e:
        print(f"❌ An error occurred in the endpoint: {e}")
        return jsonify({'error': 'Internal server error during audio generation.'}), 500

@app.route('/static/audio/<path:filename>')
def serve_audio(filename):
    return send_from_directory(AUDIO_FOLDER, filename)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
