# SITA: SMART INTELLIGENT TRAFFIC ANALYZER 🚀
### **[ ANTIGRAVITY-SCALE INTELLIGENCE CORE ]**

> **CURRENT VERSION**: 2.1.0 (Genesis Build)
> **STATUS**: PRODUCTION READY

SITA is a production-grade, enterprise-scale traffic analytics platform designed for the next generation of urban surveillance. It combines cutting-edge Computer Vision (YOLOv11+OCR) with a cinematic, highly secure user experience known as the **"Antigravity Experience."**

Unlike traditional dashboards, SITA isolates the operator in a deep-focus environment using 3D spatial audio, glassmorphism UI, and motion-reactive elements.

---

## 🌌 The Design Philosophy: "Antigravity"
SITA is not just a tool; it's an immersive experience. The frontend (React/Vite) is built with a deep-space aesthetic, featuring:

- **Cinematic Depth**: Parallax starfields (`StarField.jsx`), glassmorphism panels, and 3D motion illusions using **Framer Motion**.
- **High-Fidelity Interaction**: Smooth transitions, glitch-effect verifications, and custom audio feedback via the Web Audio API.
- **Agent Focus**: A streamlined, sidebar-free dashboard designed for maximum visual focus on neural data feeds.

---

## 🛠 System Architecture & Tech Stack

### **1. The Command Center (Frontend)**
The interface is a Single Page Application (SPA) built for speed and visual fidelity.
- **Core**: React 18 + Vite (Ultra-fast HMR).
- **Styling**: Tailwind CSS with a custom "Deep Space" palette (`brand-dark`, `brand-neon`).
- **State Machine**: React Context API handling global `AuthContext` (Session Claims) and `ToastContext` (System Feedback).
- **Security**: `ProtectedRoute.jsx` acts as a client-side firewall, validating RBAC claims before rendering routes.

### **2. The Neural Hub (Backend)**
The brain of SITA is a high-performance Flask application designed for non-blocking inference.
- **Engine**: Flask (Python 3.9+) with **Threaded Multi-Job** support.
- **Auth Gateway**: Multi-factor authentication supporting **Google OAuth**, **Twilio Mobile OTP**, and Email Magic Links.
- **Vision Core**:
    - **Detector**: `Ultralytics YOLOv11` (Optimized `yolov8s.pt` model) for vehicle tracking.
    - **Tracker**: `ByteTrack` algorithm for persistent object ID retention across frames.
    - **OCR Engine**: GPU-Accelerated `EasyOCR` with **Dual-Plate Tracking** (captures both *Initial Lock* and *Best Refined* plates).
    - **Image Enhancement**: Real-time sharpening kernels and CLAHE preprocessing for blurry plates.
- **Database**: SQLite3 (`sita.db`) with relational mapping for Users, Organizations, and OTP Codes.

---

## 🚀 Deep Dive: How It Works

### **1. The Video Processing Pipeline (Process-Flow)**
The core value of SITA is its ability to ingest raw footage and convert it into structured intelligence. Here is the exact technical lifecycle of a video file:

1.  **Ingestion & Persistence**:
    -   User uploads a video via the Drag-and-Drop zone (`GlassPanel`).
    -   **State Persistence**: Analysis progress is saved to `localStorage`, protecting data against accidental tab closures.
    -   Backend validates file integrity and generates a unique `UUID` Job ID.

2.  **Neural Analysis (Frame-by-Frame)**:
    -   **Preprocessing**: Frames are resized and sharpened.
    -   **Inference**: YOLO detects objects (Cars, Bikes, Trucks).
    -   **Tracking**: Each object is tracked using ByteTrack.
    -   **Dual-Plate OCR**:
        -   **Initial Plate**: Records the first valid alphanumeric sequence found.
        -   **Best Plate**: Continuously refines the reading over 10 frames to find the highest confidence match.
    -   **Color Logic**: HSV Color Space analysis determines the dominant color.

