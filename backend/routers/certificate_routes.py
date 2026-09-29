from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import datetime
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Certificate, Course, User, UserRole, TraineeSkill, Skill
from backend.auth import get_current_user, require_roles
from backend.crypto import verify_credential, sign_credential, get_public_key_pem
from backend.config import BASE_URL

router = APIRouter(prefix="/api/certificates", tags=["Digital Certification & Ed25519 Cryptography"])

@router.get("/my-certificates")
def get_my_certificates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    certs = db.query(Certificate).filter(Certificate.trainee_id == current_user.id).all()
    results = []
    for c in certs:
        meta = json.loads(c.metadata_json) if c.metadata_json else {}
        results.append({
            "certificate_id": c.certificate_id,
            "course_title": c.course.title if c.course else "PACS Course",
            "issue_date": c.issue_date.strftime("%d %B %Y"),
            "issuer_name": c.issuer_name,
            "grade": c.grade,
            "score": c.score,
            "ed25519_signature": c.ed25519_signature,
            "verification_url": c.verification_url,
            "metadata": meta
        })
    return results

@router.get("/{cert_id}")
def get_certificate_detail(cert_id: str, db: Session = Depends(get_db)):
    cert = db.query(Certificate).filter(Certificate.certificate_id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")

    meta = json.loads(cert.metadata_json) if cert.metadata_json else {}
    return {
        "certificate_id": cert.certificate_id,
        "trainee_name": cert.trainee.full_name if cert.trainee else "Trainee",
        "course_title": cert.course.title if cert.course else "Cooperative Management",
        "institute_name": cert.trainee.institute.name if (cert.trainee and cert.trainee.institute) else "NCCT Apex Institute",
        "issue_date": cert.issue_date.strftime("%d %B %Y"),
        "issuer_name": cert.issuer_name,
        "grade": cert.grade,
        "score": cert.score,
        "ed25519_signature": cert.ed25519_signature,
        "public_key_pem": cert.public_key_pem,
        "verification_url": cert.verification_url,
        "metadata": meta,
        "revoked": cert.revoked
    }

@router.get("/verify/{cert_id}")
def verify_certificate_public(cert_id: str, db: Session = Depends(get_db)):
    """PUBLIC ZERO-LOGIN VERIFICATION ENDPOINT
    Performs real cryptographic Ed25519 verification of the digital signature.
    Works offline or online without requiring recruiter login.
    """
    cert = db.query(Certificate).filter(Certificate.certificate_id == cert_id).first()
    if not cert:
        return {
            "is_valid": False,
            "status": "NOT_FOUND",
            "message": f"Certificate ID '{cert_id}' was not found in the National Cooperative Credential Registry.",
            "verified_at": datetime.datetime.utcnow().isoformat()
        }

    if cert.revoked:
        return {
            "is_valid": False,
            "status": "REVOKED",
            "message": "This certificate has been revoked by the issuing authority.",
            "certificate_id": cert.certificate_id,
            "verified_at": datetime.datetime.utcnow().isoformat()
        }

    # Verify cryptographic signature using Ed25519 public key
    meta_payload = json.loads(cert.metadata_json) if cert.metadata_json else {
        "cert_id": cert.certificate_id,
        "trainee_id": cert.trainee_id,
        "grade": cert.grade
    }

    is_cryptographically_valid = verify_credential(
        payload=meta_payload,
        signature_b64=cert.ed25519_signature,
        public_key_pem=cert.public_key_pem
    )

    return {
        "is_valid": is_cryptographically_valid,
        "status": "VERIFIED_AUTHENTIC" if is_cryptographically_valid else "TAMPER_DETECTED",
        "certificate_id": cert.certificate_id,
        "trainee_name": cert.trainee.full_name if cert.trainee else "Ramesh Kumar",
        "course_title": cert.course.title if cert.course else "PACS Accounting",
        "issuing_authority": cert.issuer_name,
        "issue_date": cert.issue_date.strftime("%Y-%m-%d"),
        "grade": cert.grade,
        "score": cert.score,
        "cryptography": {
            "algorithm": "Ed25519",
            "signature_snippet": cert.ed25519_signature[:32] + "...",
            "public_key_snippet": cert.public_key_pem.splitlines()[1][:30] + "...",
            "gas_cost": "$0 (Zero-Gas Asymmetric Standard)",
            "w3c_verifiable_credential_compliant": True
        },
        "verified_at": datetime.datetime.utcnow().isoformat()
    }
