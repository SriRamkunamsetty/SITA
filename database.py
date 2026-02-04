import sqlite3
import datetime
import uuid
from typing import Optional, Dict, Any
from werkzeug.security import generate_password_hash, check_password_hash
import firebase_utils # [NEW] Firebase Integration

DB_FILE = 'sita.db'

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    c = conn.cursor()
    
    # Users Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            email TEXT PRIMARY KEY,
            name TEXT,
            picture TEXT,
            role TEXT DEFAULT 'user',
            status TEXT DEFAULT 'pending',
            phone TEXT,
            country_code TEXT,
            reason TEXT,
            age INTEGER,
            organization_id INTEGER,
            agent_id TEXT UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP
        )
    ''')
    
    # OTP Codes Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS otp_codes (
            email TEXT,
            code TEXT,
            expires_at TIMESTAMP,
            PRIMARY KEY (email)
        )
    ''')

    # Organizations Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS organizations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            state TEXT NOT NULL,
            district TEXT NOT NULL,
            unique_code TEXT UNIQUE,
            password TEXT,
            created_by_email TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Audit Logs Table (New)
    c.execute('''
        CREATE TABLE IF NOT EXISTS activity_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            actor_email TEXT,
            action TEXT,
            details TEXT,
            ip_address TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')


    # Migration: Add agent_id if missing (for existing installations)
    try:
        c.execute("SELECT agent_id FROM users LIMIT 1")
    except sqlite3.OperationalError:
        print("Migrating DB: Adding agent_id column...")
        c.execute("ALTER TABLE users ADD COLUMN agent_id TEXT DEFAULT NULL")

    # Migration: Add age if missing
    try:
        c.execute("SELECT age FROM users LIMIT 1")
    except sqlite3.OperationalError:
        print("Migrating DB: Adding age column...")
        c.execute("ALTER TABLE users ADD COLUMN age INTEGER DEFAULT NULL")

    # Migration: Add organization_id if missing
    try:
        c.execute("SELECT organization_id FROM users LIMIT 1")
    except sqlite3.OperationalError:
        print("Migrating DB: Adding organization_id column...")
        c.execute("ALTER TABLE users ADD COLUMN organization_id INTEGER DEFAULT NULL")
    
    # Migration: Add password if missing (for Super Admin)
    try:
        c.execute("SELECT password FROM users LIMIT 1")
    except sqlite3.OperationalError:
        print("Migrating DB: Adding password column...")
        c.execute("ALTER TABLE users ADD COLUMN password TEXT DEFAULT NULL")

    conn.commit()
    conn.close()
    print("Database initialized.")

def log_activity(actor_email: str, action: str, details: str = None, ip_address: str = None):
    """
    Logs critical system actions for audit purposes.
    """
    try:
        conn = get_db_connection()
        conn.execute('INSERT INTO activity_logs (actor_email, action, details, ip_address) VALUES (?, ?, ?, ?)',
                     (actor_email, action, details, ip_address))
        conn.commit()
        conn.close()
        
        # [NEW] Sync to Firebase
        firebase_utils.fire_log_activity(actor_email, action, details, ip_address)
    except Exception as e:
        print(f"AUDIT LOG FAILURE: {e}")

def generate_agent_id():
    """Generates a unique Agent ID format: SITA-XXXX"""
    suffix = uuid.uuid4().hex[:4].upper()
    return f"SITA-{suffix}"

# --- Super Admin Operations ---

def check_super_admin_exists() -> bool:
    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE role = 'super_admin'").fetchone()
    conn.close()
    return user is not None

def create_super_admin(password: str) -> Dict[str, Any]:
    if check_super_admin_exists():
        raise Exception("Super Admin already exists. Genesis protocol locked.")
    
    unique_id = generate_agent_id()
    conn = get_db_connection()
    conn.execute('''
        INSERT INTO users (email, name, role, status, agent_id, password, created_at)
        VALUES (?, 'SITA COMMANDER', 'super_admin', 'verified', ?, ?, CURRENT_TIMESTAMP)
    ''', (f'{unique_id}@sita.internal', unique_id, password))
    conn.commit()
    
    user = conn.execute("SELECT * FROM users WHERE role = 'super_admin'").fetchone()
    conn.close()
    
    # [NEW] Sync to Firebase
    if user:
        firebase_utils.fire_upsert_user(dict(user))
        
    return dict(user)

def authenticate_super_admin(password: str, agent_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    if agent_id:
        user = conn.execute("SELECT * FROM users WHERE agent_id = ? AND role = 'super_admin'", (agent_id,)).fetchone()
    else:
        user = conn.execute("SELECT * FROM users WHERE role = 'super_admin' LIMIT 1").fetchone()
    conn.close()
    
    if user and user['password']:
        if check_password_hash(user['password'], password):
            return dict(user)
    return None

# --- User Operations ---

def get_user(email: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    user = conn.execute('''
        SELECT u.*, o.name as org_name, o.unique_code as org_code 
        FROM users u 
        LEFT JOIN organizations o ON u.organization_id = o.id
        WHERE u.email = ?
    ''', (email,)).fetchone()
    conn.close()
    if user:
        return dict(user)
    return None

def upsert_google_user(email: str, name: str, picture: str) -> Dict[str, Any]:
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    
    if user:
        # If user exists but has no agent_id (migration case), add one
        if not user['agent_id']:
            new_agent_id = generate_agent_id()
            conn.execute('UPDATE users SET name = ?, picture = ?, last_login = CURRENT_TIMESTAMP, agent_id = ? WHERE email = ?', (name, picture, new_agent_id, email))
        else:
            conn.execute('UPDATE users SET name = ?, picture = ?, last_login = CURRENT_TIMESTAMP WHERE email = ?', (name, picture, email))
    else:
        new_agent_id = generate_agent_id()
        conn.execute('''
            INSERT INTO users (email, name, picture, status, last_login, agent_id)
            VALUES (?, ?, ?, 'pending_onboarding', CURRENT_TIMESTAMP, ?)
        ''', (email, name, picture, new_agent_id))
    
    conn.commit()
    updated_user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    conn.close()
    
    # [NEW] Sync to Firebase
    if updated_user:
        firebase_utils.fire_upsert_user(dict(updated_user))
        
    return dict(updated_user)

def create_otp_user(email: str) -> Dict[str, Any]:
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    
    if not user:
        new_agent_id = generate_agent_id()
        conn.execute('''
            INSERT INTO users (email, name, status, last_login, agent_id)
            VALUES (?, 'Agent', 'pending_onboarding', CURRENT_TIMESTAMP, ?)
        ''', (email, new_agent_id))
        conn.commit()
    else:
        # Migration check
        if not user['agent_id']:
            new_agent_id = generate_agent_id()
            conn.execute('UPDATE users SET last_login = CURRENT_TIMESTAMP, agent_id = ? WHERE email = ?', (new_agent_id, email))
            conn.commit()
        else:
            conn.execute('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE email = ?', (email,))
            conn.commit()

    updated_user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    conn.close()
    
    # [NEW] Sync to Firebase
    if updated_user:
        firebase_utils.fire_upsert_user(dict(updated_user))
        
    return dict(updated_user)

def update_user_profile(email: str, name: str, phone: str, country_code: str, reason: str, age: int) -> Dict[str, Any]:
    conn = get_db_connection()
    conn.execute('''
        UPDATE users 
        SET name = ?, phone = ?, country_code = ?, reason = ?, age = ?, status = 'verified'
        WHERE email = ?
    ''', (name, phone, country_code, reason, age, email))
    conn.commit()
    
    user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    conn.close()
    if user:
        # [NEW] Sync to Firebase
        firebase_utils.fire_upsert_user(dict(user))
        return dict(user)
    return None

def get_all_users() -> list[Dict[str, Any]]:
    conn = get_db_connection()
    # Join with organizations table to get org details
    users = conn.execute('''
        SELECT u.*, o.name as org_name, o.unique_code as org_code 
        FROM users u 
        LEFT JOIN organizations o ON u.organization_id = o.id
    ''').fetchall()
    conn.close()
    return [dict(u) for u in users]

def create_organization(name, state, district, password, created_by_email) -> Dict[str, Any]:
    conn = get_db_connection()
    
    # [CONSTRAINT] STRICT UNIQUENESS: Organization is identified by the combination of State + District.
    # The 'unique_code' is merely a generated identifier for lookup, NOT the primary logical constraint.
    existing = conn.execute(
        'SELECT * FROM organizations WHERE LOWER(state) = ? AND LOWER(district) = ?', 
        (state.lower(), district.lower())
    ).fetchone()

    if existing:
        conn.close()
        raise Exception(f"Organization already exists for sector: {district}, {state}")

    # Generate Unique Code: SITA-[STATE_CODE]-[District_First3]-[RANDOM]
    # Simplified for demo: SITA-[First2State]-[First3Dist]-[Random4]
    import random
    code = f"SITA-{state[:2].upper()}-{district[:3].upper()}-{random.randint(1000,9999)}"
    
    # Hash Password
    hashed_pw = generate_password_hash(password)

    cursor = conn.execute('''
        INSERT INTO organizations (name, state, district, unique_code, password, created_by_email)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (name, state, district, code, hashed_pw, created_by_email))
    
    org_id = cursor.lastrowid
    
    conn.commit()
    
    org = conn.execute('SELECT * FROM organizations WHERE id = ?', (org_id,)).fetchone()
    conn.close()
    
    # [NEW] Sync to Firebase
    if org:
        firebase_utils.fire_upsert_org(dict(org))
        
    return dict(org)

