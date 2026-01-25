
import requests
import time
import os

BASE_URL = "http://127.0.0.1:5000"
VIDEO_PATH = "data/videos/traffic.mp4"

def test_speed():
    print(f"🚀 Speed Test: {VIDEO_PATH}...")
    
    files = {'video': open(VIDEO_PATH, 'rb')}
    try:
        start_time = time.time()
        r = requests.post(f"{BASE_URL}/upload_video", files=files)
        data = r.json()
        if not data.get('success'):
            print("❌ Upload Failed")
            return
        
        print("⏳ Processing...")
        while True:
            r = requests.get(f"{BASE_URL}/status")
            status = r.json()
            if status['status'] == 'completed':
                elapsed = time.time() - start_time
                print(f"✅ DONE in {elapsed:.2f} seconds!")
                break
            elif status['status'] == 'error':
                print(f"❌ Failed: {status['error']}")
                break
            time.sleep(1)
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_speed()
