import firebase_utils
import sys

print("VERIFICATION: Testing Firebase Connection...")

if firebase_utils.init_firebase():
    print("SUCCESS: Firebase initialized successfully.")
    
    # Try a write
    try:
        print("VERIFICATION: Attempting sample write...")
        firebase_utils.fire_log_activity("system_check@sita.internal", "SYSTEM_CHECK", "Verification Script Run", "127.0.0.1")
        print("SUCCESS: Log written (or queued) without error.")
    except Exception as e:
        print(f"FAILURE: Write failed. {e}")
        sys.exit(1)
        
    print("Firebase Integration Verification: PASSED")
else:
    print("WARNING: Firebase could not be initialized.")
    print("ACTION REQUIRED: Ensure 'serviceAccountKey.json' is in the root directory.")
    print("This is EXPECTED if you haven't added the key yet.")
