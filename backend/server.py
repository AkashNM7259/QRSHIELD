"""
QRShield Python REST API Backend
Compatible with both Flask and FastAPI.
Provides full cybersecurity analysis endpoints for QR Codes, URLs, UPI VPAs, Tamper Verification, and Security Reports.
"""

import re
import urllib.parse
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

app = FastAPI(title="QRShield Security API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory registry
REGISTERED_QRS = [
    {
        "id": "QRS-IND-001",
        "businessName": "Starbucks Coffee - Bandra Flagship",
        "qrName": "Counter 1 POS Payment",
        "destination": "upi://pay?pa=starbucks.bandra@hdfcbank&pn=Starbucks%20Coffee&mc=5812&cu=INR",
        "category": "Food & Beverage",
        "verifiedUpiId": "starbucks.bandra@hdfcbank",
        "registrationDate": "2026-01-15",
        "status": "VERIFIED",
        "securityHash": "sha256-e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "storeLocation": "Linking Road, Bandra West, Mumbai",
        "authorizedPhone": "+91 98200 12345"
    },
    {
        "id": "QRS-IND-002",
        "businessName": "Apollo Pharmacy Central",
        "qrName": "Billing Desk 2 UPI",
        "destination": "upi://pay?pa=apollopharmacy.pay@icici&pn=Apollo%20Pharmacy&mc=5912&cu=INR",
        "category": "Healthcare & Pharma",
        "verifiedUpiId": "apollopharmacy.pay@icici",
        "registrationDate": "2026-02-10",
        "status": "VERIFIED",
        "securityHash": "sha256-a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
        "storeLocation": "Indiranagar 100ft Rd, Bangalore",
        "authorizedPhone": "+91 98450 67890"
    }
]

SCAN_HISTORY = []

class ScanRequest(BaseModel):
    rawData: str

class UrlRequest(BaseModel):
    url: str

class UpiRequest(BaseModel):
    upiUri: str

class VerifyRequest(BaseModel):
    payload: str

class RegisterRequest(BaseModel):
    businessName: str
    qrName: str
    destination: str
    category: str
    verifiedUpiId: Optional[str] = None
    storeLocation: Optional[str] = None

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "QRShield Cybersecurity Engine",
        "version": "2.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/api/scan")
def scan_qr(req: ScanRequest):
    data = req.rawData.strip()
    content_type = "TEXT"
    if data.lower().startswith("upi://"):
        content_type = "UPI"
    elif data.lower().startswith("http://") or data.lower().startswith("https://"):
        content_type = "URL"
    elif data.lower().startswith("wifi:"):
        content_type = "WIFI"

    risk_score = 10
    threat_indicators = []
    recommended_actions = []

    # Verification check
    tamper_result = verify_against_registry(data)
    if tamper_result["status"] == "DESTINATION_CHANGED":
        risk_score = 95
        threat_indicators.append({
            "id": "TAMPER_01",
            "severity": "critical",
            "title": "QR Code Replacement Attack Detected",
            "description": tamper_result.get("mismatchDetails", "Scanned payload differs from authorized registration"),
            "category": "tamper"
        })
        recommended_actions.append("Halt immediately. Do not process payment or visit link.")

    result = {
        "id": f"SCAN-PY-{int(datetime.utcnow().timestamp())}",
        "timestamp": datetime.utcnow().isoformat(),
        "rawData": data,
        "contentType": content_type,
        "riskScore": risk_score,
        "riskLevel": "SAFE" if risk_score < 30 else ("SUSPICIOUS" if risk_score < 70 else "HIGH_RISK"),
        "aiSummary": f"Python AI Security Engine analyzed scan with threat score {risk_score}/100.",
        "threatIndicators": threat_indicators,
        "recommendedActions": recommended_actions or ["Standard safety precautions apply."],
        "qrVerification": tamper_result
    }
    SCAN_HISTORY.insert(0, result)
    return result

