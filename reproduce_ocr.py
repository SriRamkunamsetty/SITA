import cv2
import easyocr
import numpy as np
import os

# Initialize EasyOCR once
reader = easyocr.Reader(['en'], gpu=False)

def original_detect_plate(crop, frame_width=1920):
    if crop.size == 0: return "Not Detected"
    h, w, _ = crop.shape
    
    # Original logic from processor.py (approximate reconstruction for standalone testing)
    # Note check: if w < (frame_width * 0.05): return "Not Detected" (Skipping for static image test)

    # Expand Crop Rule: Start at 40% height, End at 85%
    p_y1, p_y2 = int(h * 0.40), int(h * 0.85)
    p_x1, p_x2 = int(w * 0.05), int(w * 0.95)
    plate_crop = crop[p_y1:p_y2, p_x1:p_x2]
    
    if plate_crop.size == 0: return "Not Detected", None

    # Dynamic Padding (1% of frame width)
    pad = max(5, int(1920 * 0.01)) # Assuming 1920 for test
    plate_crop = cv2.copyMakeBorder(plate_crop, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=(0,0,0))

    # OCR Preprocessing (Grayscale first)
    gray = cv2.cvtColor(plate_crop, cv2.COLOR_BGR2GRAY)
    gray = cv2.resize(gray, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_LINEAR)

    def run_ocr(img):
        try:
            # Confidence 0.15 (Master Rule)
            results = reader.readtext(img)
            for (_, text, score) in results:
                clean = text.upper().replace(" ", "").replace(".", "").replace("-", "")
                if score >= 0.15 and len(clean) >= 4: return clean, score
        except: pass
        return None, 0

    res, score = run_ocr(gray)
    if res: return res, score
    
    # Heavy Enhancement fallback
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    res, score = run_ocr(clahe.apply(gray))
    if res: return res, score
    
    return "Not Detected", 0

def improved_detect_plate(crop, frame_width=1920):
    if crop.size == 0: return "Not Detected"
    h, w, _ = crop.shape
    
    # Improved cropping?
    # Maybe the 40%-85% cut is too aggressive or wrong for some cars?
    # Let's try full crop first or less aggressive.
    
    # For now, keep crop logic but improve preprocessing
    p_y1, p_y2 = int(h * 0.40), int(h * 0.85)
    p_x1, p_x2 = int(w * 0.05), int(w * 0.95)
    plate_crop = crop[p_y1:p_y2, p_x1:p_x2]
    
    if plate_crop.size == 0: return "Not Detected", None
    
    pad = 10
    plate_crop = cv2.copyMakeBorder(plate_crop, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=(0,0,0))

    gray = cv2.cvtColor(plate_crop, cv2.COLOR_BGR2GRAY)
    
    # 1. Bilateral Filter tracking (denoise but keep edges)
    filtered = cv2.bilateralFilter(gray, 11, 17, 17)
    
    # 2. Resize
    resized = cv2.resize(filtered, None, fx=3.0, fy=3.0, interpolation=cv2.INTER_CUBIC)
    
    # 3. Thresholding (Adaptive) - from test_plate_ocr.py
    thresh = cv2.adaptiveThreshold(
        resized, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        11, 2
    )
    
    # 4. Otsu's Thresholding as alternative
    _, otsu = cv2.threshold(resized, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    candidates = [resized, thresh, otsu] # Try plain expanded, adaptive, and otsu

    def run_ocr(img):
        try:
            results = reader.readtext(img)
            best_text = None
            best_score = 0
            for (_, text, score) in results:
                clean = text.upper().replace(" ", "").replace(".", "").replace("-", "")
                if score >= 0.15 and len(clean) >= 4: 
                    if score > best_score:
                        best_score = score
                        best_text = clean
            return best_text, best_score
        except: return None, 0

    for img in candidates:
        res, score = run_ocr(img)
        if res: return res, score
        
    return "Not Detected", 0


images = [
    r"dataset_raw/archive/video_images/car-wbs-MH01DE2780_00000.png",
    r"dataset_raw/archive/video_images/car-wbs-MH12FU1014_00000.png",
    r"dataset_raw/archive/video_images/car-wbs-MH43AF5037_00000.png",
    r"dataset_raw/archive/video_images/car-wbs-MH43BU2401_00000.png",
]

print(f"{'Image':<40} | {'Original':<20} | {'Score':<5} | {'Improved':<20} | {'Score':<5}")
print("-" * 100)

for img_path in images:
    if not os.path.exists(img_path):
        print(f"File not found: {img_path}")
        continue
        
    img = cv2.imread(img_path)
    if img is None: continue
    
    # Current logic expects a crop from a vehicle detection
    # These images seem to be crops or full cars? 
    # Let's assume they are car crops based on filenames.
    
    res_orig, score_orig = original_detect_plate(img)
    res_imp, score_imp = improved_detect_plate(img)
    
    name = os.path.basename(img_path)
    print(f"{name:<40} | {res_orig:<20} | {score_orig:.2f} | {res_imp:<20} | {score_imp:.2f}")
