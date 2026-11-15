"""
UPI Payment Security Analysis Service.
Parses standard NPCI UPI payloads, verifies merchant identity bindings, and detects payment mismatches.
"""

import urllib.parse
from database import db
from models import VerifiedPayment, RegisteredQR

# Common authorized Bank PSP handles in the Indian payment ecosystem
STANDARD_PSP_HANDLES = {
    'okhdfcbank', 'okaxis', 'oksbi', 'okicici', 'ybl', 'paytm', 'ibl',
    'axl', 'upi', 'barodampay', 'federal', 'aubank', 'idfcbank', 'indus', 'yesbank'
}

# Major corporate brands often targeted by QR sticker replacement fraud
MONITORED_PAYMENT_BRANDS = [
    'starbucks', 'amazon', 'flipkart', 'apollo', 'zomato', 'swiggy',
    'airtel', 'jio', 'mcdonalds', 'kfc', 'dominos', 'decathlon', 'croma'
]

class PaymentAnalyzer:
    """NPCI UPI QR payload parser and payment integrity inspector."""

    def parse_payload(self, upi_uri: str) -> dict:
        """
        Extract query parameters from upi://pay URI.
        Returns extracted parameters and validity flag.
        """
        clean = upi_uri.strip()
        if not clean.lower().startswith('upi://pay'):
            return {
                "is_valid": False,
                "error": "Not a standard upi://pay URI schema."
            }

        try:
            query_part = clean.split('?', 1)[1] if '?' in clean else clean
            params = urllib.parse.parse_qs(query_part)
        except Exception as e:
            return {
                "is_valid": False,
                "error": f"Failed parsing URI query parameters: {str(e)}"
            }

        vpa = params.get('pa', [''])[0].strip()
        payee_name = urllib.parse.unquote_plus(params.get('pn', [''])[0].strip())
        amount = params.get('am', [None])[0]
        currency = params.get('cu', ['INR'])[0]
        merchant_code = params.get('mc', [None])[0]
        transaction_ref = params.get('tr', [None])[0]
        transaction_note = urllib.parse.unquote_plus(params.get('tn', [''])[0].strip()) if 'tn' in params else None

        return {
            "is_valid": bool(vpa),
            "vpa": vpa,
            "payee_name": payee_name,
            "amount": amount,
            "currency": currency,
            "merchant_code": merchant_code,
            "transaction_ref": transaction_ref,
            "transaction_note": transaction_note
        }

    def analyze(self, upi_uri: str) -> dict:
        """
        Execute payment forensics against database records and NPCI heuristics.
        Returns verification verdict, mismatch indicators, and actionable safety guidance.
        """
        parsed = self.parse_payload(upi_uri)
        if not parsed.get("is_valid"):
            return {
                "is_valid": False,
                "raw_uri": upi_uri,
                "findings": [{
                    "type": "MALFORMED_UPI_URI",
                    "severity": "HIGH",
                    "description": parsed.get("error", "Malformed UPI payment string.")
                }],
                "evidence": ["UPI URI lacks mandatory 'pa' (payee address) parameter."],
                "is_registered": False,
                "is_mismatch": False,
                "safety_advice": ["Do not attempt payment with corrupt UPI syntax."]
            }

        vpa = parsed["vpa"]
        payee_name = parsed["payee_name"] or "Unspecified Recipient"
        amount = parsed["amount"]
        findings = []
        evidence = []
        safety_advice = [
            "CRITICAL: Never enter your UPI PIN to receive money or cashbacks. Entering your PIN always DEBITS funds.",
            "Verify the recipient name shown on your banking app confirmation modal before entering your PIN."
        ]

        # 1. Check VPA Structure
        is_suspicious_handle = False
        if '@' not in vpa:
            findings.append({
                "type": "INVALID_VPA_FORMAT",
                "severity": "HIGH",
                "description": f"UPI Address '{vpa}' lacks mandatory '@' PSP delimiter."
            })
            evidence.append(f"VPA '{vpa}' is malformed")
        else:
            handle, psp = vpa.split('@', 1)
            if psp.lower() not in STANDARD_PSP_HANDLES:
                findings.append({
                    "type": "UNCOMMON_PSP_HANDLE",
                    "severity": "LOW",
                    "description": f"UPI address routes through non-standard bank handle '@{psp}'."
                })
                evidence.append(f"PSP handle '@{psp}' is not in primary national banking whitelist")

        # 2. Query Database for Registered Payment Records
        session = db.get_session()
        is_registered = False
        is_mismatch = False
        matched_business = None

        try:
            # Check VerifiedPayment table
            verified_record = session.query(VerifiedPayment).filter(
                VerifiedPayment.verified_upi.ilike(vpa)
            ).first()

            # Also check RegisteredQR table
            registered_qr_record = session.query(RegisteredQR).filter(
                RegisteredQR.verified_upi.ilike(vpa)
            ).first()

            if verified_record:
                is_registered = True
                matched_business = verified_record.business_name
            elif registered_qr_record:
                is_registered = True
                matched_business = registered_qr_record.business_name

            # 3. Check for Payee Identity Conflict / Mismatch
            # Example: Payee Name claims 'Starbucks Coffee', but VPA is 'fake.starbucks@ybl' or personal ID
            lower_name = payee_name.lower()
            lower_vpa = vpa.lower()

            for brand in MONITORED_PAYMENT_BRANDS:
                if brand in lower_name:
                    # Check if VPA actually belongs to this brand
                    if is_registered and matched_business and brand in matched_business.lower():
                        # Authentic registered merchant!
                        pass
                    elif brand not in lower_vpa.split('@')[0]:
                        # Name says Brand, but VPA is unrelated!
                        is_mismatch = True
                        findings.append({
                            "type": "PAYEE_NAME_VPA_MISMATCH",
                            "severity": "CRITICAL",
                            "description": f"CRITICAL FRAUD ALERT: Display Name asserts '{payee_name}', but payment routes to unrelated account '{vpa}'."
                        })
                        evidence.append(f"Declared payee '{payee_name}' does not correspond with VPA account '{vpa}'")
                        safety_advice.insert(0, "STOP: High likelihood of physical QR sticker overlay swap on store counter.")
                        break

            # If registered record exists for this business name under a different VPA
            all_records_for_name = session.query(RegisteredQR).filter(
                RegisteredQR.business_name.ilike(f"%{payee_name.split()[0]}%")
            ).all()

            for rec in all_records_for_name:
                if rec.verified_upi and rec.verified_upi.lower() != lower_vpa:
                    is_mismatch = True
                    findings.append({
                        "type": "REGISTERED_VPA_SUBSTITUTION",
                        "severity": "CRITICAL",
                        "description": f"Scanned VPA '{vpa}' conflicts with authentic registered merchant VPA '{rec.verified_upi}'."
                    })
                    evidence.append(f"Official merchant registration requires VPA '{rec.verified_upi}'")
                    break

        finally:
            session.close()

        # 4. Check for Pre-set Amount Alerts
        if amount:
            try:
                amt_val = float(amount)
                if amt_val > 5000:
                    findings.append({
                        "type": "ELEVATED_PRESET_AMOUNT",
                        "severity": "MEDIUM",
                        "description": f"Pre-set transaction amount is locked to a high value of ₹{amt_val:.2f}."
                    })
                    evidence.append(f"Fixed pre-set sum of ₹{amt_val:.2f} encoded in QR parameter 'am'")
            except ValueError:
                findings.append({
                    "type": "INVALID_AMOUNT_PARAMETER",
                    "severity": "LOW",
                    "description": f"Amount parameter value '{amount}' could not be parsed."
                })

        return {
            "is_valid": True,
            "raw_uri": upi_uri,
            "vpa": vpa,
            "payee_name": payee_name,
            "amount": amount,
            "currency": parsed["currency"],
            "merchant_code": parsed["merchant_code"],
            "transaction_ref": parsed["transaction_ref"],
            "transaction_note": parsed["transaction_note"],
            "is_registered": is_registered,
            "matched_business": matched_business,
            "is_mismatch": is_mismatch,
            "findings": findings,
            "evidence": evidence,
            "safety_advice": safety_advice
        }

payment_analyzer = PaymentAnalyzer()

