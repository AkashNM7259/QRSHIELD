"""
Tests for UPI Payment Security Analysis.
Covers:
  - Test 5: UPI QR code parsing
  - Test 6: Payment recipient mismatch detection
"""

import sys
from pathlib import Path
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import create_app
from config import TestConfig

class TestPayment(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()

    def test_05_valid_upi_qr_code(self):
        """Test 5: Standard valid UPI QR code with registered merchant."""
        upi_payload = "upi://pay?pa=starbucks.bandra@hdfcbank&pn=Starbucks%20Coffee&mc=5812&cu=INR"
        response = self.client.post('/api/analyze-payment', json={"upiUri": upi_payload})
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data.get("vpa"), "starbucks.bandra@hdfcbank")
        self.assertEqual(data.get("payee_name"), "Starbucks Coffee")
        self.assertEqual(data.get("currency"), "INR")
        self.assertEqual(data.get("merchant_code"), "5812")
        self.assertTrue(data.get("is_registered_merchant"))
        self.assertFalse(data.get("is_name_mismatch"))
        self.assertEqual(data.get("risk_level"), "LOW")

    def test_06_payment_recipient_mismatch(self):
        """Test 6: Fraudulent recipient mismatch (Starbucks display name with fraudulent VPA)."""
        tampered_upi = "upi://pay?pa=fake.starbucks@ybl&pn=Starbucks%20Coffee&mc=5812&cu=INR"
        response = self.client.post('/api/analyze-payment', json={"upiUri": tampered_upi})
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data.get("vpa"), "fake.starbucks@ybl")
        self.assertTrue(data.get("is_name_mismatch"))
        self.assertEqual(data.get("risk_level"), "HIGH")
        self.assertGreaterEqual(data.get("risk_score"), 60)

        findings_types = [f.get("type") for f in data.get("findings", [])]
        self.assertTrue(any("MISMATCH" in t or "SUBSTITUTION" in t for t in findings_types))
        self.assertIn("Never enter your UPI PIN", "".join(data.get("safety_advice", [])))

    def test_06b_malformed_upi_string(self):
        """Test handling of invalid non-UPI URI schema."""
        bad_uri = "not-a-valid-scheme://random-data"
        response = self.client.post('/api/analyze-payment', json={"upiUri": bad_uri})
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        findings_types = [f.get("type") for f in data.get("findings", [])]
        self.assertIn("MALFORMED_UPI_URI", findings_types)

if __name__ == '__main__':
    unittest.main()

