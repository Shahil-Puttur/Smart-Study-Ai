import os
import uuid
import sys
import traceback
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from TTS.api import TTS

# --- Basic Setup ---
app = Flask(__name__)
CORS(app)
AUDIO_FOLDER = os.path.join('static', 'audio')
os.makedirs(AUDIO_FOLDER, exist_ok=True)

# --- Global variable for the model ---
tts_model = None

# --- Professional Model Loading Function ---
def load_model():
    """
    Tries to load the TTS model. This is the most critical part.
    We are using a different VITS model which is very reliable.
    """
    global tts_model
    try:
        print("Attempting to load Coqui TTS model: tts_models/en/ljspeech/vits")
        # Using the LJSpeech VITS model - it's a workhorse, very stable.
        tts_model = TTS("tts_models/en/ljspeech/vits")
        print("✅ TTS Model Loaded Successfully!")
    except Exception as e:
        # This is the most important part for debugging.
        # It will print the FULL, DETAILED error to your Render logs.
        print("❌ FATAL: COULD NOT LOAD TTS MODEL!")
        print("------------------------------------")
        traceback.print_exc() # This prints the detailed error report.
        print("------------------------------------")
        # The app is useless without the model, so we explicitly set it to None.
        tts_model = None

# --- Load the model right when the server starts ---
load_model()

# --- The Main API Endpoint ---
@app.route('/generate-tts', methods=['POST'])
def generate_tts():
    # Check if the model failed to load during startup.
    # This is why you are seeing the error message!
    if tts_model is None:
        print("Request received, but TTS model is not loaded. Sending error response.")
        return jsonify({'error': 'TTS model is not available on the server.'}), 503

    try:
        data = request.json
        text_to_speak = data.get('text')

        if not text_to_speak:
            return jsonify({'error': 'No text provided'}), 400

        unique_filename = f"{uuid.uuid4()}.wav"
        output_path = os.path.join(AUDIO_FOLDER, unique_filename)

        print(f"Generating audio for: '{text_to_speak}'")
        tts_model.tts_to_file(text=text_to_speak, file_path=output_path)
        print(f"Audio file saved to: {output_path}")

        audio_url = f"{request.host_url}{output_path.replace(os.path.sep, '/')}"
        return jsonify({'audio_url': audio_url})

    except Exception as e:
        print(f"An error occurred during TTS generation: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Failed to process the text-to-speech request'}), 500

# --- Route to Serve the Static Audio Files ---
@app.route('/static/audio/<path:filename>')
def serve_audio(filename):
    return send_from_directory(AUDIO_FOLDER, filename)

# Health check endpoint for Render to know the app is running
@app.route('/')
def health_check():
    return "Backend is running!"

if __name__ == '__main__':
    app.run(debug=True, port=5000)
