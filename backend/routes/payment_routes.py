"""
Payment routes: UPI payload forensics, recipient mismatch detection, and merchant verification.
"""

from flask import Blueprint, request, jsonify
from services.payment_analyzer import payment_analyzer
from services.risk_engine import risk_engine

payment_bp = Blueprint('payment_bp', __name__)

@payment_bp.route('/api/analyze-payment', methods=['POST'])
@payment_bp.route('/api/analyze-upi', methods=['POST'])
def analyze_payment_endpoint():
    """
    Accepts: { 'upiUri': 'upi://pay?...' } or { 'payload': '...' }
    Returns: Parsed payment fields, recipient verification, and anti-fraud alerts.
    """
    if not request.is_json:
        return jsonify({
            "success": False,
            "error": "Request body must be valid JSON.",
            "analysis_status": "FAILED"
        }), 400

    data = request.get_json() or {}
    upi_uri = (data.get("upiUri") or data.get("payload") or data.get("uri") or "").strip()

    if not upi_uri:
        return jsonify({
            "success": False,
            "error": "Missing 'upiUri' or 'payload' in JSON request.",
            "analysis_status": "FAILED"
        }), 400

    # Analyze UPI payload
    analysis = payment_analyzer.analyze(upi_uri)
    risk = risk_engine.calculate_score(content_type="UPI", payment_results=analysis)

    response = {
        "success": True,
        "raw_uri": upi_uri,
        "rawUri": upi_uri,
        "vpa": analysis.get("vpa", ""),
        "payee_name": analysis.get("payee_name", ""),
        "payeeName": analysis.get("payee_name", ""),
        "amount": analysis.get("amount"),
        "currency": analysis.get("currency", "INR"),
        "merchant_code": analysis.get("merchant_code"),
        "merchantCode": analysis.get("merchant_code"),
        "transaction_ref": analysis.get("transaction_ref"),
        "transactionRef": analysis.get("transaction_ref"),
        "transaction_note": analysis.get("transaction_note"),
        "transactionNote": analysis.get("transaction_note"),
        "is_registered_merchant": analysis.get("is_registered", False),
        "isRegisteredMerchant": analysis.get("is_registered", False),
        "registered_merchant_name": analysis.get("matched_business"),
        "registeredMerchantName": analysis.get("matched_business"),
        "is_name_mismatch": analysis.get("is_mismatch", False),
        "isNameMismatch": analysis.get("is_mismatch", False),
        "is_suspicious_handle": any(f.get("type") == "UNCOMMON_PSP_HANDLE" for f in analysis.get("findings", [])),
        "isSuspiciousHandle": any(f.get("type") == "UNCOMMON_PSP_HANDLE" for f in analysis.get("findings", [])),
        "risk_score": risk["risk_score"],
        "riskScore": risk["risk_score"],
        "risk_level": risk["risk_level"],
        "riskLevel": "SAFE" if risk["risk_level"] == "LOW" else ("SUSPICIOUS" if risk["risk_level"] == "MEDIUM" else "HIGH_RISK"),
        "findings": risk["findings"],
        "flags": [f.get("description", "") for f in analysis.get("findings", [])],
        "safety_advice": analysis.get("safety_advice", []),
        "safetyAdvice": analysis.get("safety_advice", []),
        "explanation": risk["explanation"],
        "recommendation": risk["recommendation"],
        "analysis_status": risk["analysis_status"]
    }

    return jsonify(response), 200

