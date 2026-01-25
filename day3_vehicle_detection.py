import cv2
from ultralytics import YOLO

# -----------------------------
# Load YOLOv8 pretrained model
# -----------------------------
model = YOLO("yolov8n.pt")

# Video input (use 0 for live camera)
cap = cv2.VideoCapture("data/videos/traffic.mp4")

if not cap.isOpened():
    print("Error: Could not open video")
    exit()

while True:
    ret, frame = cap.read()
    if not ret:
        break

    results = model(frame, stream=True)

    for r in results:
        for box in r.boxes:
            confidence = float(box.conf[0])

            cls_id = int(box.cls[0])
            label = model.names[cls_id]

            # -----------------------------
            # Vehicle type mapping
            # -----------------------------
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

            # -----------------------------
            # Draw bounding box
            # -----------------------------
            cv2.rectangle(frame, (x1, y1), (x2, y2),
                          (0, 255, 0), 2)

            cv2.putText(frame,
                        f"{vehicle_type} {confidence:.2f}",
                        (x1, y1 - 8),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.6,
                        (0, 255, 0),
                        2)

    cv2.imshow("SITA - Vehicle Detection (Improved)", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
