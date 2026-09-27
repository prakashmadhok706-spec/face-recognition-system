# CoopSync AI – AI-Enabled Cooperative ERP & Employment Ecosystem

[![Smart India Hackathon 2026](https://img.shields.io/badge/SIH-2026-blue.svg)](https://sih.gov.in)
[![Problem Statement ID](https://img.shields.io/badge/PS_ID-SIH26087-emerald.svg)](https://sih.gov.in)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_19_+_Vite-61DAFB.svg)](https://react.dev)
[![OpenCV](https://img.shields.io/badge/Computer_Vision-OpenCV_+_LBPH-5C3EE8.svg)](https://opencv.org)

## 📌 Problem Statement Overview
- **Theme:** Smart Education / Cooperative Digital Transformation
- **Problem Statement ID:** `SIH26087`
- **Solution:** **CoopSync AI** transforms basic face recognition into a complete, enterprise-grade Cooperative ERP and Employment Ecosystem.

## 🚀 Key Modules
1. **AI Face Recognition Biometric Attendance:** OpenCV LBPH model, Anti-spoof texture frequency check, duplicate prevention, and desktop OpenCV launcher bridge.
2. **Dynamic 30-Second Expiring QR Attendance:** Rotating cryptographic salt, 30s auto-expiry, geofencing parameters, and one-time scan validation.
3. **Student ERP & Capacity Building:** Unified student rosters with Roll Numbers, Attendance percentage rings, and skills tags.
4. **Cooperative Course & Trainer LMS:** Course creation, modules, syllabus, classroom progress tracking.
5. **Tamper-Proof Digital Certificates:** ReportLab PDF certificate generation with dynamic QR verification code embedded.
6. **AI-Enabled Employment Portal:** AI Skill-to-Job matching engine with 1-click apply.
7. **Interactive Analytics Dashboard:** Metric cards and Chart.js attendance consistency trends.
8. **CoopSync AI Advisor:** Conversational chatbot with ERP semantic intelligence.
9. **Offline Attendance Sync:** Local storage queue that auto-syncs when reconnected.

## ⚡ Quick Start
Run from root:
```bash
start_coopsync.bat
```
Or manually:
```bash
# Backend
cd backend && python main.py
# Frontend
cd frontend && npm run dev
```
Open `http://localhost:5173` for the UI and `http://127.0.0.1:8000/docs` for API documentation.
