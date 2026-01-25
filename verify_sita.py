import requests
import time
import sys
import os
import json

BASE_URL = "http://127.0.0.1:5000"
VIDEO_PATH = "data/videos/traffic.mp4"

def verify():
    if not os.path.exists(VIDEO_PATH):
        print(f"Error: Video file not found at {VIDEO_PATH}")
        sys.exit(1)

    print(f"Uploading {VIDEO_PATH} to {BASE_URL}...")
    try:
        with open(VIDEO_PATH, 'rb') as f:
            files = {'video': (os.path.basename(VIDEO_PATH), f, 'video/mp4')}
            response = requests.post(f"{BASE_URL}/upload_video", files=files)
        
        data = response.json()
        print("Upload Response:", data)
        
        if not data.get("success"):
            print("Upload failed.")
            return

        print("Polling for status...")
        while True:
            time.sleep(2)
            res = requests.get(f"{BASE_URL}/status")
            status = res.json()
            print(f"Status: {status['status']} | Counters: {status['counters']}")
            
            if status['status'] == 'completed':
                break
            if status['status'] == 'error':
                print("Error:", status['error'])
                return

        print("Fetching Report...")
        report = requests.get(f"{BASE_URL}/traffic_report").json()
        print(f"Report: {len(report['data'])} rows found.")
        print("First 2 rows:", report['data'][:2])

    except Exception as e:
        print(f"Verification Failed: {e}")

if __name__ == "__main__":
    verify()
