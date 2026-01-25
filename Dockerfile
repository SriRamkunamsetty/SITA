# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Install system dependencies for OpenCV and EasyOCR
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the container
COPY . .

# Create necessary directories
RUN mkdir -p uploads downloads

# Expose the port the app runs on (Hugging Face uses 7860 by default)
EXPOSE 7860

# Define environment variable for Flask
ENV FLASK_APP=app.py
ENV PORT=7860

# Run the application
CMD ["gunicorn", "--worker-class", "eventlet", "--workers", "1", "--threads", "100", "--bind", "0.0.0.0:7860", "app:app"]
