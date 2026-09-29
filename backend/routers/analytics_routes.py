from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.database import get_db
from backend.models import (
    User, UserRole, Programme, Batch, Enrollment, AttendanceRecord,
    Course, LessonProgress, QuizAttempt, Certificate, Job, JobApplication, Device
)
from backend.auth import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["Real System Analytics"])

@router.get("/dashboard")
def get_dashboard_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Computes live aggregated metrics directly from database tables."""
    total_trainees = db.query(func.count(User.id)).filter(User.role == UserRole.TRAINEE).scalar() or 0
    total_trainers = db.query(func.count(User.id)).filter(User.role == UserRole.TRAINER).scalar() or 0
    total_programmes = db.query(func.count(Programme.id)).scalar() or 0
    total_batches = db.query(func.count(Batch.id)).scalar() or 0
    total_courses = db.query(func.count(Course.id)).scalar() or 0
    total_attendance_events = db.query(func.count(AttendanceRecord.id)).scalar() or 0
    total_certificates = db.query(func.count(Certificate.id)).filter(Certificate.revoked == False).scalar() or 0
    total_jobs = db.query(func.count(Job.id)).filter(Job.status == "OPEN").scalar() or 0
    total_applications = db.query(func.count(JobApplication.id)).scalar() or 0
    shortlisted_applications = db.query(func.count(JobApplication.id)).filter(
        JobApplication.status.in_(["SHORTLISTED", "OFFERED"])
    ).scalar() or 0

    online_devices = db.query(func.count(Device.id)).filter(Device.status == "ONLINE").scalar() or 0
    total_devices = db.query(func.count(Device.id)).scalar() or 0

    # Pass rate
    total_attempts = db.query(func.count(QuizAttempt.id)).scalar() or 0
    passed_attempts = db.query(func.count(QuizAttempt.id)).filter(QuizAttempt.passed == True).scalar() or 0
    pass_rate = round((passed_attempts / total_attempts * 100), 1) if total_attempts > 0 else 0.0

    # Placement rate
    placement_rate = round((shortlisted_applications / total_applications * 100), 1) if total_applications > 0 else 0.0

    # Trainee-specific personal stats if role is TRAINEE
    trainee_stats = None
    if current_user.role == UserRole.TRAINEE:
        my_attendance = db.query(func.count(AttendanceRecord.id)).filter(AttendanceRecord.trainee_id == current_user.id).scalar() or 0
        my_completed_lessons = db.query(func.count(LessonProgress.id)).filter(
            LessonProgress.trainee_id == current_user.id,
            LessonProgress.completed == True
        ).scalar() or 0
        my_certificates = db.query(func.count(Certificate.id)).filter(Certificate.trainee_id == current_user.id).scalar() or 0
        my_applications = db.query(func.count(JobApplication.id)).filter(JobApplication.trainee_id == current_user.id).scalar() or 0

        trainee_stats = {
            "attendance_sessions": my_attendance,
            "completed_lessons": my_completed_lessons,
            "certificates_earned": my_certificates,
            "jobs_applied": my_applications
        }

    return {
        "overview": {
            "total_trainees": total_trainees,
            "total_trainers": total_trainers,
            "total_programmes": total_programmes,
            "active_batches": total_batches,
            "total_courses": total_courses,
            "attendance_events_logged": total_attendance_events,
            "certificates_issued": total_certificates,
            "assessment_pass_rate": pass_rate,
            "open_pacs_positions": total_jobs,
            "applications_submitted": total_applications,
            "placement_conversion_rate": placement_rate,
            "hardware_kiosks_online": f"{online_devices}/{total_devices}"
        },
        "trainee_personal": trainee_stats,
        "role": current_user.role.value
    }
