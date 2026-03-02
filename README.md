# SITA: Smart Intelligent Traffic Analyzer 🚀
### **[ ANTIGRAVITY-SCALE INTELLIGENCE CORE ]**

> **CURRENT VERSION**: 2.1.0 (Genesis Build)  
> **STATUS**: PRODUCTION READY  

SITA is a production-grade, enterprise-scale traffic analytics platform designed for the next generation of urban surveillance. It combines cutting-edge Computer Vision (YOLOv11+OCR) with a cinematic, highly secure user experience known as the **"Antigravity Experience."** 

Unlike traditional dashboards, SITA isolates the operator in a deep-focus environment using 3D spatial audio, glassmorphism UI, and motion-reactive elements.

---

## 🌍 Solving Real-World Problems

In modern smart cities and enterprise security operations, managing and analyzing massive amounts of traffic data manually is error-prone, costly, and extremely slow. SITA automates critical urban infrastructure and security pipelines to resolve real-world bottlenecks:

1. **Automated Law Enforcement & Suspect Tracking**
   - *The Problem:* Searching for a suspicious vehicle involves officers manually scanning hours of grainy CCTV footage.
   - *The Solution:* SITA’s neural network automatically tags every vehicle with its class (Car, Bike, Truck), dominant color, and license plate number. An operator can simply query the SITA database for "Red Car, Plate Starts with TS09" and instantly receive the associated frames and timestamps.

2. **Smart City Planning & Traffic Surveys**
   - *The Problem:* Urban planners heavily rely on hiring human traffic surveyors to stand at intersections for hours to manually click counters for each passing vehicle. 
   - *The Solution:* SITA autonomously processes drone or stationary camera footage, extracting precise vehicular volume, classifications, and movement density. This data aids in optimizing traffic light rhythms and measuring infrastructural ROI.

3. **Facility Access Control & Parking Automation**
   - *The Problem:* Manual gating systems create huge traffic pileups at enterprise campuses and residential societies. 
   - *The Solution:* SITA's dual-plate tracking mechanism verifies clearance for vehicles against an approved database without the vehicle needing to stop, seamlessly logging entries/exits into its CSV and SQLite systems.

---

## 🛠 System Architecture & Tech Stack

### **1. The Command Center (Frontend)**
The interface is a Single Page Application (SPA) built for extreme speed and visual fidelity.
- **Core Framework**: React 18 + Vite (Ultra-fast HMR)
- **Design System**: Tailwind CSS with a custom "Deep Space" palette (`brand-dark`, `brand-neon`)
- **Animation Engine**: Framer Motion (Glassmorphism panels, parallax starfields, and 3D motion illusions)
- **State Machine**: Context API (`AuthContext` for RBAC, `ToastContext` for feedback)
- **Client Firewall**: `ProtectedRoute.jsx` acts as a UI shield, preventing any unverified access utilizing strict route checks.
- **Biometric Web Audio API**: Immersive sounds on success/fail checks (`useSystemSound` Hook).

### **2. The Neural Hub (Backend)**
The brain of SITA is a high-performance Python application designed for non-blocking ML inference.
- **API Engine**: Flask (Python 3.9+) with **Threaded Multi-Job** Background Workers.
- **Multi-Factor Auth (MFA)**:
    - **Google OAuth**: Secure enterprise single sign-on.
    - **Twilio SMS**: High-deliverability mobile OTP via Twilio Verify API.
    - **SMTP Email Protocol**: Email OTP integration and Secure Links.
- **Database Layer**: Relational mapping with `SQLite3` (`sita.db`), handling Users, Sectors (Organizations), and audit-trailed Job Activity Logs.

### **3. The Artificial Intelligence Core (Vision Pipeline)**
- **Object Detection**: `Ultralytics YOLOv11` (Optimized `yolov8s.pt` model)
- **Object Tracking**: `ByteTrack` algorithm (sustains unique vehicular identities even if objects become temporarily occluded).
- **OCR Engine**: GPU-Accelerated `EasyOCR` paired with custom `lapx` edge sharpening. 
- **Computer Vision Math**: `OpenCV` (cv2) and `NumPy` used for HSV Color Space conversions and boundary manipulations.

---

## 🚀 Deep Dive: How the Pipeline Works