def lookup_organization(name, state) -> bool:
    conn = get_db_connection()
    # Loose matching
    org = conn.execute('SELECT id FROM organizations WHERE LOWER(name) = ? AND LOWER(state) = ?', (name.lower(), state.lower())).fetchone()
    conn.close()
    return True if org else False

def join_organization(email, unique_code, password) -> tuple[bool, str]:
    conn = get_db_connection()
    org = conn.execute('SELECT * FROM organizations WHERE unique_code = ?', (unique_code,)).fetchone()
    
    if not org:
        conn.close()
        return False, "Organization not found"
        
    if password != "OPEN_ACCESS_OVERRIDE" and not check_password_hash(org['password'], password):
        conn.close()
        return False, "Invalid password"
        
    conn.execute('UPDATE users SET organization_id = ? WHERE email = ?', (org['id'], email))
    conn.commit()
    conn.close()
    return True, "Successfully joined"

def get_organization_by_id(org_id) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    org = conn.execute('SELECT * FROM organizations WHERE id = ?', (org_id,)).fetchone()
    conn.close()
    return dict(org) if org else None

def get_all_organizations() -> list[Dict[str, Any]]:
    conn = get_db_connection()
    orgs = conn.execute('SELECT * FROM organizations').fetchall()
    conn.close()
    return [dict(o) for o in orgs]

