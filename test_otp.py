
import os
import logging
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_send_otp():
    account_sid = os.getenv('TWILIO_ACCOUNT_SID')
    auth_token = os.getenv('TWILIO_AUTH_TOKEN')
    service_sid = os.getenv('TWILIO_SERVICE_SID')
    
    print(f"SID: {account_sid}")
    print(f"Token: {auth_token[:5]}...")
    print(f"Service: {service_sid}")

    if not account_sid or not auth_token or not service_sid:
        print("Error: Missing credentials")
        return

    try:
        client = Client(account_sid, auth_token)
        # Test number from user request
        to_number = "+916302342821" 
        
        print(f"Attempting to send OTP to {to_number}...")
        verification = client.verify.v2.services(service_sid).verifications.create(to=to_number, channel='sms')
        
        print(f"Success! SID: {verification.sid}")
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    test_send_otp()
