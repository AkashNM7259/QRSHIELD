"""
Explainable Risk Scoring Engine for QRShield.
Aggregates forensic signals, calculates dynamic risk scores (0-100), and synthesizes actionable recommendations.
"""

from config import Config

class RiskEngine:
    """Multi-vector heuristic risk assessment engine."""

    def calculate_score(self, content_type: str, url_results: dict = None,
                        payment_results: dict = None, verification_results: dict = None) -> dict:
        """
        Synthesize findings from all forensic engines into an explainable 0-100 risk assessment.
        Returns:
            {
                "risk_score": int (0-100),
                "risk_level": "LOW" | "MEDIUM" | "HIGH",
                "findings": list[dict],
                "evidence": list[str],
                "explanation": str,
                "recommendation": str,
                "analysis_status": "COMPLETE" | "PARTIAL"
            }
        """
        score = 0
        findings = []
        evidence = []
        high_risk_triggers = []
        has_unknown_api = False

        # 1. Process Destination Replacement / Tamper Findings
        if verification_results:
            status = verification_results.get("status")
            if status == "DESTINATION_CHANGED":
                score += Config.WEIGHT_DESTINATION_MISMATCH
                findings.append({
                    "type": "DESTINATION_TAMPER_DETECTED",
                    "severity": "CRITICAL",
                    "description": verification_results.get("mismatch_details", "Registered QR destination has been altered.")
                })
                evidence.append(f"Scanned target conflicts with registered original destination '{verification_results.get('original_destination')}'")
                high_risk_triggers.append("Destination replacement attack")
            elif status == "VERIFIED":
                # Verified match reduces baseline risk
                score = max(0, score - 15)
                evidence.append("Cryptographic hash verified against registered merchant master record")

        # 2. Process URL Analysis Findings
        if url_results and url_results.get("is_valid"):
            url_findings = url_results.get("findings", [])
            findings.extend(url_findings)
            evidence.extend(url_results.get("evidence", []))

            # Threat Intelligence match
            threat_info = url_results.get("threat_intelligence", {})
            if threat_info.get("is_malicious"):
                score += Config.WEIGHT_MALICIOUS_DOMAIN
                high_risk_triggers.append("Confirmed threat intelligence blacklist match")

            if threat_info.get("service_status") == "UNAVAILABLE":
                has_unknown_api = True

            # Raw IP host
            if url_results.get("is_ip"):
                score += Config.WEIGHT_RAW_IP_HOST

            # Punycode / Homograph spoof
            if url_results.get("has_punycode"):
                score += Config.WEIGHT_PUNYCODE_HOMOGRAPH

            # Typosquatting
            if url_results.get("typosquat_target"):
                score += 35
                high_risk_triggers.append(f"Brand impersonation targeting '{url_results.get('typosquat_target')}'")

            # Shortener
            if url_results.get("is_shortener"):
                score += Config.WEIGHT_UNVERIFIED_SHORTENER

            # Unencrypted transport (Cleartext HTTP)
            if not url_results.get("is_https"):
                score += Config.WEIGHT_UNENCRYPTED_HTTP

            # Generic structural flags
            structural_types = {'HIGH_ABUSE_TLD', 'SENSITIVE_CREDENTIAL_KEYWORDS', 'HIGH_DOMAIN_ENTROPY'}
            has_structural = any(f.get("type") in structural_types for f in url_findings)
            if has_structural:
                score += Config.WEIGHT_SUSPICIOUS_URL_STRUCTURE

        # 3. Process UPI Payment Findings
        if payment_results:
            pay_findings = payment_results.get("findings", [])
            findings.extend(pay_findings)
            evidence.extend(payment_results.get("evidence", []))

            if not payment_results.get("is_valid"):
                score += 30
                high_risk_triggers.append("Invalid or malformed payment URI")

            if payment_results.get("is_mismatch"):
                score += Config.WEIGHT_PAYMENT_MISMATCH
                high_risk_triggers.append("Payment recipient identity mismatch")

            if payment_results.get("is_registered"):
                score = max(0, score - 20)
                evidence.append("UPI VPA verified against authorized merchant directory")

        # Cap score between 0 and 100
        final_score = min(100, max(0, score))

        # Enforce Rule: Confirmed malicious-domain or destination mismatch triggers HIGH risk
        if high_risk_triggers and final_score < 60:
            final_score = 75

        # Classify Level
        if final_score <= Config.RISK_THRESHOLD_LOW_MAX:
            risk_level = "LOW"
        elif final_score <= Config.RISK_THRESHOLD_MEDIUM_MAX:
            risk_level = "MEDIUM"
        else:
            risk_level = "HIGH"

        # Synthesize Explainable Narrative tailored to the specific entity
        if content_type == "URL" and url_results:
            domain = url_results.get("domain", "web target")
            if risk_level == "HIGH":
                reasons = "; ".join(high_risk_triggers) if high_risk_triggers else "Multiple critical threat indicators"
                explanation = f"HIGH RISK URL: Destination '{domain}' exhibits dangerous threats ({reasons}). Potential credential phishing, homograph lookalike, or malicious server."
                recommendation = "DO NOT visit this destination or submit passwords/credentials. Verify domain ownership through official channels."
            elif risk_level == "MEDIUM":
                flags_desc = "; ".join([f.get("description", "") for f in findings[:2]]) if findings else "Unverified parameters"
                explanation = f"SUSPICIOUS URL: Destination '{domain}' contains potential risk factors ({flags_desc}). Threat Score: {final_score}/100."
                recommendation = "Inspect destination path and domain certificates carefully before interacting with this web portal."
            else:
                explanation = f"VERIFIED CLEAN URL: Destination '{domain}' verified authentic over secure encrypted protocol with clean reputation (Threat Score: {final_score}/100)."
                recommendation = "Destination verified clean. Standard browsing hygiene applies."
        elif content_type == "UPI" and payment_results:
            payee = payment_results.get("payee_name") or "UPI Payee"
            vpa = payment_results.get("vpa") or ""
            if payment_results.get("is_mismatch"):
                explanation = f"CRITICAL PAYMENT FRAUD: Display name claims '{payee}', but money is routed to unverified VPA '{vpa}'. Potential counter sticker replacement attack."
                recommendation = "HALT PAYMENT. Do not authorize transaction. Alert the merchant or retail cashier immediately."
            elif payment_results.get("is_registered"):
                explanation = f"VERIFIED REGISTERED MERCHANT: Authentic payment destination for '{payee}' ({vpa}) validated against merchant registry."
                recommendation = "Safe to authorize payment. Confirm amount on your banking UPI PIN authorization screen."
            else:
                explanation = f"NPCI UPI PAYMENT: Valid payment specification for '{payee}' (VPA: {vpa}). Standard payment protections apply (Threat Score: {final_score}/100)."
                recommendation = "Confirm that the payee name matches your expectation on your bank UPI app before authorizing."
        else:
            if risk_level == "HIGH":
                reasons = "; ".join(high_risk_triggers) if high_risk_triggers else "Multiple critical threat indicators identified"
                explanation = f"HIGH RISK: Scanned QR code exhibits dangerous indicators ({reasons}). Potential sticker tampering or malicious payload."
                recommendation = "DO NOT proceed with this transaction or visit the destination. Report this asset to security staff."
            elif risk_level == "MEDIUM":
                explanation = f"SUSPICIOUS ADVISORY: Scanned QR code contains unverified attributes (Threat Score: {final_score}/100). Exercise caution."
                recommendation = "Exercise caution. Verify destination ownership before sharing data."
            else:
                explanation = f"VERIFIED CLEAN: Scanned {content_type} asset verified safe without anomalous threat indicators (Threat Score: {final_score}/100)."
                recommendation = "Asset verified clean. Standard security hygiene applies."

        # Note if external API was unreachable
        if has_unknown_api:
            explanation += " (Note: External Threat Intelligence API was unavailable during scan; heuristic results applied)."

        return {
            "risk_score": final_score,
            "risk_level": risk_level,
            "findings": findings,
            "evidence": evidence,
            "explanation": explanation,
            "recommendation": recommendation,
            "analysis_status": "PARTIAL" if has_unknown_api else "COMPLETE"
        }

risk_engine = RiskEngine()
