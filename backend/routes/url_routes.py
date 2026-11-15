"""
URL Analysis Routes: Deep web destination inspection and threat forensics.
"""

from flask import Blueprint, request, jsonify
from services.url_analyzer import url_analyzer
from services.risk_engine import risk_engine
from utils.validators import is_valid_url_syntax

url_bp = Blueprint('url_bp', __name__)

@url_bp.route('/api/analyze-url', methods=['POST'])
def analyze_url_endpoint():
    """
    Accepts: { 'url': 'https://...' }
    Returns: Complete domain forensics, reputation score, and safety verdict.
    """
    if not request.is_json:
        return jsonify({
            "success": False,
            "error": "Request body must be valid JSON.",
            "analysis_status": "FAILED"
        }), 400

    data = request.get_json() or {}
    url = data.get("url", "").strip()

    if not url:
        return jsonify({
            "success": False,
            "error": "Missing 'url' parameter in JSON payload.",
            "analysis_status": "FAILED"
        }), 400

    # Execute URL forensic analysis
    analysis = url_analyzer.analyze(url)
    risk = risk_engine.calculate_score(content_type="URL", url_results=analysis)

    safety_verdict = "SAFE"
    if risk["risk_level"] == "HIGH":
        safety_verdict = "MALICIOUS"
    elif risk["risk_level"] == "MEDIUM":
        safety_verdict = "SUSPICIOUS"

    response = {
        "success": True,
        "url": url,
        "domain": analysis.get("domain", ""),
        "protocol": analysis.get("scheme", "https"),
        "is_https": analysis.get("is_https", False),
        "is_shortened": analysis.get("is_shortener", False),
        "is_ip_address": analysis.get("is_ip", False),
        "has_punycode": analysis.get("has_punycode", False),
        "has_suspicious_tld": any(f.get("type") == "HIGH_ABUSE_TLD" for f in analysis.get("findings", [])),
        "typosquatting_target": analysis.get("typosquat_target"),
        "domain_reputation": max(5, 100 - risk["risk_score"]),
        "domainReputation": max(5, 100 - risk["risk_score"]),
        "safety_verdict": safety_verdict,
        "safetyVerdict": safety_verdict,
        "risk_score": risk["risk_score"],
        "risk_level": risk["risk_level"],
        "findings": risk["findings"],
        "threat_flags": [f.get("description", "") for f in analysis.get("findings", [])],
        "threatFlags": [f.get("description", "") for f in analysis.get("findings", [])],
        "redirect_chain": [url],
        "redirectChain": [url],
        "threat_intelligence": analysis.get("threat_intelligence", {}),
        "explanation": risk["explanation"],
        "recommendation": risk["recommendation"],
        "analysis_status": risk["analysis_status"]
    }

    return jsonify(response), 200

