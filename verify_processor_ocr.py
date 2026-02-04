import cv2
import os
import sys

# Mock YOLO to avoid loading heavy model just for OCR test if possible, 
# but SITAProcessor initializes it in __init__. 
# We'll just load it, it's safer to test integration.

try:
    from processor import SITAProcessor
except ImportError:
    # Add current dir to path if not there
    sys.path.append(os.getcwd())
    from processor import SITAProcessor

def verify():
    print("Initializing Processor...")
    processor = SITAProcessor() # This will load YOLO and EasyOCR
    
    images = [
        r"dataset_raw/archive/video_images/car-wbs-MH01DE2780_00000.png",
        r"dataset_raw/archive/video_images/car-wbs-MH12FU1014_00000.png",
        r"dataset_raw/archive/video_images/car-wbs-MH43AF5037_00000.png"
    ]
    
    print("-" * 60)
    print(f"{'Image':<40} | {'Detected Text':<20}")
    print("-" * 60)
    
    for img_path in images:
        if not os.path.exists(img_path):
            print(f"File not found: {img_path}")
            continue
            
        img = cv2.imread(img_path)
        if img is None: continue
        
        # Processor expects a crop. These images appear to be crops already based on filenames.
        # But wait, logic calls 'detect_plate' with 'frame_width'.
        # We need to simulate frame width. Let's say 1920.
        
        text = processor.detect_plate(img, 1920)
        
        name = os.path.basename(img_path)
        print(f"{name:<40} | {text:<20}")

if __name__ == "__main__":
    verify()
