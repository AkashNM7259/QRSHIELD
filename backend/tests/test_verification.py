"""
Tests for QR Destination Verification and Registration Engine.
Covers:
  - Test 7: Correct registered QR verification
  - Test 8: Changed registered QR destination
  - Test 9: Unregistered QR
"""

import sys
from pathlib import Path
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import create_app
from config import TestConfig

class TestVerification(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()

    def test_07_correct_registered_qr(self):
        """Test 7: Authentic registered destination matches fingerprint -> VERIFIED."""
        authentic_payload = "https://checkout.decathlon.in/store/402/express"
        response = self.client.post('/api/verify-qr', json={"payload": authentic_payload})
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data.get("status"), "VERIFIED")
        self.assertFalse(data.get("tamper_detected"))
        self.assertIn("Decathlon", data.get("registered_record", {}).get("business_name", ""))

    def test_08_changed_registered_qr_destination(self):
        """Test 8: Altered QR destination for registered merchant -> DESTINATION_CHANGED."""
        # Simulated sticker swap: name has Starbucks, but VPA is rogue
        tampered_payload = "upi://pay?pa=fake.starbucks@ybl&pn=Starbucks%20Coffee&mc=5812&cu=INR"
        response = self.client.post('/api/verify-qr', json={"payload": tampered_payload})
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data.get("status"), "DESTINATION_CHANGED")
        self.assertTrue(data.get("tamper_detected"))
        self.assertIn("mismatch_details", data)

    def test_09_unregistered_qr(self):
        """Test 9: Arbitrary unregistered QR destination -> NOT_REGISTERED."""
        random_payload = "https://arbitrary-personal-portfolio-site.io/about"
        response = self.client.post('/api/verify-qr', json={"payload": random_payload})
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data.get("status"), "NOT_REGISTERED")
        self.assertFalse(data.get("tamper_detected"))

    def test_09b_register_new_merchant_qr(self):
        """Test registration of a new authentic business stand."""
        new_qr = {
            "businessName": "Blue Tokai Coffee Roasters",
            "qrName": "Express Counter 3",
            "destination": "https://bluetokaicoffee.com/pay/counter-3",
            "storeLocation": "Indiranagar, Bangalore"
        }
        response = self.client.post('/api/register-qr', json=new_qr)
        self.assertEqual(response.status_code, 201)

        data = response.get_json()
        self.assertTrue(data.get("success"))
        self.assertIn("record", data)
        self.assertTrue(data.get("record", {}).get("id", "").startswith("QRS-REG-"))

        # Verify newly registered QR immediately matches
        verify_resp = self.client.post(
            '/api/verify-qr',
            json={"payload": "https://bluetokaicoffee.com/pay/counter-3"}
        )
        verify_data = verify_resp.get_json()
        self.assertEqual(verify_data.get("status"), "VERIFIED")

if __name__ == '__main__':
    unittest.main()

