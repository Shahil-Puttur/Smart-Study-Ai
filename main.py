import os
import uuid
import requests
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# --- Basic Setup ---
app = Flask(__name__)
CORS(app)

# --- Securely Get API Key ---
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
if not ELEVENLABS_API_KEY:
    raise SystemExit("❌ FATAL: ELEVENLABS_API_KEY environment variable is NOT SET.")
else:
    print("✅ SUCCESS: ElevenLabs API Key was found.")

# --- Define High-Quality Voice IDs ---
VOICE_ID_MALE = "pNInz6obpgDQGcFmaJgB"  # Adam
VOICE_ID_FEMALE = "21m00Tcm4TlvDq8ikWAM" # Rachel

# --- Folder for Storing Audio Files ---
AUDIO_FOLDER = os.path.join('static', 'audio')
os.makedirs(AUDIO_FOLDER, exist_ok=True)

# --- THE NEW, LEAN API ENDPOINT ---
# This endpoint now generates a single audio clip and returns its URL.
@app.route('/generate-single-tts', methods=['POST'])
def generate_single_tts_endpoint():
    try:
        data = request.json
        text = data.get('text')
        gender = data.get('gender', 'female')

        if not text:
            return jsonify({'error': 'Text is required'}), 400

        print(f"--- Generating single audio for gender: {gender} ---")
        
        voice_id = VOICE_ID_MALE if gender == 'male' else VOICE_ID_FEMALE
        print(f"1. Voice selected: {voice_id}")

        tts_url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        headers = { "Accept": "audio/mpeg", "Content-Type": "application/json", "xi-api-key": ELEVENLABS_API_KEY }
        api_data = { "text": text, "model_id": "eleven_multilingual_v2", "voice_settings": { "stability": 0.5, "similarity_boost": 0.75 } }

        print(f"2. Making API call for text: '{text[:30]}...'")
        response = requests.post(tts_url, json=api_data, headers=headers)
        
        if response.status_code == 200:
            unique_filename = f"{uuid.uuid4()}.mp3"
            output_path = os.path.join(AUDIO_FOLDER, unique_filename)
            
            with open(output_path, 'wb') as f:
                f.write(response.content)
            
            print(f"3. ✅ SUCCESS: Audio file saved to {output_path}")
            audio_url = f"{request.host_url}{output_path.replace(os.path.sep, '/')}"
            return jsonify({'audio_url': audio_url})
        else:
            print(f"❌ ElevenLabs API Error: {response.status_code} - {response.text}")
            return jsonify({'error': f'ElevenLabs API failed: {response.text}'}), response.status_code

    except Exception as e:
        print(f"❌ An unexpected error occurred: {e}")
        return jsonify({'error': 'A critical internal server error occurred.'}), 500

@app.route('/static/audio/<path:filename>')
def serve_audio(filename):
    return send_from_directory(AUDIO_FOLDER, filename)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
