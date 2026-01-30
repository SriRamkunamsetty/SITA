
import sqlite3
DB_FILE = 'sita.db'

def fix_agent_id():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET agent_id = 'SITA-COMMANDER-001' WHERE email = 'admin@sita.ai' AND (agent_id IS NULL OR agent_id = '')")
    if cursor.rowcount > 0:
        print(f"Updated {cursor.rowcount} admin user(s) with Agent ID.")
        conn.commit()
    else:
        print("No admin user found needing update.")
    conn.close()

if __name__ == "__main__":
    fix_agent_id()
