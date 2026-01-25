import cv2
import easyocr
import os

IMAGE_PATH = r"dataset_raw/archive/video_images/car-wbs-MH01DE2780_00000.png"

if not os.path.exists(IMAGE_PATH):
    print("Image not found:", IMAGE_PATH)
    exit()

img = cv2.imread(IMAGE_PATH)
if img is None:
    print("Failed to load image")
    exit()

gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
gray = cv2.bilateralFilter(gray, 11, 17, 17)

thresh = cv2.adaptiveThreshold(
    gray, 255,
    cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
    cv2.THRESH_BINARY,
    11, 2
)

reader = easyocr.Reader(['en'], gpu=False)
results = reader.readtext(thresh)

print("Detected text:")
for (bbox, text, confidence) in results:
    if confidence > 0.4:
        print(f"Text: {text} | Confidence: {confidence:.2f}")
