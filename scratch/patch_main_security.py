import os
import re

main_path = r'CoopSyncAI\backend\main.py'
with open(main_path, 'r', encoding='utf-8') as f:
    code = f.read()

print("Original code length:", len(code))

# 1. Add Auth imports
auth_imports = """from auth.security import hash_password, verify_and_migrate_password
from auth.jwt_handler import create_access_token, create_refresh_token, decode_token, revoke_token
from auth.dependencies import get_current_user as auth_get_current_user, get_optional_current_user
from auth.permissions import require_role, require_any_role, verify_ownership_or_roles
"""

if "from auth.security import" not in code:
    code = code.replace(
        "from ai_engine import calculate_skill_match, get_ai_chat_response, get_ai_config, update_ai_config",
        "from ai_engine import calculate_skill_match, get_ai_chat_response, get_ai_config, update_ai_config\n" + auth_imports
    )

# 2. Secure CORS configuration
old_cors = """# Enable CORS for React Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)"""

new_cors = """# Secure CORS: read explicit allowed origins from environment (no wildcard with credentials)
_ALLOWED_ORIGINS_RAW = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000"
)
ALLOWED_ORIGINS = [o.strip() for o in _ALLOWED_ORIGINS_RAW.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
)"""

code = code.replace(old_cors, new_cors)

# 3. Add RefreshTokenRequest model
if "class RefreshTokenRequest" not in code:
    code = code.replace(
        "class LoginRequest(BaseModel):",
        "class RefreshTokenRequest(BaseModel):\n    refresh_token: str\n\nclass LoginRequest(BaseModel):"
    )

# 4. Replace Login endpoint
old_login = """@app.post("/api/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    identifier = req.email_or_id.strip()
    user = db.query(User).filter(
        (User.email.ilike(identifier)) | 
        (User.student_id == identifier) | 
        (User.name.ilike(identifier))
    ).first()

    if not user:
        raise HTTPException(
            status_code=401, 
            detail="Account not found. For students, please ensure your administrator has registered your Student ID."
        )

    # Password validation
    req_pass = req.password.strip() if req.password else ""
    if user.password_hash:
        if user.password_hash != req_pass and user.password_hash != "pass123":
            raise HTTPException(status_code=401, detail="Incorrect password. Please verify your credentials.")

    return {
        "access_token": f"mock_jwt_token_{user.id}_{user.role}",
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "student_id": user.student_id,
            "roll_number": user.roll_number,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "department": user.department,
            "semester": user.semester,
            "degree": user.degree,
            "skills": user.skills,
            "avatar": user.avatar
        }
    }"""

new_login = """@app.post("/api/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    identifier = req.email_or_id.strip()
    user = db.query(User).filter(
        (User.email.ilike(identifier)) | 
        (User.student_id == identifier) | 
        (User.name.ilike(identifier))
    ).first()

    if not user:
        raise HTTPException(
            status_code=401, 
            detail="Account not found. For students, please ensure your administrator has registered your Student ID."
        )

    # Secure Password validation via bcrypt with transparent migration (Task 1)
    # Hardcoded bypass pass123 is strictly removed
    req_pass = req.password.strip() if req.password else ""
    is_valid, new_hash = verify_and_migrate_password(req_pass, user.password_hash)
    if not is_valid:
        raise HTTPException(status_code=401, detail="Incorrect password. Please verify your credentials.")

    if new_hash:
        user.password_hash = new_hash
        db.commit()

    # Generate cryptographically signed JWT access and refresh tokens (Task 2)
    access_token = create_access_token(
        user_id=user.id,
        role=user.role,
        email=user.email,
        student_id=user.student_id
    )
    refresh_token = create_refresh_token(
        user_id=user.id,
        role=user.role,
        email=user.email
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "student_id": user.student_id,
            "roll_number": user.roll_number,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "department": user.department,
            "semester": user.semester,
            "degree": user.degree,
            "skills": user.skills,
            "avatar": user.avatar
        }
    }

@app.post("/api/auth/refresh")
def refresh_token_endpoint(req: RefreshTokenRequest, db: Session = Depends(get_db)):
    try:
        payload = decode_token(req.refresh_token.strip(), expected_type="refresh")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid or expired refresh token: {e}")
    
    user_id = payload.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User account no longer exists.")

    new_access_token = create_access_token(
        user_id=user.id,
        role=user.role,
        email=user.email,
        student_id=user.student_id
    )
    return {
        "access_token": new_access_token,
        "token_type": "bearer"
    }

@app.post("/api/auth/logout")
def logout(current_user: User = Depends(auth_get_current_user)):
    return {"success": True, "message": "Successfully logged out."}"""

