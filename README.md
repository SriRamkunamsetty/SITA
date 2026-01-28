# SITA: SMART INTELLIGENT TRAFFIC ANALYZER 🚀
### **[ ANTIGRAVITY-SCALE INTELLIGENCE CORE ]**

SITA is a production-grade, futuristic traffic analytics platform designed for the next generation of urban surveillance. It combines cutting-edge Computer Vision (YOLOv11) with a cinematic, highly secure user experience known as the **"Antigravity Experience."**

---

## 🌌 The Design Philosophy: "Antigravity"
SITA is not just a tool; it's an immersive experience. The frontend (React/Vite) is built with a deep-space aesthetic, featuring:
- **Cinematic Depth**: Parallax starfields, glassmorphism panels, and 3D motion illusions.
- **High-Fidelity Interaction**: Smooth transitions, glitch-effect verifications, and custom audio feedback via the Web Audio API.
- **Agent Focus**: A streamlined, sidebar-free dashboard designed for maximum visual focus on neural data feeds.

---

## 🛠 Tech Stack & Architecture

### **Frontend Integration (The Command Center)**
- **Framework**: React 18 with Vite (Ultra-fast HMR).
- **Styling**: Tailored Tailwind CSS with a custom "Deep Space" palette (`brand-dark`, `brand-neon`).
- **Animations**: Framer Motion for sophisticated UI choreography.
- **Icons**: Lucide-React for crisp, vector-based iconography.
- **State Management**: React Context (Auth, Toast notifications).

### **Backend Core (The Neural Hub)**
- **Engine**: Flask (Python) with Threaded Multi-Job support.
- **Vision Engine**: **YOLOfier-v11** optimized for vehicle detection and persistent tracking.
- **OCR Engine**: Multi-pass EasyOCR with dynamic plate localized frames.
- **Database**: SQLite with unique Agent ID generation (`SITA-XXXX`).

---

## 🚀 Key Features

### **1. Secure Identity Gate**
- **Dual Authenticator**: Access via **Google OAuth 2.0** or **Secure Email OTP**.
- **Multi-Step Onboarding**: Automated agent registration covering identity, contact, purpose, and ethics compliance.
- **Identity Encryption**: Every agent is assigned a permanent, unique `SITA-XXXX` identifier.

### **2. Auto-Verification Protocol**
- **Real-time Handshake**: A dedicated verification stage that polls the backend to confirm agent status.
- **Cinematic Verification**: Visual "Unlock" sequences with system sound feedback.

### **3. Advanced Vision Analytics Hub**
- **Live Detection Feed**: Drag-and-drop video ingestion with real-time progress streaming.
- **Neural Counters**: Live tracking of Car, Bike, and Truck metrics (Buses excluded per protocol).
- **Master Detection Log**: A high-density table featuring Plate ID, Confidence, Vehicle Type, and Color.
- **Integrated Playback**: Post-analysis, the system automatically swaps the scan-placeholder for the **actual processed video file**.

### **4. Investigative Reporting**
- **Smart Filters**: Real-time searching across the entire detection log.
- **Report Hub**: One-click **EXPORT DATA** to professional CSV format for offline analysis.
- **Scroll Navigation**: Integrated "Quick-Jump" features for fluid navigation between the vision feed and data logs.

---

## 🛡 System Robustness & Security
SITA is built for enterprise stability:
- **Kernel Panic Protection**: Global `ErrorBoundary` catches unexpected React crashes and displays a custom failure recovery screen.
- **Interactive Protocols**: System-wide `Toast` system provides agents with immediate feedback on all critical API and neutral engine actions.
- **Automated Maintenance**: A backend **Storage Audit** routine purges temporary data on startup to maintain system peak performance.
- **Secure Identity Gate**: Requests are validated against unique agent sessions to ensure data integrity.

---

## 🛠️ Setup & Installation

### **1. Prerequisites**
- Python 3.9+
- Node.js 16+
- npm 7+

### **2. Neural Core (Backend) Setup**
```bash
# Navigate to root
# (Recommended) Create a virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .\.venv\Scripts\activate

# Install AI dependencies
pip install ultralytics flask flask-cors opencv-python easyocr lapx numpy
python app.py
```

### **3. Command Center (Frontend) Setup**
```bash
cd sita-web
npm install
npm run dev
```

---

## 🗺️ Project Journey (Development Process)
SITA's development followed a rigorous 13-phase implementation plan:
1. **Foundation**: Established the dual-repo architecture and reference designs.
2. **Auth Engineering**: Built the SQL-backed Google/OTP authentication engine.
3. **Identity Design**: Created the agent profiling and unique tracking system.
4. **Dashboard Revolution**: Redesigned the UI into a full-width "Antigravity" focus.
5. **Vision Integration**: Connected real-time neural analysis feeds to the React frontend.
6. **Reporting & Polish**: Implemented video playback, CSV exports, and global robustness guardrails.

---

**© 2026 SITA | Enterprise Traffic Intelligence | [REDACTED] FOR SECURITY**
