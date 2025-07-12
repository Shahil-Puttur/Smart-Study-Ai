import os
import uuid
import asyncio
import wave
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import edge_tts

# --- Basic Setup ---
app = Flask(__name__)
CORS(app)

# --- UPGRADE: Indian English Voices ---
VOICE_MALE = "en-IN-PrabhatNeural"
VOICE_FEMALE = "en-IN-NeerjaNeural"

# --- Folder for Storing Audio Files ---
AUDIO_FOLDER = os.path.join('static', 'audio')
os.makedirs(AUDIO_FOLDER, exist_ok=True)

# --- Asynchronous function to generate a raw WAV file ---
async def generate_wav(text, voice, output_path):
    # We specify WAV output by changing the file extension.
    # We use a high-quality bitrate for the source audio.
    communicate = edge_tts.Communicate(text, voice, rate="+20%") # Question is slightly faster
    if "answer" in output_path:
        communicate = edge_tts.Communicate(text, voice) # Answer is at a normal pace
    
    await communicate.save(output_path)

# --- The API Endpoint with Lightweight Stitching ---
@app.route('/generate-paced-tts', methods=['POST'])
def generate_paced_tts_endpoint():
    try:
        data = request.json
        question_text = data.get('question')
        answer_text = data.get('answer')
        gender = data.get('gender', 'female')

        if not question_text or not answer_text:
            return jsonify({'error': 'Question and Answer are required'}), 400

        print(f"--- Starting Lightweight Stitch for gender: {gender} ---")
        
        voice_name = VOICE_MALE if gender == 'male' else VOICE_FEMALE
        unique_id = str(uuid.uuid4())
        
        # Define paths for our temporary and final files
        question_wav = os.path.join(AUDIO_FOLDER, f"{unique_id}_q.wav")
        answer_wav = os.path.join(AUDIO_FOLDER, f"{unique_id}_a.wav")
        pause_wav = os.path.join(AUDIO_FOLDER, f"{unique_id}_p.wav")
        combined_wav = os.path.join(AUDIO_FOLDER, f"{unique_id}_c.wav")
        final_mp3 = os.path.join(AUDIO_FOLDER, f"{unique_id}_final.mp3")

        # Step 1: Generate the separate WAV files asynchronously
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(generate_wav(question_text, voice_name, question_wav))
        loop.run_until_complete(generate_wav(answer_text, voice_name, answer_wav))
        print("1. Raw WAV files for question and answer generated.")

        # Step 2: Create a 2-second silent WAV file
        with wave.open(pause_wav, 'wb') as f:
            f.setnchannels(1)
            f.setsampwidth(2)
            f.setframerate(24000) # Standard rate for edge-tts
            f.writeframes(b'\x00' * 2 * 24000 * 2) # 2 seconds of silence
        print("2. 2-second silent WAV file created.")

        # Step 3: Stitch the WAV files together (lightweight method)
        infiles = [question_wav, pause_wav, answer_wav]
        with wave.open(combined_wav, 'wb') as outfile:
            for infile_path in infiles:
                with wave.open(infile_path, 'rb') as infile:
                    if not outfile.getnframes(): # Set params on first file
                        outfile.setparams(infile.getparams())
                    outfile.writeframes(infile.readframes(infile.getnframes()))
        print("3. All WAV files stitched together.")

        # Step 4: Convert the final WAV to MP3 using ffmpeg
        # This is a system command, which is very reliable inside Docker.
        os.system(f"ffmpeg -i {combined_wav} -vn -ar 44100 -ac 2 -b:a 192k {final_mp3}")
        print("4. Final MP3 converted using ffmpeg.")

        # Step 5: Clean up all the temporary WAV files
        for f in [question_wav, answer_wav, pause_wav, combined_wav]:
            os.remove(f)
        print("5. Temporary files cleaned up. Process complete.")

        # Step 6: Return the URL of the final MP3
        audio_url = f"{request.host_url}{final_mp3.replace(os.path.sep, '/')}"
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
