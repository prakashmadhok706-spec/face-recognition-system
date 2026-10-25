# CoopSync AI — Project Analysis Document
**Source of Truth for Report Generation**
*Generated: October 2026*

---

## 1. Project Overview

**Project Name:** CoopSync AI — AI-Enabled Cooperative ERP, Biometric Attendance & Employment Ecosystem

**SIH 2026 Problem Statement ID:** SIH26087

**Theme:** Smart Education / Cooperative Digital Transformation

**Type:** Full-Stack Web Application + Legacy Desktop Suite

**Institution:** Inderprastha Engineering College, Ghaziabad  
**University:** Dr. A.P.J. Abdul Kalam Technical University, Lucknow  
**Programme:** B.Tech Computer Science & Engineering, 3rd Year (Sem 5)

---

## 2. Problem Statement (Verified from ABSTRACT.txt)

Cooperative training institutions in India suffer from:
- Manual attendance registers vulnerable to proxy marking
- Isolated and siloed course tracking systems
- Unverified paper certifications susceptible to forgery
- Disconnected job placement pathways with no skill-to-vacancy matching
- No digital infrastructure connecting students, trainers, administrators, and employers

---

## 3. Objectives (Verified from README, ABSTRACT, codebase)

1. Eliminate proxy attendance using AI face biometrics + dynamic QR tokens
2. Provide a unified student ERP with skill tracking and attendance analytics
3. Automate tamper-proof PDF certificate generation with QR verification
4. Enable AI-driven skill-to-job matching for cooperative employment
5. Build an offline-resilient system for rural cooperative institutes
6. Integrate a legacy desktop OpenCV suite into the modern web platform

---

## 4. Technology Stack (Verified from requirements.txt, package.json, source code)

### Backend
- **Framework:** FastAPI >= 0.111.0
- **Language:** Python 3.x
- **ORM:** SQLAlchemy >= 2.0.0
- **Database:** SQLite (development) / PostgreSQL (production via DATABASE_URL env)
- **Computer Vision:** OpenCV >= 4.8.0 (Haar Cascades + LBPH)
- **PDF Generation:** ReportLab >= 4.0.0
- **QR Generation:** qrcode >= 8.0
- **Image Processing:** Pillow >= 10.0.0, NumPy >= 1.24.0
- **Validation:** Pydantic >= 2.0.0
- **Server:** Uvicorn (ASGI)

### Frontend
- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite
- **Charts:** Chart.js
- **API Client:** fetch / axios
- **CSS:** Glassmorphism custom CSS design system

### Legacy Desktop Suite
- **GUI:** Python Tkinter
- **CV:** OpenCV + numpy
- **Storage:** CSV files (students.csv, attendance.csv)

### DevOps
- Docker + Docker Compose
- Windows Batch script (start_coopsync.bat)

---

## 5. Architecture (Verified from main.py, database.py, face_engine.py)

### Layer Architecture
```
Client Layer (React 19 + Vite, Port 5173)
    ↕ REST/JSON API
FastAPI Backend (Port 8000)
    ├── FaceRecognitionEngine (face_engine.py)
    ├── QR Session Engine (qr_engine.py)
    ├── Certificate Engine (certificate_engine.py)
    ├── AI Matching Engine (ai_engine.py)
    └── ModelTrainingManager (async, threading)
    ↕
SQLite DB (coopsync.db)
    + File Storage (dataset/, data/classifier.xml)
    + Legacy CSV (students.csv, attendance.csv)
```

---

## 6. Database Models (Verified from database.py)

### Table: users
- id (Integer, PK)
- student_id (String 50, unique)
- roll_number (String 50)
- name (String 100, not null)
- email (String 100, unique)
- password_hash (String 200)
- role (String 20) — student, trainer, admin, employer
- department (String 50)
- semester (String 20)
- degree (String 50)
- gender (String 20)
- skills (Text)
- avatar (String 255)
- created_at (DateTime)
- Relations: attendances, certificates, applications

### Table: attendances
- id (Integer, PK)
- user_id (Integer, FK → users.id)
- student_id (String 50)
- student_name (String 100)
- date (String 20) — YYYY-MM-DD
- time (String 20) — HH:MM:SS
- method (String 20) — Face Recognition / QR Verification / Offline Sync
- confidence (Float, default 95.0)
- liveness_verified (Boolean)
- status (String 20) — Present, Late
- created_at (DateTime)

### Table: courses
- id (Integer, PK)
- title (String 150)
- category (String 50)
- trainer_name (String 100)
- duration (String 50)
- modules_count (Integer)
- enrolled_count (Integer)
- description (Text)
- thumbnail (String 255)
- youtube_url (String 255)
- progress_percentage (Integer)
- created_at (DateTime)

### Table: certificates
- id (Integer, PK)
- certificate_no (String 50, unique)
- user_id (Integer, FK → users.id)
- student_name (String 100)
- course_title (String 150)
- issue_date (String 30)
- qr_data (Text)
- grade (String 10)
- status (String 20)
- created_at (DateTime)

