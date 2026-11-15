"""
Verification routes: QR destination registration, tamper comparison, and vault records.
"""

from flask import Blueprint, request, jsonify
from database import db
from models import RegisteredQR
from services.qr_verifier import qr_verifier

verification_bp = Blueprint('verification_bp', __name__)

@verification_bp.route('/api/register-qr', methods=['POST'])
def register_qr_endpoint():
    """
    Accepts: {
        'businessName': '...',
        'qrName': '...',
        'destination': '...',
        'verifiedUpiId': '...',
        'storeLocation': '...'
    }
    Registers original QR destination and computes cryptographic fingerprint.
    """
    if not request.is_json:
        return jsonify({"success": False, "error": "Request body must be valid JSON."}), 400

    data = request.get_json() or {}
    business_name = (data.get("businessName") or data.get("business_name") or "").strip()
    qr_name = (data.get("qrName") or data.get("qr_name") or "").strip()
    destination = (data.get("destination") or data.get("original_content") or data.get("content") or "").strip()
    verified_upi = (data.get("verifiedUpiId") or data.get("verified_upi") or "").strip() or None
    store_location = (data.get("storeLocation") or data.get("store_location") or "").strip() or None

    if not business_name or not destination or not qr_name:
        return jsonify({
            "success": False,
            "error": "Missing required fields: 'businessName', 'qrName', and 'destination' are mandatory."
        }), 400

    record = qr_verifier.register_qr(
        business_name=business_name,
        qr_name=qr_name,
        destination=destination,
        verified_upi=verified_upi,
        store_location=store_location
    )

    return jsonify({
        "success": True,
        "message": "QR code registered successfully into cryptographic vault.",
        "record": record,
        **record
    }), 201

@verification_bp.route('/api/verify-qr', methods=['POST'])
def verify_qr_endpoint():
    """
    Accepts: { 'payload': '...' } or { 'destination': '...' }
    Compares scanned destination against registered vault records to detect replacement attacks.
    """
    if not request.is_json:
        return jsonify({"success": False, "error": "Request body must be valid JSON."}), 400

    data = request.get_json() or {}
    payload = (data.get("payload") or data.get("destination") or data.get("rawData") or "").strip()

    if not payload:
        return jsonify({"success": False, "error": "Missing 'payload' parameter in JSON."}), 400

    result = qr_verifier.verify_destination(payload)

    return jsonify({
        "success": True,
        **result,
        "tamperRiskScore": 95 if result.get("status") == "DESTINATION_CHANGED" else (0 if result.get("status") == "VERIFIED" else 20)
    }), 200

@verification_bp.route('/api/registered-qrs', methods=['GET'])
def get_registered_qrs_endpoint():
    """Return all registered QR codes from the database vault."""
    session = db.get_session()
    try:
        records = session.query(RegisteredQR).order_by(RegisteredQR.created_at.desc()).all()
        return jsonify([r.to_dict() for r in records]), 200
    finally:
        session.close()

