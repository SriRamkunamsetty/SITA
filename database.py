import sqlite3
import datetime
import uuid
from typing import Optional, Dict, Any

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

    # Migration: Add agent_id if missing (for existing installations)
    try:
        c.execute("SELECT agent_id FROM users LIMIT 1")
    except sqlite3.OperationalError:
        print("Migrating DB: Adding agent_id column...")
        c.execute("ALTER TABLE users ADD COLUMN agent_id TEXT DEFAULT NULL")
    
    # Seed Admin if not exists
    c.execute("SELECT * FROM users WHERE email = ?", ('admin@sita.ai',))
    if not c.fetchone():
        c.execute('''
            INSERT INTO users (email, name, role, status, reason, phone, agent_id)
            VALUES (?, ?, ?, ?, ?, ?, 'SITA-0000')
        ''', ('admin@sita.ai', 'SITA Commander', 'admin', 'verified', 'System Administrator', '000-000-0000'))
    
    conn.commit()
    conn.close()
    print("Database initialized.")

def generate_agent_id():
    """Generates a unique Agent ID format: SITA-XXXX"""
    suffix = uuid.uuid4().hex[:4].upper()
    return f"SITA-{suffix}"

# --- User Operations ---

def get_user(email: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
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
    return dict(updated_user)

def update_user_profile(email: str, name: str, phone: str, country_code: str, reason: str) -> Dict[str, Any]:
    conn = get_db_connection()
    conn.execute('''
        UPDATE users 
        SET name = ?, phone = ?, country_code = ?, reason = ?, status = 'verified'
        WHERE email = ?
    ''', (name, phone, country_code, reason, email))
    conn.commit()
    
    user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    conn.close()
    if user:
        return dict(user)
    return None

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
