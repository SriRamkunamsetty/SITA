import cv2
from ultralytics import YOLO

# -----------------------------
# Load models
# -----------------------------
vehicle_model = YOLO("yolov8n.pt")
plate_model = YOLO("models/yolov8n-license-plate.pt")

cap = cv2.VideoCapture("data/videos/traffic.mp4")

if not cap.isOpened():
    print("Error: Could not open video")
    exit()

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # -----------------------------
    # VEHICLE DETECTION
    # -----------------------------
    vehicle_results = vehicle_model(frame, stream=True)

    for r in vehicle_results:
        for box in r.boxes:
            confidence = float(box.conf[0])
            cls_id = int(box.cls[0])
            label = vehicle_model.names[cls_id]

            # Vehicle type mapping
            if label in ["motorcycle", "bicycle"]:
                vehicle_type = "two_wheeler"
                if confidence < 0.25:
                    continue
            elif label in ["car", "truck", "bus"]:
                vehicle_type = label
                if confidence < 0.4:
                    continue
            else:
                continue

            x1, y1, x2, y2 = map(int, box.xyxy[0])

            # Draw vehicle box
            cv2.rectangle(frame, (x1, y1), (x2, y2),
                          (0, 255, 0), 2)

            cv2.putText(frame,
                        vehicle_type,
                        (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.6,
                        (0, 255, 0),
                        2)

    # -----------------------------
    # NUMBER PLATE DETECTION
    # -----------------------------
    plate_results = plate_model(frame, stream=True)

    for r in plate_results:
        for box in r.boxes:
            p_conf = float(box.conf[0])
            if p_conf < 0.4:
                continue

            px1, py1, px2, py2 = map(int, box.xyxy[0])

            # Draw plate box
            cv2.rectangle(frame, (px1, py1), (px2, py2),
                          (255, 0, 0), 2)

            cv2.putText(frame,
                        "Plate",
                        (px1, py1 - 8),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.6,
                        (255, 0, 0),
                        2)

    cv2.imshow("SITA - Vehicle & Plate Detection", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
