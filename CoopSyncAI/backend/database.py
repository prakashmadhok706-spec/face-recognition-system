import os
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
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

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Models
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(50), unique=True, index=True, nullable=True) # e.g. 5025088
    roll_number = Column(String(50), nullable=True) # e.g. 2400300100305
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(200), nullable=False)
    role = Column(String(20), default="student") # student, trainer, admin, employer
    department = Column(String(50), default="Computer Science & Engineering")
    semester = Column(String(20), default="5th Semester")
    degree = Column(String(50), default="B.Tech")
    gender = Column(String(20), default="Male")
    skills = Column(Text, default="Python, OpenCV, Machine Learning, React")
    avatar = Column(String(255), default="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150")
    created_at = Column(DateTime, default=datetime.utcnow)

    attendances = relationship("Attendance", back_populates="user")
    certificates = relationship("Certificate", back_populates="user")
    applications = relationship("JobApplication", back_populates="user")

class Attendance(Base):
    __tablename__ = "attendances"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    student_id = Column(String(50), index=True)
    student_name = Column(String(100))
    date = Column(String(20), index=True) # YYYY-MM-DD
    time = Column(String(20)) # HH:MM:SS
    method = Column(String(20)) # 'Face Recognition' or 'QR Verification' or 'Offline Sync'
    confidence = Column(Float, default=95.0)
    liveness_verified = Column(Boolean, default=True)
    status = Column(String(20), default="Present") # Present, Late
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
    modules_count = Column(Integer, default=12)
    enrolled_count = Column(Integer, default=45)
    description = Column(Text)
    thumbnail = Column(String(255), default="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500")
    youtube_url = Column(String(255), default="https://www.youtube.com/watch?v=8hly31xKli0")
    progress_percentage = Column(Integer, default=75)
    created_at = Column(DateTime, default=datetime.utcnow)

class Certificate(Base):
    __tablename__ = "certificates"
    id = Column(Integer, primary_key=True, index=True)
    certificate_no = Column(String(50), unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    student_name = Column(String(100))
    course_title = Column(String(150))
    issue_date = Column(String(30))
    qr_data = Column(Text)
    grade = Column(String(10), default="A+")
    status = Column(String(20), default="Verified")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="certificates")

class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
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

    applications = relationship("JobApplication", back_populates="job")

class JobApplication(Base):
    __tablename__ = "job_applications"
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    applicant_name = Column(String(100))
    match_score = Column(Integer, default=85)
    resume_note = Column(Text)
    status = Column(String(30), default="Shortlisted") # Applied, Shortlisted, Interviewed, Hired
    applied_at = Column(DateTime, default=datetime.utcnow)

    job = relationship("Job", back_populates="applications")
    user = relationship("User", back_populates="applications")

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

def init_db():
    Base.metadata.create_all(bind=engine)
    
    # SQLite automatic schema migration for new GPS columns
    try:
        from sqlalchemy import text
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
