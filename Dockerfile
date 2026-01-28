# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Install system dependencies for OpenCV and EasyOCR
# Fixed: libgl1-mesa-glx is replaced by libgl1 in newer Debian images
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Create a non-root user for Hugging Face (UID 1000)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Set directory ownership
WORKDIR $HOME/app

# Copy the requirements file into the container
COPY --chown=user requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir --user -r requirements.txt

# Copy the rest of the application code
COPY --chown=user . .

# Create necessary directories with correct permissions
RUN mkdir -p uploads downloads

# Expose the port (Hugging Face runs on 7860)
EXPOSE 7860

# Define environment variables
ENV FLASK_APP=app.py
ENV PORT=7860

# Run the application
CMD ["gunicorn", "--worker-class", "eventlet", "--workers", "1", "--threads", "100", "--timeout", "1000", "--bind", "0.0.0.0:7860", "app:app"]
