import cv2
import numpy as np
import csv
from ultralytics import YOLO

# -----------------------------
# Load YOLO model
# -----------------------------
model = YOLO("yolov8n.pt")

cap = cv2.VideoCapture("data/videos/traffic.mp4")

if not cap.isOpened():
    print("Error: Could not open video")
    exit()

# -----------------------------
# Counting line
# -----------------------------
line_y = 350  # adjust based on video height

tracked_objects = {}
counted_ids = set()
next_object_id = 0

# -----------------------------
# Counters
# -----------------------------
vehicle_count = {
    "car": 0,
    "motorcycle": 0,
    "truck": 0,
    "bicycle": 0
}

color_count = {
    "White": 0,
    "Black": 0,
    "Red": 0,
    "Blue": 0,
    "Yellow": 0,
    "Other": 0
}

vehicle_color_count = {
    "car": color_count.copy(),
    "motorcycle": color_count.copy(),
    "truck": color_count.copy(),
    "bicycle": color_count.copy()
}

# -----------------------------
# Vehicle color detection
# -----------------------------
def detect_vehicle_color(vehicle_img):
    if vehicle_img.size == 0:
        return "Other"

    hsv = cv2.cvtColor(vehicle_img, cv2.COLOR_BGR2HSV)

    white_mask = cv2.inRange(hsv, (0, 0, 200), (180, 40, 255))
    black_mask = cv2.inRange(hsv, (0, 0, 0), (180, 255, 50))

    total_pixels = vehicle_img.shape[0] * vehicle_img.shape[1]
    if total_pixels == 0:
        return "Other"

    if cv2.countNonZero(white_mask) / total_pixels > 0.35:
        return "White"

    if cv2.countNonZero(black_mask) / total_pixels > 0.35:
        return "Black"

    color_ranges = {
        "Red": ((0, 80, 80), (10, 255, 255)),
        "Blue": ((100, 150, 80), (140, 255, 255)),
        "Yellow": ((20, 120, 120), (35, 255, 255))
    }

    max_pixels = 0
    detected_color = "Other"

    for color, (lower, upper) in color_ranges.items():
        mask = cv2.inRange(hsv, np.array(lower), np.array(upper))
        count = cv2.countNonZero(mask)
        if count > max_pixels:
            max_pixels = count
            detected_color = color

    return detected_color

# -----------------------------
# Main loop
# -----------------------------
while True:
    ret, frame = cap.read()
    if not ret:
        break

    height, width, _ = frame.shape
    cv2.line(frame, (0, line_y), (width, line_y), (0, 0, 255), 2)

    results = model(frame, stream=True)

    for r in results:
        for box in r.boxes:
            confidence = float(box.conf[0])
            if confidence < 0.4:
                continue

            cls_id = int(box.cls[0])
            label = model.names[cls_id]

            if label not in ["car", "truck", "motorcycle", "bicycle"]:
                continue

            x1, y1, x2, y2 = map(int, box.xyxy[0])
            cx = (x1 + x2) // 2
            cy = (y1 + y2) // 2

            vehicle_crop = frame[y1:y2, x1:x2]
            color = detect_vehicle_color(vehicle_crop)

            # -------- Simple centroid tracking --------
            matched_id = None
            for obj_id, (px, py) in tracked_objects.items():
                if abs(cx - px) < 50 and abs(cy - py) < 50:
                    matched_id = obj_id
                    break

            if matched_id is None:
                matched_id = next_object_id
                tracked_objects[matched_id] = (cx, cy)
                next_object_id += 1
            else:
                tracked_objects[matched_id] = (cx, cy)

            # -------- Counting logic --------
            if matched_id not in counted_ids and cy > line_y:
                counted_ids.add(matched_id)

                vehicle_count[label] += 1
                color_count[color] += 1
                vehicle_color_count[label][color] += 1

            # -------- Drawing --------
            cv2.rectangle(frame, (x1, y1), (x2, y2),
                          (0, 255, 0), 2)

            cv2.circle(frame, (cx, cy), 4, (255, 0, 0), -1)

            cv2.putText(frame,
                        f"{label} | {color}",
                        (x1, y1 - 8),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.6,
                        (0, 255, 0),
                        2)

    # -------- Display live counts --------
    y_offset = 30
    for v, count in vehicle_count.items():
        cv2.putText(frame, f"{v}: {count}", (10, y_offset),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6,
                    (255, 255, 255), 2)
        y_offset += 25

    cv2.imshow("SITA - Traffic Analytics", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()

# -----------------------------
# SAVE COUNTS TO CSV FILES
# -----------------------------
with open("vehicle_count.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["vehicle_type", "count"])
    for v, c in vehicle_count.items():
        writer.writerow([v, c])

with open("color_count.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["color", "count"])
    for c, n in color_count.items():
        writer.writerow([c, n])

print("\nCSV files saved successfully!")
print("Vehicle Count:", vehicle_count)
print("Color Count:", color_count)
