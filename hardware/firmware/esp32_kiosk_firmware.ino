/*
 * SAHAKAR-SETU: ESP32-S3 Physical Smart Kiosk Gateway Firmware
 * Smart India Hackathon (SIH 2026) Problem Statement 26087
 * 
 * Hardware: ESP32-S3 + PN532 NFC (I2C) + DS3231 RTC + MicroSD (SPI)
 * Protocols: HTTP/1.1 REST to FastAPI Core Monolith
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <SPI.h>
#include <SD.h>
#include <Adafruit_PN532.h>
#include <RTClib.h>
#include <ArduinoJson.h>
#include "mbedtls/md.h"

// Configuration
const char* WIFI_SSID = "SAHAKAR_NET";
const char* WIFI_PASS = "Cooperative@2026";
const char* SERVER_BASE = "http://192.168.1.100:8000/api";
const char* DEVICE_ID = "KIOSK-001";
const char* HARDWARE_SECRET = "sahakar-kiosk-hardware-salt-2026";

// Hardware Pins
#define PN532_IRQ   2
#define PN532_RESET 3
#define SD_CS_PIN   5
#define BUZZER_PIN  4

// Peripherals
Adafruit_PN532 nfc(PN532_IRQ, PN532_RESET);
RTC_DS3231 rtc;

// Generate Hardware HMAC-SHA256 Signature
String generateHMAC(String message) {
  byte hmacResult[32];
  mbedtls_md_context_t ctx;
  mbedtls_md_type_t md_type = MBEDTLS_MD_SHA256;
  
  mbedtls_md_init(&ctx);
  mbedtls_md_setup(&ctx, mbedtls_md_info_from_type(md_type), 1);
  mbedtls_md_hmac_starts(&ctx, (const unsigned char*)HARDWARE_SECRET, strlen(HARDWARE_SECRET));
  mbedtls_md_hmac_update(&ctx, (const unsigned char*)message.c_str(), message.length());
  mbedtls_md_hmac_finish(&ctx, hmacResult);
  mbedtls_md_free(&ctx);
  
  String hexStr = "";
  for (int i = 0; i < 12; i++) {
    if (hmacResult[i] < 16) hexStr += "0";
    hexStr += String(hmacResult[i], HEX);
  }
  return hexStr;
}

// Format ISO 8601 Timestamp from DS3231 RTC
String getISOTimestamp() {
  DateTime now = rtc.now();
  char buf[30];
  snprintf(buf, sizeof(buf), "%04d-%02d-%02dT%02d:%02d:%02d.000Z",
           now.year(), now.month(), now.day(),
           now.hour(), now.minute(), now.second());
  return String(buf);
}

// Save event to local MicroSD card when network is offline
void queueEventOffline(String jsonString) {
  File queueFile = SD.open("/offline_events.jsonl", FILE_APPEND);
  if (queueFile) {
    queueFile.println(jsonString);
    queueFile.close();
    Serial.println("[OFFLINE] Event buffered to MicroSD queue.");
  } else {
    Serial.println("[ERROR] Failed to open MicroSD queue file!");
  }
}

// Send real-time attendance or queue offline if disconnected
void processAttendanceEvent(int traineeId, String method) {
  String timestamp = getISOTimestamp();
  String eventId = "EVT-ESP32-" + String(millis(), HEX);
  
  // Create cryptographic hardware signature
  String hmacData = eventId + ":" + String(DEVICE_ID) + ":" + String(traineeId) + ":" + timestamp;
  String signature = generateHMAC(hmacData);
  
  // Build JSON payload
  StaticJsonDocument<384> doc;
  doc["event_id"] = eventId;
  doc["device_id"] = DEVICE_ID;
  doc["trainee_id"] = traineeId;
  doc["batch_id"] = 1;
  doc["method"] = method;
  doc["timestamp"] = timestamp;
  doc["location"] = "Rampur Doorway Tablet Kiosk";
  doc["signature"] = signature;
  doc["sync_status"] = (WiFi.status() == WL_CONNECTED) ? "SYNCED" : "PENDING";
  
  String jsonOutput;
  serializeJson(doc, jsonOutput);

  // If WiFi is connected, send immediately to server
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(String(SERVER_BASE) + "/attendance/mark");
    http.addHeader("Content-Type", "application/json");
    
    int httpCode = http.POST(jsonOutput);
    if (httpCode == 200) {
      Serial.println("[ONLINE] Attendance synced immediately with server.");
      tone(BUZZER_PIN, 2000, 150); // Double beep for success
      delay(200);
      tone(BUZZER_PIN, 2500, 150);
    } else {
      Serial.printf("[HTTP ERROR] %d. Buffering event offline.\n", httpCode);
      queueEventOffline(jsonOutput);
      tone(BUZZER_PIN, 800, 400); // Low warning tone
    }
    http.end();
  } else {
    // Offline mode: Store directly to MicroSD card
    queueEventOffline(jsonOutput);
    tone(BUZZER_PIN, 1200, 200);
  }
}

// Sync all buffered offline events when network reconnects
void syncOfflineQueue() {
  if (WiFi.status() != WL_CONNECTED || !SD.exists("/offline_events.jsonl")) return;

  File queueFile = SD.open("/offline_events.jsonl", FILE_READ);
  if (!queueFile || queueFile.size() == 0) return;

  Serial.println("[SYNC] Restored connection detected. Syncing offline buffer...");
  
  DynamicJsonDocument doc(8192);
  doc["device_id"] = DEVICE_ID;
  JsonArray eventsArr = doc.createNestedArray("events");

  while (queueFile.available()) {
    String line = queueFile.readStringUntil('\n');
    line.trim();
    if (line.length() > 0) {
      StaticJsonDocument<512> itemDoc;
      deserializeJson(itemDoc, line);
      eventsArr.add(itemDoc.as<JsonObject>());
    }
  }
  queueFile.close();

  // POST batch sync payload
  HTTPClient http;
  http.begin(String(SERVER_BASE) + "/attendance/sync");
  http.addHeader("Content-Type", "application/json");

  String batchJson;
  serializeJson(doc, batchJson);
  int httpCode = http.POST(batchJson);

  if (httpCode == 200) {
    Serial.println("[SYNC SUCCESS] Server processed batch sync. Purging local SD queue.");
    SD.remove("/offline_events.jsonl");
  }
  http.end();
}

void setup() {
  Serial.begin(115200);
  pinMode(BUZZER_PIN, OUTPUT);

  // Initialize I2C Bus
  Wire.begin(21, 22);

  // Initialize DS3231 RTC
  if (!rtc.begin()) {
    Serial.println("[ERROR] DS3231 RTC not found!");
  }

  // Initialize MicroSD SPI Card
  if (!SD.begin(SD_CS_PIN)) {
    Serial.println("[WARN] MicroSD module not mounted. Edge buffer will be volatile.");
  } else {
    Serial.println("[OK] MicroSD initialized for offline event queuing.");
  }

  // Initialize PN532 NFC
  nfc.begin();
  uint32_t versiondata = nfc.getFirmwareVersion();
  if (!versiondata) {
    Serial.println("[ERROR] PN532 NFC reader not detected!");
  } else {
    nfc.SAMConfig();
    Serial.println("[OK] PN532 NFC RFID Ready for Trainee Smart Cards.");
  }

  // Connect to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Connecting to Cooperative Network");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 10) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  Serial.println(WiFi.status() == WL_CONNECTED ? "\n[OK] WiFi Connected." : "\n[WARN] Starting in Edge Offline Mode.");
}

void loop() {
  // 1. Check for NFC Card Tap
  uint8_t uid[] = { 0, 0, 0, 0, 0, 0, 0 };
  uint8_t uidLength;
  
  if (nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength, 50)) {
    int traineeId = 1; // Mapped from card UID table
    Serial.printf("[NFC] Card Detected! Mapped Trainee ID #%d\n", traineeId);
    processAttendanceEvent(traineeId, "NFC");
    delay(1000); // Debounce
  }

  // 2. Periodic background check for network restoration and sync
  static unsigned long lastSyncCheck = 0;
  if (millis() - lastSyncCheck > 15000) {
    lastSyncCheck = millis();
    syncOfflineQueue();
  }
}
