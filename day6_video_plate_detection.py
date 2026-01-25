import cv2
from ultralytics import YOLO
import easyocr
from collections import defaultdict
import os

VIDEO_PATH = r"data/videos/traffic.mp4"

vehicle_model = YOLO("yolov8n.pt")
reader = easyocr.Reader(['en'], gpu=False)

cap = cv2.VideoCapture(VIDEO_PATH)

plate_votes = defaultdict(int)

frame_count = 0

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame_count += 1
    print(f"\nFrame {frame_count}")

    results = vehicle_model(frame, stream=True)

    for r in results:
        for box in r.boxes:
            conf = float(box.conf[0])
            if conf < 0.5:
                continue

            cls_id = int(box.cls[0])
            label = vehicle_model.names[cls_id]

            if label not in ["car", "motorcycle", "bus", "truck"]:
                continue

            x1, y1, x2, y2 = map(int, box.xyxy[0])
            vehicle_crop = frame[y1:y2, x1:x2]

            if vehicle_crop.size == 0:
                continue

            # ---- plate region approximation ----
            h, w, _ = vehicle_crop.shape
            plate_crop = vehicle_crop[int(h*0.6):h, int(w*0.2):int(w*0.8)]

            if plate_crop.size == 0:
                continue

            ocr_results = reader.readtext(plate_crop)

            for (_, text, score) in ocr_results:
                if score > 0.4 and len(text) >= 6:
                    clean_text = text.replace(" ", "").upper()
                    plate_votes[clean_text] += 1
                    print(f"  {label} → Plate candidate: {clean_text} ({score:.2f})")

cap.release()

print("\nFINAL PLATE VOTES:")
for plate, count in plate_votes.items():
    print(plate, ":", count)