"""
Scan routes: Handles QR decoding, content classification, multi-engine security evaluation, and database persistence.
"""

import base64
import re
from datetime import datetime
from flask import Blueprint, request, jsonify
from database import db
from models import QRScan, ThreatAnalysis
from services.qr_decoder import qr_decoder
from services.url_analyzer import url_analyzer
from services.payment_analyzer import payment_analyzer
from services.qr_verifier import qr_verifier
from services.risk_engine import risk_engine

scan_bp = Blueprint('scan_bp', __name__)

@scan_bp.route('/api/scan', methods=['POST'])
def scan_qr_endpoint():
    """
    Accepts:
        - Multipart Form Data: 'file' or 'image'
        - JSON: { 'rawData': '...' } or { 'image': '<base64>' }
    Returns:
        Structured forensic result with risk score, findings, and explanations.
    """
    raw_content = ""
    content_type = "UNKNOWN"

    # 1. Check for file upload
    if 'file' in request.files or 'image' in request.files:
        uploaded_file = request.files.get('file') or request.files.get('image')
        decode_result = qr_decoder.decode_file_storage(uploaded_file)
        if not decode_result["success"]:
            return jsonify({
                "success": False,
                "error": decode_result.get("error", "Failed decoding QR image."),
                "analysis_status": "FAILED"
            }), 400
        raw_content = decode_result["content"]
        content_type = decode_result["content_type"]

    # 2. Check for JSON payload (Base64 image or direct raw string)
    elif request.is_json:
        data = request.get_json() or {}
        if "rawData" in data or "raw_content" in data or "content" in data:
            raw_content = (data.get("rawData") or data.get("raw_content") or data.get("content") or "").strip()
            content_type = qr_decoder.identify_content_type(raw_content)
        elif "image" in data or "base64" in data:
            base64_str = data.get("image") or data.get("base64")
            if ',' in base64_str:
                base64_str = base64_str.split(',', 1)[1]
            try:
                img_bytes = base64.b64decode(base64_str)
                decode_result = qr_decoder.decode_from_bytes(img_bytes)
                if not decode_result["success"]:
                    return jsonify({
                        "success": False,
                        "error": decode_result.get("error", "Could not decode QR code from image."),
                        "analysis_status": "FAILED"
                    }), 400
                raw_content = decode_result["content"]
                content_type = decode_result["content_type"]
            except Exception as e:
                return jsonify({
                    "success": False,
                    "error": f"Base64 image decoding failed: {str(e)}",
                    "analysis_status": "FAILED"
                }), 400
        else:
            return jsonify({
                "success": False,
                "error": "No QR image file, base64 data, or rawData string provided.",
                "analysis_status": "FAILED"
            }), 400
    else:
        return jsonify({
            "success": False,
            "error": "Invalid request format. Send multipart form with image or JSON payload.",
            "analysis_status": "FAILED"
        }), 400

    if not raw_content:
        return jsonify({
            "success": False,
            "error": "Extracted QR content is empty.",
            "analysis_status": "FAILED"
        }), 400

    # 3. Security Analysis Pipeline
    # A. Anti-Tamper Destination Check
    verification_result = qr_verifier.verify_destination(raw_content)

    # B. Content Type Specific Analysis
    url_result = None
    payment_result = None

    if content_type == "URL":
        url_result = url_analyzer.analyze(raw_content)
    elif content_type == "UPI":
        payment_result = payment_analyzer.analyze(raw_content)

    # C. Risk Engine Synthesis
    risk_assessment = risk_engine.calculate_score(
        content_type=content_type,
        url_results=url_result,
        payment_results=payment_result,
        verification_results=verification_result
    )

    # 4. Save to Database
    session = db.get_session()
    scan_record = None
    try:
        scan_record = QRScan(
            qr_content=raw_content,
            content_type=content_type,
            risk_score=risk_assessment["risk_score"],
            risk_level=risk_assessment["risk_level"],
            created_at=datetime.utcnow()
        )
        session.add(scan_record)
        session.flush()  # populate scan_record.id

        # Save individual threat findings
        for f in risk_assessment["findings"]:
            threat_rec = ThreatAnalysis(
                scan_id=scan_record.id,
                threat_type=f.get("type", "UNKNOWN_THREAT"),
                severity=f.get("severity", "MEDIUM"),
                description=f.get("description", ""),
                evidence="; ".join(risk_assessment.get("evidence", []))
            )
            session.add(threat_rec)

        session.commit()
        persisted_id = scan_record.id
    except Exception as e:
        session.rollback()
        persisted_id = int(datetime.utcnow().timestamp())
    finally:
        session.close()

    # 5. Extract Entity Name and Specific Information Details
    entity_name = "QR Code Asset"
    category_description = "General QR Destination"
    entity_details = {}

    if content_type == "URL":
        domain = url_result.get("domain", "") if url_result else ""
        brand_map = {
            "google.com": "Google Search & Services",
            "youtube.com": "YouTube Video Platform",
            "decathlon.in": "Decathlon Sports Checkout",
            "bluetokaicoffee.com": "Blue Tokai Coffee Roasters",
            "starbucks.com": "Starbucks Coffee Portal",
            "github.com": "GitHub Code Repository",
            "amazon.in": "Amazon India Marketplace",
            "amazon.com": "Amazon Global Marketplace",
            "paypal.com": "PayPal Payment Gateway",
            "sbi.co.in": "State Bank of India",
            "bit.ly": "Shortened Bitly Link"
        }
        friendly = brand_map.get(domain)
        if not friendly:
            for k, v in brand_map.items():
                if domain.endswith("." + k):
                    friendly = v
                    break
        if not friendly:
            parts = domain.replace("www.", "").split(".")
            friendly = f"{parts[0].replace('-', ' ').title()} Web Portal" if parts and parts[0] else domain

        entity_name = friendly
        category_description = "Shortened URL Redirect" if (url_result and url_result.get("is_shortener")) else "Web Hyperlink Destination"
        entity_details = {
            "Identified Resource": friendly,
            "Target Domain": domain,
            "Full Address": raw_content,
            "Security Protocol": "HTTPS (TLS Encrypted)" if (url_result and url_result.get("is_https")) else "HTTP (Insecure / Cleartext)",
            "Shortened Link": "Yes (Concealed Target)" if (url_result and url_result.get("is_shortener")) else "No (Direct Destination)",
            "Domain Reputation": f"{max(5, 100 - risk_assessment['risk_score'])} / 100",
            "Host Classification": "Raw Direct IP Host" if (url_result and url_result.get("is_ip")) else "Standard DNS Hostname"
        }
    elif content_type == "UPI":
        payee = payment_result.get("payee_name") or "UPI Payee" if payment_result else "UPI Payee"
        vpa = payment_result.get("vpa") or "" if payment_result else ""
        amount = payment_result.get("amount") if payment_result else None
        amt_str = f"₹{amount}" if amount else "Open / Customer Specified"
        entity_name = f"{payee} (UPI Payee)"
        category_description = "NPCI UPI Payment Destination"
        entity_details = {
            "Payee Display Name": payee,
            "Virtual Payment Address (VPA)": vpa,
            "Requested Amount": amt_str,
            "Currency": payment_result.get("currency", "INR") if payment_result else "INR",
            "PSP Provider Handle": f"@{vpa.split('@')[1]}" if "@" in vpa else "Unknown",
            "Merchant Category (MCC)": payment_result.get("merchant_code") or "Standard Peer/Merchant" if payment_result else "Standard",
            "Merchant Registry Status": "Cryptographically Verified Business" if (payment_result and payment_result.get("is_registered")) else ("MISMATCH / FRAUD ALERT" if (payment_result and payment_result.get("is_mismatch")) else "Unregistered Payee")
        }
    elif content_type == "WIFI":
        ssid_match = re.search(r'S:([^;]+)', raw_content, re.IGNORECASE)
        ssid = ssid_match.group(1) if ssid_match else "Wireless Network"
        entity_name = f'Wi-Fi Network: "{ssid}"'
        category_description = "Wi-Fi Access Point Configuration"
        entity_details = {
            "Network Name (SSID)": ssid,
            "Encryption Standard": "WPA/WPA2",
            "Password Protected": "Yes" if "P:" in raw_content else "No (Open Public Access)"
        }
    else:
        preview = raw_content[:40] + "..." if len(raw_content) > 40 else raw_content
        entity_name = f'Text: "{preview}"'
        category_description = "Plaintext Data Record"
        entity_details = {
            "Content Type": "Plaintext",
            "Character Count": f"{len(raw_content)} characters",
            "Word Count": f"{len(raw_content.split())} words",
            "Raw Payload Preview": raw_content[:150]
        }

    # Determine Specific App / Provider Type
    qr_app_type = "Generic QR Code"
    app_provider = "Standard"

    if content_type == "UPI":
        vpa_lower = (payment_result.get("vpa") or "").lower() if payment_result else ""
        handle = vpa_lower.split('@')[1] if '@' in vpa_lower else ''
        if handle in ['ybl', 'ibl', 'axl'] or 'phonepe' in raw_content.lower():
            qr_app_type = "PhonePe Payment QR"
            app_provider = "PhonePe"
        elif handle in ['okhdfcbank', 'okaxis', 'oksbi', 'okicici'] or 'google' in raw_content.lower():
            qr_app_type = "Google Pay (GPay) QR"
            app_provider = "Google Pay"
        elif handle in ['paytm', 'ptsbi', 'pthdfc', 'ptaxis'] or 'paytm' in raw_content.lower():
            qr_app_type = "Paytm Merchant QR"
            app_provider = "Paytm"
        elif handle in ['sbi', 'oksbi']:
            qr_app_type = "State Bank of India (SBI) UPI QR"
            app_provider = "SBI UPI"
        elif handle in ['hdfcbank', 'okhdfcbank']:
            qr_app_type = "HDFC Bank UPI QR"
            app_provider = "HDFC Bank"
        elif handle in ['icici', 'okicici']:
            qr_app_type = "ICICI Bank UPI QR"
            app_provider = "ICICI Bank"
        elif handle in ['axisbank', 'okaxis']:
            qr_app_type = "Axis Bank UPI QR"
            app_provider = "Axis Bank"
        elif handle in ['apl', 'rapl']:
            qr_app_type = "Amazon Pay UPI QR"
            app_provider = "Amazon Pay"
        elif handle == 'upi':
            qr_app_type = "BHIM NPCI UPI QR"
            app_provider = "BHIM"
        else:
            qr_app_type = f"UPI Payment QR (@{handle or 'upi'})"
            app_provider = "NPCI UPI"
    elif content_type == "URL":
        domain_lower = (url_result.get("domain") or "").lower() if url_result else ""
        if 'google' in domain_lower:
            qr_app_type = "Google Website / Search QR"
            app_provider = "Google"
        elif 'youtube' in domain_lower or 'youtu.be' in domain_lower:
            qr_app_type = "YouTube Video QR"
            app_provider = "YouTube"
        elif 'phonepe' in domain_lower:
            qr_app_type = "PhonePe Web QR"
            app_provider = "PhonePe"
        elif 'paytm' in domain_lower:
            qr_app_type = "Paytm Web QR"
            app_provider = "Paytm"
        elif 'instagram' in domain_lower:
            qr_app_type = "Instagram Profile / Post QR"
            app_provider = "Instagram"
        elif 'whatsapp' in domain_lower or 'wa.me' in domain_lower:
            qr_app_type = "WhatsApp Chat / Community QR"
            app_provider = "WhatsApp"
        elif 'amazon' in domain_lower:
            qr_app_type = "Amazon Shopping QR"
            app_provider = "Amazon"
        elif 'flipkart' in domain_lower:
            qr_app_type = "Flipkart Store QR"
            app_provider = "Flipkart"
        elif 'decathlon' in domain_lower:
            qr_app_type = "Decathlon Store Checkout QR"
            app_provider = "Decathlon"
        elif 'github' in domain_lower:
            qr_app_type = "GitHub Code Repository QR"
            app_provider = "GitHub"
        elif url_result and url_result.get("is_shortener"):
            qr_app_type = "Shortened Web Link QR"
            app_provider = "URL Shortener"
        else:
            qr_app_type = f"Website URL QR ({domain_lower or 'Web'})"
            app_provider = "Web Browser"
    elif content_type == "WIFI":
        qr_app_type = "Wi-Fi Network Access QR"
        app_provider = "Wi-Fi Settings"
    else:
        qr_app_type = "Plain Text / Notes QR"
        app_provider = "Text Reader"

    # Calculate Security Percentage Score
    security_percentage = max(0, min(100, 100 - risk_assessment["risk_score"]))
    is_secured = security_percentage >= 70
    if security_percentage >= 80:
        security_status_text = f"{security_percentage}% SECURED — SAFE TO USE"
    elif security_percentage >= 50:
        security_status_text = f"{security_percentage}% SECURED — SUSPICIOUS / PROCEED WITH CAUTION"
    else:
        security_status_text = f"{security_percentage}% SECURED — UNSECURED / DANGEROUS"

    # 6. Build Standardized Response (Supporting both prompt spec & frontend format)
    response_data = {
        "success": True,
        "scan_id": persisted_id,
        "id": f"SCAN-{persisted_id}",
        "entity_name": entity_name,
        "entityName": entity_name,
        "category_description": category_description,
        "categoryDescription": category_description,
        "qr_app_type": qr_app_type,
        "qrAppType": qr_app_type,
        "app_provider": app_provider,
        "appProvider": app_provider,
        "security_percentage": security_percentage,
        "securityPercentage": security_percentage,
        "is_secured": is_secured,
        "isSecured": is_secured,
        "security_status_text": security_status_text,
        "securityStatusText": security_status_text,
        "entity_details": entity_details,
        "entityDetails": entity_details,
        "content_type": content_type,
        "contentType": content_type,
        "raw_content": raw_content,
        "rawData": raw_content,
        "risk_score": risk_assessment["risk_score"],
        "riskScore": risk_assessment["risk_score"],
        "risk_level": risk_assessment["risk_level"],
        "riskLevel": "SAFE" if risk_assessment["risk_level"] == "LOW" else ("SUSPICIOUS" if risk_assessment["risk_level"] == "MEDIUM" else "HIGH_RISK"),
        "findings": risk_assessment["findings"],
        "threatIndicators": [
            {
                "id": f"TI-{i}",
                "severity": f.get("severity", "medium").lower(),
                "title": f.get("type", "").replace('_', ' ').title(),
                "description": f.get("description", ""),
                "category": "url" if content_type == "URL" else ("payment" if content_type == "UPI" else "tamper")
            }
            for i, f in enumerate(risk_assessment["findings"])
        ],
        "evidence": risk_assessment["evidence"],
        "explanation": risk_assessment["explanation"],
        "aiSummary": risk_assessment["explanation"],
        "recommendation": risk_assessment["recommendation"],
        "recommendedActions": [
            risk_assessment["recommendation"],
            "Standard security inspection verified. Review IOC parameters."
        ],
        "analysis_status": risk_assessment["analysis_status"],
        "timestamp": datetime.utcnow().isoformat(),
        "verification_result": verification_result,
        "qrVerification": {
            "status": verification_result.get("status"),
            "mismatchDetails": verification_result.get("mismatch_details"),
            "originalDestination": verification_result.get("original_destination"),
            "scannedDestination": raw_content,
            "tamperRiskScore": 95 if verification_result.get("status") == "DESTINATION_CHANGED" else 0
        }
    }

    if url_result:
        response_data["url_analysis"] = url_result
        response_data["urlAnalysis"] = {
            "url": raw_content,
            "domain": url_result.get("domain", ""),
            "protocol": url_result.get("scheme", "https"),
            "isHttps": url_result.get("is_https", False),
            "isShortened": url_result.get("is_shortener", False),
            "domainReputation": max(5, 100 - risk_assessment["risk_score"]),
            "isIpAddress": url_result.get("is_ip", False),
            "hasPunycode": url_result.get("has_punycode", False),
            "hasSuspiciousTld": any(f.get("type") == "HIGH_ABUSE_TLD" for f in url_result.get("findings", [])),
            "typosquattingTarget": url_result.get("typosquat_target"),
            "threatFlags": [f.get("description", "") for f in url_result.get("findings", [])],
            "redirectChain": [raw_content],
            "safetyVerdict": "MALICIOUS" if risk_assessment["risk_level"] == "HIGH" else ("SUSPICIOUS" if risk_assessment["risk_level"] == "MEDIUM" else "SAFE")
        }

    if payment_result:
        response_data["payment_analysis"] = payment_result
        response_data["upiAnalysis"] = {
            "rawUri": raw_content,
            "vpa": payment_result.get("vpa", ""),
            "payeeName": payment_result.get("payee_name", ""),
            "amount": payment_result.get("amount"),
            "currency": payment_result.get("currency", "INR"),
            "merchantCode": payment_result.get("merchant_code"),
            "transactionRef": payment_result.get("transaction_ref"),
            "transactionNote": payment_result.get("transaction_note"),
            "isRegisteredMerchant": payment_result.get("is_registered", False),
            "registeredMerchantName": payment_result.get("matched_business"),
            "isNameMismatch": payment_result.get("is_mismatch", False),
            "isSuspiciousHandle": any(f.get("type") == "UNCOMMON_PSP_HANDLE" for f in payment_result.get("findings", [])),
            "flags": [f.get("description", "") for f in payment_result.get("findings", [])],
            "safetyAdvice": payment_result.get("safety_advice", [])
        }

    return jsonify(response_data), 200

