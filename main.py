import os
import uuid
import asyncio
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import edge_tts

# --- Basic Setup ---
app = Flask(__name__)
CORS(app)

# --- Indian English Voices ---
VOICE_MALE = "en-IN-PrabhatNeural"
VOICE_FEMALE = "en-IN-NeerjaNeural"

# --- Folder for Storing Audio Files ---
AUDIO_FOLDER = os.path.join('static', 'audio')
os.makedirs(AUDIO_FOLDER, exist_ok=True)

# --- Asynchronous function to generate a single speech file ---
async def generate_speech(text, voice, output_path):
    print(f"Generating audio with voice: {voice}")
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_path)
    print(f"✅ Audio file saved to {output_path}")

# --- THE FINAL, LEAN API ENDPOINT ---
# This endpoint now generates a single audio clip and returns its URL.
@app.route('/generate-single-tts', methods=['POST'])
def generate_single_tts_endpoint():
    try:
        data = request.json
        text = data.get('text')
        gender = data.get('gender', 'female')

        if not text:
            return jsonify({'error': 'Text is required'}), 400

        print(f"--- Received request for single audio (gender: {gender}) ---")
        
        voice_name = VOICE_MALE if gender == 'male' else VOICE_FEMALE
        unique_filename = f"{uuid.uuid4()}.mp3"
        output_path = os.path.join(AUDIO_FOLDER, unique_filename)

        # Run the asynchronous generation function
        asyncio.run(generate_speech(text, voice_name, output_path))
        
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
