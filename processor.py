import cv2
import numpy as np
from ultralytics import YOLO
import easyocr
import os
import csv
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VehicleData:
    def __init__(self, cls_id, bbox):
        self.cls_id = cls_id
        self.frames_seen = 0
        self.last_seen_frame = 0
        self.locked = False      # Mark as counted
        self.plate_locked = False # Initial OCR Success
        self.ocr_attempts = 0     # Increased cap
        self.csv_written = False  
        
        self.color = "Blue"  # Default
        self.type_str = "Car"
        
        # OCR Data
        self.initial_plate = "Not Detected"
        self.best_plate = "Not Detected"
        self.best_conf = 0.0
        
        if cls_id == 2: self.type_str = "Car"
        elif cls_id == 3: self.type_str = "Bike"
        elif cls_id == 7: self.type_str = "Truck"

class SITAProcessor:
    def __init__(self):
        logger.info("Initializing SITA Processor (VIVA-SAFE)...")
        print("DEBUG: Loading YOLO Model...")
        self.model = YOLO("yolov8s.pt") 
        print("DEBUG: YOLO Loaded. Initializing OCR...")
        # OPTIMIZATION: Enable GPU and allowlist
        import torch
        use_gpu = torch.cuda.is_available()
        print(f"DEBUG: OCR GPU Accelerated: {use_gpu}")
        self.reader = easyocr.Reader(['en'], gpu=use_gpu)
        print("DEBUG: OCR Initialized.")
        self.tracks = {}

    def detect_color(self, crop):
        if crop.size == 0: return "Blue"
        h, w, _ = crop.shape
        # Smart Center Crop
        center = crop[int(h*0.2):int(h*0.75), int(w*0.25):int(w*0.75)]
        if center.size == 0: return "Blue"
        
        hsv = cv2.cvtColor(center, cv2.COLOR_BGR2HSV)
        ranges = {
            "White": [((0, 0, 180), (180, 50, 255))],
            "Black": [((0, 0, 0), (180, 255, 50))],
            "Red":   [((0, 70, 50), (10, 255, 255)), ((170, 70, 50), (180, 255, 255))],
            "Blue":  [((100, 150, 0), (140, 255, 255))],
            "Gray":  [((0, 0, 50), (180, 50, 180))]
        }
        
        best_color = "Blue"
        max_pixels = 0
        total = center.shape[0] * center.shape[1]
        
        for name, r_list in ranges.items():
            count = 0
            for (low, high) in r_list:
                mask = cv2.inRange(hsv, np.array(low), np.array(high))
                count += cv2.countNonZero(mask)
            if count > max_pixels and (count/total) > 0.3:
                max_pixels = count
                best_color = name
        return best_color

    def detect_plate(self, crop, frame_width):
        if crop.size == 0: return "Not Detected", 0.0
        h, w, _ = crop.shape
        if w < (frame_width * 0.05): return "Not Detected", 0.0

        # Expand Crop Rule: Start at 40% height, End at 85%
        p_y1, p_y2 = int(h * 0.40), int(h * 0.85)
        p_x1, p_x2 = int(w * 0.05), int(w * 0.95)
        plate_crop = crop[p_y1:p_y2, p_x1:p_x2]
        if plate_crop.size == 0: return "Not Detected", 0.0

        # Dynamic Padding
        pad = max(5, int(frame_width * 0.01))
        plate_crop = cv2.copyMakeBorder(plate_crop, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=(0,0,0))

        # Preprocessing: Grayscale
        gray = cv2.cvtColor(plate_crop, cv2.COLOR_BGR2GRAY)
        
        # 1. Sharpening Kernel (New)
        kernel = np.array([[0, -1, 0], [-1, 5,-1], [0, -1, 0]])
        sharpened = cv2.filter2D(gray, -1, kernel)
        
        # 2. Resize
        resized = cv2.resize(sharpened, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)
        
        # 3. Thresholding Candidates
        _, thresh_otsu = cv2.threshold(resized, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # 4. CLAHE
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        enhanced = clahe.apply(resized)
        
        # Candidates for OCR
        # Include 'gray' (raw resized) as sometimes filters destroy features
        raw_resized = cv2.resize(gray, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)
        candidates = [thresh_otsu, enhanced, raw_resized]

        best_text = "Not Detected"
        best_score = 0.0

        for img in candidates:
            try:
                # OPTIMIZATION: Allowlist for AlphaNumeric only
                results = self.reader.readtext(img, allowlist='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ')
                for (_, text, score) in results:
                    clean = text.upper().replace(" ", "").replace(".", "").replace("-", "")
                    # Penalize short strings
                    if len(clean) < 4: continue
                    
                    if score > best_score:
                        best_score = score
                        best_text = clean
            except: pass
        
        return best_text, best_score

    def process_video(self, video_path, output_csv_path, output_video_path, update_callback=None):
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened(): raise ValueError("Video Error")

        w_orig = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        h_orig = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = int(cap.get(cv2.CAP_PROP_FPS)) or 30
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # PERFORMANCE: Relaxed limit to 1920px for better OCR
        scale = 1.0
        if w_orig > 1920:
            scale = 1920 / w_orig
            w_out, h_out = 1920, int(h_orig * scale)
        else:
            w_out, h_out = w_orig, h_orig

        # CODEC FIX: Use VP9 (WebM) for browser compatibility.
        try:
            fourcc = cv2.VideoWriter_fourcc(*'vp09') # VP9
            out = cv2.VideoWriter(output_video_path, fourcc, fps, (w_out, h_out))
            if not out.isOpened():
                print("DEBUG: VP9 Failed, trying VP8...")
                fourcc = cv2.VideoWriter_fourcc(*'vp80') # VP8
                out = cv2.VideoWriter(output_video_path, fourcc, fps, (w_out, h_out))
            
            if not out.isOpened():
                # Last resort fallback
                print("DEBUG: VP8 Failed, trying mp4v fallback...")
                fourcc = cv2.VideoWriter_fourcc(*'mp4v')
                out = cv2.VideoWriter(output_video_path, fourcc, fps, (w_out, h_out))
        except Exception as e:
            logger.error(f"VideoWriter Init Failed: {e}")
            raise e

        self.tracks = {}
        with open(output_csv_path, 'w', newline='') as f:
            # Updated Header for Dual Plate Tracking
            csv.writer(f).writerow(["vehicle_type", "color", "number_plate", "initial_plate", "confidence", "frame"])

        frame_idx = 0
        counters = {"total": 0, "cars": 0, "bikes": 0, "trucks": 0, "progress": 0}
        frame_skip = 5
        
        try:
            while True:
                ret, frame = cap.read()
                if not ret: break
                frame_idx += 1
                
                # PROGRESS LOGIC
                if frame_idx % 10 == 0:
                    logger.info(f"DEBUG: Processing Frame {frame_idx}")
                    if total_frames > 0:
                        progress = int((frame_idx / total_frames) * 100)
                        if progress > 99: progress = 99 
                    else:
                        progress = 50 
                    
                    counters["progress"] = progress
                    if update_callback: update_callback(counters)
                
                # Optimized Output
                if frame_idx % frame_skip != 0:
                    out.write(cv2.resize(frame, (w_out, h_out)))
                    continue

                if scale != 1.0: frame = cv2.resize(frame, (w_out, h_out))
                
                try:
                    results = self.model.track(frame, persist=True, tracker="bytetrack.yaml", 
                                             classes=[2, 3, 7], imgsz=640, verbose=False) # Increased imgsz for better detection
                    
                    frame_ids = []
                    for r in results:
                        if r.boxes.id is not None:
                            boxes, ids, clss, confs = r.boxes.xyxy.cpu().numpy(), r.boxes.id.cpu().numpy(), r.boxes.cls.cpu().numpy(), r.boxes.conf.cpu().numpy()
                            for box, tid, cid, conf in zip(boxes, ids, clss, confs):
                                tid = int(tid)
                                frame_ids.append(tid)
                                if tid not in self.tracks: 
                                    v_obj = VehicleData(int(cid), box)
                                    v_obj.confidence = float(conf)
                                    self.tracks[tid] = v_obj
                                v = self.tracks[tid]
                                v.frames_seen += 1
                                v.last_seen_frame = frame_idx
                                
                                x1, y1, x2, y2 = map(int, box)
                                crop = frame[y1:y2, x1:x2]

                                # LOGIC: Count & Color
                                if not v.locked and v.frames_seen == 5:
                                    v.locked = True
                                    v.color = self.detect_color(crop)
                                    counters["total"] += 1
                                    if v.type_str == "Car": counters["cars"] += 1
                                    elif v.type_str == "Bike": counters["bikes"] += 1
                                    elif v.type_str == "Truck": counters["trucks"] += 1
                                    if update_callback: update_callback(counters)

                                # LOGIC: OCR (Enhanced)
                                # Try OCR more times (up to 10) to find best plate
                                if v.ocr_attempts < 10: 
                                    if v.frames_seen >= 5 and v.frames_seen % 5 == 0: # Check frequency increased
                                        v.ocr_attempts += 1
                                        text, score = self.detect_plate(crop, w_out)
                                        
                                        if text != "Not Detected" and score > 0.3: # Threshold
                                            # Update Best Plate
                                            if score > v.best_conf:
                                                v.best_conf = score
                                                v.best_plate = text
                                            
                                            # Set Initial Plate if empty
                                            if v.initial_plate == "Not Detected":
                                                v.initial_plate = text
                                                v.plate_locked = True # We have at least one lock

                                # DRAWING
                                color = (0, 255, 0)
                                # Show BEST plate on UI
                                lbl = v.type_str
                                if v.best_plate != "Not Detected": 
                                    color, lbl = (0, 255, 255), v.best_plate
                                    
                                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                                (tw, th), _ = cv2.getTextSize(lbl, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 1)
                                cv2.rectangle(frame, (x1, y1-20), (x1+tw, y1), color, -1)
                                cv2.putText(frame, lbl, (x1, y1-5), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,0,0), 2)
                                
                except Exception as e:
                    logger.error(f"Frame {frame_idx} Inference Failed: {e}")
                    
                out.write(frame)
                
                # Cleanup Old Tracks & Write Best Result
                for tid, v in self.tracks.items():
                    if tid not in frame_ids and v.locked and not v.csv_written:
                        if (frame_idx - v.last_seen_frame) > 15:
                            with open(output_csv_path, 'a', newline='') as f:
                                # Write BEST and INITIAL
                                csv.writer(f).writerow([v.type_str, v.color, v.best_plate, v.initial_plate, f"{v.best_conf:.2f}", frame_idx])
                                v.csv_written = True

            # Final Flush
            for tid, v in self.tracks.items():
                if v.locked and not v.csv_written:
                    with open(output_csv_path, 'a', newline='') as f:
                        csv.writer(f).writerow([v.type_str, v.color, v.best_plate, v.initial_plate, f"{v.best_conf:.2f}", frame_idx])
                        v.csv_written = True

        except Exception as main_e:
            logger.error(f"Critical Processing Error: {main_e}")
            raise main_e
        finally:
            print(f"DEBUG: Finalizing Video. Total Frames: {frame_idx}")
            cap.release()
            out.release()
            
        return counters
