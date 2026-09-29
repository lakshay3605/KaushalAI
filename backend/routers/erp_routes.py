from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
import datetime
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Institute, Programme, Batch, Enrollment, Timetable, User, UserRole
from backend.auth import get_current_user, require_roles

router = APIRouter(prefix="/api/erp", tags=["Training ERP"])

class ProgrammeCreate(BaseModel):
    institute_id: int
    title: str
    code: str
    description: Optional[str] = None
    duration_weeks: int = 6

class BatchCreate(BaseModel):
    programme_id: int
    name: str
    start_date: datetime.datetime
    end_date: datetime.datetime
    max_capacity: int = 35
    trainer_id: Optional[int] = None

class EnrollRequest(BaseModel):
    batch_id: int

@router.get("/institutes")
def list_institutes(db: Session = Depends(get_db)):
    return db.query(Institute).all()

@router.get("/programmes")
def list_programmes(db: Session = Depends(get_db)):
    programmes = db.query(Programme).all()
    results = []
    for p in programmes:
        results.append({
            "id": p.id,
            "title": p.title,
            "code": p.code,
            "description": p.description,
            "duration_weeks": p.duration_weeks,
            "institute_name": p.institute.name if p.institute else "NCCT",
            "batches_count": len(p.batches)
        })
    return results

@router.post("/programmes")
def create_programme(
    req: ProgrammeCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.INSTITUTE_ADMIN, UserRole.SUPER_ADMIN]))
):
    prog = Programme(
        institute_id=req.institute_id,
        title=req.title,
        code=req.code,
        description=req.description,
        duration_weeks=req.duration_weeks
    )
    db.add(prog)
    db.commit()
    db.refresh(prog)
    return prog

@router.get("/batches")
def list_batches(programme_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Batch)
    if programme_id:
        query = query.filter(Batch.programme_id == programme_id)
    batches = query.all()
    results = []
    for b in batches:
        trainer = db.query(User).filter(User.id == b.trainer_id).first() if b.trainer_id else None
        results.append({
            "id": b.id,
            "name": b.name,
            "programme_id": b.programme_id,
            "programme_title": b.programme.title if b.programme else "",
            "start_date": b.start_date.isoformat(),
            "end_date": b.end_date.isoformat(),
            "max_capacity": b.max_capacity,
            "enrolled_count": len(b.enrollments),
            "status": b.status,
            "trainer_name": trainer.full_name if trainer else "Unassigned"
        })
    return results

@router.post("/batches")
def create_batch(
    req: BatchCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.INSTITUTE_ADMIN, UserRole.SUPER_ADMIN, UserRole.TRAINER]))
):
    batch = Batch(
        programme_id=req.programme_id,
        name=req.name,
        start_date=req.start_date,
        end_date=req.end_date,
        max_capacity=req.max_capacity,
        trainer_id=req.trainer_id
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch

@router.get("/batches/{batch_id}/timetable")
def get_batch_timetable(batch_id: int, db: Session = Depends(get_db)):
    items = db.query(Timetable).filter(Timetable.batch_id == batch_id).all()
    return items

@router.post("/enroll")
def enroll_trainee(
    req: EnrollRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    batch = db.query(Batch).filter(Batch.id == req.batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    existing = db.query(Enrollment).filter(
        Enrollment.trainee_id == current_user.id,
        Enrollment.batch_id == req.batch_id
    ).first()

    if existing:
        return {"message": "Already enrolled in this batch", "enrollment_id": existing.id, "status": existing.status}

    enrollment = Enrollment(
        trainee_id=current_user.id,
        batch_id=batch.id,
        status="ACTIVE"
    )
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return {"message": "Enrollment successful", "enrollment_id": enrollment.id, "status": "ACTIVE"}

@router.get("/my-enrollments")
def get_my_enrollments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    enrollments = db.query(Enrollment).filter(Enrollment.trainee_id == current_user.id).all()
    results = []
    for e in enrollments:
        b = e.batch
        p = b.programme if b else None
        results.append({
            "enrollment_id": e.id,
            "status": e.status,
            "enrolled_at": e.enrolled_at.isoformat(),
            "batch_id": b.id if b else None,
            "batch_name": b.name if b else "",
            "programme_id": p.id if p else None,
            "programme_title": p.title if p else "",
            "programme_code": p.code if p else "",
            "duration_weeks": p.duration_weeks if p else 6
        })
    return results
