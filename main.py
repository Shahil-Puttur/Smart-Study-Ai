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
        engine = pyttsx3.init()
        voices = engine.getProperty('voices')

        # Select voice based on gender
        # Note: Voice IDs can vary on different systems. 'espeak' voices are predictable.
        # We find voices that are English and match the desired gender.
        if gender == 'male':
            # Try to find a generic male English voice
            voice_id = next((v.id for v in voices if 'en' in v.lang and v.gender == 'male'), voices[0].id)
        else:
            # Default to a female voice
            voice_id = next((v.id for v in voices if 'en' in v.lang and v.gender == 'female'), voices[1].id if len(voices) > 1 else voices[0].id)
        
        engine.setProperty('voice', voice_id)

        # --- Generate Audio Segments ---
        
        # Segment 1: The fast question
        engine.setProperty('rate', 175) # A bit faster than normal
        question_path = os.path.join(AUDIO_FOLDER, f"{unique_id}_question.wav")
        engine.save_to_file(text_question, question_path)
        engine.runAndWait()

        # Segment 2: The slow answer
        engine.setProperty('rate', 145) # Slower, more deliberate teacher pace
        answer_path = os.path.join(AUDIO_FOLDER, f"{unique_id}_answer.wav")
        engine.save_to_file(text_answer, answer_path)
        engine.runAndWait()

        # --- Stitch Audio with Pydub ---
        
        silence_1_sec = AudioSegment.silent(duration=1000) # 1 second
        silence_2_sec = AudioSegment.silent(duration=2000) # 2 seconds

        question_audio = AudioSegment.from_wav(question_path)
        answer_audio = AudioSegment.from_wav(answer_path)

        # Combine all parts: [1s pause] + [Question] + [2s pause] + [Answer]
        final_audio = silence_1_sec + question_audio + silence_2_sec + answer_audio

        # Export the final combined audio
        final_output_path = os.path.join(AUDIO_FOLDER, f"{unique_id}_final.mp3")
        final_audio.export(final_output_path, format="mp3")
        
        # Clean up temporary WAV files
        os.remove(question_path)
        os.remove(answer_path)

        return final_output_path

    except Exception as e:
        print(f"Error in audio creation: {e}")
        return None

# --- The API Endpoint ---
@app.route('/generate-tts', methods=['POST'])
def generate_tts():
    try:
        data = request.json
        question = data.get('question')
        answer = data.get('answer')
        gender = data.get('gender', 'female') # Default to female if not provided

        if not question or not answer:
            return jsonify({'error': 'Question and Answer are required'}), 400

        unique_id = str(uuid.uuid4())
        
        final_path = create_paced_audio(question, answer, gender, unique_id)
        
        if final_path:
            audio_url = f"{request.host_url}{final_path.replace(os.path.sep, '/')}"
            return jsonify({'audio_url': audio_url})
        else:
            raise Exception("Failed to create paced audio file.")

    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({'error': 'Failed to process request'}), 500

# This allows Flask to serve the audio files from the static directory
@app.route('/static/audio/<path:filename>')
def serve_audio(filename):
    return send_from_directory(AUDIO_FOLDER, filename)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
