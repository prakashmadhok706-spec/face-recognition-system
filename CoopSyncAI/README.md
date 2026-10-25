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

---

## 🚀 Key Modules
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

---

## ⚡ Quick Start

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
