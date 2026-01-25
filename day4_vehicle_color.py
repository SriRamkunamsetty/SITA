import cv2
import numpy as np
from ultralytics import YOLO

# -----------------------------
# Load YOLOv8 pretrained model
# -----------------------------
model = YOLO("yolov8n.pt")

# Video source (use 0 for live camera)
cap = cv2.VideoCapture("data/videos/traffic.mp4")

if not cap.isOpened():
    print("Error: Could not open video")
    exit()


# -------------------------------------------------
# Vehicle Color Detection Function (IMPROVED)
# -------------------------------------------------
def detect_vehicle_color(vehicle_img):
    if vehicle_img.size == 0:
        return "Unknown"

    hsv = cv2.cvtColor(vehicle_img, cv2.COLOR_BGR2HSV)

    # ---------- STEP A: Handle WHITE & BLACK first ----------
    white_mask = cv2.inRange(hsv, (0, 0, 200), (180, 40, 255))
    black_mask = cv2.inRange(hsv, (0, 0, 0), (180, 255, 50))

    white_pixels = cv2.countNonZero(white_mask)
    black_pixels = cv2.countNonZero(black_mask)

    total_pixels = vehicle_img.shape[0] * vehicle_img.shape[1]
    if total_pixels == 0:
        return "Unknown"

    if white_pixels / total_pixels > 0.35:
        return "White"

    if black_pixels / total_pixels > 0.35:
        return "Black"

    # ---------- STEP B: Detect other colors ----------
    color_ranges = {
        "Red":    ((0, 80, 80), (10, 255, 255)),
        "Blue":   ((100, 150, 80), (140, 255, 255)),
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
# Main Processing Loop
# -----------------------------
while True:
    ret, frame = cap.read()
    if not ret:
        break

    results = model(frame, stream=True)

    for r in results:
        for box in r.boxes:
            confidence = float(box.conf[0])

            # Lower confidence for small objects like bikes
            if confidence < 0.4:
                continue

            cls_id = int(box.cls[0])
            label = model.names[cls_id]

            # Include bicycle for better bike detection
            if label in ["car", "bus", "truck", "motorcycle", "bicycle"]:
                x1, y1, x2, y2 = map(int, box.xyxy[0])

                vehicle_crop = frame[y1:y2, x1:x2]
                color = detect_vehicle_color(vehicle_crop)

                # Draw bounding box
                cv2.rectangle(frame, (x1, y1), (x2, y2),
                              (0, 255, 0), 2)

                # Display label
                cv2.putText(frame,
                            f"{label} | {color}",
                            (x1, y1 - 8),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.6,
                            (0, 255, 0),
                            2)

    cv2.imshow("SITA - Vehicle Color Detection", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
