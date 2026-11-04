new_database_code = '''import os
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, Boolean, 
    DateTime, Text, ForeignKey, UniqueConstraint, Index, event, text
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, "coopsync.db")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_FILE}")

# Handle postgres URL format for SQLAlchemy if needed
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    pool_pre_ping=True
)

# Enable PRAGMA foreign_keys = ON, WAL mode, and busy timeout for SQLite connections (Task 5)
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if "sqlite" in DATABASE_URL.lower():
        try:
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys = ON;")
            cursor.execute("PRAGMA journal_mode = WAL;")
            cursor.execute("PRAGMA busy_timeout = 5000;")
            cursor.close()
        except Exception:
            pass

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ----------------- CORE IDENTITY & USER MODELS -----------------

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(50), unique=True, index=True, nullable=True) # e.g. 5025088
    roll_number = Column(String(50), nullable=True) # e.g. 2400300100305
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(200), nullable=False)
    role = Column(String(20), default="student") # student, trainer, admin, ncct_admin, employer
    department = Column(String(50), default="Computer Science & Engineering")
    semester = Column(String(20), default="5th Semester")
    degree = Column(String(50), default="B.Tech")
    gender = Column(String(20), default="Male")
    skills = Column(Text, default="Python, OpenCV, Machine Learning, React")
    avatar = Column(String(255), default="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150")
    created_at = Column(DateTime, default=datetime.utcnow)

    attendances = relationship("Attendance", back_populates="user", cascade="all, delete-orphan")
    certificates = relationship("Certificate", back_populates="user", cascade="all, delete-orphan")
    applications = relationship("JobApplication", back_populates="user", cascade="all, delete-orphan")
    assessments = relationship("StudentAssessment", back_populates="user", cascade="all, delete-orphan")
    risk_predictions = relationship("StudentRiskPrediction", back_populates="user", cascade="all, delete-orphan")
    interventions = relationship("StudentIntervention", back_populates="user", cascade="all, delete-orphan")
    enrollments = relationship("CourseEnrollment", back_populates="user", cascade="all, delete-orphan")
    module_progress = relationship("CourseModuleProgress", back_populates="user", cascade="all, delete-orphan")
    posted_jobs = relationship("Job", back_populates="employer")

class Attendance(Base):
    __tablename__ = "attendances"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(50), index=True)
    student_name = Column(String(100))
    date = Column(String(20), index=True) # YYYY-MM-DD
    time = Column(String(20)) # HH:MM:SS
    method = Column(String(40)) # 'Face Recognition' or 'QR + Real GPS Verification' or 'Offline Sync'
    confidence = Column(Float, default=95.0)
    liveness_verified = Column(Boolean, default=True)
    status = Column(String(40), default="Present") # Present, Late, Pending Verification (GPS Flagged)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    accuracy = Column(Float, nullable=True) # in meters
    distance = Column(Float, nullable=True) # distance from campus in meters
    geofence_status = Column(String(100), default="Verified (Within Radius)")
    device_info = Column(String(200), nullable=True)
    session_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="attendances")

# ----------------- LMS & COURSE ENROLLMENT MODELS (PHASE 2) -----------------

class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    category = Column(String(50), default="AI & Computer Vision")
    trainer_name = Column(String(100), default="Prof. Rajesh Sharma")
    duration = Column(String(50), default="6 Weeks")
    modules_count = Column(Integer, default=5)
    enrolled_count = Column(Integer, default=0)
    description = Column(Text)
    thumbnail = Column(String(255), default="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500")
    youtube_url = Column(String(255), default="https://www.youtube.com/watch?v=8hly31xKli0")
    progress_percentage = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    enrollments = relationship("CourseEnrollment", back_populates="course", cascade="all, delete-orphan")
    module_progress = relationship("CourseModuleProgress", back_populates="course", cascade="all, delete-orphan")
    certificates = relationship("Certificate", back_populates="course")

class CourseEnrollment(Base):
    """Authoritative server-side LMS Course Enrollment (Phase 2 Task 2)"""
    __tablename__ = "course_enrollments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(50), index=True, nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    
    enrollment_status = Column(String(30), default="Enrolled") # 'Enrolled', 'In Progress', 'Completed', 'Dropped'
    progress_percentage = Column(Float, default=0.0) # 0.0 - 100.0
    completed_modules = Column(Integer, default=0)
    total_modules = Column(Integer, default=5)
    
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    last_accessed_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "course_id", name="uq_user_course_enrollment"),
        Index("ix_enrollment_user_course", "user_id", "course_id"),
    )

    user = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")
    module_progress = relationship("CourseModuleProgress", back_populates="enrollment", cascade="all, delete-orphan")

class CourseModuleProgress(Base):
    """Granular module-level completion state tracked on server (Phase 2 Task 2 & 3)"""
    __tablename__ = "course_module_progress"
    id = Column(Integer, primary_key=True, index=True)
    enrollment_id = Column(Integer, ForeignKey("course_enrollments.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    module_id = Column(Integer, nullable=False) # 1, 2, 3, 4, 5
    module_title = Column(String(200), nullable=False)
    completed = Column(Boolean, default=False)
    score = Column(Float, default=100.0)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("enrollment_id", "module_id", name="uq_enrollment_module"),
        Index("ix_module_enrollment_mod", "enrollment_id", "module_id"),
    )

    enrollment = relationship("CourseEnrollment", back_populates="module_progress")
    user = relationship("User", back_populates="module_progress")
    course = relationship("Course", back_populates="module_progress")

# ----------------- CERTIFICATE & VERIFICATION MODELS -----------------

class Certificate(Base):
    __tablename__ = "certificates"
    id = Column(Integer, primary_key=True, index=True)
    certificate_no = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="SET NULL"), nullable=True, index=True)
    student_name = Column(String(100), nullable=False)
    course_title = Column(String(150), nullable=False)
    issue_date = Column(String(30), nullable=False)
    qr_data = Column(Text, nullable=True)
    grade = Column(String(10), default="A+")
    status = Column(String(20), default="Verified") # Verified, Revoked
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="certificates")
    course = relationship("Course", back_populates="certificates")

# ----------------- PLACEMENT & EMPLOYMENT MODELS -----------------

class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    employer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(150), nullable=False)
    company = Column(String(100), nullable=False)
    location = Column(String(100), default="New Delhi (Hybrid)")
    type = Column(String(50), default="Full-time") # Full-time, Internship, Cooperative Apprentice
    salary = Column(String(50), default="₹6.5 - 9.0 LPA")
    required_skills = Column(Text, default="Python, OpenCV, Computer Vision, FastAPI")
    description = Column(Text)
    openings = Column(Integer, default=3)
    deadline = Column(String(30), default="2026-11-30")
    logo = Column(String(255), default="https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=100")
    created_at = Column(DateTime, default=datetime.utcnow)

    employer = relationship("User", back_populates="posted_jobs")
    applications = relationship("JobApplication", back_populates="job", cascade="all, delete-orphan")

class JobApplication(Base):
    __tablename__ = "job_applications"
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    applicant_name = Column(String(100))
    match_score = Column(Integer, default=85)
    resume_note = Column(Text)
    status = Column(String(30), default="Shortlisted") # Applied, Shortlisted, Interviewed, Hired
    applied_at = Column(DateTime, default=datetime.utcnow)

    job = relationship("Job", back_populates="applications")
    user = relationship("User", back_populates="applications")

# ----------------- EARLY WARNING & RISK PREDICTION MODELS -----------------

class StudentAssessment(Base):
    __tablename__ = "student_assessments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(50), index=True)
    subject = Column(String(100), nullable=False)
    assessment_type = Column(String(50), default="Quiz")
    score = Column(Float, nullable=False)
    max_score = Column(Float, default=100.0)
    weight = Column(Float, default=1.0)
    date = Column(String(30))
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="assessments")

class StudentRiskPrediction(Base):
    __tablename__ = "student_risk_predictions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(50), index=True)
    student_name = Column(String(100), nullable=False)
    department = Column(String(100))
    semester = Column(String(50))
    
    risk_score = Column(Float, nullable=False)
    risk_level = Column(String(30), nullable=False)
    academic_risk = Column(Float, default=0.0)
    attendance_risk = Column(Float, default=0.0)
    completion_risk = Column(Float, default=0.0)
    skill_risk = Column(Float, default=0.0)
    placement_risk = Column(Float, default=0.0)

    attendance_pct = Column(Float, default=0.0)
    assessment_avg = Column(Float, default=0.0)
    course_completion_pct = Column(Float, default=0.0)
    learning_activity_score = Column(Float, default=0.0)
    placement_readiness_score = Column(Float, default=0.0)
    skills_count = Column(Integer, default=0)

    primary_factors_json = Column(Text, default="[]")
    explainability_json = Column(Text, default="{}")
    recommendations_json = Column(Text, default="[]")

    model_version = Column(String(50), default="v1.0-rf")
    is_preliminary = Column(Boolean, default=False)
    predicted_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="risk_predictions")
    interventions = relationship("StudentIntervention", back_populates="prediction")
    feedback = relationship("PredictionFeedback", back_populates="prediction", cascade="all, delete-orphan")

class MLModelMetadata(Base):
    __tablename__ = "ml_model_metadata"
    id = Column(Integer, primary_key=True, index=True)
    version_name = Column(String(50), unique=True, index=True)
    model_type = Column(String(50), default="RandomForestClassifier")
    accuracy = Column(Float, default=0.0)
    precision_score = Column(Float, default=0.0)
    recall_score = Column(Float, default=0.0)
    f1_score = Column(Float, default=0.0)
    roc_auc = Column(Float, default=0.0)
    cv_mean_f1 = Column(Float, default=0.0)
    cv_std_f1 = Column(Float, default=0.0)
    confusion_matrix_json = Column(Text, default="[]")
    classification_report_json = Column(Text, default="{}")
    feature_importances_json = Column(Text, default="{}")
    training_samples_count = Column(Integer, default=0)
    class_distribution_json = Column(Text, default="{}")
    trained_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

class StudentIntervention(Base):
    __tablename__ = "student_interventions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(50), index=True)
    student_name = Column(String(100), nullable=False)
    prediction_id = Column(Integer, ForeignKey("student_risk_predictions.id", ondelete="SET NULL"), nullable=True)
    
    risk_level = Column(String(30), default="Medium Risk")
    intervention_type = Column(String(50), default="Academic Counseling")
    title = Column(String(150), nullable=False)
    notes = Column(Text)
    action_taken = Column(Text)
    assigned_trainer_name = Column(String(100), default="Faculty Mentor")
    status = Column(String(30), default="Pending")
    follow_up_date = Column(String(30), nullable=True)
    outcome_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="interventions")
    prediction = relationship("StudentRiskPrediction", back_populates="interventions")

class PredictionFeedback(Base):
    __tablename__ = "prediction_feedback"
    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(Integer, ForeignKey("student_risk_predictions.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reviewer_name = Column(String(100), nullable=False)
    reviewer_role = Column(String(30), default="trainer")
    actual_risk_status = Column(String(50), default="Accurate Risk")
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    prediction = relationship("StudentRiskPrediction", back_populates="feedback")

class InstitutionConfig(Base):
    __tablename__ = "institution_config"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), default="Cooperative Skill Center (NCCT / VAMNICOM)")
    latitude = Column(Float, default=28.6139)
    longitude = Column(Float, default=77.2090)
    allowed_radius_meters = Column(Float, default=50.0)
    max_accuracy_threshold = Column(Float, default=100.0)
    enforce_geofence = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# ----------------- DB INITIALIZATION & CONTROLLED SEEDING -----------------

def init_db():
    Base.metadata.create_all(bind=engine)
    
    # SQLite automatic schema migration for new GPS & relationship columns
    try:
        with engine.connect() as conn:
            # Check existing columns in attendances
            result = conn.execute(text("PRAGMA table_info(attendances)")).fetchall()
            existing_cols = {row[1] for row in result}
            
            new_columns = [
                ("latitude", "FLOAT"),
                ("longitude", "FLOAT"),
                ("accuracy", "FLOAT"),
                ("distance", "FLOAT"),
                ("geofence_status", "VARCHAR(100) DEFAULT 'Verified (Within Radius)'"),
                ("device_info", "VARCHAR(200)"),
                ("session_id", "VARCHAR(100)"),
            ]
            for col_name, col_type in new_columns:
                if col_name not in existing_cols:
                    conn.execute(text(f"ALTER TABLE attendances ADD COLUMN {col_name} {col_type}"))

            # Check existing columns in certificates
            cert_cols = {row[1] for row in conn.execute(text("PRAGMA table_info(certificates)")).fetchall()}
            if "course_id" not in cert_cols:
                conn.execute(text("ALTER TABLE certificates ADD COLUMN course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL"))

            # Check existing columns in jobs
            job_cols = {row[1] for row in conn.execute(text("PRAGMA table_info(jobs)")).fetchall()}
            if "employer_id" not in job_cols:
                conn.execute(text("ALTER TABLE jobs ADD COLUMN employer_id INTEGER REFERENCES users(id) ON DELETE SET NULL"))

            conn.commit()
    except Exception as e:
        print(f"DB Migration Warning: {e}")

    # Seed initial InstitutionConfig if none exists
    db = SessionLocal()
    try:
        cfg = db.query(InstitutionConfig).first()
        if not cfg:
            default_cfg = InstitutionConfig(
                name="Cooperative Skill Center (NCCT / VAMNICOM)",
                latitude=28.6139,
                longitude=77.2090,
                allowed_radius_meters=50.0,
                max_accuracy_threshold=100.0,
                enforce_geofence=True
            )
            db.add(default_cfg)
            db.commit()

        # Controlled Idempotent Seeding for Courses & Jobs (Task 8)
        seed_catalog_if_empty(db)

    except Exception as e:
        print(f"Database init warning: {e}")
        db.rollback()
    finally:
        db.close()

def seed_catalog_if_empty(db):
    """Controlled, idempotent database seeding for courses and job vacancies (Task 8)"""
    # 1. Seed Core Courses if catalog is empty or has < 3
    if db.query(Course).count() < 3:
        initial_courses = [
            Course(
                title="Data Structures & Algorithms (DSA) in C++ / Java",
                category="Computer Engineering (Core)",
                trainer_name="Dr. Arvind Subramanian",
                duration="12 Weeks",
                modules_count=5,
                enrolled_count=185,
                description="Foundations and advanced problem-solving: Dynamic Programming, Graph Algorithms, Trees, Tries, Heaps, and LeetCode interview preparation.",
                thumbnail="https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=500",
                progress_percentage=0
            ),
            Course(
                title="Operating Systems & System Architecture",
                category="Computer Engineering (Core)",
                trainer_name="Prof. Rajesh Sharma",
                duration="10 Weeks",
                modules_count=5,
                enrolled_count=142,
                description="Deep dive into Process Scheduling, Virtual Memory, Deadlocks, File Systems, POSIX Multithreading, and Linux Kernel Internals.",
                thumbnail="https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=500",
                progress_percentage=0
            ),
            Course(
                title="Database Management Systems (DBMS) & Distributed SQL",
                category="Computer Engineering (Core)",
                trainer_name="Dr. Anita Verma",
                duration="8 Weeks",
                modules_count=5,
                enrolled_count=160,
                description="Relational schema design, ACID transactions, B-Tree indexing, query execution planning in PostgreSQL, and distributed NoSQL databases.",
                thumbnail="https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=500",
                progress_percentage=0
            ),
            Course(
                title="AI-Enabled Computer Vision & Face Biometrics",
                category="AI & Machine Learning",
                trainer_name="Prof. Rajesh Sharma",
                duration="8 Weeks",
                modules_count=5,
                enrolled_count=64,
                description="Hands-on mastery of OpenCV, LBPH recognizers, Anti-spoofing techniques, and production FastAPI microservices.",
                thumbnail="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500",
                progress_percentage=0
            ),
            Course(
                title="Digital Cooperative ERP & Financial Accounting",
                category="Cooperative Governance",
                trainer_name="Dr. Anita Verma",
                duration="6 Weeks",
                modules_count=5,
                enrolled_count=48,
                description="Comprehensive accounting, member share management, and capacity building for rural & urban cooperative societies.",
                thumbnail="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500",
                progress_percentage=0
            )
        ]
        for c in initial_courses:
            if not db.query(Course).filter(Course.title == c.title).first():
                db.add(c)
        db.commit()

    # 2. Seed Sample Cooperative Jobs if jobs table is empty
    if db.query(Job).count() == 0:
        employer_user = db.query(User).filter(User.role == "employer").first()
        emp_id = employer_user.id if employer_user else None

        initial_jobs = [
            Job(
                employer_id=emp_id,
                title="Junior AI Vision Engineer",
                company="AgriCoop Tech Solutions",
                location="New Delhi (Hybrid)",
                type="Full-time",
                salary="₹6.5 - 9.0 LPA",
                required_skills="Python, OpenCV, Computer Vision, FastAPI, Docker",
                description="Develop face recognition attendance, sorting camera vision, and cooperative automation models.",
                openings=3,
                deadline="2026-12-31",
                logo="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100"
            ),
            Job(
                employer_id=emp_id,
                title="Cooperative ERP Associate",
                company="National Cooperative Development Corp",
                location="Bhopal / Remote",
                type="Apprentice",
                salary="₹4.2 - 5.5 LPA",
                required_skills="Python, SQL, React, ERP Management",
                description="Maintain student rosters, assist with QR verification and digital certificate distribution across regional branches.",
                openings=5,
                deadline="2026-12-15",
                logo="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100"
            ),
            Job(
                employer_id=emp_id,
                title="Full-Stack Web & AI Intern",
                company="Sahakar FinTech Labs",
                location="Pune (On-site)",
                type="Internship",
                salary="₹25,000 / month",
                required_skills="React, TypeScript, FastAPI, Machine Learning",
                description="Build dynamic dashboards, student ERP portals, and mobile-friendly attendance scanner interfaces.",
                openings=4,
                deadline="2026-11-30",
                logo="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100"
            )
        ]
        db.add_all(initial_jobs)
        db.commit()
'''

with open(r'CoopSyncAI\backend\database.py', 'w', encoding='utf-8') as f:
    f.write(new_database_code)

print("Updated database.py with CourseEnrollment, CourseModuleProgress, SQLite PRAGMA, and seeding!")
