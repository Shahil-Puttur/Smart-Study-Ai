# Step 1: Start with a lean, official Python base image.
FROM python:3.10-slim

# Step 2: Set the working directory inside our "computer-in-a-box".
WORKDIR /app

# Step 3: Install the system-level dependencies.
# pyttsx3 on Linux needs the eSpeak-NG engine to actually speak. This is the crucial step.
RUN apt-get update && apt-get install -y espeak-ng ffmpeg

# Step 4: Copy the requirements file and install our Python libraries.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Step 5: Copy the rest of our application code into the box.
COPY . .

# Step 6: Tell the world that our application will be listening on port 10000.
EXPOSE 10000

# Step 7: The command to run when the box starts.
# This starts our Python server using gunicorn, making it ready for production.
CMD ["gunicorn", "--bind", "0.0.0.0:10000", "main:app"]