3.  **Universal Transcoding (CRITICAL)**:
    -   *Problem*: Browser support for `.avi` or raw `mp4` codecs (like `mp4v`) is inconsistent.
    -   *Solution*: The pipeline automatically transcodes the output video to **VP9 (WebM)**.
    -   *Why?*: VP9 is supported natively by all modern browsers (Chrome, Edge, Firefox) without plugins, ensuring 100% playback reliability.

4.  **Data Serialization**:
    -   Detections are written to a CSV file in real-time.
    -   Once complete, the frontend swaps the "Scanning" placeholder for the actual processed video.

### **2. Role-Based Access Control (RBAC)**
SITA employs a strict 3-tier hierarchy enforced by the `@require_role` decorator in Flask and `ProtectedRoute` in React.

| Role | Designation | Responsibilities |
| :--- | :--- | :--- |
| **Super Admin** | `SITA COMMANDER` | The "God Mode" of the system. Can create Organizations (Sectors), manage global configurations, and audit all logs. Restricted from operational dashboards to maintain governance focus. |
| **Organization Admin** | `SECTOR COMMANDER` | The Head of a Department (e.g., "NAMPALLY POLICE"). Manages agents within their sector. Can view all operational data for their specific organization. |
| **Agent (User)** | `OPERATIVE` | The field user. Has access to the **Detection Dashboard** to run analysis video files. Can only see their own data. |

### **3. Organization Governance**
SITA is multi-tenant by design.
-   **Creation**: Only Super Admins can commission new Sectors.
-   **Unique Identity**: Each organization gets a unique, cryptographically generated code (e.g., `SITA-TG-HYD-8392`).
-   **Joining**: Users can join an organization by providing the Unique Code and the Sector Access Key (Password).

---

## 🛡 System Robustness & Security
SITA is built for enterprise stability:
-   **Kernel Panic Protection**: Global `ErrorBoundary` catches unexpected React crashes and displays a custom failure recovery screen.
-   **Audit Trails**: Every critical action (Login, Upload, Ban) is logged in the `activity_logs` table with IP address and User ID.
-   **Automated Maintenance**: A backend **Storage Audit** routine (`cleanup_temp_folders`) purges temporary upload/download artifacts on every server startup to prevent disk bloat.
-   **Secure Identity Gate**: Requests are validated against unique agent sessions (JWT/Session Tokens) to ensure data integrity.

---

## 🛠️ Setup & Installation Guide

### **1. Prerequisites**
-   **Python 3.9+** (Required for PyTorch/Ultralytics)
-   **Node.js 16+** (Required for Vite)
-   **FFmpeg** (Optional, but recommended for advanced transcoding)

### **2. Neural Core (Backend) Setup**
```bash
# 1. Navigate to project root
cd SITA

# 2. Create Virtual Environment (Recommended)
python -m venv .venv
# Windows
.\.venv\Scripts\activate
# Mac/Linux
source .venv/bin/activate

# 3. Install AI Dependencies
pip install -r requirements.txt
# If not present, install manually:
pip install ultralytics flask flask_cors opencv-python easyocr lapx numpy colorama

# 4. Initialize Database & Run Server
python app.py
```
*Server will start on `http://0.0.0.0:7860`*

### **3. Command Center (Frontend) Setup**
```bash
# 1. Navigate to frontend directory
cd sita-web

# 2. Install Node Modules
npm install

# 3. Ignite the Interface
npm run dev
```
*Client will launch on `http://localhost:5173`*

---

## 🧪 Troubleshooting & Utilities
We have included specialized scripts for system maintenance:

-   `clean_admin.py`: **EMERGENCY RESET**. Deletes the Super Admin account if the password is lost.
-   `fix_org_schema.py`: Repairs the database schema if the `organizations` table is missing columns.
-   `verify_db.py`: Runs a quick health check on the SQLite database.

---

**© 2026 SITA | Enterprise Traffic Intelligence | [REDACTED] FOR SECURITY**
