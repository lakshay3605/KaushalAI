# SAHAKAR-SETU Edge Hardware Communication Protocol
### Specification Version: 1.0.0 (SIH-26087-HW-PROTO)

This document formalizes the communication specification between physical edge attendance hardware (ESP32-S3, Android Tablets, Optical Face Kiosks) and the Sahakar-Setu FastAPI backend.

---

## 1. Network Transport

* **Transport Layer:** HTTP/1.1 over TLS 1.3 (or plain HTTP for local offline intranet gateways).
* **Content-Type:** `application/json`
* **Character Set:** UTF-8

---

## 2. API Endpoints

### 2.1 Single Event (Real-time Online Attendance)
* **Method:** `POST`
* **Path:** `/api/attendance/mark`
* **Headers:**
  * `Content-Type: application/json`
  * `X-Device-ID: KIOSK-001`
  * `X-Hardware-Signature: <HMAC>`

#### Request Payload:
```json
{
  "event_id": "EVT-ESP32-902184A3B1",
  "device_id": "KIOSK-001",
  "trainee_id": 1,
  "batch_id": 1,
  "method": "FACE",
  "timestamp": "2026-09-29T02:15:00.000000",
  "location": "Main Entrance Kiosk",
  "signature": "c8419fa761b043229b",
  "sync_status": "SYNCED"
}
```

#### Response Codes:
* `200 OK`: Attendance recorded or previously recorded (idempotent).
  ```json
  {
    "status": "RECORDED",
    "event_id": "EVT-ESP32-902184A3B1",
    "trainee_name": "Ramesh Kumar",
    "method": "FACE",
    "timestamp": "2026-09-29T02:15:00.000000",
    "device_id": "KIOSK-001",
    "sync_status": "SYNCED"
  }
  ```
* `404 Not Found`: Trainee ID does not exist in national cooperative database.
* `400 Bad Request`: Missing mandatory parameters.

---

### 2.2 Batch Synchronization (Offline Recovery Sync)
* **Method:** `POST`
* **Path:** `/api/attendance/sync`

#### Request Payload:
```json
{
  "device_id": "KIOSK-001",
  "events": [
    {
      "event_id": "EVT-OFF-001",
      "device_id": "KIOSK-001",
      "trainee_id": 1,
      "method": "NFC",
      "timestamp": "2026-09-29T01:30:00.000000",
      "location": "Main Entrance Kiosk",
      "sync_status": "PENDING"
    },
    {
      "event_id": "EVT-OFF-002",
      "device_id": "KIOSK-001",
      "trainee_id": 2,
      "method": "FACE",
      "timestamp": "2026-09-29T01:32:00.000000",
      "location": "Main Entrance Kiosk",
      "sync_status": "PENDING"
    }
  ]
}
```

#### Response Body:
```json
{
  "synced_count": 2,
  "duplicate_count": 0,
  "errors": [],
  "sync_time": "2026-09-29T02:20:00.000000",
  "device_id": "KIOSK-001"
}
```

---

## 3. Cryptographic Hardware Non-Repudiation

To prevent physical spoofing, each hardware terminal computes an HMAC-SHA256 signature using a pre-shared hardware salt:

```python
HMAC_SHA256(
    key = HARDWARE_SECRET_KEY,
    msg = f"{event_id}:{device_id}:{trainee_id}:{iso_timestamp}"
)[:24]
```

The server verifies the signature prior to persisting the record.
