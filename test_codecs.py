import cv2
import os

def test_codec(codec, ext):
    filename = f"test_{codec}.{ext}"
    print(f"Testing {codec} -> {filename}...")
    try:
        fourcc = cv2.VideoWriter_fourcc(*codec)
        out = cv2.VideoWriter(filename, fourcc, 30, (640, 480))
        if not out.isOpened():
            print(f"FAILED: {codec} could not open writer.")
            return False
        
        # Write 10 frames
        import numpy as np
        img = np.zeros((480, 640, 3), dtype=np.uint8)
        for i in range(10):
            out.write(img)
        
        out.release()
        size = os.path.getsize(filename)
        print(f"SUCCESS: {codec} created file of size {size} bytes.")
        return True
    except Exception as e:
        print(f"ERROR: {codec} exception: {e}")
        return False
    finally:
        if os.path.exists(filename):
            try:
                os.remove(filename)
            except: pass

print("OpenCV Version:", cv2.__version__)
test_codec('avc1', 'mp4')
test_codec('H264', 'mp4')
test_codec('mp4v', 'mp4')
test_codec('vp09', 'webm')
test_codec('vp80', 'webm')