### Table: jobs
- id (Integer, PK)
- title (String 150)
- company (String 100)
- location (String 100)
- type (String 50)
- salary (String 50)
- required_skills (Text)
- description (Text)
- openings (Integer)
- deadline (String 30)
- logo (String 255)
- created_at (DateTime)

### Table: job_applications
- id (Integer, PK)
- job_id (Integer, FK → jobs.id)
- user_id (Integer, FK → users.id)
- applicant_name (String 100)
- match_score (Integer)
- resume_note (Text)
- status (String 30) — Applied, Shortlisted, Interviewed, Hired
- applied_at (DateTime)

---

## 7. Algorithms (Verified from face_engine.py, ai_engine.py, qr_engine.py)

### Face Recognition Algorithm
1. **Detection:** OpenCV Haar Cascade (`haarcascade_frontalface_default.xml`)
   - scaleFactor=1.05, minNeighbors=2, minSize=(30,30)
   - Fallback: histogram equalization for low-light
2. **Recognition:** LBPH (Local Binary Patterns Histograms)
   - Normalize face ROI to 200×200 pixels
   - Apply histogram equalization
   - Predict ID and distance using `recognizer.predict()`
   - Confidence: `max(35, min(99, 100 - dist * 0.46))`
   - Threshold: dist <= 68 for positive match
3. **Anti-Spoofing (Liveness Detection):** Laplacian variance
   - `cv2.Laplacian(gray_roi, cv2.CV_64F).var()`
   - Threshold: variance > 45.0 = live face

### QR Attendance Algorithm
- SHA-256 HMAC-based session token
- 30-second TTL rotating salt
- One-time scan enforcement per session

### Skill Matching Algorithm (ai_engine.py)
- Set intersection: student skills ∩ required skills
- Base score = |overlap| / |required| × 100
- Final = max(55, min(98, base + 25)) if overlap > 0 else 55

### Background Retraining Algorithm (ModelTrainingManager)
- Thread-safe with Lock()
- Status states: idle → queued → processing → completed/failed
- Atomic model swap: trains to classifier_tmp.xml, then renames
- Backup: classifier.xml.bak before swap

---

## 8. Registered Students (Verified from students.csv)

| ID | Name | Roll Number | Dept | Year |
|---|---|---|---|---|
| 568250 | Prakash Madhok | 2400300100295 | CSE | 3rd Year, Sem 5 |
| 5465626 | Priyansh Topal | 2400300100303 | CSE | 3rd Year, Sem 5 |
| 542865 | Riya Singh | 2400300100339 | CSE | 3rd Year, Sem 5 |
| 5025088 | Puneet | 2400300100305 | CSE | 3rd Year, Sem 5 |

---

## 9. Implemented Features (Verified)

- [x] FastAPI backend with 25+ REST endpoints
- [x] OpenCV Haar + LBPH face recognition engine
- [x] Laplacian variance anti-spoofing liveness check
- [x] In-browser webcam biometric scanning (HTML5 getUserMedia)
- [x] Anti-duplicate attendance check per calendar day
- [x] Dynamic 30s TTL QR code attendance (SHA-256 HMAC)
- [x] Student ERP with role-based profiles (users table)
- [x] Webcam face enrollment (50-sample burst, quality validation)
- [x] Thread-safe background LBPH model retraining
- [x] SQLite database with 6 normalized tables
- [x] Course LMS with YouTube URL integration
- [x] Course enrollment → auto-skills sync to student profile
- [x] ReportLab PDF certificate generation with QR embed
- [x] Public certificate verification endpoint
- [x] AI skill-to-job matching algorithm (set intersection)
- [x] Semantic ERP chatbot (rule-based NLP on live DB)
- [x] Offline attendance queue (localStorage + sync endpoint)
- [x] Multi-role RBAC (student, trainer, admin, employer)
- [x] Chart.js analytics dashboard (KPI metrics, trends)
- [x] CSV export of attendance records
- [x] Docker Compose containerization
- [x] 1-click Windows batch launcher (start_coopsync.bat)
- [x] Legacy Python Tkinter desktop suite (main.py, facedetector.py, student.py, train.py, attendence.py)
- [x] Desktop-to-web bridge API (/api/attendance/launch-opencv-camera)
- [x] Backend integration test suite (test_face_enrollment_retrain.py)

---

## 10. Incomplete / Future Features (From PROGRESS.md)

- [ ] Live multi-cloud hosting deployment (Render + Vercel) — 90% ready
- [ ] External LLM API integration (OpenAI/Gemini) — planned
- [ ] Automated SMS/WhatsApp attendance alerts (Twilio) — planned
- [ ] Authentication uses mock JWT tokens (not cryptographically signed JWTs)
- [ ] Password hashing is stored as plaintext "pass123" (not bcrypt/argon2)

---

## 11. Verified Limitations

1. Authentication tokens are mock JWTs (`mock_jwt_token_{id}_{role}`) — not production-grade
2. Password storage is plaintext — no hashing implemented
3. AI chatbot is rule-based NLP, not a generative LLM
4. Geofencing is configured but geolocation enforcement depends on client GPS accuracy
5. LBPH model requires `opencv-contrib-python` (not base `opencv-python`) for `cv2.face`
6. SQLite used in development; PostgreSQL recommended for production