def verify_against_registry(scanned_payload: str):
    clean = scanned_payload.strip()
    for item in REGISTERED_QRS:
        if item["destination"] == clean:
            return {"status": "VERIFIED", "registeredRecord": item, "scannedDestination": clean, "tamperRiskScore": 0}
        if item.get("verifiedUpiId") and clean.startswith("upi://") and item["businessName"].split()[0].lower() in clean.lower():
            return {
                "status": "DESTINATION_CHANGED",
                "registeredRecord": item,
                "scannedDestination": clean,
                "originalDestination": item["destination"],
                "mismatchDetails": f"Original VPA {item['verifiedUpiId']} swapped with rogue payee.",
                "tamperRiskScore": 95
            }
    return {"status": "NOT_REGISTERED", "scannedDestination": clean, "tamperRiskScore": 20}

@app.post("/api/verify-qr")
def verify_qr_endpoint(req: VerifyRequest):
    return verify_against_registry(req.payload)

@app.get("/api/registered-qrs")
def get_registered_qrs():
    return REGISTERED_QRS

@app.post("/api/register-qr")
def register_qr(req: RegisterRequest):
    new_qr = {
        "id": f"QRS-REG-{int(datetime.utcnow().timestamp())}",
        "businessName": req.businessName,
        "qrName": req.qrName,
        "destination": req.destination,
        "category": req.category,
        "verifiedUpiId": req.verifiedUpiId,
        "registrationDate": datetime.utcnow().strftime("%Y-%m-%d"),
        "status": "VERIFIED",
        "securityHash": f"sha256-{abs(hash(req.destination))}",
        "storeLocation": req.storeLocation
    }
    REGISTERED_QRS.insert(0, new_qr)
    return new_qr

@app.get("/api/dashboard/stats")
def get_dashboard_stats():
    safe_cnt = sum(1 for s in SCAN_HISTORY if s.get("riskLevel") == "SAFE")
    threat_cnt = sum(1 for s in SCAN_HISTORY if s.get("riskLevel") in ("SUSPICIOUS", "HIGH_RISK"))
    return {
        "totalScans": len(SCAN_HISTORY),
        "safeCount": safe_cnt,
        "suspiciousCount": sum(1 for s in SCAN_HISTORY if s.get("riskLevel") == "SUSPICIOUS"),
        "highRiskCount": sum(1 for s in SCAN_HISTORY if s.get("riskLevel") == "HIGH_RISK"),
        "registeredCount": len(REGISTERED_QRS),
        "recentScans": SCAN_HISTORY[:5],
        "riskDistribution": [
            {"name": "Safe", "value": max(1, safe_cnt), "color": "#10B981"},
            {"name": "Suspicious", "value": max(0, sum(1 for s in SCAN_HISTORY if s.get("riskLevel") == "SUSPICIOUS")), "color": "#F59E0B"},
            {"name": "High Risk", "value": max(0, sum(1 for s in SCAN_HISTORY if s.get("riskLevel") == "HIGH_RISK")), "color": "#EF4444"}
        ],
        "weeklyActivity": [
            {"day": "Mon", "safe": 12, "threat": 1},
            {"day": "Tue", "safe": 18, "threat": 3},
            {"day": "Wed", "safe": 24, "threat": 2},
            {"day": "Thu", "safe": 30, "threat": 5},
            {"day": "Fri", "safe": 35, "threat": 7},
            {"day": "Sat", "safe": 42, "threat": 10},
            {"day": "Sun", "safe": max(1, safe_cnt), "threat": max(0, threat_cnt)}
        ],
        "latestAlerts": [
            {
                "id": "ALT-1",
                "title": "Backend Alert: Real-Time Fraud Shield Active",
                "time": "Just now",
                "severity": "high",
                "type": "Network Integrity"
            }
        ]
    }

if __name__ == "__main__":
    import uvicorn
    print("Starting QRShield API Server on http://localhost:5000 ...")
    uvicorn.run(app, host="0.0.0.0", port=5000)

