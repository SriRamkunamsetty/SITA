from flask import Flask, render_template, request, send_file, jsonify, send_from_directory
import os
import uuid
import csv
import threading
import logging
import json
import time
from processor import SITAProcessor
from flask_cors import CORS
import shutil

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# Configuration
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, 'frontend')

app = Flask(__name__, 
            template_folder=FRONTEND_DIR, 
            static_folder=FRONTEND_DIR, 
            static_url_path='')
CORS(app) # Enable CORS for all routes

# Configuration
UPLOAD_FOLDER = 'uploads'
DOWNLOAD_FOLDER = os.path.abspath('downloads')
DATA_FILE = 'users.json'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['DOWNLOAD_FOLDER'] = DOWNLOAD_FOLDER

def cleanup_temp_folders():
    """Purges upload and download directories on startup."""
    for folder in [UPLOAD_FOLDER, DOWNLOAD_FOLDER]:
        if os.path.exists(folder):
            logger.info(f"Cleaning temporary folder: {folder}")
            for filename in os.listdir(folder):
                file_path = os.path.join(folder, filename)
                try:
                    if os.path.isfile(file_path) or os.path.islink(file_path):
                        os.unlink(file_path)
                    elif os.path.isdir(file_path):
                        shutil.rmtree(file_path)
                except Exception as e:
                    logger.error(f'Failed to delete {file_path}. Reason: {e}')
        else:
            os.makedirs(folder, exist_ok=True)

# Cleanup on load
cleanup_temp_folders()

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

# --- Database & Auth ---
import database
import random

# Initialize DB
database.init_db()

def update_progress(counters):
    with job_lock:
        current_job["counters"] = counters

def background_process(filepath, csv_path, video_path):
    global current_job
    try:
        print(f"DEBUG: Starting Job for {filepath}")
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
        logger = logging.getLogger(__name__)
        logger.error(f"Processing failed: {e}")
        with job_lock:
            current_job["status"] = "error"
            current_job["error"] = str(e)

# --- API Endpoints ---

@app.route('/api/auth/otp/send', methods=['POST'])
def send_otp():
    data = request.json
    email = data.get('email')
    phone = data.get('phone')
    country_code = data.get('country_code', '+1')
    
    target = email if email else f"{country_code}{phone}"
    
    if not target:
        return jsonify({"error": "Credential required"}), 400
    
    # Generate 6-digit code
    code = f"{random.randint(100000, 999999)}"
    
    # Branded Logging to Console
    print("\n" + "="*70)
    print("        SITA INTELLIGENCE PLATFORM - SECURE IDENTITY GATE")
    print("="*70)
    print(f"  DISPATCHED TO: {target}")
    print(f"  PROTOCOL: {'SECURE_EMAIL' if email else 'SECURE_SMS'}")
    print(f"  SECURITY_CODE: {code}")
    print("="*70 + "\n")
    
    # Write to the visible 'Local Inbox' for the User
    try:
        with open('SITA_SECURE_MAIL.txt', 'w') as f:
            f.write(f"""
============================================================
      SITA INTELLIGENCE PLATFORM - SECURE IDENTITY GATE
============================================================
TIME: {time.ctime()}
DISPATCHED TO: {target}
CHANNEL: {'EMAIL_PROTOCOL' if email else 'SMS_NETWORK'}
SUBJECT: SITA SYSTEM ACCESS REQUEST

GREETINGS,

Your request for platform authentication has been approved. 
Use the following 6-digit PROTOCOL CODE to verify your session:

>>> {code} <<<

THIS CODE EXPIRES IN 10 MINUTES.
PLEASE DO NOT SHARE THIS PROTOCOL WITH UNAUTHORIZED PERSONNEL.
============================================================
""")
    except Exception as e:
        print(f"Error writing mock mail file: {e}")
    
    # Save for verification (if email not provided, use phone as key in DB)
    database.save_otp(email or target, code)
    
    return jsonify({
        "message": f"DEV_MODE: Your SITA Access Code is {code}. (In production, this would be an SMS/Email)",
        "dev_code": code,
        "status": "dispatched"
    }), 200

@app.route('/api/auth/otp/verify', methods=['POST'])
def verify_otp_endpoint():
    data = request.json
    email = data.get('email')
    phone = data.get('phone')
    country_code = data.get('country_code', '+1')
    code = data.get('code')
    
    target = email if email else f"{country_code}{phone}"
    
    if not target or not code:
        return jsonify({"error": "Credentials and code required"}), 400
        
    if database.verify_otp(target, code):
        user = database.create_otp_user(target)
        return jsonify(user)
    else:
        return jsonify({"error": "Invalid or expired protocol code"}), 401

@app.route('/api/auth/google', methods=['POST'])
def google_auth():
    data = request.json
    email = data.get('email')
    name = data.get('name', 'Unknown Agent')
    picture = data.get('picture', '')
    
    user = database.upsert_google_user(email, name, picture)
    return jsonify(user)

@app.route('/api/user/onboard', methods=['POST'])
def onboard_user():
    data = request.json
    email = data.get('email')
    name = data.get('name')
    phone = data.get('phone')
    country_code = data.get('country_code', '+1') # Default
    reason = data.get('reason')
    
    user = database.update_user_profile(email, name, phone, country_code, reason)
    if user:
        return jsonify(user)
    return jsonify({"error": "User not found"}), 404

@app.route('/api/user/me', methods=['GET'])
def get_me():
    email = request.args.get('email') or request.headers.get('X-User-Email')
    if not email:
        return jsonify({"error": "Email required"}), 400
        
    user = database.get_user(email)
    
    if not user:
         return jsonify({"error": "User not found"}), 404
         
    return jsonify(user)

# Admin endpoints removed as per new requirements


# --- Core Logic ---

@app.route('/api/upload_video', methods=['POST'])
def upload_video():
    global current_job

    # Security: Check if user is approved
    user_email = request.form.get('email') or request.headers.get('X-User-Email')
    
    user = database.get_user(user_email) if user_email else None
    
    if not user or user.get('status') != 'verified':
         return {'error': 'Unauthorized: Access to SITA Intelligence Core is restricted.'}, 403
    
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

@app.route('/api/status', methods=['GET'])
def get_status():
    with job_lock:
        return jsonify(current_job)

@app.route('/api/traffic_report', methods=['GET'])
def get_report():
    # Returns the JSON data of the COMPLETED job
    if not current_job["csv_link"]:
        return {"data": []}
    
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

@app.route('/api/download/<filename>')
def download_file(filename):
    return send_from_directory(app.config['DOWNLOAD_FOLDER'], filename, conditional=True)

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.errorhandler(404)
def page_not_found(e):
    # If the user is looking for an API, return a real 404
    if request.path.startswith('/api/'):
        return jsonify({"error": "API route not found"}), 404
    
    # Otherwise, for SPA routing, serve index.html
    # But only if it's not a missing dot-file (asset)
    if '.' in request.path and not request.path.endswith('.html'):
        return "Asset not found", 404
        
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    print("Starting SITA VIVA-SAFE Server...")
    app.run(host='0.0.0.0', port=7860, debug=True)
