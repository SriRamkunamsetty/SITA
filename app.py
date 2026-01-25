from flask import Flask, render_template, request, send_file, jsonify
import os
import uuid
import csv
import threading
import logging
from processor import SITAProcessor

from flask_cors import CORS

app = Flask(__name__, template_folder='SITA-frontend', static_folder='SITA-frontend')
CORS(app) # Enable CORS for all routes

# Configuration
UPLOAD_FOLDER = 'uploads'
DOWNLOAD_FOLDER = os.path.abspath('downloads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['DOWNLOAD_FOLDER'] = DOWNLOAD_FOLDER

# Initialize Processor
processor = SITAProcessor()

# Global Job State
job_lock = threading.Lock()
current_job = {
    "status": "idle",
    "counters": {"total": 0, "cars": 0, "bikes": 0, "trucks": 0},
    "id": None,
    "video_link": None,
    "csv_link": None,
    "error": None
}

def update_progress(counters):
    with job_lock:
        current_job["counters"] = counters

def background_process(filepath, csv_path, video_path):
    global current_job
    try:
        with job_lock:
            current_job["status"] = "processing"
            current_job["counters"] = {"total": 0, "cars": 0, "bikes": 0, "trucks": 0}
        
        final_counters = processor.process_video(filepath, csv_path, video_path, update_callback=update_progress)
        
        with job_lock:
            current_job["counters"] = final_counters
            current_job["status"] = "completed"
            current_job["video_link"] = os.path.basename(video_path)
            current_job["csv_link"] = os.path.basename(csv_path)
        
    except Exception as e:
        logger.error(f"Processing failed: {e}")
        with job_lock:
            current_job["status"] = "error"
            current_job["error"] = str(e)


@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

@app.route('/upload_video', methods=['POST'])
def upload_video():
    global current_job
    
    if 'video' not in request.files:
        return {'error': 'No file part'}, 400
    
    file = request.files['video']
    if file.filename == '':
        return {'error': 'No selected file'}, 400
    
    if file:
        job_id = str(uuid.uuid4())
        filename = job_id + "_" + file.filename
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Paths
        csv_filename = os.path.splitext(filename)[0] + '.csv'
        csv_path = os.path.join(app.config['DOWNLOAD_FOLDER'], csv_filename)
        video_filename = os.path.splitext(filename)[0] + '_processed.mp4'
        video_path = os.path.join(app.config['DOWNLOAD_FOLDER'], video_filename)
        
        # Reset Job State
        with job_lock:
            current_job = {
                "status": "starting",
                "id": job_id,
                "counters": {"total": 0, "cars": 0, "bikes": 0, "trucks": 0},
                "video_link": None,
                "csv_link": None,
                "error": None
            }

        # Start Thread
        thread = threading.Thread(target=background_process, args=(filepath, csv_path, video_path))
        thread.start()
        
        return {"success": True, "message": "Processing started", "job_id": job_id}

@app.route('/status', methods=['GET'])
def get_status():
    with job_lock:
        return jsonify(current_job)

@app.route('/traffic_report', methods=['GET'])
def get_report():
    # Returns the JSON data of the COMPLETED job
    if not current_job["csv_link"]:
        return {"rows": []}
    
    csv_path = os.path.join(app.config['DOWNLOAD_FOLDER'], current_job["csv_link"])
    rows = []
    if os.path.exists(csv_path):
        with open(csv_path, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                rows.append(row)
    
    return jsonify({
        "columns": ["vehicle_type", "color", "number_plate", "frame"],
        "data": rows
    })

@app.route('/download/<filename>')
def download_file(filename):
    return send_file(os.path.join(app.config['DOWNLOAD_FOLDER'], filename), as_attachment=True)

if __name__ == '__main__':
    print("Starting SITA VIVA-SAFE Server...")
    app.run(host='0.0.0.0', port=5000, debug=True)
