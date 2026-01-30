import sqlite3
DB_FILE = 'sita.db'
conn = sqlite3.connect(DB_FILE)
print("Removing invalid Super Admin...")
conn.execute("DELETE FROM users WHERE email = 'SITA-A287@sita.internal'")
conn.commit()
print("Cleaned up. Remaining Super Admins:")
cursor = conn.execute("SELECT email, role FROM users WHERE role='super_admin'")
print(cursor.fetchall())
conn.close()
