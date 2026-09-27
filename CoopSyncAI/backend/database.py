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

def init_db():
    Base.metadata.create_all(bind=engine)