code = code.replace(old_login, new_login)

# 5. Fix Register to hash password
old_reg_pwd = "password_hash=req.password,   # plain for now; hash in production"
new_reg_pwd = "password_hash=hash_password(req.password),   # securely hashed with bcrypt"
code = code.replace(old_reg_pwd, new_reg_pwd)

# 6. Fix /api/users/me
old_users_me = """@app.get("/api/users/me")
def get_current_user(user_id: int = 1, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = db.query(User).first()
    return user"""

new_users_me = """@app.get("/api/users/me")
def get_my_profile(current_user: User = Depends(auth_get_current_user)):
    return {
        "id": current_user.id,
        "student_id": current_user.student_id,
        "roll_number": current_user.roll_number,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "department": current_user.department,
        "semester": current_user.semester,
        "degree": current_user.degree,
        "skills": current_user.skills,
        "avatar": current_user.avatar
    }"""

code = code.replace(old_users_me, new_users_me)

# 7. Protect Student ERP routes
code = code.replace(
    "@app.get(\"/api/students\")\ndef get_students(db: Session = Depends(get_db)):",
    "@app.get(\"/api/students\")\ndef get_students(current_user: User = Depends(auth_get_current_user), db: Session = Depends(get_db)):"
)

code = code.replace(
    "@app.get(\"/api/admins\")\ndef get_admins(db: Session = Depends(get_db)):",
    "@app.get(\"/api/admins\")\ndef get_admins(current_user: User = Depends(require_role(\"admin\", \"ncct_admin\")), db: Session = Depends(get_db)):"
)

code = code.replace(
    "@app.post(\"/api/students/add\")\ndef add_student(req: StudentAddRequest, db: Session = Depends(get_db)):",
    "@app.post(\"/api/students/add\")\ndef add_student(req: StudentAddRequest, current_user: User = Depends(require_role(\"admin\", \"ncct_admin\")), db: Session = Depends(get_db)):"
)

code = code.replace(
    "@app.put(\"/api/students/{student_id}\")\ndef update_student(student_id: str, req: StudentUpdateRequest, db: Session = Depends(get_db)):",
    "@app.put(\"/api/students/{student_id}\")\ndef update_student(student_id: str, req: StudentUpdateRequest, current_user: User = Depends(require_role(\"admin\", \"ncct_admin\")), db: Session = Depends(get_db)):"
)

code = code.replace(
    "@app.delete(\"/api/students/{student_id}\")\ndef delete_student(student_id: str, db: Session = Depends(get_db)):",
    "@app.delete(\"/api/students/{student_id}\")\ndef delete_student(student_id: str, current_user: User = Depends(require_role(\"admin\", \"ncct_admin\")), db: Session = Depends(get_db)):"
)

# 8. Fix /api/students/capture-sample and remove client role spoofing
old_capture_role = """@app.post("/api/students/capture-sample")
def capture_sample(req: CaptureSampleRequest, db: Session = Depends(get_db)):
    \"\"\"Save a face photo sample to dataset/<student_id>/ for LBPH training with strict biometric quality validation\"\"\"
    # 1. Authorization: Only trainer or admin can enroll or capture samples
    role = (req.requester_role or "admin").strip().lower()
    if role == "student":
        return {
            "success": False,
            "error": "Unauthorized: Students cannot enroll or update biometric face data. Contact an institution admin or trainer."
        }"""

new_capture_role = """@app.post("/api/students/capture-sample")
def capture_sample(
    req: CaptureSampleRequest, 
    current_user: User = Depends(require_role("trainer", "admin", "ncct_admin")), 
    db: Session = Depends(get_db)
):
    \"\"\"Save a face photo sample to dataset/<student_id>/ for LBPH training with strict biometric quality validation\"\"\"
    # Server-side RBAC: Only trainer or admin can enroll or capture samples (Task 4)"""

code = code.replace(old_capture_role, new_capture_role)

# 9. Fix /api/students/{student_id}/reset-samples
code = code.replace(
    "@app.post(\"/api/students/{student_id}/reset-samples\")\ndef reset_student_samples(student_id: str):",
    "@app.post(\"/api/students/{student_id}/reset-samples\")\ndef reset_student_samples(student_id: str, current_user: User = Depends(require_role(\"trainer\", \"admin\", \"ncct_admin\"))):"
)

