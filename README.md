# SMART INTELLIGENT TRAFFIC ANALYZER (SITA) 🚀
**VIVA-SAFE | ENTERPRISE GRADE | PRODUCTION READY**

SITA is a high-performance traffic analytics system designed for robust, automated vehicle detection, tracking, and number plate recognition. It transforms raw surveillance footage into actionable data using state-of-the-art Computer Vision.

[![Deploy to Render](https://render.com/images/deploy-to-render.svg)](https://render.com/deploy?repo=https://github.com/SriRamkunamsetty/SITA)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/SriRamkunamsetty/SITA)

---

## 🌟 Key Features

### 1. Advanced Detection & Tracking
*   **Engine**: Powered by **YOLOv8s** for high accuracy and processing efficiency.
*   **Tracking**: Integrated **ByteTrack** (via `lapx`) for industrial-grade persistent tracking.
*   **Strict Counting**: Vehicles are **ONLY** counted after being persistently tracked for **5 consecutive frames**, eliminating ghost detections and flickering.

### 2. "VIVA-SAFE" Compliance Logic
*   **Dual-Label Architecture**:
    *   **UI Overlay**: Displays generic **"Vehicle"** labels for a clean, professional appearance.
    *   **Analytics Core**: Internally classifies and records **Car, Bike, and Truck** for the data report.
*   **Strict Color Logic**: Detects **Blue, White, Red, Black, Gray**. Fallback to **"Blue"** if confidence < 30%.
*   **Exclusions**: Public transport (Buses) is explicitly ignored from analytics.

---

## ⚙️ Technical Logic (Viva-Ready)

### OCR & Plate Recognition
*   **Scanning Frequency**: OCR runs every **10 frames** per vehicle until localized or locked.
*   **Efficiency**: Max **5 attempts** per vehicle; OCR is skipped entirely if `plate_locked == True`.
*   **Preprocessing**: Multi-pass system (Grayscale -> Enhancement -> Denoising) with dynamic padding.
*   **Confidence Threshold**: Strictly locks plates at **0.15** confidence or higher.

### CSV & Reporting Guarantees
*   **Persistence**: CSV is written incrementally and flushed every 10 frames to prevent data loss.
*   **Accuracy**: Every counted vehicle (seen >= 5 frames) is guaranteed a row in the CSV.
*   **Standardized Format**: `vehicle_type | color | number_plate | frame`.
*   **Fallback**: Unreadable plates are logged as **"Not Detected"** to maintain sync with global counters.

### Live Dashboard
*   **Async Processing**: Uses threading with `job_lock` for thread-safety.
*   **Seamless Polling**: Frontend polls `/status` every 1s, receiving real-time counter states:
    ```json
    { "status": "processing", "counters": { "total": 12, "cars": 8, "bikes": 3, "trucks": 1 } }
    ```
*   **UX Design**: Video player remains **hidden** until processing is 100% complete to ensure zero lag.
*   **Mobile Support**: Fully responsive layout (Mobile, Tablet, Desktop) using Tailwind CSS.

---

## 🛠 Tech Stack

*   **Backend**: Python, Flask, Threading.
*   **AI/CV**: YOLOv8, OpenCV, EasyOCR, NumPy, Lapx.
*   **Frontend**: Responsive HTML5, TailwindCSS, FontAwesome.

---

## 📥 Installation

```bash
python -m venv .venv
.\.venv\Scripts\activate
pip install ultralytics flask opencv-python easyocr lapx numpy
python app.py
```
**URL**: [http://127.0.0.1:5000](http://127.0.0.1:5000)

---

## 🔍 Verification & Testing
1.  **Count Sync**: Ensure "Total" counter matches the number of rows in the CSV report.
2.  **UI Verification**: Check that bounding boxes in video are labeled **"Vehicle"**.
3.  **Fallback Check**: Confirm unreadable plates are logged as **"Not Detected"**.
4.  **Speed Test**: Confirm processing completes quickly (optimized via **1020px downscaling**).

---

**© 2026 SITA | Enterprise Traffic Intelligence**
