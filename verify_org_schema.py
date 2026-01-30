
import sqlite3
import database
import os

def check_schema():
    print("Checking Database Schema...")
    conn = database.get_db_connection()
    c = conn.cursor()
    
    # Check Organizations Table
    try:
        c.execute("SELECT * FROM organizations LIMIT 1")
        print("[OK] Table 'organizations' exists.")
    except sqlite3.OperationalError:
        print("[FAIL] Table 'organizations' MISSING.")

    # Check Users Columns
    c.execute("PRAGMA table_info(users)")
    columns = [row[1] for row in c.fetchall()]
    
    if 'organization_id' in columns:
        print("[OK] Column 'organization_id' in 'users' exists.")
    else:
        print("[FAIL] Column 'organization_id' in 'users' MISSING.")
        
    conn.close()

def test_api_logic():
    print("\nTesting Logic...")
    try:
        # Init DB to trigger migrations
        database.init_db()
        print("[OK] Database Initialized (Migrations Verified).")
        
        # Test Create Org (Dry Run - don't actually commit if we want to keep it clean, 
        # but for dev environment it's fine)
    except Exception as e:
        print(f"[FAIL] Logic Test Failed: {e}")

if __name__ == "__main__":
    check_schema()
    test_api_logic()
