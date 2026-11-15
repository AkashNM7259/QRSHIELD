# QRShield Backend — Security & Fraud Detection API

> **"Scan Smart. Detect Threats. Stay Protected."**

QRShield Backend is an intelligent cybersecurity REST API built with Python, Flask, SQLAlchemy, OpenCV, ReportLab, and Scikit-Learn. It is engineered to decode QR codes safely, dissect URL structures, prevent SSRF, detect brand typosquatting, analyze UPI payment payloads, verify physical QR stand tampering via cryptographic destination matching, calculate explainable 0–100 risk scores, and generate forensic PDF security reports.

---

## 🏗️ Architecture & Directory Structure

```
backend/
├── app.py                      # Flask application factory & runner
├── config.py                   # Environment-driven configuration & risk weights
├── database.py                 # SQLAlchemy scoped engine & session management
├── models.py                   # Relational ORM models (Users, QRScans, ThreatAnalysis, etc.)
├── requirements.txt            # Python dependencies
├── .env.example                # Example environment variable file
│
├── routes/                     # Blueprint API routes
│   ├── __init__.py
│   ├── scan_routes.py          # POST /api/scan (Image & payload decoding)
│   ├── url_routes.py           # POST /api/analyze-url
│   ├── payment_routes.py       # POST /api/analyze-payment, POST /api/analyze-upi
│   ├── verification_routes.py  # POST /api/register-qr, POST /api/verify-qr, GET /api/registered-qrs
│   ├── history_routes.py       # GET /api/history, DELETE /api/history/<id>
│   ├── report_routes.py        # GET /api/report/<scan_id> (PDF download & JSON metadata)
│   └── dashboard_routes.py     # GET /api/dashboard, GET /api/dashboard/stats
│
├── services/                   # Modular cybersecurity forensic engines
│   ├── __init__.py
│   ├── qr_decoder.py           # OpenCV & Pillow multi-detector QR reader
│   ├── url_analyzer.py         # URL forensics, entropy, punycode & typosquatting
│   ├── threat_intelligence.py  # Google Safe Browsing v4 & local threat database
│   ├── payment_analyzer.py     # NPCI UPI protocol inspector & payee mismatch detector
│   ├── qr_verifier.py          # Cryptographic SHA-256 destination fingerprinting
│   ├── risk_engine.py          # Explainable 0-100 heuristic scoring engine
│   └── report_generator.py     # ReportLab professional PDF report compiler
│
├── utils/                      # Shared cybersecurity utilities
│   ├── __init__.py
│   ├── security.py             # SSRF prevention, IP validation, canonicalization & hashing
│   └── validators.py           # File MIME type, upload limits & syntax validation
│
└── tests/                      # Automated test suite (15 unit/integration tests)
    ├── __init__.py
    ├── run_all_tests.py        # Master test runner
    ├── test_scanner.py         # Tests 1 & 2 (QR decoding & invalid images)
    ├── test_url_analyzer.py    # Tests 3, 4, 10 & 10b (Suspicious, malicious, API offline)
    ├── test_payment.py         # Tests 5, 6 & 6b (Valid UPI & recipient mismatch)
    ├── test_verification.py    # Tests 7, 8, 9 & 9b (Tamper check & registration)
    └── test_report.py          # PDF generation & download tests
```

---

## ⚡ Quick Start

### 1. Installation
Ensure Python 3.10+ is installed:
```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Launch the Backend Server
```bash
python app.py
```
The server will start at **`http://localhost:5000`** with pre-seeded verified merchant data (Starbucks, Apollo Pharmacy, Decathlon, Blue Tokai).

---

## 🧪 Running Automated Tests

Run the complete 15-test automated test suite:
```bash
python -u tests/run_all_tests.py
```
Or via standard unittest:
```bash
python -m unittest discover tests
```

### Verified Test Matrix:
| # | Test Scenario | Module | Status |
|---|---------------|--------|--------|
| 1 | Valid URL QR Code Scanning | `test_scanner.py` | ✅ PASSED |
| 2 | Invalid / Blank QR Image Handling | `test_scanner.py` | ✅ PASSED |
| 3 | Corrupted File Upload Rejection | `test_scanner.py` | ✅ PASSED |
| 4 | Suspicious URL with Shortener | `test_url_analyzer.py` | ✅ PASSED |
| 5 | Known Malicious URL Fixture Detection | `test_url_analyzer.py` | ✅ PASSED |
| 6 | Threat Intelligence API Unavailable (Fallback) | `test_url_analyzer.py` | ✅ PASSED |
| 7 | Homograph Punycode Domain Detection | `test_url_analyzer.py` | ✅ PASSED |
| 8 | Valid Registered UPI Payment QR Code | `test_payment.py` | ✅ PASSED |
| 9 | Payment Recipient Identity Mismatch | `test_payment.py` | ✅ PASSED |
| 10 | Malformed UPI Scheme Handling | `test_payment.py` | ✅ PASSED |
| 11 | Correct Registered QR -> `VERIFIED` | `test_verification.py` | ✅ PASSED |
| 12 | Altered QR Destination -> `DESTINATION_CHANGED` | `test_verification.py` | ✅ PASSED |
| 13 | Unregistered QR -> `NOT_REGISTERED` | `test_verification.py` | ✅ PASSED |
| 14 | Register New Merchant QR Code | `test_verification.py` | ✅ PASSED |
| 15 | PDF Security Report Generation & Download | `test_report.py` | ✅ PASSED |

