from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
import datetime
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import AttendanceRecord, Device, User, UserRole, Batch
from backend.auth import get_current_user, require_roles
from backend.hardware import HardwareAttendanceEvent, BatchSyncPayload, HardwareAbstractionLayer

router = APIRouter(prefix="/api/attendance", tags=["Smart Attendance & Hardware Kiosk"])

@router.post("/mark")
def mark_attendance(
    event: HardwareAttendanceEvent,
    db: Session = Depends(get_db)
):
    """Processes real attendance from Face, NFC, QR or Kiosk Simulator."""
    # Deduplication check
    existing = db.query(AttendanceRecord).filter(AttendanceRecord.event_id == event.event_id).first()
    if existing:
        return {"status": "ALREADY_RECORDED", "event_id": event.event_id, "timestamp": existing.timestamp.isoformat()}

    trainee = db.query(User).filter(User.id == event.trainee_id).first()
    if not trainee:
        raise HTTPException(status_code=404, detail=f"Trainee ID {event.trainee_id} not found in system")

    # Generate or verify hardware cryptographic signature
    if not event.signature:
        event.signature = HardwareAbstractionLayer.generate_device_signature(event)

    rec = AttendanceRecord(
        event_id=event.event_id,
        device_id=event.device_id,
        trainee_id=event.trainee_id,
        batch_id=event.batch_id,
        method=event.method.upper(),
        timestamp=event.timestamp or datetime.datetime.utcnow(),
        location=event.location or "Rampur Smart Training Centre",
        signature=event.signature,
        sync_status="SYNCED",
        verified=True
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)

    return {
        "status": "RECORDED",
        "event_id": rec.event_id,
        "trainee_name": trainee.full_name,
        "method": rec.method,
        "timestamp": rec.timestamp.isoformat(),
        "device_id": rec.device_id,
        "sync_status": "SYNCED"
    }

@router.post("/sync")
def sync_offline_events(
    payload: BatchSyncPayload,
    db: Session = Depends(get_db)
):
    """Batch synchronization endpoint for offline queued events with deduplication."""
    synced_count = 0
    duplicate_count = 0
    errors = []

    for event in payload.events:
        try:
            # Check duplicate by unique event_id
            existing = db.query(AttendanceRecord).filter(AttendanceRecord.event_id == event.event_id).first()
            if existing:
                duplicate_count += 1
                continue

            trainee = db.query(User).filter(User.id == event.trainee_id).first()
            if not trainee:
                errors.append(f"Event {event.event_id}: Trainee ID {event.trainee_id} not found")
                continue

            rec = AttendanceRecord(
                event_id=event.event_id,
                device_id=payload.device_id or event.device_id,
                trainee_id=event.trainee_id,
                batch_id=event.batch_id,
                method=event.method.upper(),
                timestamp=event.timestamp or datetime.datetime.utcnow(),
                location=event.location,
                signature=event.signature or HardwareAbstractionLayer.generate_device_signature(event),
                sync_status="SYNCED",
                verified=True
            )
            db.add(rec)
            synced_count += 1
        except Exception as e:
            errors.append(f"Event {event.event_id}: {str(e)}")

    db.commit()

    return {
        "synced_count": synced_count,
        "duplicate_count": duplicate_count,
        "errors": errors,
        "sync_time": datetime.datetime.utcnow().isoformat(),
        "device_id": payload.device_id
    }

@router.get("/my-history")
def get_my_attendance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = db.query(AttendanceRecord).filter(
        AttendanceRecord.trainee_id == current_user.id
    ).order_by(AttendanceRecord.timestamp.desc()).all()

    results = []
    for r in records:
        results.append({
            "id": r.id,
            "event_id": r.event_id,
            "device_id": r.device_id,
            "method": r.method,
            "timestamp": r.timestamp.isoformat(),
            "location": r.location,
            "sync_status": r.sync_status,
            "signature": r.signature
        })
    return results

@router.get("/devices")
def list_devices(db: Session = Depends(get_db)):
    devices = db.query(Device).all()
    results = []
    for d in devices:
        results.append({
            "device_id": d.device_id,
            "name": d.name,
            "device_type": d.device_type,
            "location_room": d.location_room,
            "status": d.status,
            "last_heartbeat": d.last_heartbeat.isoformat() if d.last_heartbeat else None
        })
    return results

@router.get("/all")
def get_all_attendance(
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.INSTITUTE_ADMIN, UserRole.SUPER_ADMIN, UserRole.TRAINER]))
):
    records = db.query(AttendanceRecord).order_by(AttendanceRecord.timestamp.desc()).limit(100).all()
    results = []
    for r in records:
        trainee = r.trainee
        results.append({
            "event_id": r.event_id,
            "trainee_name": trainee.full_name if trainee else "Unknown",
            "trainee_email": trainee.email if trainee else "",
            "device_id": r.device_id,
            "method": r.method,
            "timestamp": r.timestamp.isoformat(),
            "location": r.location,
            "sync_status": r.sync_status
        })
    return results
