from flask import Flask, render_template, request, send_file, jsonify, send_from_directory
import os
from dotenv import load_dotenv

load_dotenv() # Load variables from .env

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
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("debug_viva.log", mode='a')
    ]
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
            current_job["status"] = "complete"
            current_job["video_link"] = os.path.basename(video_path)
            current_job["csv_link"] = os.path.basename(csv_path)
        
    except Exception as e:
        logger = logging.getLogger(__name__)
        logger.error(f"Processing failed: {e}")
        with job_lock:
            current_job["status"] = "error"
            current_job["error"] = str(e)

# --- Auth Guard Decorator ---
from functools import wraps

def require_role(allowed_roles):
    """
    Decorator to enforce strictly role-based access control.
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # 1. Identify User
            user_email = request.headers.get('X-User-Email') or request.form.get('email')
            if not user_email:
                return jsonify({"error": "Missing Authentication Credentials"}), 401
            
            user = database.get_user(user_email)
            if not user:
                return jsonify({"error": "User not found"}), 403
                
            # 2. Check Role
            if user['role'] not in allowed_roles:
                database.log_activity(user_email, "ACCESS_DENIED", f"Attempted access to {request.path}", request.remote_addr)
                return jsonify({"error": f"Access Protocol Violation: Role '{user['role']}' not authorized."}), 403
                
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# --- API Endpoints ---


# --- Email Auth Logic ---
@app.route('/api/auth/otp/send', methods=['POST'])
def send_otp():
    """Real Email OTP via SMTP."""
    data = request.json
    email = data.get('email')
    
    if not email: return jsonify({'error': 'Email required'}), 400
    
    # Generate 6-digit code
    code = f"{random.randint(100000, 999999)}"
    database.save_otp(email, code)
    
    # Send Real Email
    try:
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        sender_email = os.getenv("SITA_MAIL_USER")
        sender_password = os.getenv("SITA_MAIL_PASS")

        if not sender_email or not sender_password:
            logger.error("Email credentials missing in .env")
            return jsonify({'error': 'Server Misconfiguration: Email Credentials Missing'}), 500

        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = email
        msg['Subject'] = "SITA Security Verification Code"

        body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #00f0ff; text-align: center;">SITA ACCESS CONTROL</h2>
              <p style="color: #333; font-size: 16px;">Agent,</p>
              <p style="color: #555; font-size: 16px;">Use the following security code to access the SITA Intelligence Core.</p>
              <div style="background-color: #000; color: #00f0ff; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; margin: 20px 0; letter-spacing: 5px; border: 1px solid #00f0ff; border-radius: 5px;">
                {code}
              </div>
              <p style="color: #777; font-size: 12px; text-align: center;">This code will expire in 10 minutes. Do not share this credential.</p>
            </div>
          </body>
        </html>
        """
        msg.attach(MIMEText(body, 'html'))

        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(msg)
            
        logger.info(f"Email sent successfully to {email}")
        
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        # Fallback for Dev/Demo if email fails (don't block user access completely in demo)
        if app.debug:
            print(f"DEV FALLBACK OTP: {code}")
            return jsonify({
                'success': True,
                'message': 'Email Gateway Error (Dev Mode: Check Console)',
                'dev_mode_code': code 
            })
        return jsonify({'error': 'Failed to dispatch verification email'}), 500
    
    return jsonify({
        'success': True,
        'message': 'Verification code sent via Secure Relay',
        'dev_mode_code': None # Hide in prod
    })

@app.route('/api/auth/otp/verify', methods=['POST'])
def verify_otp():
    data = request.json
    email = data.get('email')
    code = data.get('code')
    
    if database.verify_otp(email, code):
        user = database.create_otp_user(email)
        database.log_activity(email, "LOGIN_EMAIL", "Email Login Success", request.remote_addr)
        return jsonify(user)
        
    return jsonify({'error': 'Invalid OTP Code'}), 400


# --- SUPER ADMIN AUTH FLOW ---

