import fs from 'fs';
import path from 'path';

function esc(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const cells = [];
let idCounter = 2;
function nextId() {
  return String(idCounter++);
}

function addCell({ id, parent = '1', value = '', style = '', vertex = true, edge = false, x = 0, y = 0, w = 100, h = 50, source = null, target = null, relative = false, points = null }) {
  const cellId = id || nextId();
  cells.push({
    id: cellId,
    parent,
    value: esc(value),
    style,
    vertex,
    edge,
    x, y, w, h,
    source, target,
    relative,
    points
  });
  return cellId;
}

// ---------------------------------------------------------
// STYLES (SOLID FORMAL CREAM PALETTE FOR PRESENTATIONS)
// ---------------------------------------------------------
const S_HEADER = "rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFDF8;strokeColor=#D1C3A5;strokeWidth=1.4;fontColor=#0F172A;fontStyle=1;fontSize=18;align=left;spacingLeft=25;shadow=1;";
const S_LAYER_CONTAINER = "rounded=1;whiteSpace=wrap;html=1;fillColor=#F4EDE0;strokeColor=#CFC2A7;strokeWidth=1.5;dashed=1;verticalAlign=top;align=left;spacingLeft=20;spacingTop=8;fontSize=11;fontStyle=1;fontColor=#0369A1;";

const S_CARD_CYAN = "rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#0284C7;strokeWidth=1.4;fontColor=#0F172A;align=left;verticalAlign=top;spacingLeft=14;spacingTop=10;shadow=1;";
const S_CARD_EMERALD = "rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#059669;strokeWidth=1.4;fontColor=#0F172A;align=left;verticalAlign=top;spacingLeft=14;spacingTop=10;shadow=1;";
const S_CARD_PURPLE = "rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#7C3AED;strokeWidth=1.4;fontColor=#0F172A;align=left;verticalAlign=top;spacingLeft=14;spacingTop=10;shadow=1;";
const S_CARD_AMBER = "rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#D97706;strokeWidth=1.4;fontColor=#0F172A;align=left;verticalAlign=top;spacingLeft=14;spacingTop=10;shadow=1;";
const S_CARD_ROSE = "rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#E11D48;strokeWidth=1.4;fontColor=#0F172A;align=left;verticalAlign=top;spacingLeft=14;spacingTop=10;shadow=1;";

const S_GATEWAY = "rounded=1;whiteSpace=wrap;html=1;fillColor=#F4EDE0;strokeColor=#0284C7;strokeWidth=1.6;fontColor=#0F172A;fontStyle=1;fontSize=15;align=left;spacingLeft=25;shadow=1;";
const S_SECURITY_PILL = "rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#0284C7;strokeWidth=1.2;fontColor=#0F172A;fontSize=10;fontStyle=1;align=center;shadow=1;";

const S_CORE_CONTAINER = "rounded=1;whiteSpace=wrap;html=1;fillColor=#F0E9DC;strokeColor=#0284C7;strokeWidth=1.6;verticalAlign=top;align=left;spacingLeft=20;spacingTop=8;fontSize=12;fontStyle=1;fontColor=#0F172A;shadow=1;";
const S_CORE_ENGINE = "rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#0284C7;strokeWidth=1.4;fontColor=#0F172A;align=left;verticalAlign=top;spacingLeft=14;spacingTop=10;shadow=1;";

const S_STORAGE_CARD = "rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#0284C7;strokeWidth=1.4;fontColor=#0F172A;align=left;verticalAlign=top;spacingLeft=16;spacingTop=12;shadow=1;";
const S_DPI_CARD = "rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#0284C7;strokeWidth=1.4;fontColor=#0F172A;align=left;verticalAlign=top;spacingLeft=14;spacingTop=10;shadow=1;";
const S_FOOTER_BADGE = "rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#059669;strokeWidth=1.5;fontColor=#0F172A;align=left;verticalAlign=middle;spacingLeft=16;shadow=1;";

const S_CONNECTOR_CYAN = "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#0284C7;strokeWidth=2;endArrow=block;endFill=1;";
const S_CONNECTOR_AMBER = "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#D97706;strokeWidth=2;endArrow=block;endFill=1;";
const S_CONNECTOR_PURPLE = "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#7C3AED;strokeWidth=2;endArrow=block;endFill=1;";

// ---------------------------------------------------------
// 1. TOP HEADER BANNER
// ---------------------------------------------------------
addCell({
  x: 40, y: 16, w: 1840, h: 54,
  value: "<b>SAHAKAR-SETU: SYSTEM ARCHITECTURE &amp; DATA FLOW</b><br><font color='#64748B' style='font-size:11px;'>MINISTRY OF COOPERATION • NCCT TRAINING NETWORK • MODULAR MONOLITH + EDGE KIOSK (16:9 PRESENTATION BLUEPRINT)</font>",
  style: S_HEADER
});

// ---------------------------------------------------------
// 2. LAYER 1: CLIENT INTERFACES & PHYSICAL EDGE DEVICES (Y: 78 - 236)
// ---------------------------------------------------------
const l1 = addCell({
  x: 40, y: 78, w: 1840, h: 158,
  value: "LAYER 1: CLIENT INTERFACES &amp; PHYSICAL EDGE DEVICES",
  style: S_LAYER_CONTAINER
});

// Card 1: Trainee Mobile PWA
const c1 = addCell({
  parent: l1,
  x: 14, y: 20, w: 352, h: 122,
  value: "<b>📱 Trainee Mobile PWA</b> <font color='#0369A1' style='font-size:9px;'>[OFFLINE-FIRST]</font><br><font color='#0284C7' style='font-size:10px;'><b>Next.js 14 • Serwist SW • IndexedDB</b></font><br><font color='#334155' style='font-size:9.5px;'>• Spoken Vernacular LMS (22 Languages)<br>• In-Browser PACS ERP Accounting Simulator<br><font color='#64748B'>Local quiz state • Sub-1.2MB mobile payload</font></font>",
  style: S_CARD_CYAN
});

// Card 2: Institute ERP Portal
const c2 = addCell({
  parent: l1,
  x: 382, y: 20, w: 352, h: 122,
  value: "<b>💻 Institute Admin &amp; ERP</b> <font color='#0369A1' style='font-size:9px;'>[CAMPUS ERP]</font><br><font color='#0284C7' style='font-size:10px;'><b>React 18 • TanStack Table • FullCalendar</b></font><br><font color='#334155' style='font-size:9.5px;'>• Trainee Admissions &amp; Bulk CSV Verification<br>• Dynamic Hostel Bed Matrix &amp; Meal Tokens<br><font color='#64748B'>Automated faculty timetable &amp; hall allocations</font></font>",
  style: S_CARD_CYAN
});

// Card 3: PACS & Recruiter Portal
const c3 = addCell({
  parent: l1,
  x: 750, y: 20, w: 352, h: 122,
  value: "<b>🏢 PACS &amp; Recruiter Portal</b> <font color='#6D28D9' style='font-size:9px;'>[JOBS BRIDGE]</font><br><font color='#7C3AED' style='font-size:10px;'><b>Cooperative Society Talent Ingress</b></font><br><font color='#334155' style='font-size:9.5px;'>• PACS &amp; DCCB Direct Vacancy Management<br>• 1-Click Hiring of Certified Local Youth<br><font color='#64748B'>Verified merit filters • Distance-based matching</font></font>",
  style: S_CARD_PURPLE
});

// Card 4: Verifier & HQ Cockpit
const c4 = addCell({
  parent: l1,
  x: 1118, y: 20, w: 344, h: 122,
  value: "<b>🔍 Verifier &amp; HQ Cockpit</b> <font color='#047857' style='font-size:9px;'>[TRUST &amp; BI]</font><br><font color='#059669' style='font-size:10px;'><b>Zero-Login QR Validation &amp; Analytics</b></font><br><font color='#334155' style='font-size:9.5px;'>• Offline Ed25519 2D QR Signature Check (&lt;15ms)<br>• Ministry HQ National Macro BI Telemetry<br><font color='#64748B'>Apache Superset • Real-time stipend audit streams</font></font>",
  style: S_CARD_EMERALD
});

// Card 5: Door Edge Kiosk
const c5 = addCell({
  parent: l1,
  x: 1478, y: 20, w: 348, h: 122,
  value: "<b>🚪 Door Edge Kiosk</b> <font color='#B45309' style='font-size:9px;'>[HARDWARE KIOSK]</font><br><font color='#D97706' style='font-size:10px;'><b>Wall-Mounted Rugged Device (Doorway)</b></font><br><font color='#334155' style='font-size:9.5px;'>• INT8 MobileFaceNet ONNX (&lt;80ms Match)<br>• MiniFASNet Silent Anti-Spoof Liveness<br><font color='#64748B'>50,000 log SQLite buffer • 5000mAh battery backup</font></font>",
  style: S_CARD_AMBER
});

// ---------------------------------------------------------
// 3. LAYER 2: UNIFIED API GATEWAY & SECURITY INGRESS (Y: 288 - 356)
// ---------------------------------------------------------
const l2 = addCell({
  x: 40, y: 288, w: 1840, h: 68,
  value: "<b>Unified API Gateway &amp; Reverse Proxy</b>",
  style: S_GATEWAY
});

addCell({
  parent: l2,
  x: 390, y: 18, w: 260, h: 32,
  value: "● <b>Nginx / Cloudflare Edge Ingress</b>",
  style: S_SECURITY_PILL + "strokeColor=#0284C7;"
});

addCell({
  parent: l2,
  x: 670, y: 18, w: 260, h: 32,
  value: "● <b>TLS 1.3 Strict Mutual Encryption</b>",
  style: S_SECURITY_PILL + "strokeColor=#059669;"
});

addCell({
  parent: l2,
  x: 950, y: 18, w: 260, h: 32,
  value: "● <b>WAF &amp; DDoS Layer-7 Mitigation</b>",
  style: S_SECURITY_PILL + "strokeColor=#D97706;"
});

addCell({
  parent: l2,
  x: 1230, y: 18, w: 270, h: 32,
  value: "● <b>JWT &amp; Fine-Grained RBAC Auth</b>",
  style: S_SECURITY_PILL + "strokeColor=#7C3AED;"
});

addCell({
  parent: l2,
  x: 1520, y: 18, w: 260, h: 32,
  value: "● <b>Token Bucket Rate Limiter</b>",
  style: S_SECURITY_PILL + "strokeColor=#E11D48;"
});

// ---------------------------------------------------------
// 4. LAYER 3: CORE APPLICATION MODULAR MONOLITH (Y: 398 - 584)
// ---------------------------------------------------------
const l3 = addCell({
  x: 40, y: 398, w: 1840, h: 186,
  value: "<b>FastAPI High-Performance Async Application Core</b>  <font color='#64748B' style='font-size:10px;'>[Python 3.12 • Pydantic v2 • AsyncIO Event Loop • High-Throughput Domain Boundaries]</font>",
  style: S_CORE_CONTAINER
});

// Engine 1: ERP & Logistics
const e1 = addCell({
  parent: l3,
  x: 14, y: 38, w: 435, h: 134,
  value: "<b>📋 ERP &amp; Hostel Logistics Engine</b> <font color='#0369A1' style='font-size:9px;'>[CORE ENGINE 1]</font><br><font color='#0284C7' style='font-size:10px;'><b>• Camunda BPMN Multi-Tier Approval State Machine</b></font><br><font color='#334155' style='font-size:9.5px;'>• PostgreSQL pg_trgm Fuzzy Dedup (Aadhaar &amp; Phone Check)<br>• Dynamic Hostel Bed Matrix &amp; Bed Allocation<br><font color='#64748B'>QR-verified daily mess coupons • Automated batch roll calls</font></font>",
  style: S_CORE_ENGINE + "strokeColor=#0284C7;"
});

// Engine 2: Biometric Attendance & Stipend
const e2 = addCell({
  parent: l3,
  x: 465, y: 38, w: 440, h: 134,
  value: "<b>⚡ Biometric Attendance &amp; Stipend</b> <font color='#047857' style='font-size:9px;'>[CORE ENGINE 2]</font><br><font color='#059669' style='font-size:10px;'><b>• INT8 Vector Match Verification (&lt;80ms Inference)</b></font><br><font color='#334155' style='font-size:9.5px;'>• Automated TA/DA Daily Stipend Calculator<br>• Anomaly Fraud Detection Gate (Blocks Geo/Proxy Clocks)<br><font color='#64748B'>100% DPDP Act compliant • Zero raw photos in storage</font></font>",
  style: S_CORE_ENGINE + "strokeColor=#059669;"
});

// Engine 3: Multilingual LMS & Sandbox
const e3 = addCell({
  parent: l3,
  x: 921, y: 38, w: 440, h: 134,
  value: "<b>📚 Multilingual LMS &amp; Sandbox</b> <font color='#0369A1' style='font-size:9px;'>[CORE ENGINE 3]</font><br><font color='#0284C7' style='font-size:10px;'><b>• 3-5min Audio Lesson Bundler in 22 Indian Languages</b></font><br><font color='#334155' style='font-size:9.5px;'>• 22-Module PACS Accounting Software Simulator<br>• Formative Vernacular Spoken Quizzing Engine<br><font color='#64748B'>Bhashini ASR/TTS powered • Offline caching support</font></font>",
  style: S_CORE_ENGINE + "strokeColor=#0284C7;"
});

// Engine 4: Trust & Jobs
const e4 = addCell({
  parent: l3,
  x: 1377, y: 38, w: 448, h: 134,
  value: "<b>🎯 Trust &amp; Cooperative Jobs</b> <font color='#6D28D9' style='font-size:9px;'>[CORE ENGINE 4]</font><br><font color='#7C3AED' style='font-size:10px;'><b>• W3C Verifiable Credentials with Ed25519 2D QR Signing</b></font><br><font color='#334155' style='font-size:9.5px;'>• Explainable Ranker: Score = w₁(Grade) + w₂(Dist) + w₃(Rec)<br>• National Cooperative Database (NCD) PACS Verification<br><font color='#64748B'>Direct DigiLocker sync • 1-click candidate shortlisting</font></font>",
  style: S_CORE_ENGINE + "strokeColor=#7C3AED;"
});

// ---------------------------------------------------------
// 5. LAYER 4: PERSISTENCE & DATA STORAGE LAYER (Y: 636 - 742)
// ---------------------------------------------------------
const l4 = addCell({
  x: 40, y: 636, w: 1840, h: 106,
  value: "LAYER 4: PERSISTENCE &amp; DISTRIBUTED STORAGE",
  style: S_LAYER_CONTAINER
});

// Storage 1: PostgreSQL 16
const s1 = addCell({
  parent: l4,
  x: 14, y: 20, w: 594, h: 72,
  value: "<b>Primary Database: PostgreSQL 16</b> <font color='#0369A1' style='font-size:9px;'>[RELATIONAL / RLS ACID]</font><br><font color='#0284C7' style='font-size:10.5px;'><b>Multi-Tenant with Row-Level Security (RLS) • Native JSONB Schema</b></font><br><font color='#64748B' style='font-size:9.5px;'>pg_trgm tri-gram GIN indexing • Automated connection pooling &amp; read-replica split</font>",
  style: S_STORAGE_CARD + "strokeColor=#0284C7;"
});

// Storage 2: Redis 7
const s2 = addCell({
  parent: l4,
  x: 624, y: 20, w: 594, h: 72,
  value: "<b>In-Memory Cache &amp; Broker: Redis 7</b> <font color='#BE123C' style='font-size:9px;'>[&lt;2ms IN-MEMORY]</font><br><font color='#E11D48' style='font-size:10.5px;'><b>Session Store • Rate Limit Sliding Counters • Celery Background Queues</b></font><br><font color='#64748B' style='font-size:9.5px;'>Pub/Sub event fan-out for real-time WebSocket notifications &amp; attendance alerts</font>",
  style: S_STORAGE_CARD + "strokeColor=#E11D48;"
});

// Storage 3: Cloudflare R2 / S3
const s3 = addCell({
  parent: l4,
  x: 1232, y: 20, w: 594, h: 72,
  value: "<b>Encrypted Object Store: Cloudflare R2 / S3</b> <font color='#B45309' style='font-size:9px;'>[ZERO EGRESS S3 API]</font><br><font color='#D97706' style='font-size:10.5px;'><b>Audio Micro-Lessons (&lt;2MB) • Signed Tamper-Proof PDF Certificates</b></font><br><font color='#64748B' style='font-size:9.5px;'>AES-256 at rest • Signed time-bound presigned URLs • Multi-region CDN caching</font>",
  style: S_STORAGE_CARD + "strokeColor=#D97706;"
});

// ---------------------------------------------------------
// 6. LAYER 5: NATIONAL DPI & EXTERNAL SERVICES (Y: 798 - 924)
// ---------------------------------------------------------
const l5 = addCell({
  x: 40, y: 798, w: 1840, h: 126,
  value: "LAYER 5: NATIONAL DIGITAL PUBLIC INFRASTRUCTURE (DPI) &amp; EXTERNAL SERVICES",
  style: S_LAYER_CONTAINER
});

// DPI 1: Bhashini
const d1 = addCell({
  parent: l5,
  x: 14, y: 20, w: 352, h: 92,
  value: "<b>Bhashini / AI4Bharat Gateway</b> <font color='#0369A1' style='font-size:9px;'>[DPI - SPEECH]</font><br><font color='#0284C7' style='font-size:10px;'><b>IndicWhisper (ASR) • IndicTrans2 (NMT)</b></font><br><font color='#334155' style='font-size:9px;'>Meta MMS-TTS Neural Voices in 22 Languages<br><font color='#64748B'>Real-time dialect translation &amp; audio streaming</font></font>",
  style: S_DPI_CARD + "strokeColor=#0284C7;"
});

// DPI 2: DigiLocker
const d2 = addCell({
  parent: l5,
  x: 381, y: 20, w: 352, h: 92,
  value: "<b>DigiLocker &amp; NAD</b> <font color='#047857' style='font-size:9px;'>[DPI - IDENTITY]</font><br><font color='#059669' style='font-size:10px;'><b>National Academic Depository Integration</b></font><br><font color='#334155' style='font-size:9px;'>Permanent Citizen Verifiable Credential Vault<br><font color='#64748B'>Direct push of Ed25519-signed training degrees</font></font>",
  style: S_DPI_CARD + "strokeColor=#059669;"
});

// DPI 3: NCS
const d3 = addCell({
  parent: l5,
  x: 748, y: 20, w: 352, h: 92,
  value: "<b>National Career Service (NCS)</b> <font color='#6D28D9' style='font-size:9px;'>[DPI - JOBS]</font><br><font color='#7C3AED' style='font-size:10px;'><b>Ministry of Labour &amp; Employment Ingress</b></font><br><font color='#334155' style='font-size:9px;'>Cooperative Vacancy &amp; Apprenticeship Feed<br><font color='#64748B'>Syncs DCCB accountant &amp; field manager openings</font></font>",
  style: S_DPI_CARD + "strokeColor=#7C3AED;"
});

// DPI 4: NCD
const d4 = addCell({
  parent: l5,
  x: 1115, y: 20, w: 352, h: 92,
  value: "<b>National Cooperative Database</b> <font color='#4338CA' style='font-size:9px;'>[MIN COOPERATION]</font><br><font color='#4F46E5' style='font-size:10px;'><b>Master Society &amp; PACS Registry API</b></font><br><font color='#334155' style='font-size:9px;'>79,630+ Active PACS Verification &amp; Audits<br><font color='#64748B'>Legal standing check before job posting</font></font>",
  style: S_DPI_CARD + "strokeColor=#4F46E5;"
});

// DPI 5: NIC Gov SMS
const d5 = addCell({
  parent: l5,
  x: 1482, y: 20, w: 344, h: 92,
  value: "<b>NIC Gov SMS / WhatsApp DLT</b> <font color='#B45309' style='font-size:9px;'>[GOV TELECOM]</font><br><font color='#D97706' style='font-size:10px;'><b>TRAI DLT Whitelisted Notification Ingress</b></font><br><font color='#334155' style='font-size:9px;'>Transactional OTPs, Attendance &amp; Allowances<br><font color='#64748B'>Direct DBT credit alerts &amp; training status notifications</font></font>",
  style: S_DPI_CARD + "strokeColor=#D97706;"
});

// ---------------------------------------------------------
// 7. FOOTER CALLOUT BADGES (Y: 946 - 1022)
// ---------------------------------------------------------
addCell({
  x: 40, y: 946, w: 596, h: 76,
  value: "<font color='#059669'><b>✓ EDGE ATTENDANCE &amp; PRIVACY GUARANTEE</b></font><br><b>Sub-80ms Face Match • 100% Offline SQLite Spooler</b><br><font color='#64748B' style='font-size:10px;'>Zero Raw Photo Storage • Fully Compliant with DPDP Act 2023</font>",
  style: S_FOOTER_BADGE + "strokeColor=#059669;"
});

addCell({
  x: 656, y: 946, w: 606, h: 76,
  value: "<font color='#0284C7'><b>⚡ CRYPTOGRAPHIC CREDENTIAL TRUST</b></font><br><b>Ed25519 2D QR Code • Sub-15ms Offline Instant Validation</b><br><font color='#64748B' style='font-size:10px;'>$0 Blockchain Gas Fees • W3C Verifiable Credentials Standard</font>",
  style: S_FOOTER_BADGE + "strokeColor=#0284C7;"
});

addCell({
  x: 1282, y: 946, w: 598, h: 76,
  value: "<font color='#D97706'><b>₹ COST-EFFECTIVE PRODUCTION TOPOLOGY</b></font><br><b>Modular Monolith Topology (FastAPI + PostgreSQL RLS)</b><br><font color='#64748B' style='font-size:10px;'>Scales to 20 National Institutes &amp; 79,630 PACS on &lt;$90/mo VPS</font>",
  style: S_FOOTER_BADGE + "strokeColor=#D97706;"
});

// ---------------------------------------------------------
// CONNECTORS
// ---------------------------------------------------------
// L1 to L2
addCell({
  source: c2,
  target: l2,
  edge: true,
  value: "HTTPS / TLS 1.3: Audio Chunks, OTP, Portals, Roster CSVs",
  style: S_CONNECTOR_CYAN + "exitX=0.5;exitY=1;entryX=0.25;entryY=0;labelBackgroundColor=#FFFDF8;fontColor=#0369A1;fontSize=8.5;fontStyle=1;"
});

addCell({
  source: c5,
  target: l2,
  edge: true,
  value: "HMAC-SHA256 Encrypted Sync: 128-d Biometric Vectors (No Raw Photos)",
  style: S_CONNECTOR_AMBER + "exitX=0.5;exitY=1;entryX=0.85;entryY=0;labelBackgroundColor=#FFFDF8;fontColor=#9A3412;fontSize=8.5;fontStyle=1;"
});

// L2 to L3
addCell({
  source: l2,
  target: l3,
  edge: true,
  value: "Internal Reverse Proxy Routing to Domain Micro-Modules (/api/v1/...)",
  style: S_CONNECTOR_CYAN + "exitX=0.5;exitY=1;entryX=0.5;entryY=0;labelBackgroundColor=#FFFDF8;fontColor=#0284C7;fontSize=8.5;fontStyle=1;"
});

// L3 to L4
addCell({
  source: e1,
  target: s1,
  edge: true,
  value: "SQL with Row-Level Security (RLS) Tenant Isolation (tenant_id = Institute_ID)",
  style: S_CONNECTOR_CYAN + "exitX=0.5;exitY=1;entryX=0.3;entryY=0;labelBackgroundColor=#FFFDF8;fontColor=#0369A1;fontSize=8.5;fontStyle=1;"
});

addCell({
  source: e2,
  target: s2,
  edge: true,
  value: "Pub/Sub Event Bus &amp; Celery Async Queues (Stipend Audits, SMS Alerts)",
  style: S_CONNECTOR_PURPLE + "exitX=0.5;exitY=1;entryX=0.5;entryY=0;labelBackgroundColor=#FFFDF8;fontColor=#6D28D9;fontSize=8.5;fontStyle=1;"
});

addCell({
  source: e3,
  target: s3,
  edge: true,
  value: "Direct Presigned S3 URLs (Course Audio Files, Signed PDF Certificates)",
  style: S_CONNECTOR_AMBER + "exitX=0.5;exitY=1;entryX=0.5;entryY=0;labelBackgroundColor=#FFFDF8;fontColor=#9A3412;fontSize=8.5;fontStyle=1;"
});

// L4 to L5
addCell({
  source: s1,
  target: d2,
  edge: true,
  value: "REST API: JSON-LD W3C Verifiable Credential Push",
  style: S_CONNECTOR_CYAN + "exitX=0.5;exitY=1;entryX=0.5;entryY=0;labelBackgroundColor=#FFFDF8;fontColor=#047857;fontSize=8.5;fontStyle=1;"
});

addCell({
  source: s2,
  target: d3,
  edge: true,
  value: "REST API: Ingest National Vacancies &amp; Verify PACS Reg ID",
  style: S_CONNECTOR_PURPLE + "exitX=0.5;exitY=1;entryX=0.5;entryY=0;labelBackgroundColor=#FFFDF8;fontColor=#6D28D9;fontSize=8.5;fontStyle=1;"
});

addCell({
  source: s3,
  target: d5,
  edge: true,
  value: "REST API: DLT-Approved Notification Template &amp; OTP Disbursal",
  style: S_CONNECTOR_AMBER + "exitX=0.5;exitY=1;entryX=0.5;entryY=0;labelBackgroundColor=#FFFDF8;fontColor=#9A3412;fontSize=8.5;fontStyle=1;"
});

// ---------------------------------------------------------
// ASSEMBLE XML
// ---------------------------------------------------------
let xml = `<mxfile host="Electron" modified="${new Date().toISOString()}" agent="Arkitect" version="21.6.8" type="device">\n`;
xml += `  <diagram id="sahakar-setu-blueprint" name="Sahakar-Setu Architecture">\n`;
xml += `    <mxGraphModel dx="1920" dy="1080" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1920" pageHeight="1080" background="#FAF6ED" math="0" shadow="0">\n`;
xml += `      <root>\n`;
xml += `        <mxCell id="0"/>\n`;
xml += `        <mxCell id="1" parent="0"/>\n`;

for (const c of cells) {
  if (c.edge) {
    xml += `        <mxCell id="${c.id}" value="${c.value}" style="${c.style}" edge="1" parent="${c.parent}" source="${c.source}" target="${c.target}">\n`;
    xml += `          <mxGeometry relative="1" as="geometry"/>\n`;
    xml += `        </mxCell>\n`;
  } else {
    xml += `        <mxCell id="${c.id}" value="${c.value}" style="${c.style}" vertex="1" parent="${c.parent}">\n`;
    xml += `          <mxGeometry x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" as="geometry"/>\n`;
    xml += `        </mxCell>\n`;
  }
}

xml += `      </root>\n`;
xml += `    </mxGraphModel>\n`;
xml += `  </diagram>\n`;
xml += `</mxfile>\n`;

const outPath = path.resolve('d:/sih-26087/docs/sahakar_setu_architecture.drawio');
fs.writeFileSync(outPath, xml, 'utf8');
console.log('Successfully written Draw.io diagram to:', outPath);
