import sqlite3
DB_FILE = 'sita.db'
conn = sqlite3.connect(DB_FILE)
cursor = conn.execute("SELECT email, role, password FROM users WHERE role='super_admin'")
print(cursor.fetchall())
conn.close()
