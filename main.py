import os
import uuid
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
# Import the correct client from the library
from elevenlabs.client import ElevenLabs

# --- The "Direct Line" API Key Setup ---
# This is the fix. We are setting the API key directly in the code.
# The library will now automatically use this key for all requests.
# ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
# PASTE YOUR NEW, REGENERATED ELEVENLABS API KEY HERE
API_KEY = "sk_6e8777037dcc1b235c817c3931f64419c996f028b83769e7" 
# ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

# --- Initialize the ElevenLabs Client ---
# This is the correct, modern way to initialize the client, as you discovered.
if "REPLACE" in API_KEY:
    raise SystemExit("❌ FATAL: You forgot to replace the placeholder API key in main.py!")
else:
    client = ElevenLabs(api_key=API_KEY)
    print("✅ SUCCESS: ElevenLabs client initialized successfully.")


# --- Basic Setup ---
app = Flask(__name__)
CORS(app)

# --- Define High-Quality Voice IDs ---
VOICE_ID_MALE = "pNInz6obpgDQGcFmaJgB"  # Adam
VOICE_ID_FEMALE = "21m00Tcm4TlvDq8ikWAM" # Rachel

# --- Folder for Storing Audio Files ---
AUDIO_FOLDER = os.path.join('static', 'audio')
os.makedirs(AUDIO_FOLDER, exist_ok=True)

# --- THE LEAN API ENDPOINT ---
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
        
        # 2. Use the initialized client to generate the audio.
        print("2. Making API call to ElevenLabs via official client...")
        audio_stream = client.generate(
            text=text,
            voice=voice_id,
            model="eleven_multilingual_v2"
        )

        # 3. Combine the streamed audio chunks into a single byte object in memory.
        audio_data = b"".join(chunk for chunk in audio_stream)

        if not audio_data:
            raise Exception("ElevenLabs returned empty audio data.")

        # 4. Save the final audio file.
        unique_filename = f"{uuid.uuid4()}.mp3"
        output_path = os.path.join(AUDIO_FOLDER, unique_filename)
        
        with open(output_path, 'wb') as f:
            f.write(audio_data)
        
        print(f"3. ✅ SUCCESS: Audio file saved to {output_path}")
        audio_url = f"{request.host_url}{output_path.replace(os.path.sep, '/')}"
        return jsonify({'audio_url': audio_url})

    except Exception as e:
        print(f"❌ An unexpected error occurred: {e}")
        return jsonify({'error': f'A critical internal server error occurred: {str(e)}'}), 500

@app.route('/static/audio/<path:filename>')
def serve_audio(filename):
    return send_from_directory(AUDIO_FOLDER, filename)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
