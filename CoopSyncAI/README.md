# CoopSync AI – AI-Enabled Cooperative ERP, Biometrics & Employment Ecosystem

[![Smart India Hackathon 2026](https://img.shields.io/badge/SIH-2026-blue.svg)](https://sih.gov.in)
[![Problem Statement ID](https://img.shields.io/badge/PS_ID-SIH26087-emerald.svg)](https://sih.gov.in)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_19_+_Vite-61DAFB.svg)](https://react.dev)
[![OpenCV](https://img.shields.io/badge/Computer_Vision-OpenCV_+_LBPH-5C3EE8.svg)](https://opencv.org)
[![GPS Geofencing](https://img.shields.io/badge/Geofence-Real_Browser_GPS-brightgreen.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)

---

## 📌 Problem Statement Overview
- **Theme:** Smart Education / Cooperative Digital Transformation
- **Problem Statement ID:** `SIH26087`
- **Solution:** **CoopSync AI** transforms basic face recognition into an enterprise-grade Cooperative ERP and Employment Ecosystem featuring **Real Browser GPS Geofencing**, **Anti-Spoofing Biometrics**, **30-Second Dynamic QR Attendance**, **Interactive Student Performance Graphs**, and **AI Job Placement Matching**.
# CoopSync AI – Full-Stack Enterprise Platform

[![Smart India Hackathon 2026](https://img.shields.io/badge/SIH-2026-blue.svg)](https://sih.gov.in)
[![Problem Statement ID](https://img.shields.io/badge/PS_ID-SIH26087-emerald.svg)](https://sih.gov.in)
[![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com)
[![Frontend: React 19 + Vite](https://img.shields.io/badge/Frontend-React_19_+_Vite-61DAFB.svg)](https://react.dev)
[![OpenCV](https://img.shields.io/badge/Vision-OpenCV_+_LBPH-5C3EE8.svg)](https://opencv.org)

This folder contains the complete full-stack web application of **CoopSync AI**, built for Smart India Hackathon (SIH 2026) under Problem Statement `SIH26087`.

---

## 🚀 Key Modules
<<<<<<< HEAD
1. **Real Browser GPS Geofencing (Haversine Formula Verification):** Real device `navigator.geolocation` acquisition, zero-trust backend Haversine distance validation, configurable campus radius ($\le 50\text{m}$ default) via `/api/institution/config` with RBAC, and offline GPS revalidation.
2. **Student Portal Interactive Performance Graphs:** Personal weekly attendance trend, course-wise attendance breakdown doughnut, verified skill competency ratings, cooperative job match projections, and 75% statutory exam eligibility warning indicator.
3. **AI Face Recognition Biometric Attendance:** OpenCV LBPH model, anti-spoof texture frequency check, duplicate prevention, and desktop OpenCV launcher bridge (`facedetector.py`).
4. **Web Face Biometric Enrollment:** 50-sample burst web enrollment with pose guidance and automated asynchronous LBPH recognizer retraining.
5. **Dynamic 30-Second Expiring QR Attendance:** Rotating cryptographic SHA-256 HMAC salt, 30s auto-expiry, circular timer, and one-time scan validation.
6. **Student ERP & Capacity Building:** Unified student rosters with Roll Numbers, Attendance percentage rings, in-place tech stack editor, and card-level "📊 Graphs" modal.
7. **Cooperative Course & Trainer LMS:** Course creation, YouTube video lecture embeds, auto-thumbnail detection, one-click Study Mode, and automatic skill synchronization.
8. **Tamper-Proof Digital Certificates:** ReportLab PDF certificate generation with dynamic QR verification code embedded linking to `/api/certificates/verify/{cert_id}`.
9. **AI-Enabled Employment Portal:** AI Skill-to-Job matching engine with match score badges and 1-click apply.
10. **Interactive Analytics Dashboard:** Multi-metric cards, Chart.js trends, and department distribution for institution administrators.
11. **CoopSync AI Advisor:** Conversational chatbot with ERP semantic intelligence answering attendance, career, and course inquiries.
12. **Offline Attendance Sync:** Local storage queue that auto-syncs when reconnected and enforces backend GPS revalidation.
=======
1. **AI Face Recognition Biometric Attendance:** Real-time webcam scanning, Haar Cascade face detection, LBPH recognizer, Laplacian frequency anti-spoofing filter, and legacy OpenCV desktop bridge.
2. **Integrated Web Face Enrollment & Retraining:** 2-step onboarding modal with webcam face capture, real-time quality validation (blur $\ge 28$, brightness 38–230, centering), 50-sample auto-burst, and thread-safe background LBPH model retraining.
3. **Dynamic 30-Second Expiring QR Attendance:** SHA-256 HMAC rotating cryptographic salt, 30s circular countdown ring, 50m geofence perimeter, and student QR scanner.
4. **Student ERP & Tech Stack Sync:** Complete student registry with 75% attendance threshold alerts, dynamic card-level Tech Stack chip editor, and instant DB synchronization.
5. **Attendance Manager & Audit Ledger:** Roster filtering by date, status toggling (Present / Absent / Late / Excused), bulk approvals, manual override audit trails, and CSV log export.
6. **Courses & Learning LMS:** YouTube video lecture integration with dedicated "Study ▶" mode, auto-extracted YouTube video thumbnails + custom preview box, and automatic enrollment skill-sync into student profiles.
7. **Tamper-Proof Digital Certificates:** ReportLab PDF certificate generator with official golden borders and embedded QR verification code (`/api/certificates/verify/{cert_id}`).
8. **AI-Enabled Employment Portal:** Cooperative federation job board with algorithmic skill-to-job matching scores and 1-click profile applications.
9. **Interactive Analytics Dashboard:** Real-time KPI metric cards, Chart.js weekly attendance trends, department distribution doughnut chart, and skills matrix.
10. **CoopSync AI Advisor:** Context-aware semantic chatbot answering ERP questions over live SQLite database records.
11. **Offline Attendance Synchronization:** Resilient `localStorage` queue for rural connectivity drops with automatic batch synchronization upon reconnection.
12. **Role-Based Access Control (RBAC):** 5 configured roles (Student, Trainer, Institution Admin, NCCT Admin, Employer).
13. **Python Desktop Suite Manager:** Web interface to trigger and monitor native desktop Tkinter tools (`main.py`, `student.py`, `train.py`, `facedetector.py`, `attendence.py`).
>>>>>>> 0f82b22eb61227d075db8ef4cff42abba01f3c6b

---

## ⚡ Quick Start

<<<<<<< HEAD
### 1-Click Launcher (Windows)
Double-click `start_coopsync.bat` in the root folder, or run:
```bash
# Backend
cd backend && python main.py

# Frontend
cd frontend && npm run dev
```
- Frontend UI: `http://localhost:5173`
- Backend API & Swagger: `http://127.0.0.1:8000/docs`

### Automated Test Suite
```bash
cd backend
python run_tests.py
```
*(Runs full test suite: Haversine distance calculations, institution config RBAC, real GPS verification scenarios, duplicate prevention, and biometric web retraining)*.
=======
### 1. 1-Click Batch Launcher (Windows)
From the project root directory, run:
```powershell
start_coopsync.bat
```

### 2. Manual Development Mode
```bash
# Terminal 1 - FastAPI Backend
cd backend
pip install -r requirements.txt
python main.py

# Terminal 2 - React Vite Frontend
cd frontend
npm install
npm run dev
```

- **Frontend App:** `http://localhost:5173`
- **Backend API Docs (Swagger):** `http://127.0.0.1:8000/docs`
- **Backend API Docs (ReDoc):** `http://127.0.0.1:8000/redoc`

### 3. Docker Compose
```bash
docker compose up --build
```

### 4. Running Backend Verification Tests
```bash
cd backend
python test_face_enrollment_retrain.py
```

---

For complete system design, architecture diagrams, and detailed documentation, refer to the [Root README.md](../README.md).
>>>>>>> 0f82b22eb61227d075db8ef4cff42abba01f3c6b
