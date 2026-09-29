import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
import enum
from backend.database import Base

class UserRole(str, enum.Enum):
    TRAINEE = "TRAINEE"
    TRAINER = "TRAINER"
    INSTITUTE_ADMIN = "INSTITUTE_ADMIN"
    RECRUITER = "RECRUITER"
    SUPER_ADMIN = "SUPER_ADMIN"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.TRAINEE, nullable=False)
    phone = Column(String(50), nullable=True)
    location = Column(String(255), nullable=True, default="Rampur, Uttar Pradesh")
    institute_id = Column(Integer, ForeignKey("institutes.id"), nullable=True)
    pacs_name = Column(String(255), nullable=True, default="PACS Rampur Cooperative")
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    institute = relationship("Institute", back_populates="users")
    enrollments = relationship("Enrollment", back_populates="trainee")
    attendance_records = relationship("AttendanceRecord", back_populates="trainee")
    lesson_progresses = relationship("LessonProgress", back_populates="trainee")
    quiz_attempts = relationship("QuizAttempt", back_populates="trainee")
    certificates = relationship("Certificate", back_populates="trainee")
    skills = relationship("TraineeSkill", back_populates="trainee")
    job_applications = relationship("JobApplication", back_populates="trainee")
    posted_jobs = relationship("Job", back_populates="employer")

class Institute(Base):
    __tablename__ = "institutes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    contact_email = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    users = relationship("User", back_populates="institute")
    programmes = relationship("Programme", back_populates="institute")
    devices = relationship("Device", back_populates="institute")

class Programme(Base):
    __tablename__ = "programmes"

    id = Column(Integer, primary_key=True, index=True)
    institute_id = Column(Integer, ForeignKey("institutes.id"), nullable=False)
    title = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    duration_weeks = Column(Integer, default=6)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    institute = relationship("Institute", back_populates="programmes")
    batches = relationship("Batch", back_populates="programme")
    courses = relationship("Course", back_populates="programme")

class Batch(Base):
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True)
    programme_id = Column(Integer, ForeignKey("programmes.id"), nullable=False)
    name = Column(String(100), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    max_capacity = Column(Integer, default=40)
    trainer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String(50), default="IN_PROGRESS") # UPCOMING, IN_PROGRESS, COMPLETED

    programme = relationship("Programme", back_populates="batches")
    enrollments = relationship("Enrollment", back_populates="batch")
    timetables = relationship("Timetable", back_populates="batch")

class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    trainee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    status = Column(String(50), default="ACTIVE") # ACTIVE, COMPLETED, DROPPED
    enrolled_at = Column(DateTime, default=datetime.datetime.utcnow)
    completion_date = Column(DateTime, nullable=True)

    trainee = relationship("User", back_populates="enrollments")
    batch = relationship("Batch", back_populates="enrollments")

class Timetable(Base):
    __tablename__ = "timetables"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    day_of_week = Column(String(20), nullable=False) # Monday, Tuesday...
    start_time = Column(String(10), nullable=False) # "09:30"
    end_time = Column(String(10), nullable=False) # "12:30"
    subject = Column(String(255), nullable=False)
    room = Column(String(50), default="Smart Lab 1")

    batch = relationship("Batch", back_populates="timetables")

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    programme_id = Column(Integer, ForeignKey("programmes.id"), nullable=False)
    title = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    thumbnail = Column(String(500), nullable=True)
    total_lessons = Column(Integer, default=5)
    category = Column(String(100), default="PACS Accounting & ERP")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    programme = relationship("Programme", back_populates="courses")
    modules = relationship("Module", back_populates="course")
    quizzes = relationship("Quiz", back_populates="course")
    certificates = relationship("Certificate", back_populates="course")

class Module(Base):
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String(255), nullable=False)
    order = Column(Integer, default=1)

    course = relationship("Course", back_populates="modules")
    lessons = relationship("Lesson", back_populates="module")

class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)
    title = Column(String(255), nullable=False)
    order = Column(Integer, default=1)
    duration_minutes = Column(Integer, default=15)
    content_text = Column(Text, nullable=False)
    summary_hi = Column(Text, nullable=True)
    audio_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    module = relationship("Module", back_populates="lessons")
    progresses = relationship("LessonProgress", back_populates="lesson")

