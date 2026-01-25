# SITA Deployment Guide: Industry-Ready Production Setup 🚀

This guide provides a step-by-step roadmap to deploy **SITA (Smart Intelligent Traffic Analyzer)** from your local machine to a production environment accessible via a public URL.

---

## 1. Repository Structure & Version Control

### A. Repository Structure
Your repository should look like this for a seamless deployment:
```text
SITA/
├── app.py              # Entry point
├── processor.py        # Core Logic
├── requirements.txt    # Python deps
├── Procfile            # Deployment instructions (for Render/Railway)
├── .gitignore          # Exclude temp files
├── yolov8s.pt          # Model weights
├── templates/
│   └── index.html      # Frontend
├── static/             # (Optional) CSS/JS files
└── data/               # (Optional) Small sample videos
```

### B. `.gitignore` Configuration
Ensure your `.gitignore` contains the following to avoid bloating the repo:
```text
.venv/
__pycache__/
uploads/
downloads/
*.mp4
*.csv
.DS_Store
```

### C. Push to GitHub
1. Create a new repository on [GitHub](https://github.com/new).
2. Run these commands in your project folder:
```powershell
git init
git add .
git commit -m "Initial VIVA-SAFE Production Release"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/SITA.git
git push -u origin main
```

---

## 2. Backend Deployment (Public API)

### Recommended Platform: **Railway.app** or **Render.com**
These platforms are ideal for Python/ML apps because they support **Gunicorn** and background processing.

### A. Exact Deployment Config (`Procfile`)
Ensure your `Procfile` is in the root directory:
```text
web: gunicorn --worker-class eventlet --workers 1 --threads 100 --bind 0.0.0.0:$PORT app:app
```
*Note: We use `eventlet` or `threads` to handle async polling requests efficiently.*

### B. Install Dependencies
Your `requirements.txt` MUST include:
```text
flask
gunicorn
eventlet
ultralytics
opencv-python-headless  # Crucial: standard opencv fails on most cloud servers
easyocr
lapx
numpy
```

### C. Environment Variables (Cloud Dashboard)
Set these in your Render/Railway dashboard:
* `PORT`: `5000` (Platform usually sets this automatically)
* `PYTHON_VERSION`: `3.10.x` (Recommended)

---

## 3. Frontend Accessibility

### A. Cross-Device Responsiveness
The current `index.html` is already built using **Tailwind CSS Grid & Flexbox**, making it industry-ready for:
* **Mobile**: Stats stack in a 2x2 grid, buttons stack vertically.
* **Desktop**: Wide cinematic dashboard.

### B. Deploying Frontend to Netlify

Netlify is the best platform for hosting the **Frontend**. 

1.  **Configure**: In `templates/index.html`, update `API_BASE` (line 267) with your Render URL (e.g., `https://sita-api.onrender.com`).
2.  **Standalone File**: Netlify expects `index.html` at the root. I recommend copying `templates/index.html` to a new folder on your desktop, and rename it to `index.html`.
3.  **Upload**: Log in to Netlify, and drag-and-drop that folder into the "Sites" area.
4.  **Result**: Your frontend will be live at a URL like `https://sita-analyzer.netlify.app`. 

**⚠️ CORS Note**: We have already added `flask-cors` to `app.py` and `requirements.txt` to support this.

---

## 4. Optimizations & Best Practices

| Challenge | Solution |
| :--- | :--- |
| **High CPU Load** | We implemented **1020px Downscaling** and **OCR Throttling**. This ensures the app doesn't crash on free-tier cloud servers. |
| **CSV Sync** | The **Strict Single-Write** logic ensures data remains accurate even if a user refreshes the page. |
| **Zero-Lag Video** | The UI hides the video player until processing is complete, avoiding a "frozen" interface. |
| **Security** | Always use **HTTPS** (provided automatically by Render/Railway). Rename files on upload to prevent injection. |

---

## 5. Verification Plan (Post-Deployment)

1. **Ping Test**: Visit `https://your-app.render.com/status` to ensure the API is "live".
2. **Mobile Test**: Open the URL on your phone. Upload a short video (e.g., 5 seconds).
3. **Data Integrity**: Download the CSV at the end. Verify that the "Total" counter on the screen exactly matches the row count in the file.

---

## 6. Final Command Summary

**To deploy locally for testing before cloud:**
```bash
python app.py
```

**To test industry-grade performance (Gunicorn):**
```bash
gunicorn --bind 0.0.0.0:5000 app:app
```

**Ready for Demo**: Once you push to GitHub and connect it to Railway/Render, your project will be live at a public URL for your Viva evaluators.

**© 2026 SITA | Enterprise Traffic Intelligence**
