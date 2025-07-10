import os
import uuid
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from TTS.api import TTS

# --- Basic Setup ---
app = Flask(__name__)
CORS(app)  # Allows your frontend to talk to this backend

# --- Folder for Storing Audio Files ---
# This will create a 'static/audio' directory if it doesn't exist
AUDIO_FOLDER = os.path.join('static', 'audio')
os.makedirs(AUDIO_FOLDER, exist_ok=True)

# --- Load the TTS Model ---
# This is the most important step. We load the model ONCE when the server starts.
# This prevents reloading it on every request, which would be very slow.
print("Loading Coqui TTS model... This may take a moment.")
tts_model = TTS("tts_models/en/ljspeech/tacotron2-DDC")
print("TTS Model Loaded Successfully!")

# --- The API Endpoint ---
@app.route('/generate-tts', methods=['POST'])
def generate_tts():
    try:
        data = request.json
        text_to_speak = data.get('text')

        if not text_to_speak:
            return jsonify({'error': 'No text provided'}), 400

        # Generate a unique filename to prevent overwriting files
        unique_filename = f"{uuid.uuid4()}.wav"
        output_path = os.path.join(AUDIO_FOLDER, unique_filename)

        print(f"Generating audio for text: '{text_to_speak}'")
        # Use the pre-loaded model to generate the audio file
        tts_model.tts_to_file(text=text_to_speak, file_path=output_path)
        print(f"Audio file saved to: {output_path}")

        # Create a URL that the frontend can use to access the file
        # request.host_url gives the base URL (e.g., 'https://your-app.onrender.com/')
        audio_url = f"{request.host_url}{output_path.replace(os.path.sep, '/')}"

        return jsonify({'audio_url': audio_url})

    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({'error': 'Failed to process request'}), 500

# This allows Flask to serve the audio files from the static directory
@app.route('/static/audio/<path:filename>')
def serve_audio(filename):
    return send_from_directory(AUDIO_FOLDER, filename)

if __name__ == '__main__':
    # This runs the app locally for testing
    app.run(debug=True, port=5000)
