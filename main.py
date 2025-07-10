import os
import uuid
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from TTS.api import TTS

# --- Basic Setup ---
app = Flask(__name__)
CORS(app)

# --- Folder for Storing Audio Files ---
AUDIO_FOLDER = os.path.join('static', 'audio')
os.makedirs(AUDIO_FOLDER, exist_ok=True)

# --- Load the TTS Model (The Final Fix) ---
# We are now using the vits--neon model. It is the lightest, fastest English model
# they have, specifically designed to run on low-resource hardware like Render's free tier.
print("Loading Coqui TTS model (vits--neon ULTRA-LIGHTWEIGHT)...")
try:
    # ▼▼▼ THIS IS THE FINAL, FINAL FIX ▼▼▼
    # Old model: tts_model = TTS("tts_models/en/vctk/vits")
    # THE CORRECT MODEL:
    tts_model = TTS("tts_models/en/ljspeech/vits--neon")
    # ▲▲▲ THIS IS THE FINAL, FINAL FIX ▲▲▲
    print("TTS Model Loaded Successfully! The server is ready.")
except Exception as e:
    print(f"❌ FATAL: COULD NOT LOAD TTS MODEL! Error: {e}")
    tts_model = None


# --- The Main API Endpoint ---
@app.route('/generate-tts', methods=['POST'])
def generate_tts():
    if tts_model is None:
        return jsonify({'error': 'TTS model is not available on the server.'}), 503

    try:
        data = request.json
        text_to_speak = data.get('text')

        if not text_to_speak:
            return jsonify({'error': 'No text provided in the request'}), 400

        unique_filename = f"{uuid.uuid4()}.wav"
        output_path = os.path.join(AUDIO_FOLDER, unique_filename)

        print(f"Generating audio for text: '{text_to_speak}'")
        tts_model.tts_to_file(text=text_to_speak, file_path=output_path)
        print(f"Audio file saved to: {output_path}")

        audio_url = f"{request.host_url}{output_path.replace(os.path.sep, '/')}"
        return jsonify({'audio_url': audio_url})

    except Exception as e:
        print(f"An error occurred during TTS generation: {e}")
        return jsonify({'error': 'Failed to process the text-to-speech request'}), 500

# --- Route to Serve the Static Audio Files ---
@app.route('/static/audio/<path:filename>')
def serve_audio(filename):
    return send_from_directory(AUDIO_FOLDER, filename)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
