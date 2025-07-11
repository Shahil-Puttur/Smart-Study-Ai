import os
import uuid
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
# Import the official ElevenLabs library
import elevenlabs

# --- The "Direct Line" API Key Setup ---
# This is the fix. We are setting the API key directly in the code.
# The library will now automatically use this key for all requests.
# ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
# PASTE YOUR NEW, REGENERATED ELEVENLABS API KEY HERE
ELEVENLABS_API_KEY = "REPLACE_WITH_YOUR_NEW_ELEVENLABS_API_KEY" 
# ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

# Set the API key for the elevenlabs library
if "REPLACE" in ELEVENLABS_API_KEY:
    # This is a safety check to prevent deploying with the placeholder text.
    raise SystemExit("❌ FATAL: You forgot to replace the placeholder API key in main.py!")
else:
    elevenlabs.set_api_key(ELEVENLABS_API_KEY)
    print("✅ SUCCESS: ElevenLabs API Key has been set directly in the code.")


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
        
        # 2. Use the official library to generate the audio.
        # This streams the audio data directly, which is very efficient.
        print("2. Making API call to ElevenLabs via official library...")
        audio_stream = elevenlabs.generate(
            text=text,
            voice=elevenlabs.Voice(voice_id=voice_id),
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
        # This will now give us a very specific error if ElevenLabs fails.
        print(f"❌ An unexpected error occurred: {e}")
        return jsonify({'error': f'A critical internal server error occurred: {str(e)}'}), 500

@app.route('/static/audio/<path:filename>')
def serve_audio(filename):
    return send_from_directory(AUDIO_FOLDER, filename)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
