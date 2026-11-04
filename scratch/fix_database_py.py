import os

target = r"CoopSyncAI\backend\database.py"

content = '''import os
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, UniqueConstraint, Index, event
from sqlalchemy.engine import Engine
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
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

# SQLite Integrity and Concurrency PRAGMAs
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if "sqlite" in str(DATABASE_URL):
        cursor = dbapi_connection.cursor()
        try:
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA busy_timeout=5000")
        except Exception:
            pass
        finally:
            cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==================== CORE USER & IDENTITY MODELS ====================

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(50), unique=True, index=True, nullable=True) # e.g. 5025088
    roll_number = Column(String(50), nullable=True) # e.g. 2400300100305
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(200), nullable=False)
    role = Column(String(20), default="student") # student, trainer, admin, employer, ncct_admin
    department = Column(String(50), default="Computer Science & Engineering")
    semester = Column(String(20), default="5th Semester")
    degree = Column(String(50), default="B.Tech")
    gender = Column(String(20), default="Male")
    skills = Column(Text, default="Python, OpenCV, Machine Learning, React")
    avatar = Column(String(255), default="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships with strict cascade delete
    attendances = relationship("Attendance", back_populates="user", cascade="all, delete-orphan")
    certificates = relationship("Certificate", back_populates="user", cascade="all, delete-orphan")
    applications = relationship("JobApplication", back_populates="user", cascade="all, delete-orphan")
    assessments = relationship("StudentAssessment", back_populates="user", cascade="all, delete-orphan")
    risk_predictions = relationship("StudentRiskPrediction", back_populates="user", cascade="all, delete-orphan")
    interventions = relationship("StudentIntervention", back_populates="user", cascade="all, delete-orphan")
    enrollments = relationship("CourseEnrollment", back_populates="student", cascade="all, delete-orphan")
    posted_jobs = relationship("Job", back_populates="employer", foreign_keys="Job.employer_id")

class Attendance(Base):
    __tablename__ = "attendances"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(50), index=True)
    student_name = Column(String(100))
    date = Column(String(20), index=True) # YYYY-MM-DD
    time = Column(String(20)) # HH:MM:SS
    method = Column(String(50)) # 'Face Recognition' or 'QR Verification' or 'Offline Sync'
    confidence = Column(Float, default=95.0)
    liveness_verified = Column(Boolean, default=True)
    status = Column(String(50), default="Present") # Present, Late, Pending Verification (GPS Flagged)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    accuracy = Column(Float, nullable=True) # in meters
    distance = Column(Float, nullable=True) # distance from campus in meters
    geofence_status = Column(String(100), default="Verified (Within Radius)")
    device_info = Column(String(200), nullable=True)
    session_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="attendances")

class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    category = Column(String(50), default="AI & Computer Vision")
    trainer_name = Column(String(100), default="Prof. Rajesh Sharma")
    duration = Column(String(50), default="6 Weeks")
    modules_count = Column(Integer, default=5)
    enrolled_count = Column(Integer, default=45)
    description = Column(Text)
    thumbnail = Column(String(255), default="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500")
    youtube_url = Column(String(255), default="https://www.youtube.com/watch?v=8hly31xKli0")
    progress_percentage = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    enrollments = relationship("CourseEnrollment", back_populates="course", cascade="all, delete-orphan")
    certificates = relationship("Certificate", back_populates="course")

# ==================== LMS ENROLLMENT & MODULE PROGRESS ====================

class CourseEnrollment(Base):
    __tablename__ = "course_enrollments"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    enrollment_date = Column(DateTime, default=datetime.utcnow)
    enrollment_status = Column(String(30), default="Enrolled") # Enrolled, In Progress, Completed, Dropped
    progress_percentage = Column(Float, default=0.0)
    completed_modules = Column(Integer, default=0)
    total_modules = Column(Integer, default=5)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    last_accessed_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("student_id", "course_id", name="uq_student_course_enrollment"),
        Index("idx_student_enrollment_status", "student_id", "enrollment_status"),
    )

    student = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")
    module_progresses = relationship("CourseModuleProgress", back_populates="enrollment", cascade="all, delete-orphan")

class CourseModuleProgress(Base):
    __tablename__ = "course_module_progress"
    id = Column(Integer, primary_key=True, index=True)
    enrollment_id = Column(Integer, ForeignKey("course_enrollments.id", ondelete="CASCADE"), nullable=False, index=True)
    module_id = Column(Integer, nullable=False) # 1, 2, 3, 4, 5
    module_title = Column(String(255), nullable=False)
    is_completed = Column(Boolean, default=False)
    score = Column(Float, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    time_spent_minutes = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("enrollment_id", "module_id", name="uq_enrollment_module"),
    )

    enrollment = relationship("CourseEnrollment", back_populates="module_progresses")

# ==================== CERTIFICATES & CREDENTIALS ====================

class Certificate(Base):
    __tablename__ = "certificates"
    id = Column(Integer, primary_key=True, index=True)
    certificate_no = Column(String(50), unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="SET NULL"), nullable=True, index=True)
    student_name = Column(String(100))
    course_title = Column(String(150))
    issue_date = Column(String(30))
    qr_data = Column(Text, nullable=True)
    grade = Column(String(10), default="A+")
    status = Column(String(20), default="Valid") # Valid, Revoked
    revoked_at = Column(DateTime, nullable=True)
    revoked_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="certificates")
    course = relationship("Course", back_populates="certificates")

# ==================== PLACEMENT & EMPLOYMENT PORTAL ====================

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
    deadline = Column(String(30), default="2026-10-30")
    logo = Column(String(255), default="https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=100")
    created_at = Column(DateTime, default=datetime.utcnow)

    employer = relationship("User", back_populates="posted_jobs", foreign_keys=[employer_id])
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

# ==================== EARLY WARNING & RISK PREDICTION MODELS ====================

class StudentAssessment(Base):
    __tablename__ = "student_assessments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(50), index=True)
    subject = Column(String(100), nullable=False) # e.g. DSA, DBMS, OS, Networks
    assessment_type = Column(String(50), default="Quiz") # Quiz, Midterm, Lab, Assignment, Final
    score = Column(Float, nullable=False) # 0.0 - 100.0
    max_score = Column(Float, default=100.0)
    weight = Column(Float, default=1.0)
    date = Column(String(30)) # YYYY-MM-DD
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="assessments")

class StudentRiskPrediction(Base):
    __tablename__ = "student_risk_predictions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(50), index=True)
    student_name = Column(String(100), nullable=False)
    department = Column(String(50), default="Computer Science & Engineering")
    semester = Column(String(20), default="5th Semester")
    risk_score = Column(Float, nullable=False) # 0 - 100
    risk_level = Column(String(20), default="Low Risk") # Low Risk, Medium Risk, High Risk, Critical Dropout Risk
    academic_risk = Column(Float, default=0.0)
    attendance_risk = Column(Float, default=0.0)
    completion_risk = Column(Float, default=0.0)
    skill_risk = Column(Float, default=0.0)
    placement_risk = Column(Float, default=0.0)
    attendance_pct = Column(Float, default=85.0)
    assessment_avg = Column(Float, default=78.0)
    course_completion_pct = Column(Float, default=65.0)
    learning_activity_score = Column(Float, default=80.0)
    placement_readiness_score = Column(Float, default=70.0)
    skills_count = Column(Integer, default=4)
    primary_factors_json = Column(Text, default="[]") # JSON list of top contributing risk factors
    explainability_json = Column(Text, default="{}") # Feature importances & radar metrics
    recommendations_json = Column(Text, default="[]") # Actionable recommendations
    model_version = Column(String(50), default="v1.0-rf-ensemble")
    is_preliminary = Column(Boolean, default=False)
    predicted_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="risk_predictions")
    interventions = relationship("StudentIntervention", back_populates="prediction", cascade="all, delete-orphan")
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
    intervention_type = Column(String(50), default="Academic Counseling") # Remedial Class, Peer Mentoring, Attendance Warning, etc.
    title = Column(String(150), nullable=False)
    notes = Column(Text)
    action_taken = Column(Text)
    assigned_trainer_name = Column(String(100), default="Faculty Mentor")
    status = Column(String(30), default="Pending") # Pending, In Progress, Completed, Escalated
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
    reviewer_role = Column(String(30), default="trainer") # trainer, admin
    actual_risk_status = Column(String(50), default="Accurate Risk") # 'Accurate Risk', 'False Alarm / Overestimated', 'Underestimated Risk'
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    prediction = relationship("StudentRiskPrediction", back_populates="feedback")

class InstitutionConfig(Base):
    __tablename__ = "institution_config"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), default="Cooperative Skill Center (NCCT / VAMNICOM)")
    latitude = Column(Float, default=28.6139) # default campus latitude
    longitude = Column(Float, default=77.2090) # default campus longitude
    allowed_radius_meters = Column(Float, default=50.0) # 50 meters geofence radius
    max_accuracy_threshold = Column(Float, default=100.0) # max allowed GPS accuracy (meters)
    enforce_geofence = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# ==================== IDEMPOTENT CATALOG SEEDING ====================

def seed_catalog_if_empty():
    db = SessionLocal()
    try:
        # Seed Courses if empty
        if db.query(Course).count() == 0:
            initial_courses = [
                Course(
                    title="Cooperative Management & Governance",
                    category="Governance & Law",
                    trainer_name="Dr. Arvind V. Sharma",
                    duration="6 Weeks",
                    modules_count=5,
                    enrolled_count=32,
                    description="Comprehensive study of cooperative society frameworks, MSCS Act 2002, democratic decision-making, and financial audit accountability.",
                    thumbnail="https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600",
                    youtube_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                ),
                Course(
                    title="Computer Vision & Biometric Systems",
                    category="AI & Edge Computing",
                    trainer_name="Prof. Rajesh Sharma",
                    duration="8 Weeks",
                    modules_count=5,
                    enrolled_count=48,
                    description="Practical computer vision pipeline covering OpenCV Haar Cascades, LBPH texture analysis, Laplacian anti-spoofing and edge deployment.",
                    thumbnail="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600",
                    youtube_url="https://www.youtube.com/watch?v=8hly31xKli0"
                ),
                Course(
                    title="Agri-Cooperative Supply Chain & IoT",
                    category="Logistics & AgTech",
                    trainer_name="Er. Priya Patel",
                    duration="6 Weeks",
                    modules_count=5,
                    enrolled_count=27,
                    description="IoT sensors, automated milk collection systems, cold storage tracking, and decentralized cooperative logistics.",
                    thumbnail="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600",
                    youtube_url="https://www.youtube.com/watch?v=0hly31xKli0"
                )
            ]
            db.add_all(initial_courses)
            db.commit()

        # Seed Jobs if none exist
        if db.query(Job).count() == 0:
            employer = db.query(User).filter(User.role == "employer").first()
            emp_id = employer.id if employer else None
            initial_jobs = [
                Job(
                    employer_id=emp_id,
                    title="Computer Vision & AI Engineer",
                    company="National Cooperative Development Corporation (NCDC)",
                    location="New Delhi (Hybrid)",
                    type="Full-time",
                    salary="₹8.0 - 12.0 LPA",
                    required_skills="Python, OpenCV, PyTorch, FastAPI, Computer Vision",
                    description="Develop edge biometric authentication and automated sorting systems for agricultural cooperatives.",
                    openings=2,
                    deadline="2026-12-31",
                    logo="https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=100"
                ),
                Job(
                    employer_id=emp_id,
                    title="Cooperative Operations & ERP Analyst",
                    company="AMUL / Gujarat Cooperative Milk Marketing Fed",
                    location="Anand, Gujarat",
                    type="Full-time",
                    salary="₹6.5 - 9.5 LPA",
                    required_skills="PostgreSQL, SQLAlchemy, Business Intelligence, ERP Systems",
                    description="Manage cooperative supply chain databases, member analytics, and digital attendance compliance.",
                    openings=4,
                    deadline="2026-11-30",
                    logo="https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100"
                ),
                Job(
                    employer_id=emp_id,
                    title="IoT Edge Solutions Apprentice",
                    company="IFFCO Smart AgTech Division",
                    location="Gurugram (On-site)",
                    type="Cooperative Apprentice",
                    salary="₹30,000 / month stipend",
                    required_skills="Embedded C, Python, MQTT, Sensors, IoT",
                    description="Deploy GPS and telemetry gateways for cooperative warehouses and cold chain distribution centers.",
                    openings=5,
                    deadline="2026-12-15",
                    logo="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100"
                )
            ]
            db.add_all(initial_jobs)
            db.commit()
    except Exception as e:
        print(f"Catalog seeding warning: {e}")
        db.rollback()
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
    
    # SQLite automatic schema migration for columns
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            # Attendances columns
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

            # Certificates columns
            res_cert = conn.execute(text("PRAGMA table_info(certificates)")).fetchall()
            cert_cols = {row[1] for row in res_cert}
            cert_new_cols = [
                ("course_id", "INTEGER"),
                ("revoked_at", "DATETIME"),
                ("revoked_reason", "VARCHAR(255)")
            ]
            for col_name, col_type in cert_new_cols:
                if col_name not in cert_cols:
                    conn.execute(text(f"ALTER TABLE certificates ADD COLUMN {col_name} {col_type}"))

            # Jobs columns
            res_jobs = conn.execute(text("PRAGMA table_info(jobs)")).fetchall()
            jobs_cols = {row[1] for row in res_jobs}
            if "employer_id" not in jobs_cols:
                conn.execute(text("ALTER TABLE jobs ADD COLUMN employer_id INTEGER"))

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
    except Exception as e:
        print(f"InstitutionConfig seed warning: {e}")
        db.rollback()
    finally:
        db.close()

    # Seed courses and jobs if empty
    seed_catalog_if_empty()
'''

with open(target, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated database.py restoring exact risk models while keeping Phase 2 LMS & PRAGMA enhancements.")

