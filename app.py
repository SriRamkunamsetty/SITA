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

# --- EMAIL SYSTEM ---
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def get_html_email_template(code, target):
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #e2e8f0; margin: 0; padding: 0; }}
            .container {{ max-width: 600px; margin: 40px auto; background: #1e293b; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #334155; }}
            .header {{ background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); padding: 30px; text-align: center; }}
            .header h1 {{ margin: 0; color: white; font-size: 24px; letter-spacing: 2px; }}
            .content {{ padding: 40px; text-align: center; }}
            .code-box {{ background: rgba(148, 163, 184, 0.1); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 8px; padding: 20px; margin: 30px 0; font-family: 'Courier New', monospace; font-size: 36px; letter-spacing: 8px; font-weight: bold; color: #38bdf8; display: inline-block; }}
            .footer {{ background: #0f172a; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #334155; }}
            .badge {{ display: inline-block; padding: 4px 12px; border-radius: 20px; background: rgba(6, 182, 212, 0.2); color: #22d3ee; font-size: 11px; font-weight: bold; margin-bottom: 20px; }}
            .image-preview {{ width: 100%; border-radius: 8px; margin-top: 20px; opacity: 0.8; border: 1px solid #334155; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>SITA INTELLIGENCE</h1>
            </div>
            <div class="content">
                <span class="badge">SECURE LOGIN PROTOCOL</span>
                <p>Hello Agent,</p>
                <p>A request was received to access the <strong>SITA Command Center</strong> for account associated with <strong>{target}</strong>.</p>
                
                <div class="code-box">{code}</div>
                
                <p style="color: #94a3b8; font-size: 14px;">This protocol code is valid for 10 minutes. <br>If you did not request this, please terminate this session immediately.</p>
                
                <!-- Placeholder for visual flair - Use public URL or base64 in production -->
                <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #334155;">
                     <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">System Visuals</p>
                    <img src="https://raw.githubusercontent.com/SriRamkunamsetty/SITA/main/reference_ui/detection.png" alt="SITA Interface" class="image-preview" onerror="this.style.display='none'">
                </div>
            </div>
            <div class="footer">
                <p>SITA: Smart Intelligent Traffic Analyzer | VIVA-SAFE Core</p>
                <p>Automated Security Dispatch • Do Not Reply</p>
            </div>
        </div>
    </body>
    </html>
    """

def send_smtp_email(target, code):
    sender_user = os.environ.get('SITA_MAIL_USER')
    sender_pass = os.environ.get('SITA_MAIL_PASS')
    
    if not sender_user or not sender_pass:
        return False
        
    try:
        msg = MIMEMultipart()
        msg['From'] = f"SITA Security <{sender_user}>"
        msg['To'] = target
        msg['Subject'] = f"SITA Access Protocol: {code}"
        
        msg.attach(MIMEText(get_html_email_template(code, target), 'html'))
        
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_user, sender_pass)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        logger.error(f"SMTP Flow Failed: {e}")
        return False


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
    
    # 1. Attempt Real Email Implementation
    email_sent = False
    if email:
        email_sent = send_smtp_email(target, code)
    
    # 2. Local Fallback (Preview File)
    # We ALWAYS write the file in Dev mode so user can see the beautiful HTML even if email fails
    try:
        html_content = get_html_email_template(code, target)
        with open('SITA_SECURE_MAIL.html', 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        # Keep the TXT file for legacy/convenience reading
        with open('SITA_SECURE_MAIL.txt', 'w') as f:
            f.write(f"CODE: {code}\nTARGET: {target}\n(Open SITA_SECURE_MAIL.html for full preview)")
            
    except Exception as e:
        print(f"Error writing local mail file: {e}")
    
    # Branded Logging to Console
    print("\n" + "="*70)
    print("        SITA INTELLIGENCE PLATFORM - SECURE IDENTITY GATE")
    print("="*70)
    print(f"  DISPATCHED TO: {target}")
    print(f"  SECURITY_CODE: {code}")
    if email_sent:
        print("  STATUS: [SENT VIA SMTP]")
    else:
        print("  STATUS: [SAVED TO LOCAL FILE] (Set SITA_MAIL_USER/PASS to enable SMTP)")
    print("="*70 + "\n")
    
    # Save for verification
    database.save_otp(email or target, code)
    
    msg = f"Code sent to {target}"
    if not email_sent:
        msg = f"DEV: Code is {code}. (See SITA_SECURE_MAIL.html)"
    
    return jsonify({
        "message": msg,
        "dev_code": code,
        "status": "dispatched" if email_sent else "local_save"
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

def validate_mission_brief(text):
    if not text:
        return False, "Mission brief is empty."
    
    text_lower = text.lower()
    
    # 1. Length Check
    if len(text) < 20:
        return False, "Brief too short. Elaboration required."

    # 2. Keyword Analysis (Simulating AI Intent Detection)
    prohibited_terms = [
        'hack', 'crack', 'bypass', 'attack', 'destroy', 'steal', 'fake', 
        'bot', 'spam', 'override', 'illegal', 'malware', 'virus', 'kill',
        'inject', 'exploit', 'ddos'
    ]
    
    for term in prohibited_terms:
        if term in text_lower:
            return False, "MALICIOUS INTENT DETECTED. NEURAL CORE SAFETY LOCK ENGAGED."
            
    # 3. Pattern Analysis (Simulate detecting gibberish/spam)
    if len(set(text)) < 5: # e.g. "aaaaa..."
        return False, "COGNITIVE PATTERN REJECTED. HUMAN INPUT REQUIRED."
        
    return True, "Valid"

@app.route('/api/user/onboard', methods=['POST'])
def onboard_user():
    data = request.json
    email = data.get('email')
    name = data.get('name')
    phone = data.get('phone')
    country_code = data.get('country_code', '+1') # Default
    reason = data.get('reason')
    
    # --- SECURITY CHECK ---
    is_valid, msg = validate_mission_brief(reason)
    if not is_valid:
        return jsonify({"error": "ACCESS_DENIED", "message": msg}), 403
    # ----------------------
    
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
