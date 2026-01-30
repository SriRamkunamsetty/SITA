import sqlite3

DB_PATH = r"c:\Users\Shiva\Downloads\SITA\SITA\SITA\sita.db"

def fix_schema():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if column exists
        cursor.execute("PRAGMA table_info(organizations)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if 'created_by_email' not in columns:
            print("Adding created_by_email column...")
            cursor.execute("ALTER TABLE organizations ADD COLUMN created_by_email TEXT")
            conn.commit()
            print("Column added successfully.")
        else:
            print("Column already exists.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    fix_schema()
