# Step 1: Start with a lean, official Python base image.
FROM python:3.10-slim

# Step 2: Set the working directory inside the container.
WORKDIR /app

# Step 3: Install system dependencies. pydub is no longer used, but ffmpeg is good practice for audio.
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Step 4: Copy the requirements file and install Python libraries.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Step 5: Copy the rest of the application code.
COPY . .

# Step 6: Expose the port our app will run on.
EXPOSE 10000

# Step 7: The command to run when the container starts.
CMD ["gunicorn", "--bind", "0.0.0.0:10000", "main:app"]
