import sqlite3
import os

DB_FILE = 'sita.db'

if not os.path.exists(DB_FILE):
    print(f"[ERROR] {DB_FILE} not found.")
else:
    print(f"[OK] {DB_FILE} exists.")
    try:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row # Enable name access
        cursor = conn.cursor()
        
        # Check Tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print(f"Tables found: {[t['name'] for t in tables]}")
        
        # Check Admin
        cursor.execute("SELECT * FROM users WHERE email='admin@sita.ai'")
        admin = cursor.fetchone()
        if admin:
            # Row factory gives access by name
            print(f"[OK] Admin found: {admin['name']} | Status: {admin['status']}")
            print(f"[OK] Admin Agent ID: {admin['agent_id']}")
            if not admin['agent_id'] or not admin['agent_id'].startswith('SITA-'):
                 print("[FAIL] Agent ID format incorrect or missing.")
        else:
            print("[ERROR] Admin user missing.")
            
        conn.close()
    except Exception as e:
        print(f"[FAIL] DB Check Failed: {e}")