@app.route('/api/super-admin/check', methods=['GET'])
def check_super_admin():
    exists = database.check_super_admin_exists()
    return jsonify({"exists": exists})

@app.route('/api/super-admin/setup', methods=['POST'])
def setup_super_admin():
    data = request.json
    password = data.get('password')
    
    if not password or len(password) < 6:
        return jsonify({"error": "Strong password required"}), 400
        
    try:
        user = database.create_super_admin(password)
        database.log_activity(user['email'], "SYSTEM_INIT", "Super Admin Genesis", request.remote_addr)
        return jsonify(user)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/super-admin/login', methods=['POST'])
def login_super_admin():
    data = request.json
    agent_id = data.get('agent_id')
    password = data.get('password')
    
    user = database.authenticate_super_admin(password, agent_id)
    if user:
        database.log_activity(user['email'], "LOGIN_SUCCESS", "Super Admin Login", request.remote_addr)
        return jsonify(user)
        
    database.log_activity(agent_id or "Unknown", "LOGIN_FAILED", "Super Admin Auth Failed", request.remote_addr)
    return jsonify({"error": "Access Denied: Invalid Command Credentials"}), 401


@app.route('/api/admin/login', methods=['POST'])
def login_admin():
    data = request.json
    org_unique_code = data.get('org_unique_code')
    # admin_agent_id param is now org_name
    org_name = data.get('org_name') or data.get('admin_agent_id') # Handle legacy field name if needed
    password = data.get('password')
    
    success, user, msg = database.authenticate_organization_credentials(org_unique_code, org_name, password)
    
    if success:
        database.log_activity(user['email'], "LOGIN_SUCCESS", f"Sector Command Login: {org_unique_code}", request.remote_addr)
        return jsonify(user)
    else:
        database.log_activity(org_unique_code or "Unknown", "LOGIN_FAILED", f"Sector Auth Failed: {msg}", request.remote_addr)
        return jsonify({"error": msg}), 401

# ... validate_mission_brief ...

@app.route('/api/user/onboard', methods=['POST'])
def onboard_user():
    data = request.json
    email = data.get('email')
    name = data.get('name')
    picture = data.get('picture')
    
    # Logic: Upsert
    user = database.upsert_google_user(email, name, picture)
    return jsonify(user)

@app.route('/api/user/me', methods=['GET'])
def get_me():
    email = request.args.get('email')
    if not email:
        return jsonify({"error": "Email required"}), 400
    
    user = database.get_user(email)
    if not user:
        return jsonify({"error": "User not found", "status": "unknown"}), 404
        
    return jsonify(user)

@app.route('/api/admin/users', methods=['GET'])
@require_role(['admin', 'super_admin'])
def list_users():
    requester_email = request.headers.get('X-User-Email')
    requester = database.get_user(requester_email)
    
    # Redundant check removed, decorator handles it.
    
    all_users = database.get_all_users()
    
    if requester['role'] == 'super_admin':
        return jsonify(all_users)
    else:
        # Admin sees only their org's users
        # Constraint: Admin sees ONLY users in their org
        org_users = [u for u in all_users if u['organization_id'] == requester['organization_id']]
        return jsonify(org_users)

@app.route('/api/org/create', methods=['POST'])
@require_role(['super_admin']) # STRICT: Super Admin Only
def create_org():
    data = request.json
    requester_email = data.get('requester_email')
    # Requester email also authenticated via Headers in strict middleware if applied globally, 
    # but here we rely on the decorator checking X-User-Email or form depending on implementation.
    # Note: Decorator checks X-User-Email.
    
    # NOTE: The client sends 'requester_email' in body, but our decorator checks HEADER 'X-User-Email'.
    # We must ensure client sends header. Experience.jsx apiRequest DOES send it if logged in.
    
    try:
        org = database.create_organization(
            data.get('name'), 
            data.get('state'), 
            data.get('district'), 
            data.get('password'),
            requester_email
        )
        database.log_activity(requester_email, "ORG_CREATED", f"Created {org['unique_code']}", request.remote_addr)
        return jsonify(org)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/org/join', methods=['POST'])
