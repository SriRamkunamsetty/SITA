import sqlite3
import json

DB_FILE = 'sita.db'
conn = sqlite3.connect(DB_FILE)
conn.row_factory = sqlite3.Row

print("--- SUPER ADMINS ---")
super_admins = conn.execute("SELECT email, name, role, agent_id FROM users WHERE role='super_admin'").fetchall()
for sa in super_admins:
    print(dict(sa))

print("\n--- ORGANIZATIONS ---")
orgs = conn.execute("SELECT id, name, state, district, unique_code FROM organizations").fetchall()
for org in orgs:
    print(dict(org))

conn.close()
