
import requests
import time
import os

BASE_URL = "http://127.0.0.1:5000"
VIDEO_PATH = "data/videos/traffic.mp4"

def verify():
    print("🚀 FINAL SITA VERIFICATION...")
    files = {'video': open(VIDEO_PATH, 'rb')}
    r = requests.post(f"{BASE_URL}/upload_video", files=files)
    job_id = r.json()['job_id']
    print(f"✅ Job Started: {job_id}")
    
    while True:
        r = requests.get(f"{BASE_URL}/status")
        status = r.json()
        print(f"   [{status['status']}] Total: {status['counters']['total']}", end="\r")
        if status['status'] == 'completed':
            print("\n✅ Verification SUCCESS!")
            r_rep = requests.get(f"{BASE_URL}/traffic_report")
            print(f"📊 Rows in Report: {len(r_rep.json()['data'])}")
            break
        time.sleep(2)

if __name__ == "__main__": verify()
