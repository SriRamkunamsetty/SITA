import firebase_admin
from firebase_admin import credentials, firestore
import os
import logging
import datetime

logger = logging.getLogger(__name__)

# Global Firestore client
db = None

def init_firebase():
    """Initializes Firebase Admin SDK if serviceAccountKey.json is present."""
    global db
    
    if db is not None:
        return db

    key_path = os.path.join(os.path.dirname(__file__), 'serviceAccountKey.json')
    
    if not os.path.exists(key_path):
        logger.warning(f"FIREBASE WARNING: '{key_path}' not found. Firebase features will be disabled.")
        return None

    try:
        cred = credentials.Certificate(key_path)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        logger.info("FIREBASE: Connected successfully.")
        return db
    except Exception as e:
        logger.error(f"FIREBASE ERROR: Failed to initialize. {e}")
        return None

def get_db():
    global db
    if db is None:
        return init_firebase()
    return db

# --- Helper Functions for Dual-Write ---

def fire_log_activity(actor_email, action, details, ip_address):
    """Logs activity to Firestore 'activity_logs' collection."""
    try:
        client = get_db()
        if not client: return

        doc_ref = client.collection('activity_logs').document()
        doc_ref.set({
            'actor_email': actor_email,
            'action': action,
            'details': details,
            'ip_address': ip_address,
            'timestamp': firestore.SERVER_TIMESTAMP
        })
    except Exception as e:
        logger.error(f"FIREBASE SYNC ERROR (Log): {e}")

def fire_upsert_user(user_data):
    """
    Syncs user data to Firestore 'users' collection.
    'user_data' should be a dictionary from the SQLite row.
    """
    try:
        client = get_db()
        if not client: return
        
        if not user_data.get('email'): return

        # Convert simple types only
        safe_data = {k: v for k, v in user_data.items() if v is not None}
        
        # Ensure ID is email
        doc_ref = client.collection('users').document(user_data['email'])
        doc_ref.set(safe_data, merge=True)
        # logger.info(f"FIREBASE: Synced user {user_data['email']}")
    except Exception as e:
        logger.error(f"FIREBASE SYNC ERROR (User): {e}")

def fire_upsert_org(org_data):
    """Syncs organization data to Firestore 'organizations' collection."""
    try:
        client = get_db()
        if not client: return

        if not org_data.get('unique_code'): return

        safe_data = {k: v for k, v in org_data.items() if v is not None}
        
        doc_ref = client.collection('organizations').document(org_data['unique_code'])
        doc_ref.set(safe_data, merge=True)
    except Exception as e:
        logger.error(f"FIREBASE SYNC ERROR (Org): {e}")