@require_role(['user', 'admin', 'super_admin'])
def join_org():
    data = request.json
    user_email = data.get('email')
    org_name = data.get('orgName')
    state = data.get('state')
    district = data.get('district')
    password = data.get('password')
    unique_code = data.get('unique_code') # AccessGate sends this for 'Found' sectors
    
    try:
        # If code not provided but name/state is, find it (Auto-Resolve)
        if not unique_code and org_name and state:
            conn = database.get_db_connection()
            org = conn.execute('SELECT unique_code FROM organizations WHERE LOWER(name) = ? AND LOWER(state) = ?', (org_name.lower(), state.lower())).fetchone()
            conn.close()
            if org:
                unique_code = org['unique_code']
            else:
                 return jsonify({"error": "Organization not found"}), 404

        # DB Join Logic
        result, msg = database.join_organization(user_email, unique_code, password)
        if result:
            return jsonify({"success": True, "message": "Joined Organization Successfully"})
        else:
             return jsonify({"error": msg}), 400
             
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/org/lookup', methods=['POST'])
def lookup_org():
    data = request.json
    org_name = data.get('orgName')
    state = data.get('state')
    
    # Only return status for privacy, no details
    exists = database.lookup_organization(org_name, state) # Need to implement lookup in DB or use existing
    if exists:
        return jsonify({"status": "found", "type": "existing"})
    return jsonify({"status": "not_found"})

@app.route('/api/orgs', methods=['GET'])
@require_role(['super_admin'])
def list_orgs():
    return jsonify(database.get_all_organizations())

@app.route('/api/org/my', methods=['GET'])
@require_role(['admin', 'super_admin', 'user']) # Users technically belong to an org too? 
# Requirement: "Admin ... View Logic ... My Org". 
# Let's keep it safe. If a user needs it, we can add 'user'. 
# Actually, the user profile already has org info. This endpoint gives DETAILS (e.g. unique code).
# Users probably shouldn't see unique code/password (even hidden). 
# Let's restrict to Admin/SuperAdmin for deep details.
def get_my_org():
    requester_email = request.headers.get('X-User-Email')
    user = database.get_user(requester_email)
    
    if not user.get('organization_id'):
         return jsonify({"error": "No Organization found"}), 404
         
    org = database.get_organization_by_id(user['organization_id'])
    
    if user['role'] != 'admin' and user['role'] != 'super_admin':
        # If we allow users, strip more data. But for now, let's allow them to see basic Org Name.
        org = {k:v for k,v in org.items() if k in ['name', 'state', 'district']}
    else:
         org.pop('password', None)
         
    return jsonify(org)


# --- Core Logic ---

@app.route('/api/upload_video', methods=['POST'])
@require_role(['user', 'admin']) # BLOCK Super Admin from Ops?
# User prompt: "Super Admin capabilities ... No access to Detection Dashboard"
# So yes, strict block.
def upload_video():
    global current_job

    # Security: Check if user is approved
    # Decorator handles role check
    user_email = request.form.get('email') or request.headers.get('X-User-Email')
    
    user = database.get_user(user_email)
    if not user or user.get('status') != 'verified':
         return {'error': 'Unauthorized: Access to SITA Intelligence Core is restricted.'}, 403
    
    if 'video' not in request.files:
        return {'error': 'No file part'}, 400
    
    file = request.files['video']
    if file.filename == '':
        return {'error': 'No selected file'}, 400
    
    if file:
        database.log_activity(user_email, "VIDEO_UPLOAD", f"Processing {file.filename}", request.remote_addr)
        
        job_id = str(uuid.uuid4())
        filename = job_id + "_" + file.filename
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Paths
        csv_filename = os.path.splitext(filename)[0] + '.csv'
        csv_path = os.path.join(app.config['DOWNLOAD_FOLDER'], csv_filename)
        # CHANGE: Use .webm for better browser compatibility (VP9)
        video_filename = os.path.splitext(filename)[0] + '_processed.webm'
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
# Status is public-ish for the dashboard, but maybe restrict?
# Let's leave it open or simple check.
def get_status():
    with job_lock:
        return jsonify(current_job)