---

## 📡 REST API Reference

### 1. Ingest & Analyze QR Code
`POST /api/scan`
- **Body**: Multipart form (`file` or `image`) OR JSON (`{ "rawData": "..." }`)
- **Response**:
```json
{
  "success": true,
  "scan_id": 1,
  "id": "SCAN-1",
  "content_type": "URL",
  "rawData": "https://checkout.decathlon.in/store/402/express",
  "risk_score": 0,
  "risk_level": "LOW",
  "findings": [],
  "explanation": "VERIFIED LOW RISK: Scanned QR code matches baseline cybersecurity and cryptographic standards (Threat Score: 0/100).",
  "recommendation": "Asset verified clean. Standard digital security hygiene applies.",
  "analysis_status": "COMPLETE",
  "verification_result": {
    "status": "VERIFIED",
    "tamper_detected": false
  }
}
```

### 2. Deep URL Forensics
`POST /api/analyze-url`
- **Body**: `{ "url": "http://185.220.101.5/bank/sbi-kyc-update.php?ref=qr89" }`
- **Response**:
```json
{
  "success": true,
  "domain": "185.220.101.5",
  "protocol": "http",
  "is_https": false,
  "is_ip_address": true,
  "safety_verdict": "MALICIOUS",
  "risk_score": 95,
  "risk_level": "HIGH",
  "threat_flags": [
    "Cleartext HTTP protocol in use. Vulnerable to interception on untrusted networks.",
    "Direct numerical IP address hostname used instead of registered domain name."
  ]
}
```

### 3. UPI Payment Security & Mismatch Check
`POST /api/analyze-payment`
- **Body**: `{ "upiUri": "upi://pay?pa=fake.starbucks@ybl&pn=Starbucks%20Coffee&mc=5812&cu=INR" }`
- **Response**:
```json
{
  "success": true,
  "vpa": "fake.starbucks@ybl",
  "payee_name": "Starbucks Coffee",
  "is_name_mismatch": true,
  "risk_score": 85,
  "risk_level": "HIGH",
  "flags": [
    "CRITICAL FRAUD ALERT: Display Name asserts 'Starbucks Coffee', but payment routes to unrelated account 'fake.starbucks@ybl'."
  ],
  "safety_advice": [
    "STOP: High likelihood of physical QR sticker overlay swap on store counter.",
    "CRITICAL: Never enter your UPI PIN to receive money or cashbacks. Entering your PIN always DEBITS funds."
  ]
}
```

### 4. Register Merchant QR Destination
`POST /api/register-qr`
- **Body**:
```json
{
  "businessName": "Starbucks Coffee - Bandra Flagship",
  "qrName": "Counter 1 Billing POS",
  "destination": "upi://pay?pa=starbucks.bandra@hdfcbank&pn=Starbucks%20Coffee&mc=5812&cu=INR",
  "verifiedUpiId": "starbucks.bandra@hdfcbank",
  "storeLocation": "Linking Road, Bandra West, Mumbai"
}
```

### 5. Verify Scanned QR Against Registry
`POST /api/verify-qr`
- **Body**: `{ "payload": "upi://pay?pa=fake.starbucks@ybl&pn=Starbucks%20Coffee" }`
- **Response**:
```json
{
  "success": true,
  "status": "DESTINATION_CHANGED",
  "tamper_detected": true,
  "mismatch_details": "Registered merchant 'Starbucks Coffee - Bandra Flagship' requires verified VPA 'starbucks.bandra@hdfcbank', but scanned QR routes to an unauthorized destination."
}
```

### 6. Generate & Download PDF Security Report
`GET /api/report/<scan_id>`
- Streams a ReportLab-generated PDF file (`QRShield_Report_<scan_id>.pdf`).
- Pass `?format=json` for JSON metadata view.

### 7. Telemetry Dashboard
`GET /api/dashboard`
- Returns total scans, safe/suspicious/high-risk counters, risk distribution donut ratios, and weekly threat telemetry.

### 8. Service Health Check
`GET /api/health`
- Returns status of API server, threat intelligence engine, and database connectivity.

---

## 🔒 Cybersecurity Safeguards
1. **SSRF Defense**: The backend blocks all attempts to connect to internal or loopback IP ranges (`127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254`, `::1`).
2. **Zero Auto-Execution**: Scanned payloads are parsed strictly as passive data and never evaluated or navigated to automatically.
3. **Sensitive Banking Credential Shield**: The system never asks for or stores UPI PINs, OTPs, CVVs, or bank passwords.
4. **Path Traversal Protection**: PDF report paths are validated with `werkzeug.utils.secure_filename`.
5. **SQL Injection Prevention**: All queries execute through SQLAlchemy parameterized ORM interfaces.

---

## 🌐 Frontend Integration

The React frontend communicates directly with this Flask backend via `http://localhost:5000`.
- Set `VITE_API_BASE_URL=http://localhost:5000` in the frontend `.env`.
- If the backend is running, the frontend top navbar will show a green **"API CONNECTED"** badge.
- If the backend is stopped, the frontend seamlessly switches to its built-in client heuristic engine with an explicit Demo Mode warning banner.

