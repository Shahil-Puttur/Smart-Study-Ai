import os
import uuid
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from TTS.api import TTS

# --- Basic Setup ---
# Initialize the Flask application
app = Flask(__name__)
# Enable Cross-Origin Resource Sharing (CORS) to allow your frontend to communicate with this backend
CORS(app)

# --- Folder for Storing Audio Files ---
# Create a path to a 'static/audio' directory. This is where we'll save the generated audio.
# The 'os.makedirs' function will create this directory if it doesn't already exist.
AUDIO_FOLDER = os.path.join('static', 'audio')
os.makedirs(AUDIO_FOLDER, exist_ok=True)

# --- Load the TTS Model (The Professional Way) ---
# We load the model ONCE when the server starts up. This is critical for performance.
# Reloading the model on every user request would be extremely slow.
# The VITS model is much smaller and faster than Tacotron, making it ideal for free hosting services like Render.
print("Loading Coqui TTS model (VITS)... This may take a moment.")
try:
    tts_model = TTS("tts_models/en/vctk/vits")
    print("TTS Model Loaded Successfully!")
except Exception as e:
    print(f"FATAL: Could not load TTS model. Error: {e}")
    # If the model fails to load, the server is useless, so we should be aware.
    tts_model = None

# --- The Main API Endpoint ---
# This is the URL your frontend will call (e.g., 'https://your-app.onrender.com/generate-tts')
@app.route('/generate-tts', methods=['POST'])
def generate_tts():
    # First, check if the TTS model was loaded successfully on startup.
    if tts_model is None:
        return jsonify({'error': 'TTS model is not available on the server.'}), 503 # Service Unavailable

    try:
        # Get the JSON data sent from the frontend
        data = request.json
        text_to_speak = data.get('text')

        # Basic validation: make sure the user actually sent some text
        if not text_to_speak:
            return jsonify({'error': 'No text provided in the request'}), 400 # Bad Request

        # Generate a unique filename using UUID to prevent two users from overwriting each other's files
        unique_filename = f"{uuid.uuid4()}.wav"
        output_path = os.path.join(AUDIO_FOLDER, unique_filename)

        print(f"Generating audio for text: '{text_to_speak}'")
        # This is where the magic happens: the pre-loaded model generates the speech and saves it to a file.
        tts_model.tts_to_file(text=text_to_speak, file_path=output_path)
        print(f"Audio file saved to: {output_path}")

        # Construct a full, public URL for the newly created audio file.
        # The frontend will use this URL to play the audio.
        # request.host_url provides the base URL of your app (e.g., 'https://your-app.onrender.com/')
        audio_url = f"{request.host_url}{output_path.replace(os.path.sep, '/')}"

        # Send a successful response back to the frontend with the audio URL
        return jsonify({'audio_url': audio_url})

    except Exception as e:
        # If anything goes wrong during the process, log the error and send a generic error message.
        print(f"An error occurred during TTS generation: {e}")
        return jsonify({'error': 'Failed to process the text-to-speech request'}), 500 # Internal Server Error

# --- Route to Serve the Static Audio Files ---
# This special route allows the browser to directly access the audio files we just created.
# For example, when the browser requests '.../static/audio/some-uuid.wav', this function will find and return that file.
@app.route('/static/audio/<path:filename>')
def serve_audio(filename):
    return send_from_directory(AUDIO_FOLDER, filename)

# This part of the code only runs if you execute the script directly (e.g., 'python main.py')
# It's used for local testing on your own computer. gunicorn does not use this.
if __name__ == '__main__':
    app.run(debug=True, port=5000)
