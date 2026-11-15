"""
QR Destination Replacement Detection and Verification Service.
Compares newly scanned QR destinations against registered cryptographic fingerprints in the vault.
"""

import uuid
from database import db
from models import RegisteredQR
from utils.security import compute_sha256_fingerprint, canonicalize_destination

class QRVerifier:
    """Cryptographic destination verifier detecting alterations in registered QR assets."""

    def register_qr(self, business_name: str, qr_name: str, destination: str,
                    verified_upi: str = None, store_location: str = None) -> dict:
        """
        Register authentic business destination into the vault.
        Generates canonical SHA-256 fingerprint and persistent database record.
        """
        record_id = f"QRS-REG-{uuid.uuid4().hex[:6].upper()}"
        fingerprint = compute_sha256_fingerprint(destination)

        session = db.get_session()
        try:
            record = RegisteredQR(
                id=record_id,
                business_name=business_name.strip(),
                qr_name=qr_name.strip(),
                original_content=destination.strip(),
                original_hash=fingerprint,
                verified_upi=verified_upi.strip() if verified_upi else None,
                store_location=store_location.strip() if store_location else None
            )
            session.add(record)
            session.commit()
            return record.to_dict()
        finally:
            session.close()

    def verify_destination(self, scanned_destination: str) -> dict:
        """
        Compare scanned payload against registered fingerprints in the database.
        Returns verification status:
            - VERIFIED: Payload matches registered cryptographic hash.
            - DESTINATION_CHANGED: Scanned destination differs from registered business record.
            - NOT_REGISTERED: Destination is not in the merchant vault.
            - UNVERIFIED: Malformed or unprocessable payload.
        """
        if not scanned_destination or not scanned_destination.strip():
            return {
                "status": "UNVERIFIED",
                "scanned_destination": scanned_destination,
                "error": "Empty or invalid scanned destination content."
            }

        clean_scanned = scanned_destination.strip()
        scanned_hash = compute_sha256_fingerprint(clean_scanned)

        session = db.get_session()
        try:
            # 1. Exact Fingerprint Match
            exact_match = session.query(RegisteredQR).filter(
                RegisteredQR.original_hash == scanned_hash
            ).first()

            if exact_match:
                return {
                    "status": "VERIFIED",
                    "registered_record": exact_match.to_dict(),
                    "scanned_destination": clean_scanned,
                    "original_destination": exact_match.original_content,
                    "tamper_detected": False,
                    "explanation": f"Scanned payload matches 100% of authentic registration fingerprint for '{exact_match.business_name}'."
                }

            # 2. Check if scanned payload contains references to a registered business or VPA
            # Indicating a potential swapped / tampered destination for a known registered store stand
            all_registered = session.query(RegisteredQR).all()

            for rec in all_registered:
                # Check UPI payee address substitution
                if rec.verified_upi and clean_scanned.lower().startswith('upi://'):
                    # If display name or business keyword matches registered merchant but VPA differs
                    first_keyword = rec.business_name.split()[0].lower()
                    if first_keyword in clean_scanned.lower() and rec.verified_upi.lower() not in clean_scanned.lower():
                        return {
                            "status": "DESTINATION_CHANGED",
                            "registered_record": rec.to_dict(),
                            "scanned_destination": clean_scanned,
                            "original_destination": rec.original_content,
                            "tamper_detected": True,
                            "mismatch_details": f"Registered merchant '{rec.business_name}' requires verified VPA '{rec.verified_upi}', but scanned QR routes to an unauthorized destination.",
                            "explanation": "CRITICAL TAMPER ALERT: Scanned QR destination conflicts with registered merchant master record."
                        }

                # Check URL host substitution for registered business websites
                if rec.original_content.startswith(('http://', 'https://')) and clean_scanned.startswith(('http://', 'https://')):
                    first_keyword = rec.business_name.split()[0].lower()
                    if first_keyword in clean_scanned.lower() and clean_scanned != rec.original_content:
                        return {
                            "status": "DESTINATION_CHANGED",
                            "registered_record": rec.to_dict(),
                            "scanned_destination": clean_scanned,
                            "original_destination": rec.original_content,
                            "tamper_detected": True,
                            "mismatch_details": f"Expected authentic registered URL '{rec.original_content}', but encountered altered target '{clean_scanned}'.",
                            "explanation": "CRITICAL TAMPER ALERT: Destination URL deviates from registered corporate destination."
                        }

            # 3. Not registered in vault
            return {
                "status": "NOT_REGISTERED",
                "scanned_destination": clean_scanned,
                "tamper_detected": False,
                "explanation": "Scanned destination is not currently present in the QRShield registered merchant vault."
            }

        finally:
            session.close()

qr_verifier = QRVerifier()