class LessonProgress(Base):
    __tablename__ = "lesson_progress"

    id = Column(Integer, primary_key=True, index=True)
    trainee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)

    trainee = relationship("User", back_populates="lesson_progresses")
    lesson = relationship("Lesson", back_populates="progresses")

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String(255), nullable=False)
    passing_score = Column(Integer, default=70) # 70%

    course = relationship("Course", back_populates="quizzes")
    questions = relationship("QuizQuestion", back_populates="quiz")
    attempts = relationship("QuizAttempt", back_populates="quiz")

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    options_json = Column(Text, nullable=False) # JSON list of string options
    correct_answer_index = Column(Integer, nullable=False)
    explanation = Column(Text, nullable=True)

    quiz = relationship("Quiz", back_populates="questions")

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    trainee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    score = Column(Float, nullable=False) # e.g. 85.0
    passed = Column(Boolean, default=False)
    answers_json = Column(Text, nullable=True)
    attempted_at = Column(DateTime, default=datetime.datetime.utcnow)

    quiz = relationship("Quiz", back_populates="attempts")
    trainee = relationship("User", back_populates="quiz_attempts")

class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    certificate_id = Column(String(100), unique=True, index=True, nullable=False)
    trainee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    issue_date = Column(DateTime, default=datetime.datetime.utcnow)
    issuer_name = Column(String(255), default="National Council for Cooperative Training (NCCT)")
    grade = Column(String(10), default="A+")
    score = Column(Float, default=92.0)
    ed25519_signature = Column(Text, nullable=False)
    public_key_pem = Column(Text, nullable=False)
    verification_url = Column(String(500), nullable=False)
    metadata_json = Column(Text, nullable=True)
    revoked = Column(Boolean, default=False)

    trainee = relationship("User", back_populates="certificates")
    course = relationship("Course", back_populates="certificates")

class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    category = Column(String(100), default="Cooperative Management")

    trainee_skills = relationship("TraineeSkill", back_populates="skill")

class TraineeSkill(Base):
    __tablename__ = "trainee_skills"

    id = Column(Integer, primary_key=True, index=True)
    trainee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    proficiency_level = Column(Integer, default=3) # 1 to 5
    verified = Column(Boolean, default=True)
    verified_by_cert_id = Column(String(100), nullable=True)

    trainee = relationship("User", back_populates="skills")
    skill = relationship("Skill", back_populates="trainee_skills")

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    employer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    pacs_name = Column(String(255), nullable=False)
    title = Column(String(255), nullable=False)
    location = Column(String(255), nullable=False)
    salary_range = Column(String(100), default="₹22,000 - ₹35,000 / month")
    description = Column(Text, nullable=False)
    required_skills_json = Column(Text, nullable=False) # JSON list of skill names
    min_experience_years = Column(Float, default=0.0)
    status = Column(String(50), default="OPEN") # OPEN, CLOSED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    employer = relationship("User", back_populates="posted_jobs")
    applications = relationship("JobApplication", back_populates="job")

class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    trainee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    applied_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String(50), default="APPLIED") # APPLIED, SHORTLISTED, OFFERED, REJECTED
    match_score_json = Column(Text, nullable=True)

    job = relationship("Job", back_populates="applications")
    trainee = relationship("User", back_populates="job_applications")

class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    institute_id = Column(Integer, ForeignKey("institutes.id"), nullable=False)
    device_type = Column(String(50), default="KIOSK") # KIOSK, TABLET, ESP32
    location_room = Column(String(100), default="Main Entrance Kiosk")
    status = Column(String(50), default="ONLINE") # ONLINE, OFFLINE
    last_heartbeat = Column(DateTime, default=datetime.datetime.utcnow)

    institute = relationship("Institute", back_populates="devices")
    attendance_records = relationship("AttendanceRecord", back_populates="device")

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(100), unique=True, index=True, nullable=False) # Deduplication key!
    device_id = Column(String(100), ForeignKey("devices.device_id"), nullable=False)
    trainee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=True)
    method = Column(String(50), nullable=False) # FACE, NFC, QR, SIMULATOR
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    location = Column(String(255), default="Rampur Smart Training Centre")
    signature = Column(String(255), nullable=True) # Hardware cryptographic signature / HMAC
    sync_status = Column(String(50), default="SYNCED") # SYNCED, PENDING
    verified = Column(Boolean, default=True)

    trainee = relationship("User", back_populates="attendance_records")
    device = relationship("Device", back_populates="attendance_records")
