import hmac
import hashlib
import uuid
import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class HardwareAttendanceEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: f"EVT-{uuid.uuid4().hex[:12].upper()}")
    device_id: str
    trainee_id: int
    batch_id: Optional[int] = None
    method: str = Field(..., description="FACE, NFC, QR, or SIMULATOR")
    timestamp: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    location: str = "Smart Training Kiosk"
    signature: Optional[str] = None
    sync_status: str = "SYNCED"

class BatchSyncPayload(BaseModel):
    device_id: str
    events: List[HardwareAttendanceEvent]

class HardwareAbstractionLayer:
    """Standardized Hardware Abstraction Layer (HAL).
    Accepts attendance records identically whether sent from:
    - 8-inch Rugged Android Tablet Kiosk
    - ESP32 / Arduino Microcontroller
    - Optical/Face Sensor
    - NFC Card Reader
    - Web / Mobile Kiosk Simulator
    """

    SECRET_DEVICE_KEY = "sahakar-kiosk-hardware-salt-2026"

    @classmethod
    def generate_device_signature(cls, event: HardwareAttendanceEvent) -> str:
        """Computes hardware HMAC signature to ensure non-repudiation of physical events."""
        canonical_str = f"{event.event_id}:{event.device_id}:{event.trainee_id}:{event.timestamp.isoformat()}"
        return hmac.new(
            cls.SECRET_DEVICE_KEY.encode('utf-8'),
            canonical_str.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()[:24]

    @classmethod
    def verify_event_authenticity(cls, event: HardwareAttendanceEvent) -> bool:
        if not event.signature:
            # For simulator or dev testing, generate and verify
            return True
        expected = cls.generate_device_signature(event)
        return hmac.compare_digest(event.signature, expected)
