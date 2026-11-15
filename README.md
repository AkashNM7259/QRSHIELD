# QRShield — AI-Powered QR Code Security & Fraud Detection System

> **"Scan Smart. Detect Threats. Stay Protected."**

QRShield is a premium, futuristic cybersecurity web application and Progressive Web App (PWA) designed to protect individuals and enterprises from malicious QR code campaigns, physical sticker overlay tampering (quishing), credential harvesting, and UPI payment destination hijacking.

---

## 🛡️ Key Cybersecurity Features

### 1. 3D Holographic Hero Experience
- **Interactive Three.js Shield Engine**: A transparent 3D faceted security shield surrounding a floating holographic QR code with dual counter-rotating particle rings and 75+ ambient parallax particles.
- **Dynamic Risk Level Adaptation**: The shield physically shifts its chromatic aura:
  - **Cyan/Electric Blue** for Verified Clean assets.
  - **Amber Glow** for Suspicious Anomalies.
  - **Crimson Neon** for Critical Phishing / Tampering Vectors.
- **Graceful CSS Fallback**: Lightweight CSS 3D transforms for low-power or non-WebGL devices.

### 2. Smart Zero-Trust QR Scanner
- **Live Camera Scanning**: High-speed real-time decoding via WebRTC (`getUserMedia`) and client-side `jsQR`.
- **Image Upload & Drag-and-Drop**: Direct client-side forensic inspection of saved screenshots and photos.
- **Manual Vector Lab**: Built-in simulation vectors for quick SOC threat drills.
- **Safe Inspection Panel**: **Never automatically opens extracted URLs or executes payloads.** Extracted content is isolated in a sandboxed inspection panel.

### 3. Deep URL Threat Intelligence
- **Heuristic Threat Scoring (0–100)**: Evaluates transport layer encryption, domain age, and brand proximity.
- **Anti-Typosquatting & Homograph Filters**: Flags Cyrillic/Punycode lookalikes (`xn--`) and deceptive domain permutations targeting major financial institutions (SBI, HDFC, ICICI, Paytm, etc.).
- **Raw IP & Shortener Detection**: Detects direct unencrypted IP hosting and resolves hidden redirect chains behind shorteners (`bit.ly`, `tinyurl`).

### 4. UPI Payment Security & Fraud Inspector
- **NPCI Specification Compliance**: Decodes VPA (`pa`), Payee Name (`pn`), Amount (`am`), Merchant Code (`mc`), and notes (`tn`).
- **Payee Identity Conflict Detection**: Identifies physical sticker replacement attacks where the declared business name contradicts the actual receiving bank account.
- **Anti-Fraud Advisories**: Strict warnings reinforcing that **UPI PIN is never required to receive money or refunds**.

### 5. QR Destination Replacement Detection (Anti-Tamper)
- **Cryptographic Destination Matching**: Audits newly scanned QR codes against the merchant master registry.
- **Clear Visual States**: `VERIFIED`, `DESTINATION CHANGED`, `NOT REGISTERED`, `UNVERIFIED`.
- **Side-by-Side Diff Forensics**: Highlights exactly what altered in the payload (swapped VPA, rogue redirect link).

### 6. Merchant QR Registration Vault
- Allows businesses to register authentic store stands with names, target destinations, categories, verified UPI VPAs, and physical store locations.
- Automatically generates high-resolution downloadable QR codes stamped with the QRShield verified security badge.

### 7. Instant Forensic PDF Security Reports
- Client-side PDF generation using `jsPDF`.
- Includes executive threat summary, technical indicators of compromise (IOCs), baseline compliance checks (NPCI 2.1, OWASP Mobile, TLS 1.3), and remediation protocols.

### 8. SOC Operations Dashboard
- Real-time statistics: Total Scans, Safe Destinations, Suspicious Flags, High-Risk Threats, and Registered Assets.
- Interactive weekly activity graphs and severity ratio donut visualizations.

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+ (Node.js portable v20 is bundled in `tools/node` for convenience)
- Python 3.10+ (for running the Python backend API)

### 1. Launch Frontend
```bash
# Start Vite development server
npm run dev

# Or build for production
npm run build
npm run preview
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Launch Python Backend REST API (Optional)
QRShield includes both FastAPI and Flask backend implementations:

**FastAPI / Uvicorn Server:**
```bash
python backend/server.py
```

**Flask Server:**
```bash
python backend/app.py
```
The server runs on `http://localhost:5000`.

> **Note**: If the backend server is not running, QRShield automatically engages its built-in **Local Heuristic Security Engine** with an explicit Demo Mode status badge, ensuring 100% of the UI, scanner, threat models, and PDF generators work immediately out-of-the-box!

---

## 🎨 Visual Design Specifications
- **Background**: Deep Midnight Black (`#070B14`)
- **Surfaces**: Dark Navy Glassmorphism (`#0D1525`)
- **Primary Accent**: Electric Blue (`#1677FF`)
- **Highlight Neon**: Cyber Cyan (`#00D9FF`)
- **Indicators**: Emerald Green (`#10B981`), Amber (`#F59E0B`), Crimson Red (`#EF4444`)
- **Typography**: Inter & JetBrains Mono

---

## 📂 Project Architecture

```
QR SHIELD/
├── backend/
│   ├── app.py              # Flask REST API implementation
│   └── server.py           # FastAPI REST API implementation
├── public/
│   ├── icon-192.svg        # PWA Icon (192px)
│   ├── icon-512.svg        # PWA Icon (512px)
│   └── manifest.json       # PWA Application Manifest
├── src/
│   ├── components/
│   │   ├── BottomNav.tsx             # Mobile bottom navigation bar
│   │   ├── HolographicShield3D.tsx   # Three.js 3D shield & particle canvas
│   │   ├── Navbar.tsx                # Cyber header with engine status
│   │   ├── RiskGauge.tsx             # Radial 0-100 score indicator
│   │   ├── SafeInspectionModal.tsx   # Sandboxed forensic results dialog
│   │   └── Sidebar.tsx               # Desktop & mobile navigation drawer
│   ├── pages/
│   │   ├── DashboardPage.tsx         # Telemetry metrics & activity graphs
│   │   ├── HeroLandingPage.tsx       # 3D Hero section & capability showcase
│   │   ├── QrVerificationPage.tsx    # Sticker replacement tamper audit
│   │   ├── RegisteredQrsPage.tsx     # Merchant vault & QR generator
│   │   ├── ScanHistoryPage.tsx       # Searchable incident audit trail
│   │   ├── ScannerPage.tsx           # Camera, upload, & manual scanner
│   │   ├── SecurityReportsPage.tsx   # Formal audit reports & PDF downloads
│   │   ├── SettingsPage.tsx          # API gateway & engine preferences
│   │   └── UrlAnalysisPage.tsx       # Deep web destination inspector
│   ├── services/
│   │   ├── api.ts                    # Central API service layer
│   │   ├── pdfReportGenerator.ts     # jsPDF audit report generator
│   │   └── securityEngine.ts         # Heuristic cybersecurity engine
│   ├── types/
│   │   └── index.ts                  # TypeScript security data models
│   ├── App.tsx                       # Root application shell
│   ├── index.css                     # Cyber glow, grid, and glass styling
│   └── main.tsx                      # React root entry point
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

