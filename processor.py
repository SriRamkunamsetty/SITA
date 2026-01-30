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
        self.locked = False      # Mark as counted (Frame 5)
        self.plate_locked = False # OCR Success (Score >= 0.15)
        self.ocr_attempts = 0     # Cap at 5
        self.csv_written = False  # Strict single write
        
        self.color = "Blue"  # Default
        self.plate = "Not Detected"
        self.type_str = "Car"
        
        if cls_id == 2: self.type_str = "Car"
        elif cls_id == 3: self.type_str = "Bike"
        elif cls_id == 7: self.type_str = "Truck"

class SITAProcessor:
    def __init__(self):
        logger.info("Initializing SITA Processor (VIVA-SAFE)...")
        print("DEBUG: Loading YOLO Model...")
        self.model = YOLO("yolov8s.pt") 
        print("DEBUG: YOLO Loaded. Initializing OCR...")
        self.reader = easyocr.Reader(['en'], gpu=False)
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
        if crop.size == 0: return "Not Detected"
        h, w, _ = crop.shape
        if w < (frame_width * 0.05): return "Not Detected"

        # Expand Crop Rule: Start at 40% height, End at 85%
        p_y1, p_y2 = int(h * 0.40), int(h * 0.85)
        p_x1, p_x2 = int(w * 0.05), int(w * 0.95)
        plate_crop = crop[p_y1:p_y2, p_x1:p_x2]
        if plate_crop.size == 0: return "Not Detected"

        # Dynamic Padding (1% of frame width)
        pad = max(5, int(frame_width * 0.01))
        plate_crop = cv2.copyMakeBorder(plate_crop, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=(0,0,0))

        # OCR Preprocessing (Grayscale first)
        gray = cv2.cvtColor(plate_crop, cv2.COLOR_BGR2GRAY)
        gray = cv2.resize(gray, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_LINEAR)
        # Removed fastNlMeansDenoising (Too slow on CPU)

        def run_ocr(img):
            try:
                # Confidence 0.15 (Master Rule)
                results = self.reader.readtext(img)
                for (_, text, score) in results:
                    clean = text.upper().replace(" ", "").replace(".", "").replace("-", "")
                    if score >= 0.15 and len(clean) >= 4: return clean
            except: pass
            return None

        res = run_ocr(gray)
        if res: return res
        
        # Heavy Enhancement fallback
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        return run_ocr(clahe.apply(gray)) or "Not Detected"

    def process_video(self, video_path, output_csv_path, output_video_path, update_callback=None):
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened(): raise ValueError("Video Error")

        w_orig = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        h_orig = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = int(cap.get(cv2.CAP_PROP_FPS)) or 30
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # PERFORMANCE: 1020px limit
        scale = 1.0
        if w_orig > 1020:
            scale = 1020 / w_orig
            w_out, h_out = 1020, int(h_orig * scale)
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
            csv.writer(f).writerow(["vehicle_type", "color", "number_plate", "confidence", "frame"])

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
                                             classes=[2, 3, 7], imgsz=320, verbose=False)
                    
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

                                # LOGIC: OCR
                                if not v.plate_locked and v.ocr_attempts < 5:
                                    if v.frames_seen >= 5 and v.frames_seen % 10 == 0:
                                        v.ocr_attempts += 1
                                        res = self.detect_plate(crop, w_out)
                                        if res != "Not Detected":
                                            v.plate = res
                                            v.plate_locked = True
                                            with open(output_csv_path, 'a', newline='') as f:
                                                csv.writer(f).writerow([v.type_str, v.color, v.plate, f"{v.confidence:.2f}", frame_idx])
                                                v.csv_written = True

                                # DRAWING
                                color = (0, 255, 0)
                                lbl = "Vehicle"
                                if v.plate_locked: color, lbl = (0, 255, 255), v.plate
                                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                                (tw, th), _ = cv2.getTextSize(lbl, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 1)
                                cv2.rectangle(frame, (x1, y1-20), (x1+tw, y1), color, -1)
                                cv2.putText(frame, lbl, (x1, y1-5), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,0,0), 2)
                                
                except Exception as e:
                    logger.error(f"Frame {frame_idx} Inference Failed: {e}")
                    
                out.write(frame)
                
                # Cleanup Old Tracks
                for tid, v in self.tracks.items():
                    if tid not in frame_ids and v.locked and not v.csv_written:
                        if (frame_idx - v.last_seen_frame) > 15:
                            with open(output_csv_path, 'a', newline='') as f:
                                csv.writer(f).writerow([v.type_str, v.color, v.plate, f"{v.confidence:.2f}", frame_idx])
                                v.csv_written = True

            # Final Flush
            for tid, v in self.tracks.items():
                if v.locked and not v.csv_written:
                    with open(output_csv_path, 'a', newline='') as f:
                        csv.writer(f).writerow([v.type_str, v.color, v.plate, f"{v.confidence:.2f}", frame_idx])
                        v.csv_written = True

        except Exception as main_e:
            logger.error(f"Critical Processing Error: {main_e}")
            raise main_e
        finally:
            print(f"DEBUG: Finalizing Video. Total Frames: {frame_idx}")
            cap.release()
            out.release()
            
        return counters
