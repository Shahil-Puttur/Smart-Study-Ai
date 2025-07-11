# Step 1: Start with the same lean Python base.
FROM python:3.10-slim

# Step 2: Set the working directory.
WORKDIR /app

# Step 3: Install ALL required system dependencies.
# THIS IS THE FIX: We are now installing 'espeak-ng-data' which contains the actual voices.
# We also add a cleanup step to keep the image small, which is a professional practice.
RUN apt-get update && apt-get install -y espeak-ng espeak-ng-data ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Step 4: Copy and install our Python libraries.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Step 5: Copy the rest of our application code.
COPY . .

# Step 6: Expose the port our app will run on.
EXPOSE 10000

# Step 7: The command to run when the container starts.
CMD ["gunicorn", "--bind", "0.0.0.0:10000", "main:app"]
