import os
import re

target_file = r"CoopSyncAI\backend\main.py"
with open(target_file, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update imports
old_imp = """from database import (
    init_db, get_db, User, Attendance, Course, Certificate, Job, JobApplication, InstitutionConfig,
    StudentAssessment, StudentRiskPrediction, MLModelMetadata, StudentIntervention, PredictionFeedback
)"""

new_imp = """from database import (
    init_db, get_db, User, Attendance, Course, Certificate, Job, JobApplication, InstitutionConfig,
    StudentAssessment, StudentRiskPrediction, MLModelMetadata, StudentIntervention, PredictionFeedback,
    CourseEnrollment, CourseModuleProgress
)"""

assert old_imp in content, "old_imp not found"
content = content.replace(old_imp, new_imp, 1)

# 2. Add Pydantic models
old_models = """class CreateCourseRequest(BaseModel):
    title: str
    category: str
    trainer_name: str
    duration: str
    description: str
    youtube_url: Optional[str] = None
    thumbnail: Optional[str] = None"""

new_models = """class CreateCourseRequest(BaseModel):
    title: str
    category: str
    trainer_name: str
    duration: str
    description: str
    youtube_url: Optional[str] = None
    thumbnail: Optional[str] = None

class ModuleProgressUpdateRequest(BaseModel):
    is_completed: bool = True
    time_spent_minutes: Optional[int] = 10
    score: Optional[float] = None

class RevokeCertificateRequest(BaseModel):
    reason: Optional[str] = "Administrative revocation" """

assert old_models in content, "old_models not found"
content = content.replace(old_models, new_models, 1)

# 3. Add Course module helper and LMS endpoints + Gated Cert endpoints
old_course_and_cert_section = """# 5. Course Management
@app.get("/api/courses")
def get_courses(current_user: User = Depends(auth_get_current_user), db: Session = Depends(get_db)):
    return db.query(Course).all()

@app.post("/api/courses")
def create_course(req: CreateCourseRequest, db: Session = Depends(get_db)):
    yt_link = req.youtube_url or ("https://www.youtube.com/results?search_query=" + "+".join(req.title.split()))
    
    # Auto-resolve thumbnail if not explicitly given
    thumb = (req.thumbnail or "").strip()
    if not thumb:
        import re
        yt_match = re.search(r'(?:v=|\\/|embed\\/|youtu\\.be\\/)([0-9A-Za-z_-]{11})', yt_link)
        if yt_match:
            thumb = f"https://img.youtube.com/vi/{yt_match.group(1)}/hqdefault.jpg"
        else:
            thumb = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600"

    new_course = Course(
        title=req.title,
        category=req.category,
        trainer_name=req.trainer_name,
        duration=req.duration,
        description=req.description,
        youtube_url=yt_link,
        thumbnail=thumb,
        modules_count=10,
        enrolled_count=1
    )
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    return new_course

# 6. Certificate Generation
@app.get("/api/certificates")
def get_certificates(student_name: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Certificate)
    if student_name and student_name.strip():
        from sqlalchemy import or_
        name = student_name.strip()
        tokens = name.split()
        # Match exact full name OR the first name token — avoids cross-student bleed
        conditions = [Certificate.student_name.ilike(f"%{name}%")]
        if tokens:
            conditions.append(Certificate.student_name.ilike(f"{tokens[0]}"))
        query = query.filter(or_(*conditions))
    return query.order_by(Certificate.id.desc()).all()

@app.post("/api/certificates/generate")
def generate_cert(student_name: str = Body(..., embed=True), course_title: str = Body(..., embed=True), current_user: User = Depends(auth_get_current_user), db: Session = Depends(get_db)):
    s_name = student_name.strip()
    c_title = course_title.strip()

    # Check for existing certificate for this student and course
    existing = db.query(Certificate).filter(
        Certificate.student_name.ilike(s_name),
        Certificate.course_title.ilike(c_title)
    ).first()
    if existing:
        return {
            "success": True,
            "certificate_id": existing.certificate_no,
            "student_name": existing.student_name,
            "course_title": existing.course_title,
            "download_url": f"/api/certificates/download/{existing.certificate_no}",
            "verify_url": f"/api/certificates/verify/{existing.certificate_no}",
            "message": f"Certificate already verified for {existing.student_name}!"
        }

    cert_id = f"CS-{int(datetime.now().timestamp())}-{random.randint(100, 999)}"
    issue_date = datetime.now().strftime("%B %d, %Y")
    
    # Generate actual PDF file
    pdf_path = generate_pdf_certificate(
        student_name=s_name,
        course_title=c_title,
        cert_id=cert_id,
        grade="A+",
        issue_date=issue_date
    )

    user = db.query(User).filter(User.name.ilike(s_name)).first()
    user_id = user.id if user else 1

    cert = Certificate(
        certificate_no=cert_id,
        user_id=user_id,
        student_name=s_name,
        course_title=c_title,
        issue_date=issue_date,
        grade="A+",
        status="Verified"
    )
    db.add(cert)
    db.commit()
    db.refresh(cert)

    return {
        "success": True,
        "certificate_id": cert_id,
        "student_name": s_name,
        "course_title": c_title,
        "download_url": f"/api/certificates/download/{cert_id}",
        "verify_url": f"/api/certificates/verify/{cert_id}"
    }

@app.get("/api/certificates/download/{cert_id}")
def download_cert(cert_id: str, current_user: User = Depends(get_optional_current_user)):
    pdf_path = os.path.join(CERTIFICATES_DIR, f"certificate_{cert_id}.pdf")
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
            _db.close()
    return FileResponse(pdf_path, media_type="application/pdf", filename=f"CoopSync_Certificate_{cert_id}.pdf")

@app.get("/api/certificates/verify/{cert_id}")
def verify_cert(cert_id: str, db: Session = Depends(get_db)):
    cert = db.query(Certificate).filter(Certificate.certificate_no == cert_id).first()
    if cert:
        return {
            "valid": True,
            "status": "Official Authentic Certificate",
            "certificate_no": cert.certificate_no,
            "student_name": cert.student_name,
            "course": cert.course_title,
            "grade": cert.grade,
            "issue_date": cert.issue_date,
            "issuing_authority": "CoopSync Cooperative Skills ERP Board"
        }
    return {
        "valid": True,
        "status": "Verified Public Credential",
        "certificate_no": cert_id,
        "student_name": "Puneet",
        "course": "AI-Enabled Computer Vision & Face Biometrics",
        "grade": "A+",
        "issue_date": datetime.now().strftime("%B %d, %Y"),
        "issuing_authority": "CoopSync Cooperative Skills ERP Board"
    }"""

new_course_and_cert_section = '''# 5. Course Management & LMS Engine

def _get_default_course_modules(course_title: str):
    """Returns 5 comprehensive syllabus modules matching the course topic."""
    tl = (course_title or "").lower()
    if "dsa" in tl or "data structure" in tl:
        return [
            (1, "Asymptotic Complexity Analysis & C++/Java STL Containers"),
            (2, "Linear Structures: Linked Lists, Stacks, Queues & Monotonic Stacks"),
            (3, "Trees, Binary Search Trees, Heaps & Priority Queues"),
            (4, "Advanced Graph Algorithms: BFS, DFS, Dijkstra & Kruskal"),
            (5, "Dynamic Programming, Memoization & LeetCode Hard Patterns")
        ]
    elif "operating system" in tl or "os" in tl:
        return [
            (1, "Operating System Architecture, Kernel Modes & POSIX System Calls"),
            (2, "CPU Scheduling Algorithms, Context Switching & Process Lifecycle"),
            (3, "Concurrency, Semaphores, Mutex Locks & Deadlock Avoidance"),
            (4, "Virtual Memory, Multi-level Paging & Page Replacement Algorithms"),
            (5, "File System Implementation, Disk Scheduling & Linux VFS")
        ]
    elif "database" in tl or "dbms" in tl or "sql" in tl:
        return [
            (1, "Relational Model, ER Diagrams & Normalization (1NF to BCNF)"),
            (2, "PostgreSQL Advanced Queries: Joins, Window Functions & CTEs"),
            (3, "ACID Properties, Transaction Concurrency & Isolation Levels"),
            (4, "B-Tree & Hash Indexing, EXPLAIN Query Plans & Sharding"),
            (5, "NoSQL Distributed Systems: MongoDB, Redis Caching & CAP Theorem")
        ]
    elif "vision" in tl or "biometric" in tl or "opencv" in tl:
        return [
            (1, "Computer Vision Core: OpenCV Image Filters, Haar Cascades & LBPH"),
            (2, "Biometric Anti-Spoofing: Laplacian Texture Frequency & Liveness Analysis"),
            (3, "Neural Networks: Forward Propagation, Cross-Entropy Loss & Backprop"),
            (4, "Convolutional Neural Networks (CNNs) & FaceNet Feature Embeddings"),
            (5, "Production Edge Inference & FastAPI Biometrics Microservices")
        ]
    elif "cooperative" in tl or "governance" in tl or "management" in tl:
        return [
            (1, "Principles of Cooperation & Evolution of Indian Cooperative Societies"),
            (2, "Multi-State Co-operative Societies (MSCS) Act 2002 & NCCT Norms"),
            (3, "Democratic Governance, Board Leadership & Member Financial Equity"),
            (4, "Statutory Audit, Accounting Standards & Cooperative Compliance"),
            (5, "Digital Transformation & Technology Modernization in Cooperatives")
        ]
    elif "supply chain" in tl or "iot" in tl or "agri" in tl:
        return [
            (1, "Agri-Cooperative Logistics Architecture & Cold Chain Operations"),
            (2, "IoT Sensor Gateways, Telemetry & Real-Time Warehouse Telematics"),
            (3, "Automated Milk & Grain Collection Systems with Edge Computing"),
            (4, "Inventory Optimization, Batch Traceability & Quality Standards"),
            (5, "Decentralized Cooperative Distribution Networks & Analytics")
        ]
    else:
        return [
            (1, f"{course_title} - Module 1: Foundational Principles & Core Concepts"),
            (2, f"{course_title} - Module 2: Applied Methodologies & Practical Tooling"),
            (3, f"{course_title} - Module 3: Intermediate Architecture & Hands-on Lab"),
            (4, f"{course_title} - Module 4: Advanced Workflows & Industry Best Practices"),
            (5, f"{course_title} - Module 5: Capstone Implementation & Performance Assessment")
        ]

@app.get("/api/courses")
def get_courses(current_user: User = Depends(auth_get_current_user), db: Session = Depends(get_db)):
    return db.query(Course).order_by(Course.id.asc()).all()

@app.post("/api/courses")
def create_course(req: CreateCourseRequest, current_user: User = Depends(require_role("admin", "ncct_admin", "trainer")), db: Session = Depends(get_db)):
    yt_link = req.youtube_url or ("https://www.youtube.com/results?search_query=" + "+".join(req.title.split()))
    
    thumb = (req.thumbnail or "").strip()
    if not thumb:
        import re
        yt_match = re.search(r'(?:v=|\/|embed\/|youtu\.be\/)([0-9A-Za-z_-]{11})', yt_link)
        if yt_match:
            thumb = f"https://img.youtube.com/vi/{yt_match.group(1)}/hqdefault.jpg"
        else:
            thumb = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600"

    new_course = Course(
        title=req.title,
        category=req.category,
        trainer_name=req.trainer_name or current_user.name,
        duration=req.duration,
        description=req.description,
        youtube_url=yt_link,
        thumbnail=thumb,
        modules_count=5,
        enrolled_count=0
    )
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    return new_course

# LMS Course Enrollment & Progress Endpoints
@app.post("/api/courses/{course_id}/enroll")
def enroll_course(
    course_id: int,
    current_user: User = Depends(auth_get_current_user),
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    existing = db.query(CourseEnrollment).filter(
        CourseEnrollment.student_id == current_user.id,
        CourseEnrollment.course_id == course_id
    ).first()

    if existing:
        return {
            "success": True,
            "message": "Student is already enrolled in this course",
            "enrollment": {
                "id": existing.id,
                "course_id": existing.course_id,
                "student_id": existing.student_id,
                "status": existing.enrollment_status,
                "progress_percentage": existing.progress_percentage,
                "completed_modules": existing.completed_modules,
                "total_modules": existing.total_modules
            }
        }

    enrollment = CourseEnrollment(
        student_id=current_user.id,
        course_id=course.id,
        enrollment_date=datetime.utcnow(),
        enrollment_status="Enrolled",
        progress_percentage=0.0,
        completed_modules=0,
        total_modules=5,
        started_at=datetime.utcnow(),
        last_accessed_at=datetime.utcnow()
    )
    db.add(enrollment)
    db.flush()

    modules = _get_default_course_modules(course.title)
    for mod_id, mod_title in modules:
        prog = CourseModuleProgress(
            enrollment_id=enrollment.id,
            module_id=mod_id,
            module_title=mod_title,
            is_completed=False,
            time_spent_minutes=0
        )
        db.add(prog)

    course.enrolled_count = (course.enrolled_count or 0) + 1
    db.commit()
    db.refresh(enrollment)

    return {
        "success": True,
        "message": f"Successfully enrolled in {course.title}",
        "enrollment": {
            "id": enrollment.id,
            "course_id": enrollment.course_id,
            "student_id": enrollment.student_id,
            "status": enrollment.enrollment_status,
            "progress_percentage": enrollment.progress_percentage,
            "completed_modules": enrollment.completed_modules,
            "total_modules": enrollment.total_modules
        }
    }

@app.get("/api/students/me/enrollments")
def get_my_enrollments(
    current_user: User = Depends(auth_get_current_user),
    db: Session = Depends(get_db)
):
    enrollments = db.query(CourseEnrollment).filter(
        CourseEnrollment.student_id == current_user.id
    ).order_by(CourseEnrollment.last_accessed_at.desc()).all()

    result = []
    for enr in enrollments:
        c = enr.course
        result.append({
            "enrollment_id": enr.id,
            "course_id": enr.course_id,
            "course_title": c.title if c else "Unknown Course",
            "category": c.category if c else "General",
            "trainer_name": c.trainer_name if c else "NCCT Faculty",
            "thumbnail": c.thumbnail if c else "",
            "duration": c.duration if c else "6 Weeks",
            "enrollment_date": enr.enrollment_date.isoformat() if enr.enrollment_date else None,
            "status": enr.enrollment_status,
            "progress_percentage": enr.progress_percentage,
            "completed_modules": enr.completed_modules,
            "total_modules": enr.total_modules,
            "started_at": enr.started_at.isoformat() if enr.started_at else None,
            "completed_at": enr.completed_at.isoformat() if enr.completed_at else None,
            "last_accessed_at": enr.last_accessed_at.isoformat() if enr.last_accessed_at else None
        })
    return result

@app.get("/api/courses/{course_id}/progress")
def get_course_progress(
    course_id: int,
    current_user: User = Depends(auth_get_current_user),
    db: Session = Depends(get_db)
):
    enrollment = db.query(CourseEnrollment).filter(
        CourseEnrollment.student_id == current_user.id,
        CourseEnrollment.course_id == course_id
    ).first()

    if not enrollment:
        raise HTTPException(status_code=404, detail="Student is not enrolled in this course")

    modules = db.query(CourseModuleProgress).filter(
        CourseModuleProgress.enrollment_id == enrollment.id
    ).order_by(CourseModuleProgress.module_id.asc()).all()

    return {
        "enrollment_id": enrollment.id,
        "course_id": enrollment.course_id,
        "course_title": enrollment.course.title if enrollment.course else "",
        "status": enrollment.enrollment_status,
        "progress_percentage": enrollment.progress_percentage,
        "completed_modules": enrollment.completed_modules,
        "total_modules": enrollment.total_modules,
        "modules": [
            {
                "id": m.id,
                "module_id": m.module_id,
                "title": m.module_title,
                "is_completed": m.is_completed,
                "score": m.score,
                "completed_at": m.completed_at.isoformat() if m.completed_at else None,
                "time_spent_minutes": m.time_spent_minutes
            }
            for m in modules
        ]
    }

@app.put("/api/courses/{course_id}/modules/{module_id}/progress")
def update_module_progress(
    course_id: int,
    module_id: int,
    req: ModuleProgressUpdateRequest,
    current_user: User = Depends(auth_get_current_user),
    db: Session = Depends(get_db)
):
    enrollment = db.query(CourseEnrollment).filter(
        CourseEnrollment.student_id == current_user.id,
        CourseEnrollment.course_id == course_id
    ).first()

    if not enrollment:
        raise HTTPException(status_code=404, detail="Student is not enrolled in this course")

    mod = db.query(CourseModuleProgress).filter(
        CourseModuleProgress.enrollment_id == enrollment.id,
        CourseModuleProgress.module_id == module_id
    ).first()

    if not mod:
        mod = CourseModuleProgress(
            enrollment_id=enrollment.id,
            module_id=module_id,
            module_title=f"Module {module_id}",
            is_completed=req.is_completed,
            score=req.score,
            time_spent_minutes=req.time_spent_minutes or 0,
            completed_at=datetime.utcnow() if req.is_completed else None
        )
        db.add(mod)
    else:
        mod.is_completed = req.is_completed
        mod.completed_at = datetime.utcnow() if req.is_completed else None
        if req.time_spent_minutes:
            mod.time_spent_minutes = (mod.time_spent_minutes or 0) + req.time_spent_minutes
        if req.score is not None:
            mod.score = req.score

    db.flush()

    all_mods = db.query(CourseModuleProgress).filter(
        CourseModuleProgress.enrollment_id == enrollment.id
    ).all()
    completed_count = sum(1 for m in all_mods if m.is_completed)
    total_count = max(len(all_mods), enrollment.total_modules or 5)

    enrollment.completed_modules = completed_count
    enrollment.total_modules = total_count
    enrollment.progress_percentage = round((completed_count / total_count) * 100.0, 1)
    enrollment.last_accessed_at = datetime.utcnow()

    if enrollment.progress_percentage >= 100.0:
        enrollment.enrollment_status = "Completed"
        enrollment.completed_at = datetime.utcnow()
    elif enrollment.progress_percentage > 0:
        enrollment.enrollment_status = "In Progress"
    else:
        enrollment.enrollment_status = "Enrolled"

    db.commit()
    db.refresh(enrollment)
    db.refresh(mod)

    return {
        "success": True,
        "enrollment_status": enrollment.enrollment_status,
        "progress_percentage": enrollment.progress_percentage,
        "completed_modules": enrollment.completed_modules,
        "total_modules": enrollment.total_modules,
        "module": {
            "module_id": mod.module_id,
            "title": mod.module_title,
            "is_completed": mod.is_completed,
            "completed_at": mod.completed_at.isoformat() if mod.completed_at else None
        }
    }

@app.get("/api/students/me/learning-progress")
def get_my_learning_progress(
    current_user: User = Depends(auth_get_current_user),
    db: Session = Depends(get_db)
):
    enrollments = db.query(CourseEnrollment).filter(
        CourseEnrollment.student_id == current_user.id
    ).all()

    total_enrolled = len(enrollments)
    completed_count = sum(1 for e in enrollments if e.enrollment_status == "Completed")
    in_progress_count = sum(1 for e in enrollments if e.enrollment_status == "In Progress")
    avg_progress = (
        round(sum(e.progress_percentage for e in enrollments) / total_enrolled, 1)
        if total_enrolled > 0 else 0.0
    )

    certs_count = db.query(Certificate).filter(
        Certificate.user_id == current_user.id,
        Certificate.status == "Valid"
    ).count()

    return {
        "student_id": current_user.student_id or str(current_user.id),
        "student_name": current_user.name,
        "total_courses_enrolled": total_enrolled,
        "completed_courses": completed_count,
        "in_progress_courses": in_progress_count,
        "average_progress_percentage": avg_progress,
        "certificates_earned": certs_count
    }

@app.post("/api/courses/{course_id}/complete")
def complete_course(
    course_id: int,
    current_user: User = Depends(auth_get_current_user),
    db: Session = Depends(get_db)
):
    enrollment = db.query(CourseEnrollment).filter(
        CourseEnrollment.student_id == current_user.id,
        CourseEnrollment.course_id == course_id
    ).first()

    if not enrollment:
        raise HTTPException(status_code=404, detail="Student is not enrolled in this course")

    modules = db.query(CourseModuleProgress).filter(
        CourseModuleProgress.enrollment_id == enrollment.id
    ).all()

    incomplete = [m for m in modules if not m.is_completed]
    if incomplete or len(modules) == 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot complete course: {len(incomplete)} of {len(modules)} modules remain incomplete"
        )

    enrollment.enrollment_status = "Completed"
    enrollment.completed_modules = len(modules)
    enrollment.progress_percentage = 100.0
    enrollment.completed_at = datetime.utcnow()
    enrollment.last_accessed_at = datetime.utcnow()

    db.commit()
    db.refresh(enrollment)

    return {
        "success": True,
        "message": f"Congratulations! You have completed {enrollment.course.title if enrollment.course else 'the course'}",
        "enrollment_id": enrollment.id,
        "status": enrollment.enrollment_status,
        "progress_percentage": 100.0,
        "completed_at": enrollment.completed_at.isoformat()
    }

# 6. Gated Digital Certificate Verification & Revocation
@app.get("/api/certificates")
def get_certificates(student_name: Optional[str] = None, current_user: Optional[User] = Depends(get_optional_current_user), db: Session = Depends(get_db)):
    query = db.query(Certificate)
    
    # If a student requests certificates, scope to their own records unless an admin searches
    if current_user and current_user.role == "student":
        query = query.filter(Certificate.user_id == current_user.id)
    elif student_name and student_name.strip():
        from sqlalchemy import or_
        name = student_name.strip()
        tokens = name.split()
        conditions = [Certificate.student_name.ilike(f"%{name}%")]
        if tokens:
            conditions.append(Certificate.student_name.ilike(f"{tokens[0]}"))
        query = query.filter(or_(*conditions))
    return query.order_by(Certificate.id.desc()).all()

@app.post("/api/certificates/generate")
def generate_cert(student_name: str = Body(..., embed=True), course_title: str = Body(..., embed=True), current_user: User = Depends(auth_get_current_user), db: Session = Depends(get_db)):
    s_name = student_name.strip()
    c_title = course_title.strip()

    # Find matching course
    course = db.query(Course).filter(Course.title.ilike(c_title)).first()

    # CRITICAL INTEGRITY REQUIREMENT: Student MUST be enrolled and reach 100% completion
    # Trainers and admins can generate for demonstration/testing, but students must earn it
    if current_user.role == "student":
        if not course:
            raise HTTPException(status_code=404, detail=f"Course '{c_title}' does not exist in curriculum")
        
        enrollment = db.query(CourseEnrollment).filter(
            CourseEnrollment.student_id == current_user.id,
            CourseEnrollment.course_id == course.id
        ).first()

        if not enrollment:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot issue certificate: You must be enrolled in '{course.title}' first."
            )

        if enrollment.progress_percentage < 100.0 or enrollment.enrollment_status != "Completed":
            raise HTTPException(
                status_code=400,
                detail=f"Cannot issue certificate: You have only completed {enrollment.progress_percentage}% of '{course.title}'. Complete all modules first."
            )

    # Check for existing valid certificate for this user and course to prevent duplicates
    existing = db.query(Certificate).filter(
        Certificate.user_id == current_user.id,
        Certificate.course_title.ilike(c_title),
        Certificate.status == "Valid"
    ).first()

    if existing:
        return {
            "success": True,
            "certificate_id": existing.certificate_no,
            "student_name": existing.student_name,
            "course_title": existing.course_title,
            "download_url": f"/api/certificates/download/{existing.certificate_no}",
            "verify_url": f"/api/certificates/verify/{existing.certificate_no}",
            "message": f"Certificate already verified for {existing.student_name}!"
        }

    cert_id = f"CS-{int(datetime.now().timestamp())}-{random.randint(100, 999)}"
    issue_date = datetime.now().strftime("%B %d, %Y")
    
    # Generate authentic PDF file
    pdf_path = generate_pdf_certificate(
        student_name=current_user.name,
        course_title=course.title if course else c_title,
        cert_id=cert_id,
        grade="A+",
        issue_date=issue_date
    )

    cert = Certificate(
        certificate_no=cert_id,
        user_id=current_user.id,
        course_id=course.id if course else None,
        student_name=current_user.name,
        course_title=course.title if course else c_title,
        issue_date=issue_date,
        grade="A+",
        status="Valid"
    )
    db.add(cert)
    db.commit()
    db.refresh(cert)

    return {
        "success": True,
        "certificate_id": cert_id,
        "student_name": current_user.name,
        "course_title": cert.course_title,
        "download_url": f"/api/certificates/download/{cert_id}",
        "verify_url": f"/api/certificates/verify/{cert_id}"
    }

@app.get("/api/certificates/download/{cert_id}")
def download_cert(cert_id: str, current_user: User = Depends(get_optional_current_user)):
    pdf_path = os.path.join(CERTIFICATES_DIR, f"certificate_{cert_id}.pdf")
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
            _db.close()
    return FileResponse(pdf_path, media_type="application/pdf", filename=f"CoopSync_Certificate_{cert_id}.pdf")

@app.get("/api/certificates/verify/{cert_id}")
def verify_cert(cert_id: str, db: Session = Depends(get_db)):
    cert = db.query(Certificate).filter(Certificate.certificate_no == cert_id).first()
    if not cert:
        return {
            "valid": False,
            "status": "Invalid or Non-existent Certificate",
            "certificate_no": cert_id,
            "error": "No authentic certificate record found with this identifier"
        }

    if cert.status == "Revoked":
        return {
            "valid": False,
            "status": "Revoked Credential",
            "certificate_no": cert.certificate_no,
            "student_name": cert.student_name,
            "course": cert.course_title,
            "revoked_at": cert.revoked_at.isoformat() if cert.revoked_at else None,
            "revoked_reason": cert.revoked_reason or "Revoked by Institution Admin"
        }

    return {
        "valid": True,
        "status": "Official Authentic Certificate",
        "certificate_no": cert.certificate_no,
        "student_name": cert.student_name,
        "course": cert.course_title,
        "grade": cert.grade,
        "issue_date": cert.issue_date,
        "issuing_authority": "CoopSync Cooperative Skills ERP Board"
    }

@app.post("/api/certificates/{cert_id}/revoke")
def revoke_certificate(
    cert_id: str,
    req: RevokeCertificateRequest = Body(default=RevokeCertificateRequest()),
    current_user: User = Depends(require_role("admin", "ncct_admin")),
    db: Session = Depends(get_db)
):
    cert = db.query(Certificate).filter(Certificate.certificate_no == cert_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")

    cert.status = "Revoked"
    cert.revoked_at = datetime.utcnow()
    cert.revoked_reason = req.reason or "Administrative revocation"
    db.commit()

    return {
        "success": True,
        "message": f"Certificate {cert_id} has been revoked",
        "certificate_no": cert.certificate_no,
        "status": cert.status,
        "revoked_reason": cert.revoked_reason,
        "revoked_at": cert.revoked_at.isoformat()
    }'''

assert old_course_and_cert_section in content, "old_course_and_cert_section not found"
content = content.replace(old_course_and_cert_section, new_course_and_cert_section, 1)

# 4. Check sync-offline student isolation
old_offline = """@app.post("/api/attendance/sync-offline")
def sync_offline_records(req: OfflineSyncRequest, db: Session = Depends(get_db)):"""

new_offline = """@app.post("/api/attendance/sync-offline")
def sync_offline_records(req: OfflineSyncRequest, current_user: Optional[User] = Depends(get_optional_current_user), db: Session = Depends(get_db)):"""

if old_offline in content:
    content = content.replace(old_offline, new_offline, 1)

old_check = """        user = db.query(User).filter(
            (User.student_id == item.student_id) | (User.name.ilike(item.student_name))
        ).first()
        if not user:
            import logging
            logging.getLogger("coopsync.security").warning(f"[Security Audit] Rejected offline sync record for unverified student: {item.student_id} / {item.student_name}")
            results.append({"student_id": item.student_id, "status": "rejected_unknown_student", "error": f"Student ID '{item.student_id}' is not registered in ERP"})
            continue"""

new_check = """        user = db.query(User).filter(
            (User.student_id == item.student_id) | (User.name.ilike(item.student_name))
        ).first()
        if not user:
            import logging
            logging.getLogger("coopsync.security").warning(f"[Security Audit] Rejected offline sync record for unverified student: {item.student_id} / {item.student_name}")
            results.append({"student_id": item.student_id, "status": "rejected_unknown_student", "error": f"Student ID '{item.student_id}' is not registered in ERP"})
            continue

        # Prevent a student from synchronizing attendance for another student
        if current_user and current_user.role == "student":
            if (current_user.student_id and item.student_id != current_user.student_id) and (user.id != current_user.id):
                results.append({
                    "student_id": item.student_id,
                    "status": "rejected_unauthorized",
                    "error": "Students may only submit their own offline attendance records."
                })
                continue"""

if old_check in content:
    content = content.replace(old_check, new_check, 1)

with open(target_file, "w", encoding="utf-8") as f:
    f.write(content)

print("Successfully applied Phase 2 LMS, Certificate gating, and Sync-Offline hardening to main.py")

