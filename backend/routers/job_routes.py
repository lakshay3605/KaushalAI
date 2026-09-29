from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import datetime
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Job, JobApplication, User, UserRole, TraineeSkill, Certificate
from backend.auth import get_current_user, require_roles
from backend.matcher import ExplainableCandidateMatcher

router = APIRouter(prefix="/api/jobs", tags=["Cooperative Employment Exchange"])

class JobCreate(BaseModel):
    pacs_name: str
    title: str
    location: str
    salary_range: str = "₹22,000 - ₹32,000 / month"
    description: str
    required_skills: List[str]
    min_experience_years: float = 0.5

class StatusUpdateRequest(BaseModel):
    status: str # APPLIED, SHORTLISTED, OFFERED, REJECTED

@router.get("")
def list_jobs(
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    jobs = db.query(Job).filter(Job.status == "OPEN").order_by(Job.created_at.desc()).all()
    results = []

    # Get trainee skills if trainee
    trainee_skill_names = []
    has_cert = False
    if current_user and current_user.role == UserRole.TRAINEE:
        t_skills = db.query(TraineeSkill).filter(TraineeSkill.trainee_id == current_user.id).all()
        trainee_skill_names = [ts.skill.name for ts in t_skills if ts.skill]
        has_cert = db.query(Certificate).filter(Certificate.trainee_id == current_user.id).first() is not None

    # Get user's applied jobs
    applied_job_ids = set()
    if current_user:
        apps = db.query(JobApplication).filter(JobApplication.trainee_id == current_user.id).all()
        applied_job_ids = {a.job_id for a in apps}

    for j in jobs:
        req_skills = json.loads(j.required_skills_json) if j.required_skills_json else []
        match_info = None

        if current_user and current_user.role == UserRole.TRAINEE:
            match_info = ExplainableCandidateMatcher.calculate_match(
                candidate_skills=trainee_skill_names,
                required_skills=req_skills,
                has_certificate=has_cert,
                candidate_location=current_user.location,
                job_location=j.location,
                candidate_experience_years=1.0,
                required_experience_years=j.min_experience_years
            )

        results.append({
            "id": j.id,
            "pacs_name": j.pacs_name,
            "title": j.title,
            "location": j.location,
            "salary_range": j.salary_range,
            "description": j.description,
            "required_skills": req_skills,
            "min_experience_years": j.min_experience_years,
            "created_at": j.created_at.strftime("%d %b %Y"),
            "is_applied": j.id in applied_job_ids,
            "match": match_info
        })
    return results

@router.post("")
def create_job(
    req: JobCreate,
    current_user: User = Depends(require_roles([UserRole.RECRUITER, UserRole.INSTITUTE_ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    job = Job(
        employer_id=current_user.id,
        pacs_name=req.pacs_name or current_user.pacs_name,
        title=req.title,
        location=req.location,
        salary_range=req.salary_range,
        description=req.description,
        required_skills_json=json.dumps(req.required_skills),
        min_experience_years=req.min_experience_years,
        status="OPEN"
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job

@router.get("/{job_id}/candidates")
def get_job_candidates(
    job_id: int,
    current_user: User = Depends(require_roles([UserRole.RECRUITER, UserRole.INSTITUTE_ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    required_skills = json.loads(job.required_skills_json) if job.required_skills_json else []

    # Query all trainees
    trainees = db.query(User).filter(User.role == UserRole.TRAINEE).all()
    candidates = []

    for t in trainees:
        t_skills = db.query(TraineeSkill).filter(TraineeSkill.trainee_id == t.id).all()
        skill_names = [ts.skill.name for ts in t_skills if ts.skill]
        cert = db.query(Certificate).filter(Certificate.trainee_id == t.id).first()

        match_score = ExplainableCandidateMatcher.calculate_match(
            candidate_skills=skill_names,
            required_skills=required_skills,
            has_certificate=cert is not None,
            candidate_location=t.location,
            job_location=job.location,
            candidate_experience_years=1.0,
            required_experience_years=job.min_experience_years
        )

        # Check existing application
        app = db.query(JobApplication).filter(
            JobApplication.job_id == job.id,
            JobApplication.trainee_id == t.id
        ).first()

        candidates.append({
            "trainee_id": t.id,
            "full_name": t.full_name,
            "email": t.email,
            "phone": t.phone,
            "location": t.location,
            "skills": skill_names,
            "has_certificate": cert is not None,
            "certificate_id": cert.certificate_id if cert else None,
            "match": match_score,
            "application_status": app.status if app else "NOT_APPLIED",
            "application_id": app.id if app else None
        })

    # Sort deterministically by overall match descending
    candidates.sort(key=lambda x: x["match"]["overall_match"], reverse=True)
    return {
        "job": {
            "id": job.id,
            "title": job.title,
            "pacs_name": job.pacs_name,
            "required_skills": required_skills
        },
        "candidates": candidates
    }

@router.post("/{job_id}/apply")
def apply_to_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    existing = db.query(JobApplication).filter(
        JobApplication.job_id == job_id,
        JobApplication.trainee_id == current_user.id
    ).first()

    if existing:
        return {"message": "Already applied to this PACS position", "application_id": existing.id, "status": existing.status}

    t_skills = db.query(TraineeSkill).filter(TraineeSkill.trainee_id == current_user.id).all()
    skill_names = [ts.skill.name for ts in t_skills if ts.skill]
    cert = db.query(Certificate).filter(Certificate.trainee_id == current_user.id).first()
    required_skills = json.loads(job.required_skills_json) if job.required_skills_json else []

    match_score = ExplainableCandidateMatcher.calculate_match(
        candidate_skills=skill_names,
        required_skills=required_skills,
        has_certificate=cert is not None,
        candidate_location=current_user.location,
        job_location=job.location,
        candidate_experience_years=1.0,
        required_experience_years=job.min_experience_years
    )

    app = JobApplication(
        job_id=job.id,
        trainee_id=current_user.id,
        status="APPLIED",
        match_score_json=json.dumps(match_score),
        applied_at=datetime.datetime.utcnow()
    )
    db.add(app)
    db.commit()
    db.refresh(app)

    return {
        "message": "Application submitted successfully to PACS recruiter",
        "application_id": app.id,
        "status": "APPLIED",
        "match": match_score
    }

@router.get("/my-applications")
def get_my_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    apps = db.query(JobApplication).filter(JobApplication.trainee_id == current_user.id).all()
    results = []
    for a in apps:
        j = a.job
        match_data = json.loads(a.match_score_json) if a.match_score_json else {}
        results.append({
            "application_id": a.id,
            "job_id": j.id if j else None,
            "job_title": j.title if j else "Cooperative Role",
            "pacs_name": j.pacs_name if j else "",
            "location": j.location if j else "",
            "salary_range": j.salary_range if j else "",
            "status": a.status,
            "applied_at": a.applied_at.strftime("%d %b %Y"),
            "match": match_data
        })
    return results

@router.get("/recruiter/applications")
def get_recruiter_applications(
    current_user: User = Depends(require_roles([UserRole.RECRUITER, UserRole.INSTITUTE_ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    apps = db.query(JobApplication).order_by(JobApplication.applied_at.desc()).all()
    results = []
    for a in apps:
        j = a.job
        t = a.trainee
        match_data = json.loads(a.match_score_json) if a.match_score_json else {}
        results.append({
            "application_id": a.id,
            "job_id": j.id if j else None,
            "job_title": j.title if j else "",
            "pacs_name": j.pacs_name if j else "",
            "trainee_id": t.id if t else None,
            "trainee_name": t.full_name if t else "Trainee",
            "trainee_email": t.email if t else "",
            "trainee_phone": t.phone if t else "",
            "trainee_location": t.location if t else "",
            "status": a.status,
            "applied_at": a.applied_at.strftime("%d %b %Y"),
            "match": match_data
        })
    return results

@router.post("/applications/{app_id}/status")
def update_application_status(
    app_id: int,
    req: StatusUpdateRequest,
    current_user: User = Depends(require_roles([UserRole.RECRUITER, UserRole.INSTITUTE_ADMIN, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    app = db.query(JobApplication).filter(JobApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    app.status = req.status
    db.commit()
    return {"message": "Application status updated", "application_id": app.id, "status": app.status}
