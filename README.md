# CoopSync AI – AI-Enabled Cooperative ERP, Biometrics & Employment Ecosystem

[![Smart India Hackathon 2026](https://img.shields.io/badge/SIH-2026-blue.svg)](https://sih.gov.in)
[![Problem Statement ID](https://img.shields.io/badge/PS_ID-SIH26087-emerald.svg)](https://sih.gov.in)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_19_+_Vite-61DAFB.svg)](https://react.dev)
[![OpenCV](https://img.shields.io/badge/Computer_Vision-OpenCV_+_LBPH-5C3EE8.svg)](https://opencv.org)
[![Chart.js](https://img.shields.io/badge/Visualization-Chart.js-FF6384.svg)](https://www.chartjs.org/)
[![GPS Geofencing](https://img.shields.io/badge/Geofence-Real_Browser_GPS-brightgreen.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)

---

## 📌 Problem Statement Overview
- **Theme:** Smart Education / Cooperative Digital Transformation
- **Problem Statement ID:** `SIH26087`
- **Core Challenge:** Cooperative training institutions (NCCT, VAMNICOM, RICMs) face systemic challenges: paper-based attendance registers, proxy attendance, unverified physical certificates, lack of automated skill tracking, and absence of a direct employment pipeline to cooperative federations (AMUL, IFFCO, KRIBHCO).
- **Solution:** **CoopSync AI** transforms basic face recognition into an enterprise-grade Cooperative ERP and Employment Ecosystem featuring **Real Browser GPS Geofencing**, **Anti-Spoofing Biometrics**, **30-Second Dynamic QR Attendance**, **Interactive Student Performance Graphs**, **LMS Learning Portal**, and **AI Job Placement Matching**.

---

## 🚀 Key Modules & Innovations

### 1. 📍 Real Browser GPS Geofencing (Haversine Formula Verification)
- **Real Device Telemetry:** Uses the browser Geolocation API (`navigator.geolocation.getCurrentPosition`) with `enableHighAccuracy: true` to acquire the student's real physical coordinates and signal accuracy ($\pm X\text{ meters}$).
- **Permission On-Demand:** Location permission is requested **only when the student initiates attendance** (no tracking on page load).
- **Zero-Trust Backend Validation:** Coordinates are sent to `/api/attendance/qr/verify` where the server calculates geodesic distance using the **Haversine formula** ($R = 6,371,000\text{ m}$):
  $$d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\text{lat}}{2}\right) + \cos(\text{lat}_1)\cos(\text{lat}_2)\sin^2\left(\frac{\Delta\text{lon}}{2}\right)}\right)$$
- **Configurable Campus Geofence (`/api/institution/config`):** Institution administrators can configure campus coordinates, allowed radius ($\le 50\text{m}$ default), and signal accuracy threshold ($\le 100\text{m}$) via UI/API with strict RBAC blocking student tampering.
- **Strict Error Handling & Anti-Tampering:** Rejects out-of-bounds coordinates, poor satellite accuracy, location denial, and out-of-radius attempts with explicit user messages.
- **Offline Attendance GPS Revalidation (Req 14):** Offline records cached on mobile cannot bypass geofence; backend revalidates GPS telemetry upon sync and flags/quarantines invalid records.

### 2. 📈 Student Portal Interactive Performance Graphs
- **Default Student Landing Screen:** Students land directly on **"My Analytics & Graphs"** upon login.
- **75% Statutory Exam Threshold Alert:** Live calculation against NCCT statutory 75% exam attendance guidelines with visual status alert badges.
- **4 Interactive Visual Graphs (Chart.js):**
  1. **Personal Weekly Attendance Trend:** Bar chart tracking attended vs. missed classes across academic weeks.
  2. **Course-Wise Attendance Breakdown:** Doughnut chart breaking down attendance percentages per enrolled engineering and cooperative module.
  3. **Verified Tech Stack & Competency Scores:** Horizontal bar chart rating practical skills from ERP capacity profiles.
  4. **Cooperative Job Placement Match Projections:** Real-time semantic compatibility chart matching student profile to AMUL, IFFCO, and Sahakar openings.
- **Card-Level Graph Modal in Student ERP:** Every student card in the directory has a dedicated **"📊 Graphs"** button allowing students and administrators to inspect interactive charts directly in a modal.

### 3. 📸 AI Face Recognition Biometric Attendance
- Reuses and upgrades your pre-trained OpenCV LBPH model (`data/classifier.xml`, 15MB).
- **Anti-Spoofing & Liveness Telemetry:** Real-time Laplacian variance edge-frequency algorithm preventing 2D photo printouts and mobile screen replay attacks.
- **Duplicate Prevention:** Enforces multi-tier rules preventing double check-ins on the same day for a single student.
- **Desktop OpenCV Bridge:** Built `/api/attendance/launch-opencv-camera` to launch native Python Tkinter detector (`facedetector.py`) directly from the web browser.
- **Web Face Biometric Enrollment:** Capture 50 samples in-browser with pose guidance (Front, Left, Right, Tilt, Smile) and trigger asynchronous LBPH model retraining with automatic rollback backups.

### 4. 📱 Dynamic 30-Second Expiring QR Attendance System
- Fail-safe attendance backup when cameras or lighting conditions are poor.
- Rotating cryptographic SHA-256 HMAC salt refreshed every 30 seconds.
- Real-time animated circular countdown timer blocking shared screenshot exploits.
- One-time scan enforcement per session and per-student.

### 5. 🎓 Student ERP & Capacity Building Module
- Unified student roster matching NCCT ERP specifications.
- Displays Roll Numbers, Department, Semester, Attendance Ratio, and Skills tags.
- In-place **"Edit Tech Stack"** modal on student cards with instant database synchronization.
- Real-time attendance percentage ring (75% eligibility warning threshold).

### 6. 📚 Computer Engineering LMS & YouTube Learning Portal
- Comprehensive curriculum on AI Biometrics, Computer Vision, Operating Systems, Full-Stack, and Agri-IoT.
- **YouTube Video Integration:** Clickable video overlay badges with automatic thumbnail extraction (`https://img.youtube.com/vi/<ID>/hqdefault.jpg`).
- **One-Click Study Mode:** Enrolled students get a prominent `Study ▶` button launching dedicated high-definition YouTube video lectures.
- Course enrollment automatically extracts and synchronizes practical skill tags into the student's ERP Capacity Profile.

### 7. 📜 Tamper-Proof Digital Certificates (PDF + QR)
- Automated PDF generation via ReportLab with official cooperative borders and digital seals.
- Dynamic verification QR code embedded in each certificate linking to `/api/certificates/verify/{cert_id}` for public authenticity checks.
- Direct PDF download endpoint `/api/certificates/download/{cert_id}`.

### 8. 💼 AI-Enabled Employment & Placement Portal
- Active openings across cooperative federations (AMUL, IFFCO, KRIBHCO, Sahakar FinTech).
- **AI Skill-to-Job Matching Engine:** Algorithmic calculation of student skills vs. required job competencies with match score badges (e.g., 94% Match).
- 1-click ERP profile submission.

### 9. 🤖 CoopSync AI Advisor (Chatbot)
- Context-aware conversational AI assistant that queries current ERP records.
- Provides immediate answers to questions like *"How many attendance days do I have?"*, *"Recommend jobs for my skills"*, and *"Verify my certificate eligibility"*.

### 10. ⚡ Offline Attendance Synchronization
- Local storage queue that auto-stores attendance check-ins when network connectivity drops.
- Batch synchronizes all records to `/api/attendance/sync-offline` when connection restores.
- Synchronized records are re-validated against GPS geofence rules before confirmation.

---

## 📂 Project Architecture

```
face recognition system/
│
├── CoopSyncAI/
│   ├── backend/
│   │   ├── main.py                     # FastAPI application & REST endpoints
│   │   ├── database.py                 # SQLite / PostgreSQL SQLAlchemy models & geofence configs
│   │   ├── face_engine.py              # OpenCV LBPH recognizer & anti-spoof checks
│   │   ├── qr_engine.py                # 30-second dynamic QR generator & GPS validation
│   │   ├── certificate_engine.py       # ReportLab PDF + verification QR generator
│   │   ├── ai_engine.py                # Skill matching & AI chat advisor
│   │   ├── test_gps_attendance.py      # Real GPS geofencing automated test suite
│   │   ├── test_face_enrollment_retrain.py # Biometric enrollment & retraining test suite
│   │   ├── run_tests.py                # Unified test runner
│   │   ├── requirements.txt            # Python dependencies
│   │   └── Dockerfile                  # Containerization
│   │
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Navbar.tsx          # Multi-role navigation with "My Analytics & Graphs"
│   │   │   │   ├── FaceAttendanceView.tsx # Webcam biometric scanner & anti-spoofing
│   │   │   │   ├── QRAttendanceView.tsx   # Dynamic QR check-in & real GPS verification
│   │   │   │   ├── AnalyticsView.tsx   # Student Portal & Admin Chart.js dashboards
│   │   │   │   ├── StudentERPView.tsx  # Student directory with in-place Graph Modals
│   │   │   │   ├── CoursesView.tsx     # LMS with YouTube integration
│   │   │   │   ├── CertificatesView.tsx # Verified PDF certificates
│   │   │   │   ├── EmploymentView.tsx  # Cooperative job board & AI matching
│   │   │   │   ├── AttendanceManagerView.tsx # Attendance roster with GPS telemetry
│   │   │   │   ├── WebFaceEnrollmentModal.tsx # 50-sample burst web enrollment
│   │   │   │   └── AIChatModal.tsx     # Semantic ERP AI assistant
│   │   │   ├── App.tsx                 # Root application & role routing
│   │   │   ├── index.css               # Modern glassmorphism design system
│   │   │   ├── api.ts                  # Backend API client
│   │   │   └── types.ts                # TypeScript interfaces & telemetry models
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── Dockerfile
│   │
│   ├── docker-compose.yml              # Full-stack container orchestrator
│   └── README.md
│
├── data/                               # Pre-trained model (classifier.xml 15MB)
├── dataset/                            # Enrolled student biometric datasets
├── students.csv                        # Student registry seed
├── attendance.csv                      # Attendance logs cache
├── facedetector.py                     # Native desktop OpenCV detector
├── start_coopsync.bat                  # 1-Click Windows Launcher Script
├── PROGRESS.md                         # Detailed SIH progress documentation
└── README.md                           # Master project documentation
```

---

## ⚡ Quick Start Guide

### Option 1: 1-Click Windows Launcher (Recommended)
Double-click:
```bash
start_coopsync.bat
```
This automatically boots the FastAPI backend, launches the React Vite frontend, and opens `http://localhost:5173` in your default browser!

### Option 2: Manual Start

**1. Start Backend:**
```bash
cd CoopSyncAI\backend
python main.py
```
- API Server: `http://127.0.0.1:8000`
- Interactive Swagger Docs: `http://127.0.0.1:8000/docs`

**2. Start Frontend:**
```bash
cd CoopSyncAI\frontend
npm run dev
```
- Frontend Web App: `http://localhost:5173`

### Option 3: Docker Compose
```bash
cd CoopSyncAI
docker compose up --build
```

---

## 🧪 Automated Test Suite

Run the full end-to-end verification suite covering Face Biometrics, Asynchronous Retraining, and Real GPS Geofencing:
```bash
cd CoopSyncAI\backend
python run_tests.py
```

### Verified Test Cases:
- `test_haversine_formula`: Verifies mathematical geodesic distance accuracy.
- `test_institution_config_api`: Validates fetching config and enforcing RBAC on geofence parameters.
- `test_gps_attendance_scenarios`:
  - Reject missing / denied location coordinates.
  - Reject out-of-bounds coordinates ($-90..90$, $-180..180$).
  - Reject poor GPS satellite accuracy ($> 100\text{m}$).
  - Reject student outside campus geofence ($> 50\text{m}$).
  - Accept student inside campus geofence ($\le 50\text{m}$).
  - Block duplicate scan on the same 30s QR session.
  - Block duplicate attendance across the entire calendar day.
- `test_offline_gps_revalidation`: Revalidates offline records upon sync, ensuring unverified records cannot bypass geofence rules.
- `test_attendance_logs_telemetry`: Verifies GPS telemetry (lat, lon, accuracy, distance, status) is recorded in audit logs.

---

## 👥 Demo User Accounts

Switch roles seamlessly via the top-right profile selector:

| User | Role | Key Capabilities |
| :--- | :---: | :--- |
| **Puneet** (`Roll: 2400300100305`, `ID: 5025088`) | `student` | Default landing on **My Analytics & Graphs**, 75% exam warning, dynamic QR check-in with real GPS, course enrollment, certificate download. |
| **Dr. Rajesh Sharma** | `institution_admin` / `admin` | Full ERP directory, Geofence configuration, Attendance Roster with GPS distance telemetry, Web Face Enrollment & retraining. |
| **Dr. Arvind Kumar** | `ncct_admin` | National aggregate analytics, multi-institute capacity governance, audit log exports. |
| **Vikram Mehta** | `trainer` | Attendance management, course creation, classroom progress monitoring. |
| **Pooja Patel** (AMUL) | `employer` | Post cooperative job openings, review AI candidate skill match rankings. |

---

## 🏆 Smart India Hackathon (SIH 2026) Highlights
1. **Zero-Trust Physical Presence:** Combines **Real Device GPS Geofencing (Haversine formula)**, **Rotating 30s HMAC QR codes**, and **OpenCV Face Liveness Detection** to make proxy attendance mathematically impossible.
2. **Student-Centric Analytics:** Real-time multi-metric graphs tracking degree progress, exam attendance eligibility, and cooperative career readiness.
3. **100% Backward Compatibility:** Directly preserved existing OpenCV LBPH recognizers, datasets, and Tkinter bridges while uplifting the platform into a modern web cloud ecosystem.