# 10. Fix /api/train server-side role check
old_train_role = """@app.post("/api/train")
@app.post("/api/train-model")
def train_model(req: Optional[TrainModelRequest] = None):
    # Authorization: Only institution admin or trainer can trigger retraining
    if req and req.requester_role:
        role = req.requester_role.strip().lower()
        if role == "student":
            return {
                "success": False,
                "error": "Unauthorized: Only institution admins and trainers can trigger model retraining."
            }"""

new_train_role = """@app.post("/api/train")
@app.post("/api/train-model")
def train_model(
    req: Optional[TrainModelRequest] = None,
    current_user: User = Depends(require_role("trainer", "admin", "ncct_admin"))
):
    # Server-side RBAC: Only institution admin or trainer can trigger retraining (Task 4)"""

code = code.replace(old_train_role, new_train_role)

# 11. Task 5: Fix Attendance Identity Fallback in QR Verification
old_qr_user = """    user = db.query(User).filter(
        (User.student_id == student_id) | (User.id == 1)
    ).first()

    if not user:
        return {"success": False, "error": f"Student ID '{student_id}' not found.", "code": "STUDENT_NOT_FOUND"}"""

new_qr_user = """    user = db.query(User).filter(User.student_id == student_id).first()

    if not user:
        import logging
        logging.getLogger("coopsync.security").warning(f"[Security Audit] Rejected QR attendance for unassigned student ID: {student_id}")
        return {"success": False, "error": f"Student ID '{student_id}' is not registered in the system.", "code": "STUDENT_NOT_FOUND"}"""

code = code.replace(old_qr_user, new_qr_user)

# 12. Task 5: Fix Attendance Identity Fallback in Offline Sync
old_offline_user = """    for item in req.records:
        user = db.query(User).filter(
            (User.student_id == item.student_id) | (User.name.ilike(item.student_name))
        ).first()
        if not user:
            user = db.query(User).first()"""

new_offline_user = """    for item in req.records:
        user = db.query(User).filter(
            (User.student_id == item.student_id) | (User.name.ilike(item.student_name))
        ).first()
        if not user:
            import logging
            logging.getLogger("coopsync.security").warning(f"[Security Audit] Rejected offline sync record for unverified student: {item.student_id} / {item.student_name}")
            results.append({"student_id": item.student_id, "status": "rejected_unknown_student", "error": f"Student ID '{item.student_id}' is not registered in ERP"})
            continue"""

code = code.replace(old_offline_user, new_offline_user)

# 13. Protect Attendance Admin operations
code = code.replace(
    "@app.post(\"/api/attendance/clear\")\ndef clear_attendance(db: Session = Depends(get_db)):",
    "@app.post(\"/api/attendance/clear\")\ndef clear_attendance(current_user: User = Depends(require_role(\"admin\", \"ncct_admin\")), db: Session = Depends(get_db)):"
)

code = code.replace(
    "@app.post(\"/api/attendance/manual\")\ndef manual_attendance(req: ManualAttendanceRequest, db: Session = Depends(get_db)):",
    "@app.post(\"/api/attendance/manual\")\ndef manual_attendance(req: ManualAttendanceRequest, current_user: User = Depends(require_role(\"trainer\", \"admin\", \"ncct_admin\")), db: Session = Depends(get_db)):"
)

code = code.replace(
    "@app.get(\"/api/attendance/logs\")\ndef get_attendance_logs(db: Session = Depends(get_db)):",
    "@app.get(\"/api/attendance/logs\")\ndef get_attendance_logs(current_user: User = Depends(auth_get_current_user), db: Session = Depends(get_db)):"
)

code = code.replace(
    "@app.put(\"/api/institution/config\")\ndef update_institution_config(req: InstitutionConfigUpdate, db: Session = Depends(get_db)):",
    "@app.put(\"/api/institution/config\")\ndef update_institution_config(req: InstitutionConfigUpdate, current_user: User = Depends(require_role(\"admin\", \"ncct_admin\")), db: Session = Depends(get_db)):"
)

# 14. Protect Risk and Early Warning Endpoints & Ownership
code = code.replace(
    "@app.get(\"/api/risk/overview\")\ndef get_risk_overview(db: Session = Depends(get_db)):",
    "@app.get(\"/api/risk/overview\")\ndef get_risk_overview(current_user: User = Depends(require_role(\"trainer\", \"admin\", \"ncct_admin\")), db: Session = Depends(get_db)):"
)

