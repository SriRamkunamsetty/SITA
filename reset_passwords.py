import sqlite3
from werkzeug.security import generate_password_hash
import uuid
import random

DB_FILE = 'sita.db'
conn = sqlite3.connect(DB_FILE)
conn.row_factory = sqlite3.Row

# 1. Update Super Admin
super_admin_pass = "SuperAdmin2026!"
hashed_sa_pass = generate_password_hash(super_admin_pass)

sa = conn.execute("SELECT agent_id FROM users WHERE role='super_admin'").fetchone()
if sa:
    agent_id = sa['agent_id']
    conn.execute("UPDATE users SET password = ? WHERE role='super_admin'", (hashed_sa_pass,))
    print(f"Updated Super Admin: ID = {agent_id}, Password = {super_admin_pass}")
else:
    # If no super admin, create one
    suffix = uuid.uuid4().hex[:4].upper()
    agent_id = f"SITA-{suffix}"
    conn.execute('''
        INSERT INTO users (email, name, role, status, agent_id, password, created_at)
        VALUES (?, 'SITA COMMANDER', 'super_admin', 'verified', ?, ?, CURRENT_TIMESTAMP)
    ''', (f'{agent_id}@sita.internal', agent_id, hashed_sa_pass))
    print(f"Created Super Admin: ID = {agent_id}, Password = {super_admin_pass}")

# 2. Update or Create Organization
org_pass = "OrgAdmin2026!"
hashed_org_pass = generate_password_hash(org_pass)

org = conn.execute("SELECT name, state, unique_code FROM organizations LIMIT 1").fetchone()
if org:
    org_name = org['name']
    org_code = org['unique_code']
    state = org['state']
    conn.execute("UPDATE organizations SET password = ?", (hashed_org_pass,))
    print(f"Updated Org: Name = {org_name}, State/Code = {state} (Use name/code), Unique Code = {org_code}, Password = {org_pass}")
else:
    # Create an org
    state = "Delhi"
    district = "New Delhi"
    org_name = "Central Command"
    org_code = f"SITA-{state[:2].upper()}-{district[:3].upper()}-{random.randint(1000,9999)}"
    
    conn.execute('''
        INSERT INTO organizations (name, state, district, unique_code, password, created_by_email)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (org_name, state, district, org_code, hashed_org_pass, "system@sita.internal"))
    
    print(f"Created Org: Name = {org_name}, Unique Code = {org_code}, Password = {org_pass}")

conn.commit()
conn.close()

# 3. Save to idreadme.md
with open("idreadme.md", "w") as f:
    f.write("# SITA Credentials\n\n")
    f.write("## 1. System Governor (Super Admin)\n")
    f.write(f"- **Agent ID**: `{agent_id}`\n")
    f.write(f"- **Password**: `{super_admin_pass}`\n\n")
    f.write("## 2. Org Admin (Sector Commander)\n")
    f.write(f"- **Organization Unique Code**: `{org_code}`\n")
    f.write(f"- **Organization Name**: `{org_name}`\n")
    f.write(f"- **Password**: `{org_pass}`\n\n")
    f.write("> Keep this file safe. You can use these credentials in the Secure Login Gateway.\n")

print("\nCredentials saved to idreadme.md")
