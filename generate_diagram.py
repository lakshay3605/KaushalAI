import os

def generate_svg():
    width = 1920
    height = 1080
    
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%">
  <defs>
    <!-- Drop Shadow Filter -->
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="125%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#4A3B32" flood-opacity="0.08"/>
    </filter>
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <!-- Markers for Orthogonal Arrows -->
    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#1E3A8A"/>
    </marker>
    <marker id="arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#047857"/>
    </marker>
    <marker id="arrow-amber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#B45309"/>
    </marker>
  </defs>

  <!-- Canvas Background (Formal Cream Theme) -->
  <rect width="{width}" height="{height}" fill="#FDFBF7"/>
  <rect x="20" y="20" width="{width-40}" height="{height-40}" rx="16" fill="#F8F4EC" stroke="#E6DED2" stroke-width="2"/>

  <!-- Main Title Banner -->
  <g id="header">
    <text x="{width/2}" y="65" text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800" fill="#0F172A" letter-spacing="1">
      SAHAKAR-SETU: MASTER TECHNICAL SYSTEM ARCHITECTURE &amp; DATA FLOW
    </text>
    <text x="{width/2}" y="95" text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#64748B" letter-spacing="0.5">
      Ministry of Cooperation | National Council for Cooperative Training (NCCT) | 45 Integrated Subsystem Components
    </text>
  </g>

  <!-- ========================================== -->
  <!-- LAYER 1: CLIENT & PHYSICAL EDGE (Y: 120-290) -->
  <!-- ========================================== -->
  <rect x="50" y="115" width="1820" height="175" rx="12" fill="#FFFFFF" stroke="#E2D9CC" stroke-width="1.5" filter="url(#cardShadow)"/>
  <rect x="50" y="115" width="1820" height="32" rx="12" fill="#EFE8DC"/>
  <text x="75" y="137" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#1E293B" letter-spacing="0.5">
    LAYER 1: CLIENT ACCESS &amp; PHYSICAL EDGE DEVICES
  </text>

  <!-- Panel A: Web & Mobile Clients (Left Box) -->
  <g transform="translate(70, 155)">
    <rect width="1170" height="120" rx="8" fill="#FAF7F2" stroke="#E2D9CC"/>
    <text x="15" y="22" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#047857">PANEL A: MOBILE &amp; WEB CLIENTS</text>
    
    <!-- Client Cards -->
    <g transform="translate(15, 32)">
      <!-- Card 1 -->
      <rect width="150" height="75" rx="6" fill="#FFFFFF" stroke="#CBD5E1"/>
      <text x="75" y="24" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#0F172A">Trainee Mobile PWA</text>
      <text x="75" y="42" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#64748B">Next.js 14, Serwist</text>
      <text x="75" y="58" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#047857">IndexedDB Offline</text>

      <!-- Card 2 -->
      <g transform="translate(162, 0)">
        <rect width="150" height="75" rx="6" fill="#FFFFFF" stroke="#CBD5E1"/>
        <text x="75" y="24" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#0F172A">Voice &amp; Chatbot UI</text>
        <text x="75" y="42" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#64748B">MediaRecorder API</text>
        <text x="75" y="58" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#0284C7">22 Indic Languages</text>
      </g>

      <!-- Card 3 -->
      <g transform="translate(324, 0)">
        <rect width="155" height="75" rx="6" fill="#FFFFFF" stroke="#CBD5E1"/>
        <text x="77" y="24" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#0F172A">Institute ERP Portal</text>
        <text x="77" y="42" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#64748B">React, TanStack Table</text>
        <text x="77" y="58" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#475569">FullCalendar Sched.</text>
      </g>

      <!-- Card 4 -->
      <g transform="translate(491, 0)">
        <rect width="155" height="75" rx="6" fill="#FFFFFF" stroke="#CBD5E1"/>
        <text x="77" y="24" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#0F172A">Hostel &amp; Mess UI</text>
        <text x="77" y="42" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#64748B">Dynamic Bed Grid</text>
        <text x="77" y="58" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#D97706">Coupon Disbursal</text>
      </g>

      <!-- Card 5 -->
      <g transform="translate(658, 0)">
        <rect width="155" height="75" rx="6" fill="#FFFFFF" stroke="#CBD5E1"/>
        <text x="77" y="24" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#0F172A">PACS Bulk Sponsor</text>
        <text x="77" y="42" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#64748B">Society Nomination</text>
        <text x="77" y="58" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#475569">CSV Bulk Engine</text>
      </g>

      <!-- Card 6 -->
      <g transform="translate(825, 0)">
        <rect width="155" height="75" rx="6" fill="#FFFFFF" stroke="#CBD5E1"/>
        <text x="77" y="24" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#0F172A">Cooperative Jobs</text>
        <text x="77" y="42" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#64748B">Recruiter Portal</text>
        <text x="77" y="58" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#059669">1-Click Apply</text>
      </g>

      <!-- Card 7 -->
      <g transform="translate(992, 0)">
        <rect width="150" height="75" rx="6" fill="#FFFFFF" stroke="#CBD5E1"/>
        <text x="75" y="24" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#0F172A">Ministry Cockpit</text>
        <text x="75" y="42" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#64748B">Apache Superset</text>
        <text x="75" y="58" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#DC2626">Live Pan-India BI</text>
      </g>
    </g>
  </g>

  <!-- Panel B: Hardware Kiosk at Doorway (Right Box) -->
  <g transform="translate(1260, 155)">
    <rect width="590" height="120" rx="8" fill="#FFFBEB" stroke="#FDE68A"/>
    <text x="15" y="22" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#B45309">PANEL B: PHYSICAL HARDWARE KIOSK (CLASSROOM DOOR)</text>
    
    <g transform="translate(15, 32)">
      <rect width="130" height="75" rx="6" fill="#FFFFFF" stroke="#FCD34D"/>
      <text x="65" y="24" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#78350F">8" Tablet Enclosure</text>
      <text x="65" y="42" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#64748B">Tamper-Proof VESA</text>
      <text x="65" y="58" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#D97706">5000mAh Battery</text>

      <g transform="translate(142, 0)">
        <rect width="135" height="75" rx="6" fill="#FFFFFF" stroke="#FCD34D"/>
        <text x="67" y="24" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#78350F">HD Optical Sensor</text>
        <text x="67" y="42" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#64748B">Wide Dynamic Range</text>
        <text x="67" y="58" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#D97706">Low-Light Enhanced</text>
      </g>

      <g transform="translate(287, 0)">
        <rect width="135" height="75" rx="6" fill="#FFFFFF" stroke="#FCD34D"/>
        <text x="67" y="24" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#78350F">INT8 Face ONNX</text>
        <text x="67" y="42" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#64748B">&lt;80ms Match in RAM</text>
        <text x="67" y="58" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#16A34A">MiniFASNet Liveness</text>
      </g>

      <g transform="translate(432, 0)">
        <rect width="130" height="75" rx="6" fill="#FFFFFF" stroke="#FCD34D"/>
        <text x="65" y="24" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#78350F">Offline SQLite</text>
        <text x="65" y="42" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#64748B">50,000 Event Queue</text>
        <text x="65" y="58" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" fill="#2563EB">Dynamic QR Backup</text>
      </g>
    </g>
  </g>

  <!-- ========================================== -->
  <!-- CONNECTORS: L1 -> L2 (Y: 290 to 330)      -->
  <!-- ========================================== -->
  <!-- Connector 1: PWA/Web -> Gateway -->
  <path d="M 650 290 L 650 330" fill="none" stroke="#1E3A8A" stroke-width="2.5" marker-end="url(#arrow)"/>
  <rect x="420" y="300" width="460" height="22" rx="4" fill="#FFFFFF" stroke="#CBD5E1"/>
  <text x="650" y="315" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#1E3A8A">
    HTTPS / TLS 1.3: Voice Audio (WebM), Phone OTP, Profile Updates, Bulk CSV Rosters
  </text>

  <!-- Connector 2: Kiosk -> Gateway -->
  <path d="M 1555 290 L 1555 330" fill="none" stroke="#B45309" stroke-width="2.5" marker-end="url(#arrow-amber)"/>
  <rect x="1360" y="300" width="390" height="22" rx="4" fill="#FFFFFF" stroke="#FDE68A"/>
  <text x="1555" y="315" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#B45309">
    HMAC-SHA256 Encrypted Sync: 128-d Face Vectors, KioskID, Timestamps (No Raw Photos)
  </text>


  <!-- ========================================== -->
  <!-- LAYER 2: API GATEWAY & SECURITY (Y: 330-390) -->
  <!-- ========================================== -->
  <rect x="50" y="330" width="1820" height="60" rx="10" fill="#1E293B" stroke="#0F172A" stroke-width="1.5" filter="url(#cardShadow)"/>
  <text x="90" y="365" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#38BDF8" letter-spacing="1">
    LAYER 2: UNIFIED API GATEWAY &amp; REVERSE PROXY
  </text>
  
  <g transform="translate(560, 342)">
    <rect width="180" height="35" rx="6" fill="#334155"/>
    <text x="90" y="22" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#F8FAFC">Nginx / Cloudflare Edge</text>

    <g transform="translate(200, 0)">
      <rect width="180" height="35" rx="6" fill="#334155"/>
      <text x="90" y="22" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#F8FAFC">TLS 1.3 Strict Cipher</text>
    </g>

    <g transform="translate(400, 0)">
      <rect width="210" height="35" rx="6" fill="#334155"/>
      <text x="105" y="22" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#F8FAFC">WAF &amp; Rate Limiting (Token Bucket)</text>
    </g>

    <g transform="translate(630, 0)">
      <rect width="220" height="35" rx="6" fill="#334155"/>
      <text x="110" y="22" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#38BDF8">JWT &amp; RBAC Multi-Institute Filter</text>
    </g>
  </g>


  <!-- ========================================== -->
  <!-- CONNECTORS: L2 -> L3 (Y: 390 to 425)      -->
  <!-- ========================================== -->
  <path d="M 960 390 L 960 425" fill="none" stroke="#1E293B" stroke-width="2.5" marker-end="url(#arrow)"/>
  <rect x="760" y="398" width="400" height="20" rx="4" fill="#FFFFFF" stroke="#CBD5E1"/>
  <text x="960" y="412" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#1E293B">
    Internal Reverse Proxy Dispatch (/api/v1/auth, /erp, /lms, /jobs, /creds)
  </text>


  <!-- ========================================== -->
  <!-- LAYER 3: CORE MODULAR MONOLITH (Y: 425-615)-->
  <!-- ========================================== -->
  <rect x="50" y="425" width="1820" height="190" rx="12" fill="#FFFFFF" stroke="#E2D9CC" stroke-width="1.5" filter="url(#cardShadow)"/>
  <rect x="50" y="425" width="1820" height="32" rx="12" fill="#EFE8DC"/>
  <text x="75" y="447" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#1E293B" letter-spacing="0.5">
    LAYER 3: CORE APPLICATION MODULAR MONOLITH (FastAPI High-Performance Async Backend)
  </text>

  <!-- Monolith Engines -->
  <g transform="translate(70, 470)">
    <!-- Engine 1 -->
    <rect width="280" height="130" rx="8" fill="#F8FAFC" stroke="#CBD5E1"/>
    <rect width="280" height="28" rx="8" fill="#E2E8F0"/>
    <text x="140" y="19" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#0F172A">ERP &amp; Academic Workflow</text>
    <text x="15" y="52" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#334155">• Camunda BPMN State Machine</text>
    <text x="15" y="70" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#334155">• Multi-Tier Sponsoring Approvals</text>
    <text x="15" y="88" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#334155">• Conflict-Free Timetable Scheduler</text>
    <text x="15" y="106" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#047857">• PostgreSQL pg_trgm Fuzzy Dedup</text>

    <!-- Engine 2 -->
    <g transform="translate(300, 0)">
      <rect width="280" height="130" rx="8" fill="#F8FAFC" stroke="#CBD5E1"/>
      <rect width="280" height="28" rx="8" fill="#E2E8F0"/>
      <text x="140" y="19" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#0F172A">Hostel &amp; Logistics Engine</text>
      <text x="15" y="52" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#334155">• Dynamic Room &amp; Bed Matrix Grid</text>
      <text x="15" y="70" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#334155">• Gender &amp; Date Batch Constraints</text>
      <text x="15" y="88" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#334155">• Real-Time Check-In / Occupancy</text>
      <text x="15" y="106" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#D97706">• Mess Meal Coupon QR Issuance</text>
    </g>

    <!-- Engine 3 -->
    <g transform="translate(600, 0)">
      <rect width="280" height="130" rx="8" fill="#F8FAFC" stroke="#CBD5E1"/>
      <rect width="280" height="28" rx="8" fill="#E2E8F0"/>
      <text x="140" y="19" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#0F172A">Attendance &amp; Stipend Engine</text>
      <text x="15" y="52" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#334155">• Biometric Log Ingestion &amp; Verification</text>
      <text x="15" y="70" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#334155">• Automated TA/DA Stipend Calculator</text>
      <text x="15" y="88" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#DC2626">• Anomaly &amp; Duplicate Claim Gate</text>
      <text x="15" y="106" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#047857">• Direct Benefit Transfer (DBT) Output</text>
    </g>

    <!-- Engine 4 -->
    <g transform="translate(900, 0)">
      <rect width="280" height="130" rx="8" fill="#F8FAFC" stroke="#CBD5E1"/>
      <rect width="280" height="28" rx="8" fill="#E2E8F0"/>
      <text x="140" y="19" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#0F172A">Multilingual LMS &amp; Sandbox</text>
      <text x="15" y="52" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#334155">• Audio-First Micro-Lessons (&lt;2MB)</text>
      <text x="15" y="70" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#334155">• 22-Module PACS ERP Simulator</text>
      <text x="15" y="88" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#334155">• Client-Side Quiz Scoring Engine</text>
      <text x="15" y="106" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#2563EB">• Synchronizes Integer Score Only</text>
    </g>

    <!-- Engine 5 -->
    <g transform="translate(1200, 0)">
      <rect width="280" height="130" rx="8" fill="#F8FAFC" stroke="#CBD5E1"/>
      <rect width="280" height="28" rx="8" fill="#E2E8F0"/>
      <text x="140" y="19" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#0F172A">Cryptographic Credentials</text>
      <text x="15" y="52" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#334155">• W3C Verifiable Credential Model</text>
      <text x="15" y="70" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#334155">• Ed25519 64-Byte Digital Signature</text>
      <text x="15" y="88" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#334155">• High-Density 2D QR Code Stamping</text>
      <text x="15" y="106" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#047857">• Zero Blockchain / $0 Gas Fees</text>
    </g>

    <!-- Engine 6 -->
    <g transform="translate(1500, 0)">
      <rect width="280" height="130" rx="8" fill="#F8FAFC" stroke="#CBD5E1"/>
      <rect width="280" height="28" rx="8" fill="#E2E8F0"/>
      <text x="140" y="19" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#0F172A">Job Matching &amp; Guidance</text>
      <text x="15" y="52" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#334155">• Deterministic Candidate Ranker</text>
      <text x="15" y="70" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#334155">• Score = w1(Grade)+w2(Dist)+w3(Rec)</text>
      <text x="15" y="88" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#334155">• AI Voice Career Counseling Bot</text>
      <text x="15" y="106" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#059669">• 1-Click Verified Transcript Apply</text>
    </g>
  </g>


  <!-- ========================================== -->
  <!-- CONNECTORS: L3 -> L4 (Y: 615 to 655)      -->
  <!-- ========================================== -->
  <path d="M 350 615 L 350 655" fill="none" stroke="#047857" stroke-width="2" marker-end="url(#arrow-green)"/>
  <rect x="180" y="625" width="340" height="20" rx="4" fill="#FFFFFF" stroke="#CBD5E1"/>
  <text x="350" y="639" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" font-weight="600" fill="#047857">
    SQL with Row-Level Security (RLS) Tenant Isolation
  </text>

  <path d="M 960 615 L 960 655" fill="none" stroke="#1E3A8A" stroke-width="2" marker-end="url(#arrow)"/>
  <rect x="810" y="625" width="300" height="20" rx="4" fill="#FFFFFF" stroke="#CBD5E1"/>
  <text x="960" y="639" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" font-weight="600" fill="#1E3A8A">
    Pub/Sub Event Bus &amp; Celery Async Queues
  </text>

  <path d="M 1550 615 L 1550 655" fill="none" stroke="#B45309" stroke-width="2" marker-end="url(#arrow-amber)"/>
  <rect x="1390" y="625" width="320" height="20" rx="4" fill="#FFFFFF" stroke="#CBD5E1"/>
  <text x="1550" y="639" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" font-weight="600" fill="#B45309">
    Direct Presigned S3 URLs (Audio Chunks &amp; Signed PDFs)
  </text>


  <!-- ========================================== -->
  <!-- LAYER 4: PERSISTENCE & STORAGE (Y: 655-775)-->
  <!-- ========================================== -->
  <rect x="50" y="655" width="1820" height="120" rx="12" fill="#FFFFFF" stroke="#E2D9CC" stroke-width="1.5" filter="url(#cardShadow)"/>
  <rect x="50" y="655" width="1820" height="28" rx="12" fill="#EFE8DC"/>
  <text x="75" y="674" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#1E293B" letter-spacing="0.5">
    LAYER 4: PERSISTENCE &amp; DATA STORAGE LAYER
  </text>

  <g transform="translate(70, 695)">
    <!-- DB 1 -->
    <rect width="560" height="68" rx="8" fill="#F0FDF4" stroke="#BBF7D0"/>
    <text x="20" y="26" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#14532D">Primary Relational DB: PostgreSQL 16</text>
    <text x="20" y="48" font-family="system-ui, sans-serif" font-size="10" fill="#166534">Multi-Tenant Row-Level Security (RLS) | pg_trgm Bi-Gram Matching | ACID Attendance Ledger</text>

    <!-- DB 2 -->
    <g transform="translate(600, 0)">
      <rect width="560" height="68" rx="8" fill="#EFF6FF" stroke="#BFDBFE"/>
      <text x="20" y="26" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#1E3A8A">In-Memory Cache &amp; Broker: Redis 7</text>
      <text x="20" y="48" font-family="system-ui, sans-serif" font-size="10" fill="#1D4ED8">Session Store | Celery Task Queues (Stipends, SMS, PDF Rendering) | Token Rate Limit Counters</text>
    </g>

    <!-- DB 3 -->
    <g transform="translate(1200, 0)">
      <rect width="580" height="68" rx="8" fill="#FFFBEB" stroke="#FDE68A"/>
      <text x="20" y="26" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#78350F">Object Storage: Cloudflare R2 / AWS S3</text>
      <text x="20" y="48" font-family="system-ui, sans-serif" font-size="10" fill="#92400E">Micro-Lesson Audio Bundles (&lt;2MB) | Tamper-Proof Cryptographic Certificate PDFs with 2D QR</text>
    </g>
  </g>


  <!-- ========================================== -->
  <!-- CONNECTORS: L4 -> L5 (Y: 775 to 815)      -->
  <!-- ========================================== -->
  <path d="M 230 775 L 230 815" fill="none" stroke="#047857" stroke-width="2" marker-end="url(#arrow-green)"/>
  <rect x="90" y="785" width="280" height="20" rx="4" fill="#FFFFFF" stroke="#CBD5E1"/>
  <text x="230" y="799" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" font-weight="600" fill="#047857">
    gRPC Audio Streams (ASR &amp; TTS)
  </text>

  <path d="M 590 775 L 590 815" fill="none" stroke="#1E3A8A" stroke-width="2" marker-end="url(#arrow)"/>
  <rect x="470" y="785" width="240" height="20" rx="4" fill="#FFFFFF" stroke="#CBD5E1"/>
  <text x="590" y="799" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" font-weight="600" fill="#1E3A8A">
    JSON-LD W3C Verifiable Credential
  </text>

  <path d="M 960 775 L 960 815" fill="none" stroke="#059669" stroke-width="2" marker-end="url(#arrow-green)"/>
  <rect x="840" y="785" width="240" height="20" rx="4" fill="#FFFFFF" stroke="#CBD5E1"/>
  <text x="960" y="799" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" font-weight="600" fill="#059669">
    REST: Bidirectional Vacancy Sync
  </text>

  <path d="M 1330 775 L 1330 815" fill="none" stroke="#7C3AED" stroke-width="2" marker-end="url(#arrow)"/>
  <rect x="1210" y="785" width="240" height="20" rx="4" fill="#FFFFFF" stroke="#CBD5E1"/>
  <text x="1330" y="799" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" font-weight="600" fill="#7C3AED">
    REST: PACS Registration Verification
  </text>

  <path d="M 1690 775 L 1690 815" fill="none" stroke="#DC2626" stroke-width="2" marker-end="url(#arrow)"/>
  <rect x="1560" y="785" width="260" height="20" rx="4" fill="#FFFFFF" stroke="#CBD5E1"/>
  <text x="1690" y="799" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" font-weight="600" fill="#DC2626">
    REST: DLT Notification Payload
  </text>


  <!-- ========================================== -->
  <!-- LAYER 5: EXTERNAL DPI & AI (Y: 815-970)   -->
  <!-- ========================================== -->
  <rect x="50" y="815" width="1820" height="150" rx="12" fill="#FFFFFF" stroke="#E2D9CC" stroke-width="1.5" filter="url(#cardShadow)"/>
  <rect x="50" y="815" width="1820" height="28" rx="12" fill="#EFE8DC"/>
  <text x="75" y="834" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#1E293B" letter-spacing="0.5">
    LAYER 5: NATIONAL DIGITAL PUBLIC INFRASTRUCTURE (DPI) &amp; EXTERNAL SERVICES
  </text>

  <g transform="translate(70, 855)">
    <!-- Card 1 -->
    <rect width="330" height="95" rx="8" fill="#FAF5FF" stroke="#E9D5FF"/>
    <text x="165" y="24" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#581C87">Bhashini / AI4Bharat Gateway</text>
    <text x="165" y="44" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#6B21A8">• IndicWhisper Speech-to-Text (ASR)</text>
    <text x="165" y="62" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#6B21A8">• IndicTrans2 Neural Translation (NMT)</text>
    <text x="165" y="80" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#6B21A8">• Meta MMS-TTS Audio Generation (22 Lang)</text>

    <!-- Card 2 -->
    <g transform="translate(360, 0)">
      <rect width="330" height="95" rx="8" fill="#EFF6FF" stroke="#BFDBFE"/>
      <text x="165" y="24" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#1E3A8A">DigiLocker &amp; NAD API</text>
      <text x="165" y="44" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#1D4ED8">• Permanent W3C Credential Vault</text>
      <text x="165" y="62" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#1D4ED8">• Direct Push to Trainee Aadhaar Locker</text>
      <text x="165" y="80" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#1D4ED8">• National Academic Depository Compliance</text>
    </g>

    <!-- Card 3 -->
    <g transform="translate(720, 0)">
      <rect width="330" height="95" rx="8" fill="#F0FDF4" stroke="#BBF7D0"/>
      <text x="165" y="24" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#065F46">National Career Service (NCS)</text>
      <text x="165" y="44" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#047857">• Ministry of Labour &amp; Employment Portal</text>
      <text x="165" y="62" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#047857">• Ingestion of 79,630 PACS Vacancies</text>
      <text x="165" y="80" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#047857">• Auto-Sync of Certified Alumni Pool</text>
    </g>

    <!-- Card 4 -->
    <g transform="translate(1080, 0)">
      <rect width="330" height="95" rx="8" fill="#FFF7ED" stroke="#FED7AA"/>
      <text x="165" y="24" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#9A3412">National Cooperative DB (NCD)</text>
      <text x="165" y="44" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#C2410C">• Master Registry of all Indian Cooperatives</text>
      <text x="165" y="62" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#C2410C">• Verification of Genuine Sponsoring PACS</text>
      <text x="165" y="80" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#C2410C">• Validates Legal Registration Numbers</text>
    </g>

    <!-- Card 5 -->
    <g transform="translate(1440, 0)">
      <rect width="340" height="95" rx="8" fill="#FEF2F2" stroke="#FECACA"/>
      <text x="170" y="24" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#991B1B">NIC SMS &amp; WhatsApp DLT Gateway</text>
      <text x="170" y="44" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#B91C1C">• Mandatory TRAI DLT Template Dispatch</text>
      <text x="170" y="62" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#B91C1C">• Transactional OTP &amp; Admission Passes</text>
      <text x="170" y="80" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#B91C1C">• TA/DA Stipend Bank Transfer Notifications</text>
    </g>
  </g>

  <!-- ========================================== -->
  <!-- FOOTER CALLOUT BADGES (Y: 980-1040)       -->
  <!-- ========================================== -->
  <g transform="translate(70, 985)">
    <rect width="560" height="45" rx="8" fill="#FFFFFF" stroke="#E2D9CC" filter="url(#cardShadow)"/>
    <text x="280" y="28" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#0F172A">
      ⚡ EDGE ATTENDANCE: &lt;80ms Face Match | 100% Offline SQLite | Zero Raw Photos (DPDP Act)
    </text>

    <g transform="translate(600, 0)">
      <rect width="560" height="45" rx="8" fill="#FFFFFF" stroke="#E2D9CC" filter="url(#cardShadow)"/>
      <text x="280" y="28" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#0F172A">
        🔒 VERIFICATION: Ed25519 2D QR | Sub-15ms Offline Validation | $0 Blockchain Gas Fees
      </text>
    </g>

    <g transform="translate(1200, 0)">
      <rect width="580" height="45" rx="8" fill="#FFFFFF" stroke="#E2D9CC" filter="url(#cardShadow)"/>
      <text x="290" y="28" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#0F172A">
        💰 INFRASTRUCTURE: Modular Monolith | Scales to 20 Institutes &amp; 79,630 PACS on &lt;$90/mo VPS
      </text>
    </g>
  </g>

</svg>"""

    with open("d:/sih-26087/master_architecture_cream.svg", "w", encoding="utf-8") as f:
        f.write(svg)
    print("SVG generated successfully at d:/sih-26087/master_architecture_cream.svg")

if __name__ == "__main__":
    generate_svg()