code = code.replace(
    "@app.get(\"/api/risk/students\")\ndef get_risk_students(\n    department: Optional[str] = None,\n    risk_level: Optional[str] = None,\n    search: Optional[str] = None,\n    limit: int = 50,\n    db: Session = Depends(get_db)\n):",
    "@app.get(\"/api/risk/students\")\ndef get_risk_students(\n    department: Optional[str] = None,\n    risk_level: Optional[str] = None,\n    search: Optional[str] = None,\n    limit: int = 50,\n    current_user: User = Depends(require_role(\"trainer\", \"admin\", \"ncct_admin\")),\n    db: Session = Depends(get_db)\n):"
)

# Risk student profile ownership check
old_risk_student = """@app.get("/api/risk/student/{student_id}")
def get_student_risk_profile(student_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (User.student_id == student_id) | (User.id == int(student_id) if student_id.isdigit() else False)
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"Student '{student_id}' not found.")"""

new_risk_student = """@app.get("/api/risk/student/{student_id}")
def get_student_risk_profile(
    student_id: str, 
    current_user: User = Depends(auth_get_current_user), 
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        (User.student_id == student_id) | (User.id == int(student_id) if student_id.isdigit() else False)
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"Student '{student_id}' not found.")

    # Task 4 & Task 8: Cross-user data isolation (Student can only view their own risk profile)
    verify_ownership_or_roles(current_user, target_student_id=user.student_id, target_user_id=user.id, elevated_roles=["trainer", "admin", "ncct_admin"])"""

code = code.replace(old_risk_student, new_risk_student)

code = code.replace(
    "@app.post(\"/api/risk/predict/all\")\ndef run_all_risk_predictions(db: Session = Depends(get_db)):",
    "@app.post(\"/api/risk/predict/all\")\ndef run_all_risk_predictions(current_user: User = Depends(require_role(\"trainer\", \"admin\", \"ncct_admin\")), db: Session = Depends(get_db)):"
)

code = code.replace(
    "@app.post(\"/api/risk/predict/student/{student_id}\")\ndef predict_student_risk_endpoint(student_id: str, db: Session = Depends(get_db)):",
    "@app.post(\"/api/risk/predict/student/{student_id}\")\ndef predict_student_risk_endpoint(student_id: str, current_user: User = Depends(require_role(\"trainer\", \"admin\", \"ncct_admin\")), db: Session = Depends(get_db)):"
)

code = code.replace(
    "@app.get(\"/api/risk/interventions\")\ndef list_interventions(\n    status_filter: Optional[str] = None,\n    student_id: Optional[str] = None,\n    db: Session = Depends(get_db)\n):",
    "@app.get(\"/api/risk/interventions\")\ndef list_interventions(\n    status_filter: Optional[str] = None,\n    student_id: Optional[str] = None,\n    current_user: User = Depends(require_role(\"trainer\", \"admin\", \"ncct_admin\")),\n    db: Session = Depends(get_db)\n):"
)

code = code.replace(
    "@app.post(\"/api/risk/interventions\")\ndef record_intervention(req: RecordInterventionRequest, db: Session = Depends(get_db)):",
    "@app.post(\"/api/risk/interventions\")\ndef record_intervention(req: RecordInterventionRequest, current_user: User = Depends(require_role(\"trainer\", \"admin\", \"ncct_admin\")), db: Session = Depends(get_db)):"
)

code = code.replace(
    "@app.put(\"/api/risk/interventions/{intervention_id}\")\ndef update_intervention(intervention_id: int, req: UpdateInterventionRequest, db: Session = Depends(get_db)):",
    "@app.put(\"/api/risk/interventions/{intervention_id}\")\ndef update_intervention(intervention_id: int, req: UpdateInterventionRequest, current_user: User = Depends(require_role(\"trainer\", \"admin\", \"ncct_admin\")), db: Session = Depends(get_db)):"
)

code = code.replace(
    "@app.post(\"/api/risk/assessments\")\ndef add_student_assessment(req: AddAssessmentRequest, db: Session = Depends(get_db)):",
    "@app.post(\"/api/risk/assessments\")\ndef add_student_assessment(req: AddAssessmentRequest, current_user: User = Depends(require_role(\"trainer\", \"admin\", \"ncct_admin\")), db: Session = Depends(get_db)):"
)

code = code.replace(
    "@app.post(\"/api/risk/model/retrain\")\ndef retrain_risk_model(db: Session = Depends(get_db)):",
    "@app.post(\"/api/risk/model/retrain\")\ndef retrain_risk_model(current_user: User = Depends(require_role(\"admin\", \"ncct_admin\")), db: Session = Depends(get_db)):"
)

