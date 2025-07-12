# Step 1: Start with our lean Python base.
FROM python:3.10-slim

# Step 2: Set the working directory.
WORKDIR /app

# Step 3: Install ffmpeg, a good utility for any audio work.
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Step 4: Copy and install our Python libraries.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Step 5: Copy the rest of our application code.
COPY . .

# Step 6: Expose the port our app will run on.
EXPOSE 10000

# Step 7: The command to run when the container starts.
CMD ["gunicorn", "--bind", "0.0.0.0:10000", "main:app"]