@app.route('/api/traffic_report', methods=['GET'])
# Report is definitely sensitive.
@require_role(['user', 'admin']) 
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
        "columns": ["vehicle_type", "color", "number_plate", "confidence", "frame"],
        "data": rows
    })

@app.route('/api/download/<filename>')
def download_file(filename):
    # This might need protection too, but for MVP let's trust the filename is hard to guess (uuid)
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


@app.route('/api/auth/otp/mobile/send', methods=['POST'])
def send_mobile_otp():
    """MOCKED Mobile OTP for Demo. In prod, integrate Twilio/SNS."""
    data = request.json
    mobile = data.get('mobile')
    country_code = data.get('country_code', '+91')
    
    if not mobile: return jsonify({'error': 'Mobile number required'}), 400
    
    # STRICT CHECK: Only allow registered numbers (as per strict protocol)
    conn = database.get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE phone = ? AND country_code = ?", (mobile, country_code)).fetchone()
    conn.close()
    
    if not user:
        # Simulate vagueness for security? Or direct error?
        # User requested: "otp should sent to the registered mobile number"
        # Implies failure if not registered.
        return jsonify({'error': 'SECURE_ACCESS: Mobile identifier not recognized in system registry.'}), 404
    
    # Generate 6-digit code
    code = f"{random.randint(100000, 999999)}"
    
    # Store in DB (Reusing otp_codes table, keying by full phone number)
    full_number = f"{country_code}{mobile}"
    database.save_otp(full_number, code)
    
    # LOG IT for user visibility (Simulating SMS)
    print(f"============ SMS GATEWAY SIMULATION ============")
    print(f"TO: {full_number} (Agent: {user['name']})")
    print(f"MESSAGE: Your SITA Verification Code is: {code}")
    print(f"================================================")
    
    return jsonify({
        'success': True, 
        'message': 'OTP dispatched to registered endpoint via Secure Gateway',
        'dev_mode_code': code if app.debug else None # For easy testing
    })

@app.route('/api/auth/otp/mobile/verify', methods=['POST'])
def verify_mobile_otp():
    data = request.json
    mobile = data.get('mobile')
    country_code = data.get('country_code', '+91')
    code = data.get('code')
    
    full_number = f"{country_code}{mobile}"
    
    if database.verify_otp(full_number, code):
        # Determine if user exists, else create/update
        # Note: We treat phone as a unique identifier here, but our User model is Email-centric.
        # Strategy: Use phone@mobile.sita as synthetic email if specific email not provided?
        # OR: The UI handles profile creation. AccessGate expects us to return a User object if identified.
        
        # Check if any user has this phone number
        conn = database.get_db_connection()
        user = conn.execute("SELECT * FROM users WHERE phone = ? AND country_code = ?", (mobile, country_code)).fetchone()
        conn.close()
        
        if user:
            # Login existing
            database.log_activity(user['email'], "LOGIN_MOBILE", "Mobile Login Success", request.remote_addr)
            return jsonify(dict(user))
        else:
            # New User - Create placeholder via synthetic email
            synthetic_email = f"{mobile}@mobile.sita"
            user_data = database.create_otp_user(synthetic_email)
            
            # Update phone record immediately so future lookups work
            conn = database.get_db_connection()
            conn.execute("UPDATE users SET phone = ?, country_code = ? WHERE email = ?", (mobile, country_code, synthetic_email))
            conn.commit()
            conn.close()
            
            # Return updated obj
            final_user = database.get_user(synthetic_email)
            return jsonify(final_user)
            
    return jsonify({'error': 'Invalid OTP Code'}), 400

if __name__ == '__main__':
    print("Starting SITA VIVA-SAFE Server...")
    app.run(host='0.0.0.0', port=7860, debug=True)