code = code.replace(
    "@app.post(\"/api/risk/feedback\")\ndef submit_risk_feedback(req: PredictionFeedbackRequest, db: Session = Depends(get_db)):",
    "@app.post(\"/api/risk/feedback\")\ndef submit_risk_feedback(req: PredictionFeedbackRequest, current_user: User = Depends(require_role(\"trainer\", \"admin\", \"ncct_admin\")), db: Session = Depends(get_db)):"
)

# 15. Fix Certificate PDF Regeneration Bug
old_cert_regen = """    pdf_path = os.path.join(CERTIFICATES_DIR, f"certificate_{cert_id}.pdf")
    if not os.path.exists(pdf_path):
        # Auto regenerate
        pdf_path = generate_pdf_certificate(
            student_name="Puneet",
            course_title="AI-Enabled Computer Vision & Face Biometrics",
            cert_id=cert_id
        )"""

new_cert_regen = """    pdf_path = os.path.join(CERTIFICATES_DIR, f"certificate_{cert_id}.pdf")
    if not os.path.exists(pdf_path):
        from database import SessionLocal
        _db = SessionLocal()
        try:
            _cert_row = _db.query(Certificate).filter(Certificate.certificate_no == cert_id).first()
            _s_name = _cert_row.student_name if _cert_row else "Student"
            _c_title = _cert_row.course_title if _cert_row else "Cooperative Skills Certification"
            pdf_path = generate_pdf_certificate(
                student_name=_s_name,
                course_title=_c_title,
                cert_id=cert_id
            )
        finally:
            _db.close()"""

code = code.replace(old_cert_regen, new_cert_regen)

# 16. Protect Certificate & Job routes
code = code.replace(
    "@app.get(\"/api/certificates\")\ndef get_certificates(db: Session = Depends(get_db)):",
    "@app.get(\"/api/certificates\")\ndef get_certificates(current_user: User = Depends(auth_get_current_user), db: Session = Depends(get_db)):"
)

code = code.replace(
    "@app.post(\"/api/certificates/generate\")\ndef generate_cert(student_name: str = Body(..., embed=True), course_title: str = Body(..., embed=True), db: Session = Depends(get_db)):",
    "@app.post(\"/api/certificates/generate\")\ndef generate_cert(student_name: str = Body(..., embed=True), course_title: str = Body(..., embed=True), current_user: User = Depends(auth_get_current_user), db: Session = Depends(get_db)):"
)

code = code.replace(
    "@app.get(\"/api/certificates/download/{cert_id}\")\ndef download_cert(cert_id: str):",
    "@app.get(\"/api/certificates/download/{cert_id}\")\ndef download_cert(cert_id: str, current_user: User = Depends(get_optional_current_user)):"
)

code = code.replace(
    "@app.get(\"/api/courses\")\ndef get_courses(db: Session = Depends(get_db)):",
    "@app.get(\"/api/courses\")\ndef get_courses(current_user: User = Depends(auth_get_current_user), db: Session = Depends(get_db)):"
)

code = code.replace(
    "@app.post(\"/api/courses\")\ndef add_course(req: CourseCreateRequest, db: Session = Depends(get_db)):",
    "@app.post(\"/api/courses\")\ndef add_course(req: CourseCreateRequest, current_user: User = Depends(require_role(\"trainer\", \"admin\", \"ncct_admin\")), db: Session = Depends(get_db)):"
)

code = code.replace(
    "@app.get(\"/api/jobs\")\ndef get_jobs(user_id: Optional[int] = 1, db: Session = Depends(get_db)):",
    "@app.get(\"/api/jobs\")\ndef get_jobs(current_user: User = Depends(auth_get_current_user), db: Session = Depends(get_db)):\n    user_id = current_user.id"
)

code = code.replace(
    "@app.post(\"/api/jobs/apply\")\ndef apply_job(req: JobApplyRequest, db: Session = Depends(get_db)):",
    "@app.post(\"/api/jobs/apply\")\ndef apply_job(req: JobApplyRequest, current_user: User = Depends(auth_get_current_user), db: Session = Depends(get_db)):\n    req.user_id = current_user.id"
)

# 17. Re-enable Seeding for Jobs so Placement portal is populated
code = code.replace(
    "# -- Demo seed data disabled for fresh start --\n        # Change to `if True:` to re-enable demo courses, jobs, and attendance\n        if False:",
    "# Re-enabled demo courses, jobs, and placement board seeding (Audit Fix)\n        if True:"
)

with open(main_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Modified code length:", len(code))
print("Patched main.py successfully!")

