# SAHAKAR-SETU Edge Hardware Integration Layer
### Smart Attendance & Biometric Kiosk Hardware Specification (SIH #26087)

This directory contains the physical integration layer, microcontroller firmware, hardware communication protocol, and terminal simulator for the **Smart Training Kiosk**.

---

## 🔌 Hardware Bill of Materials (BOM)

| Component | Function | Interface | Operating Voltage |
| :--- | :--- | :--- | :--- |
| **ESP32-S3 Dual-Core SoC** | Master Edge Gateway, WiFi 802.11 b/g/n, BLE 5.0, cryptographic engine | SPI / I2C / UART | 3.3V / 5V USB-C |
| **ESP32-CAM (OV2640 Sensor)** | Video capture for INT8 face detection and silent liveness detection | High-speed DVP / UART | 5V DC |
| **PN532 NFC/RFID Module** | 13.56 MHz ISO/IEC 14443A card reader for trainee smart identity cards | I2C (Pins: SDA=GPIO 21, SCL=GPIO 22) | 3.3V |
| **DS3231 High-Precision RTC** | Real-time clock battery-backed timestamping for offline non-repudiation | I2C (Shared bus) | 3.3V (CR2032 coin) |
| **MicroSD SPI Module** | Edge non-volatile FIFO buffer storing up to 50,000 attendance events offline | SPI (MOSI=23, MISO=19, SCK=18, CS=5) | 3.3V |
| **0.96" SSD1306 OLED / Buzzer** | Audio-visual feedback on biometric acceptance or offline queue state | I2C / GPIO 4 PWM | 3.3V |

---

## ⚡ Pinout & Wiring Diagram

```text
                  +--------------------------+
                  |      ESP32-S3 Master     |
                  +--------------------------+
                   | 3V3                 GND |
                   |                         |
   PN532 NFC <---- | GPIO 21 (SDA)           |
   DS3231 RTC <--- | GPIO 22 (SCL)           |
   SSD1306 OLED <- | (Shared I2C Bus)        |
                   |                         |
   MicroSD CS <--- | GPIO 5                  |
   MicroSD MOSI <- | GPIO 23                 |
   MicroSD MISO <- | GPIO 19                 |
   MicroSD SCK <-- | GPIO 18                 |
                   |                         |
   ESP32-CAM RX <- | GPIO 17 (UART TX)       |
   ESP32-CAM TX -> | GPIO 16 (UART RX)       |
   Buzzer Output<- | GPIO 4                  |
                  +--------------------------+
```

---

## 📡 Standardized Event Payload Schema

All physical edge devices transmit the exact same canonical JSON schema utilized by the web simulator:

```json
{
  "event_id": "EVT-ESP32-A1B2C3D4E5F6",
  "device_id": "KIOSK-001",
  "trainee_id": 1,
  "batch_id": 1,
  "method": "FACE",
  "timestamp": "2026-09-29T02:15:00.000Z",
  "location": "Lecture Hall A Entrance",
  "signature": "a89f92b7c61d43e2f89c01ab",
  "sync_status": "SYNCED"
}
```

* **`event_id`**: Globally unique event identifier generated from device UUID + timestamp. Used by the server for **strict deduplication**.
* **`signature`**: Truncated HMAC-SHA256 calculated using hardware secret salt over `event_id:device_id:trainee_id:timestamp`.

---

## 🔄 Offline Operation & Sync State Machine

1. **Card Tap / Face Recognized**: Microcontroller checks WiFi connectivity via `WiFi.status() == WL_CONNECTED`.
2. **If Online**:
   - Sends immediate HTTP POST to `http://<SERVER_IP>:8000/api/attendance/mark`.
   - On HTTP 200: Beeps buzzer twice, displays "✓ Verified".
3. **If Offline (Network severed/2G outage)**:
   - Microcontroller writes event to MicroSD FIFO queue file `/offline_events.jsonl`.
   - Increments local offline queue counter.
   - OLED displays: `OFFLINE QUEUED (N pending)`.
4. **When Connectivity Restored**:
   - Background sync task reads up to 50 records from `/offline_events.jsonl`.
   - Sends batch HTTP POST to `http://<SERVER_IP>:8000/api/attendance/sync`.
   - Server returns `{synced_count: X, duplicate_count: Y}`.
   - Microcontroller flushes synced events from SD card buffer.
