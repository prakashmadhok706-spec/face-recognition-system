# CoopSync AI – AI-Enabled Cooperative ERP & Employment Ecosystem

[![Smart India Hackathon 2026](https://img.shields.io/badge/SIH-2026-blue.svg)](https://sih.gov.in)
[![Problem Statement ID](https://img.shields.io/badge/PS_ID-SIH26087-emerald.svg)](https://sih.gov.in)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_19_+_Vite-61DAFB.svg)](https://react.dev)
[![OpenCV](https://img.shields.io/badge/Computer_Vision-OpenCV_+_LBPH-5C3EE8.svg)](https://opencv.org)

## 📌 Problem Statement Overview
- **Theme:** Smart Education / Cooperative Digital Transformation
- **Problem Statement ID:** `SIH26087`
- **Core Challenge:** Many cooperative institutions rely on paper attendance registers, isolated student records, lack of centralized employment pipelines, proxy attendance, and unverified paper certificates.
- **Solution:** **CoopSync AI** transforms basic face recognition into a complete, enterprise-grade Cooperative ERP and Employment Ecosystem.

---

## 🚀 Key Modules & Innovations

### 1. 📸 AI Face Recognition Biometric Attendance
- Reuses and upgrades your existing OpenCV LBPH model (`data/classifier.xml`, 15MB).
- **Anti-Spoofing / Liveness Detection:** Uses real-time Laplacian texture frequency analysis to detect and block 2D phone screens and printed photos.
- **Duplicate Prevention:** Prevents duplicate marking for the same day.
- **Desktop OpenCV Bridge:** Direct 1-click trigger to launch your original Python Tkinter desktop detector (`facedetector.py`) directly from the web interface.

### 2. 📱 Dynamic 30-Second Expiring QR Attendance
- Fail-safe attendance backup when cameras or lighting conditions are poor.
- Rotating cryptographic salt (SHA-256) refreshed every 30 seconds.
- Geofenced perimeter checks (50m campus boundary).
- One-time scan enforcement per student session.

### 3. 🎓 Student ERP & Capacity Building
- Profiles with Roll Numbers, Department, Semester, Attendance Ratio, and Skills tags.
- Seeded with your original dataset (`Puneet`, `Ranjan`, `Varun` from `students.csv`).
- Real-time attendance percentage ring (75% eligibility warning threshold).

### 4. 📚 Cooperative Course & Trainer LMS
- Full curriculum management: add modules, syllabus, duration, lecture notes.
- Classroom progress metrics and student rosters.

### 5. 📜 Tamper-Proof Digital Certificates
- Automated PDF generation via ReportLab with golden cooperative border.
- Dynamic verification QR code embedded in each certificate linking to `/api/certificates/verify/{cert_id}` for public authenticity checks.

### 6. 💼 AI-Enabled Employment & Placement Portal
- Direct hiring pipeline for cooperative federations, agri-tech startups, and fintech labs.
- **AI Skill-to-Job Matching Engine:** Computes a match score (e.g., 94% match) comparing student profile skills against job requirements.
- 1-click ERP profile submission.

### 7. 📊 Interactive Analytics Dashboard
- Metric cards: Total Students, Present Today %, Course Completion %, Placement Rate.
- Chart.js weekly attendance consistency trends.
- Department distribution doughnut chart.
- In-demand cooperative skills matrix.

### 8. 🤖 CoopSync AI Advisor
- Context-aware conversational AI assistant that queries current ERP records.
- Provides immediate answers to questions like *"How many attendance days do I have?"*, *"Recommend jobs for my skills"*, and *"Verify my certificate eligibility"*.

### 9. ⚡ Offline Attendance Sync
- Automatically queues attendance locally in `localStorage` when network connectivity drops.
- Batch synchronizes all records to the backend when reconnected (`/api/attendance/sync-offline`).

---

## 📂 Project Architecture

```
face recognition system/
│
├── CoopSyncAI/
│   ├── backend/
│   │   ├── main.py                  # FastAPI application & REST endpoints
│   │   ├── database.py              # SQLite / PostgreSQL SQLAlchemy models
│   │   ├── face_engine.py           # OpenCV LBPH recognizer & anti-spoof checks
│   │   ├── qr_engine.py             # 30-second dynamic QR generator
│   │   ├── certificate_engine.py    # ReportLab PDF + verification QR generator
│   │   ├── ai_engine.py             # Skill matching & AI chat advisor
│   │   ├── requirements.txt         # Python dependencies
│   │   └── Dockerfile               # Containerization
│   │
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Navbar.tsx
│   │   │   │   ├── FaceAttendanceView.tsx
│   │   │   │   ├── QRAttendanceView.tsx
│   │   │   │   ├── AnalyticsView.tsx
│   │   │   │   ├── StudentERPView.tsx
│   │   │   │   ├── CoursesView.tsx
│   │   │   │   ├── CertificatesView.tsx
│   │   │   │   ├── EmploymentView.tsx
│   │   │   │   └── AIChatModal.tsx
│   │   │   ├── App.tsx
│   │   │   ├── index.css            # Modern glassmorphism design system
│   │   │   └── api.ts               # Backend API client
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── Dockerfile
│   │
│   ├── docker-compose.yml           # Full-stack orchestrator
│   └── README.md
│
├── data/                            # Existing trained model (classifier.xml 15MB)
├── dataset/                         # Existing student face dataset
├── students.csv                     # Original student registry
├── attendance.csv                   # Original attendance records
├── facedetector.py                  # Original desktop OpenCV application
├── start_coopsync.bat               # 1-Click Windows Launcher Script
└── README.md                        # Project documentation
```

---

## ⚡ Quick Start Guide

### Option 1: 1-Click Windows Launcher (Easiest)
Simply double-click:
```bash
start_coopsync.bat
```
This automatically boots the FastAPI backend, launches the React Vite frontend, and opens `http://localhost:5173` in your browser!

### Option 2: Manual Development Mode

**1. Backend:**
```bash
cd CoopSyncAI\backend
python main.py
```
Backend API will be live at `http://127.0.0.1:8000` (Interactive Swagger docs: `http://127.0.0.1:8000/docs`).

**2. Frontend:**
```bash
cd CoopSyncAI\frontend
npm run dev
```
Frontend UI will be live at `http://localhost:5173`.

### Option 3: Docker Compose
```bash
cd CoopSyncAI
docker compose up --build
```

---

## 🏆 Smart India Hackathon (SIH 2026) Evaluation Highlights
1. **Reusability of Prior Work:** Reused 100% of the trained face recognition dataset and classifier, wrapping it into high-performance REST APIs.
2. **Beyond Basic Attendance:** Built an entire cooperative capacity building ERP (courses, certified degrees, and employment matching).
3. **Robust Anti-Spoofing & Offline Resiliency:** Addresses real-world rural/semi-urban network dropouts with offline sync.
