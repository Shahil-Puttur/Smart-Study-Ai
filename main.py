import os
import uuid
import pyttsx3
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from pydub import AudioSegment

# --- Basic Setup ---
app = Flask(__name__)
CORS(app)

# --- Folder for Storing Audio Files ---
AUDIO_FOLDER = os.path.join('static', 'audio')
os.makedirs(AUDIO_FOLDER, exist_ok=True)

# --- Function to generate the professionally paced audio ---
def create_paced_audio(text_question, text_answer, gender='female', unique_id='default'):
    try:
        print("--- Starting Audio Generation ---")
        
        # Initialize the TTS Engine
        print("1. Initializing pyttsx3 engine...")
        engine = pyttsx3.init()
        
        # Get available voices
        voices = engine.getProperty('voices')
        if not voices:
            print("❌ FATAL: No voices found by pyttsx3. Make sure espeak-ng is installed correctly.")
            return None
        
        print(f"2. Found {len(voices)} voices. Selecting a voice for gender: {gender}...")
        
        # Select voice based on gender
        if gender == 'male':
            voice_id = next((v.id for v in voices if 'english' in v.name.lower() and v.gender == 'male'), None)
        else: # female
            voice_id = next((v.id for v in voices if 'english' in v.name.lower() and v.gender == 'female'), None)
        
        # Fallback if no specific gendered voice is found
        if voice_id is None:
            print("⚠️ WARNING: No specific gendered voice found. Using default voice.")
            voice_id = voices[0].id
        
        engine.setProperty('voice', voice_id)
        print(f"3. Voice selected: {voice_id}")

        # Generate Question Audio (Faster)
        print("4. Generating Question audio...")
        engine.setProperty('rate', 175)
        question_path = os.path.join(AUDIO_FOLDER, f"{unique_id}_question.wav")
        engine.save_to_file(text_question, question_path)
        engine.runAndWait()

        # Generate Answer Audio (Slower)
        print("5. Generating Answer audio...")
        engine.setProperty('rate', 145)
        answer_path = os.path.join(AUDIO_FOLDER, f"{unique_id}_answer.wav")
        engine.save_to_file(text_answer, answer_path)
        engine.runAndWait()
        print("6. Raw audio files generated successfully.")

        # Stitch Audio with Pydub
        print("7. Combining audio files with pauses...")
        silence_1_sec = AudioSegment.silent(duration=1000)
        silence_2_sec = AudioSegment.silent(duration=2000)

        question_audio = AudioSegment.from_wav(question_path)
        answer_audio = AudioSegment.from_wav(answer_path)

        final_audio = silence_1_sec + question_audio + silence_2_sec + answer_audio

        # Export the final combined audio to MP3
        final_output_path = os.path.join(AUDIO_FOLDER, f"{unique_id}_final.mp3")
        final_audio.export(final_output_path, format="mp3")
        print(f"8. Final MP3 exported to: {final_output_path}")

        # Clean up temporary WAV files
        os.remove(question_path)
        os.remove(answer_path)
        print("9. Temporary files cleaned up. Process complete.")

        return final_output_path

    except Exception as e:
        print(f"❌ ERROR in audio creation pipeline: {e}")
        return None

# --- The API Endpoint ---
@app.route('/generate-tts', methods=['POST'])
def generate_tts():
    try:
        data = request.json
        question = data.get('question')
        answer = data.get('answer')
        gender = data.get('gender', 'female')

        if not question or not answer:
            return jsonify({'error': 'Question and Answer are required'}), 400

        unique_id = str(uuid.uuid4())
        
        final_path = create_paced_audio(question, answer, gender, unique_id)
        
        if final_path:
            audio_url = f"{request.host_url}{final_path.replace(os.path.sep, '/')}"
            return jsonify({'audio_url': audio_url})
        else:
            raise Exception("create_paced_audio returned None.")

    except Exception as e:
        print(f"An error occurred in the /generate-tts endpoint: {e}")
        return jsonify({'error': 'Internal server error during audio generation.'}), 500

# --- Route to Serve Static Audio Files ---
@app.route('/static/audio/<path:filename>')
def serve_audio(filename):
    return send_from_directory(AUDIO_FOLDER, filename)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