The core functionality of SITA is ingesting raw video footage and turning it into structured, actionable intelligence. SITA uses a **Multi-Stage Neural Pipeline**:

1. **Ingestion & Cryptographic Logging**:
    - The operator uploads a video via the secure UI. 
    - The Flask backend generates a unique `UUID` job hash.
    - `Job Tracking` is initiated inside the SQLite database, storing the payload state so it survives server reboots or tab closures.

2. **Frame Preprocessing**:
    - Frames are sliced from the video feed.
    - Using `OpenCV`, lighting variance is normalized using **CLAHE** (Contrast Limited Adaptive Histogram Equalization).

3. **Inference & ByteTracking**:
    - The `YOLOv11` model scans the frame and returns bounding boxes spanning vehicles.
    - `ByteTrack` links these bounding boxes frame-over-frame, so "Car #24" remains "Car #24" as it drives across the screen.

4. **HSV Color Mapping & Dual-Plate Tracking**:
    - SITA examines the central pixel block of the vehicle's bounding box and translates the RGB spectrum into the **HSV** (Hue, Saturation, Value) model to accurately name the dominant color (e.g., Red, Blue, White), ignoring glare.
    - **Dual-Plate Engine**: As the vehicle moves, SITA uses `EasyOCR` to scan the plate. It records the *Initial Lock* (first readable frame) and then continuously swaps it with the *Best Refined* frame (highest OCR confidence score) over 10 consecutive ticks to ensure near-100% plate accuracy.

5. **Universal VP9 Transcoding (CRITICAL)**:
    - SITA autonomously stitches the AI-annotated frames back into a video stream.
    - Because modern browsers fail to play `.avi` or raw `.mp4v` codec files without plugins, SITA runs a background `ffmpeg`-level equivalent operation to transcode the output immediately into **VP9 (.webm)**. This ensures guaranteed 4K/1080p playback inside Google Chrome, Edge, and Firefox.

6. **Serialization & Presentation**:
    - Extracted data (Type, Color, Best Plate reads) are immediately serialized into an encrypted CSV array.
    - Background workers trigger an API signal to the React frontend, automatically switching from the "Scanning" screen to the Interactive Video Player & Data Grid.

---

## 🛡 System Governance & Security (RBAC)

SITA operates on a strict **3-Tier Role-Based Access Control** hierarchy enforced by `@require_role` in Flask:

| Role | Designation | Responsibilities |
| :--- | :--- | :--- |
| **Super Admin** | `SITA COMMANDER` | "God Mode". Commissions new organizations, manages global configurations, audits all cross-sector logs. |
| **Organization Admin** | `SECTOR COMMANDER` | Head of a specific Department (e.g., "NYPD Traffic Ops"). Can view operational data and agent telemetry solely for their own organization context. |
| **Agent (User)** | `OPERATIVE` | The field user. Runs video analysis files through the AI engine and generates on-the-ground traffic intelligence. |

Organizations are strictly siloed. SITA uses **Sector Unique Cryptographic Codes** (e.g., `SITA-TG-HYD-8392`) that a user must provide during onboarding alongside an admin-defined password to authenticate their affiliation.

---

## 🛠️ Setup & Installation Guide

### **1. Prerequisites**
- **Python 3.9+** 
- **Node.js 18+** 
- **FFmpeg** (Recommended on system PATH for enhanced multimedia handling)

### **2. Database & Auth Environment**
Clone the `.env` configuration file into `SITA/`. This powers the SMS/Email security grid:
```env
SITA_MAIL_USER=your_gmail_here
SITA_MAIL_PASS=your_16_char_google_app_password

TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_SERVICE_SID=create_a_verify_service_and_paste_sid_here
```

### **3. Neural Core (Backend) Ignition**
```bash
# 1. Setup Environment
cd SITA
python -m venv .venv
.\.venv\Scripts\activate   # Windows
# source .venv/bin/activate # Mac/Linux

# 2. Install ML/Web Requirements
pip install -r requirements.txt

# 3. Ignite Core Server
python app.py
```
*Server runs on `http://127.0.0.1:7860`*

### **4. Command Center (Frontend) Ignition**
```bash
cd sita-web
npm install
npm run dev
```
*Interface available on `http://localhost:5173`*

---

**© 2026 SITA | Enterprise Traffic Intelligence | [REDACTED] FOR SECURITY**
