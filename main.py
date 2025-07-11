import os
import uuid
import asyncio
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
# Import the edge-tts library
import edge_tts

# --- Basic Setup ---
app = Flask(__name__)
CORS(app)

# --- Define High-Quality Voice Names for Edge TTS ---
# These are standard, high-quality neural voices.
VOICE_MALE = "en-US-GuyNeural"
VOICE_FEMALE = "en-US-JennyNeural"

# --- Folder for Storing Audio Files ---
AUDIO_FOLDER = os.path.join('static', 'audio')
os.makedirs(AUDIO_FOLDER, exist_ok=True)

# --- Asynchronous function to generate and save speech ---
# This is where the core logic happens. It's 'async' because edge-tts is.
async def generate_and_save_speech(text, voice, output_path):
    print(f"Generating audio with voice: {voice}")
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_path)
    print(f"✅ Audio file saved to {output_path}")

# --- THE LEAN API ENDPOINT ---
# This is a standard Flask route, which is synchronous.
@app.route('/generate-single-tts', methods=['POST'])
def generate_single_tts_endpoint():
    try:
        data = request.json
        text = data.get('text')
        gender = data.get('gender', 'female')

        if not text:
            return jsonify({'error': 'Text is required'}), 400

        print(f"--- Received request for gender: {gender} ---")
        
        voice_name = VOICE_MALE if gender == 'male' else VOICE_FEMALE
        unique_filename = f"{uuid.uuid4()}.mp3"
        output_path = os.path.join(AUDIO_FOLDER, unique_filename)

        # This is the crucial bridge: We run our async function from our sync route.
        # This is the professional way to handle this.
        print("Bridging to asyncio to run edge-tts...")
        asyncio.run(generate_and_save_speech(text, voice_name, output_path))
        
        # Construct the full URL to send back to the frontend
        audio_url = f"{request.host_url}{output_path.replace(os.path.sep, '/')}"
        return jsonify({'audio_url': audio_url})

    except Exception as e:
        print(f"❌ An unexpected error occurred: {e}")
        return jsonify({'error': 'A critical internal server error occurred.'}), 500

# This route serves the generated audio files
@app.route('/static/audio/<path:filename>')
def serve_audio(filename):
    return send_from_directory(AUDIO_FOLDER, filename)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
