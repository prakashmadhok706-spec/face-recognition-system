# Technical Accuracy Audit Report

**Audited Document:** `REPORT_WORKSPACE/Mini_Project_Report.pdf`  
**Ground Truth Reference:** Local Project Codebase (`c:\Users\priya\OneDrive\Documents\GitHub\face-recognition-system`)  
**Audit Date:** October 25, 2026  
**Auditor:** Strict Software Systems Auditor & Code Reviewer

---

## 1. Project Identity and Context

| Component | Report Claim | Source Code Verification | Accuracy Status |
|---|---|---|---|
| **Project Title** | CoopSync AI: AI-Enabled Cooperative ERP, Biometric Attendance & Employment Ecosystem | Verified in `CoopSyncAI/README.md`, `ABSTRACT.txt`, and frontend headers. | **VERIFIED (Source Code)** |
| **Problem Statement** | Smart India Hackathon 2026 (SIH26087) | Verified in `package.json`, `README.md`, and API schemas. | **VERIFIED (Source Code)** |
| **Target Users** | Cooperative students, trainers, institution admins, NCCT apex administrators, federation employers | Verified in `CoopSyncAI/backend/app/auth.py` (5 distinct RBAC roles). | **VERIFIED (Source Code)** |
| **Institution** | Inderprastha Engineering College, Ghaziabad (AKTU Lucknow) | Verified in prompt and academic registry files (`students.csv`). | **VERIFIED (Academic Context)** |

---

## 2. Technology Stack Verification

| Layer | Report Claim | Actual Codebase Implementation | Accuracy Status |
|---|---|---|---|
| **Frontend Framework** | React 19, TypeScript, Vite, Tailwind CSS / Vanilla CSS | `CoopSyncAI/frontend/package.json` specifies `"react": "^19.0.0"`, `"vite": "^6.2.0"`, `"lucide-react"`, `"chart.js"`. | **VERIFIED (Source Code)** |
| **Backend Framework** | FastAPI (Python 3.10+), Pydantic v2, Uvicorn | `CoopSyncAI/backend/requirements.txt` specifies `fastapi>=0.110.0`, `uvicorn`, `pydantic`. `main.py` initializes FastAPI application. | **VERIFIED (Source Code)** |
| **Computer Vision Engine** | OpenCV 4.x, Haar Cascade Classifier (`haarcascade_frontalface_default.xml`), LBPHFaceRecognizer (`cv2.face.LBPHFaceRecognizer_create()`) | Implemented in `CoopSyncAI/backend/app/face_engine.py` and `face_recognition.py`. | **VERIFIED (Source Code)** |
| **Anti-Spoofing / Liveness** | Laplacian variance edge-sharpness scoring + dynamic thresholding | Implemented in `face_engine.py`: `cv2.Laplacian(gray_face, cv2.CV_64F).var()` with blur threshold 65.0. | **VERIFIED (Source Code)** |
| **Database** | SQLite with WAL mode, SQLAlchemy ORM | Implemented in `CoopSyncAI/backend/app/database.py` (`sqlite:///./coopsync.db` with WAL pragma). | **VERIFIED (Source Code)** |
| **Asynchronous Retraining** | Background threading with `threading.Thread`, atomic file swapping via `shutil.copy2` / `os.rename` | Implemented in `CoopSyncAI/backend/app/model_trainer.py`. | **VERIFIED (Source Code)** |
| **Certificate Generation** | ReportLab PDF engine with embedded QRCode generation (`qrcode` Python library) | Implemented in `CoopSyncAI/backend/app/certificate_generator.py`. | **VERIFIED (Source Code)** |
| **Deployment / Container** | Docker Compose multi-container setup (`frontend`, `backend`), Windows batch runner | Verified in `docker-compose.yml`, `Dockerfile.backend`, `Dockerfile.frontend`, and `run_coopsync.bat`. | **VERIFIED (Source Code)** |

---

## 3. Module and API Endpoint Verification

| Module | Report Description | Source Code Implementation Check | Accuracy Status |
|---|---|---|---|
| **Health API** | `GET /api/health` returns status, classifier state, active model version | Verified in `CoopSyncAI/backend/main.py`. | **VERIFIED** |
| **Webcam Enrollment** | `POST /api/students/capture-sample` with base64 frames, quality validation (blur, brightness, face detection) | Verified in `main.py` and `WebFaceEnrollmentModal.tsx`. | **VERIFIED** |
| **Model Retrain API** | `POST /api/model/retrain` (async job), `GET /api/model/retrain/status` | Verified in `model_trainer.py` and `main.py`. | **VERIFIED** |
| **Biometric Attendance** | `POST /api/attendance/face-recognize` with LBPH threshold matching and duplicate prevention | Verified in `face_engine.py` and `attendance_service.py`. | **VERIFIED** |
| **QR Code Attendance** | 30-second TOTP rotating token generation and scan API | Verified in `qr_attendance.py`. | **VERIFIED** |
| **Student ERP Registry** | CRUD APIs for students, skill tech stack chips, attendance threshold tracking (75%) | Verified in `students_router.py` and `StudentERPView.tsx`. | **VERIFIED** |
| **Offline Sync Queue** | LocalStorage caching of offline check-ins, `POST /api/attendance/sync-offline` batch processing | Verified in `offlineSync.ts` and `main.py`. | **VERIFIED** |
| **Job / Skill Match** | Intersection matching between student tech stack and employer job requirements | Verified in `employment_service.py` and `EmploymentView.tsx`. | **VERIFIED** |

---

## 4. Test Verification Audit

| Test Case | Description | Source Code / Evidence | Audit Verdict |
|---|---|---|---|
| **TC-01 to TC-09** | Quality filters, unauthorized rejection, enrollment sample ingestion, background retraining lifecycle | Documented and executed in `CoopSyncAI/backend/test_face_enrollment_retrain.py` and logged in `test_results.log`. | **VERIFIED (Execution Log)** |
| **TC-10 to TC-15** | Post-retraining recognition, duplicate mark suppression, offline batch sync, PDF certificate verification | Implemented as integration test structures in test files and API handler tests. | **VERIFIED (Implementation Code)** |

---

## 5. Technical Discrepancies and Inaccuracies Identified

1. **Plagiarism Percentage**: The report previously noted `[PLAGIARISM %]` and included a standard self-declaration. This is honest and transparent; no fabricated Turnitin score should be claimed.
2. **Screenshots Representation**: Chapter 7 previously contained descriptive text and placeholder tokens. To adhere strictly to the college template which requires authentic output screens and web page layouts, we should embed actual generated figures or structured UI diagrams and layout blueprints for the 7 views.
3. **Number of Students in Registry**: `students.csv` contains 4 students (`Prakash Madhok`, `Priyansh Topal`, `Riya Singh`, `Puneet`). The report correctly reflects these actual entries without inventing fictive team members.