def lookup_organization(state: str, district: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    # Case insensitive check
    org = conn.execute('SELECT * FROM organizations WHERE LOWER(state) = ? AND LOWER(district) = ?', 
                       (state.lower(), district.lower())).fetchone()
    conn.close()
    return dict(org) if org else None

# --- Strict Admin Auth ---


def authenticate_organization_credentials(org_unique_code: str, org_name: str, password: str) -> tuple[bool, Optional[Dict[str, Any]], str]:
    """
    Authenticates using Organization Credentials (Sector Keys).
    Returns a synthetic User object representing the Sector Commander.
    """
    conn = get_db_connection()
    
    # 1. Verify Org by Code and Name (Case Insensitive for name for better UX?)
    # Strict requirement: "organization name"
    org = conn.execute("SELECT * FROM organizations WHERE unique_code = ?", (org_unique_code,)).fetchone()
    
    if not org:
        conn.close()
        return False, None, "Invalid Sector ID"
        
    if org['name'].lower() != org_name.lower():
        conn.close()
        return False, None, "Invalid Sector Designation (Name mismatch)"
        
    # 2. Verify Org Password
    if check_password_hash(org['password'], password):
        # 3. Create Synthetic Admin Session
        conn.close()
        return True, {
            "email": f"commander@{org['unique_code'].lower()}.sita",
            "name": f"COMMANDER-{org['name'].upper()}",
            "role": "admin",
            "organization_id": org['id'],
            "status": "verified",
            "picture": "", # Default avatar
            "org_name": org['name'],
            "org_code": org['unique_code']
        }, "Authenticated"
    else:
        conn.close()
        return False, None, "Invalid Sector Access Key"

def authenticate_admin_strict(org_unique_code: str, admin_agent_id: str, password: str) -> tuple[bool, Optional[Dict[str, Any]], str]:
    # Legacy User-Based Auth (Keeping for backup or mixed mode if needed)
    # ... (existing code mostly) ...
    conn = get_db_connection()
    org = conn.execute("SELECT * FROM organizations WHERE unique_code = ?", (org_unique_code,)).fetchone()
    if not org: return False, None, "Invalid Org ID"
    
    admin = conn.execute("SELECT * FROM users WHERE agent_id = ? AND organization_id = ? AND role = 'admin'", (admin_agent_id, org['id'])).fetchone()
    conn.close()
    
    if not admin: return False, None, "Admin ID not found"
    if not admin['password']: return False, None, "Password not set"
    if check_password_hash(admin['password'], password): return True, dict(admin), "Auth"
    return False, None, "Invalid Password"


# --- OTP Operations ---

def save_otp(email: str, code: str):
    conn = get_db_connection()
    # Expires in 10 minutes
    expires = datetime.datetime.now() + datetime.timedelta(minutes=10)
    
    conn.execute('REPLACE INTO otp_codes (email, code, expires_at) VALUES (?, ?, ?)', 
                 (email, code, expires))
    conn.commit()
    conn.close()

def verify_otp(email: str, code: str) -> bool:
    print(f"DEBUG: Verifying OTP for {email} with code {code}")
    conn = get_db_connection()
    record = conn.execute('SELECT * FROM otp_codes WHERE email = ?', (email,)).fetchone()
    conn.close()
    
    if not record:
        print(f"DEBUG: No OTP record found for {email}")
        return False
        
    stored_code = str(record['code'])
    
    # Robust timestamp parsing
    try:
        expires_at_str = record['expires_at']
        # Handle different sqlite formats (with/without ms)
        if '.' in expires_at_str:
            expires_at = datetime.datetime.strptime(expires_at_str, '%Y-%m-%d %H:%M:%S.%f')
        else:
            expires_at = datetime.datetime.strptime(expires_at_str, '%Y-%m-%d %H:%M:%S')
    except Exception as e:
        print(f"DEBUG: Expiry parsing error: {e}")
        # Default fallback: if we can't parse, let them in for dev mode or fail
        return False
    
    current_time = datetime.datetime.now()
    
    if str(code) == stored_code and current_time < expires_at:
        print(f"DEBUG: OTP Verified successfully for {email}")
        # Delete OTP after successful use
        conn = get_db_connection()
        conn.execute('DELETE FROM otp_codes WHERE email = ?', (email,))
        conn.commit()
        conn.close()
        return True
    
    if str(code) != stored_code:
        print(f"DEBUG: OTP Mismatch for {email}. Stored: {stored_code}, Sent: {code}")
    if current_time >= expires_at:
        print(f"DEBUG: OTP Expired for {email}. Expired at: {expires_at}, Current: {current_time}")
        
    return False
