#!/usr/bin/env python3
"""
SAHAKAR-SETU: Hardware Client Emulator
Emulates an attached ESP32-S3 / Rugged Kiosk Terminal connecting to the FastAPI backend.
"""

import time
import uuid
import datetime
import hmac
import hashlib
import requests
import sys

API_BASE = "http://127.0.0.1:8000/api"
DEVICE_ID = "KIOSK-001"
HARDWARE_SECRET = "sahakar-kiosk-hardware-salt-2026"

def generate_hardware_sig(event_id: str, device_id: str, trainee_id: int, timestamp: str) -> str:
    canonical = f"{event_id}:{device_id}:{trainee_id}:{timestamp}"
    return hmac.new(
        HARDWARE_SECRET.encode("utf-8"),
        canonical.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()[:24]

def simulate_card_tap(trainee_id: int = 1, method: str = "NFC"):
    timestamp = datetime.datetime.utcnow().isoformat()
    event_id = f"EVT-HW-{uuid.uuid4().hex[:10].upper()}"
    signature = generate_hardware_sig(event_id, DEVICE_ID, trainee_id, timestamp)

    payload = {
        "event_id": event_id,
        "device_id": DEVICE_ID,
        "trainee_id": trainee_id,
        "batch_id": 1,
        "method": method,
        "timestamp": timestamp,
        "location": "Doorway Tablet Kiosk #1",
        "signature": signature,
        "sync_status": "SYNCED"
    }

    print(f"\n[HARDWARE KIOSK] Sensor Triggered: {method} Scan for Trainee ID #{trainee_id}")
    print(f"Generated Event ID: {event_id} | Signature: {signature}")

    try:
        res = requests.post(f"{API_BASE}/attendance/mark", json=payload, timeout=5)
        if res.status_code == 200:
            data = res.json()
            print(f"[SERVER RESPONSE 200 OK] Status: {data.get('status')}")
            print(f"Verified Trainee: {data.get('trainee_name')} at {data.get('timestamp')}")
        else:
            print(f"[SERVER ERROR {res.status_code}] {res.text}")
    except Exception as e:
        print(f"[OFFLINE] Network unreachable: {e}. Event buffered to hardware NVRAM/SD queue.")

if __name__ == "__main__":
    t_id = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    method = sys.argv[2] if len(sys.argv) > 2 else "FACE"
    simulate_card_tap(trainee_id=t_id, method=method)
