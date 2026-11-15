"""
Tests for QR Decoding and Scanner Endpoint.
Covers:
  - Test 1: Valid URL QR code
  - Test 2: Invalid QR image handling
"""

import io
import sys
from pathlib import Path
import unittest
from PIL import Image

# Ensure backend directory is in python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import create_app
from config import TestConfig
from services.qr_decoder import qr_decoder

class TestScanner(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()

    def test_01_valid_url_payload_scan(self):
        """Test 1: Valid URL QR code payload via /api/scan."""
        payload = {"rawData": "https://checkout.decathlon.in/store/402/express"}
        response = self.client.post('/api/scan', json=payload)
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data.get("content_type"), "URL")
        self.assertIn("risk_score", data)
        self.assertIn("risk_level", data)
        self.assertEqual(data.get("risk_level"), "LOW")
        self.assertIn("explanation", data)
        self.assertIn("url_analysis", data)

    def test_02_invalid_qr_image(self):
        """Test 2: Invalid QR image with no decodable QR matrix."""
        # Create a plain white 200x200 image without QR patterns
        img = Image.new('RGB', (200, 200), color=(255, 255, 255))
        img_bytes_io = io.BytesIO()
        img.save(img_bytes_io, format='PNG')
        img_bytes_io.seek(0)

        data = {
            'file': (img_bytes_io, 'blank_test.png', 'image/png')
        }
        response = self.client.post(
            '/api/scan',
            data=data,
            content_type='multipart/form-data'
        )

        self.assertEqual(response.status_code, 400)
        json_data = response.get_json()
        self.assertFalse(json_data.get("success"))
        self.assertIn("No QR code could be detected", json_data.get("error"))

    def test_02b_corrupted_file_upload(self):
        """Test corrupted or non-image file upload."""
        corrupted_io = io.BytesIO(b"NOT_A_VALID_IMAGE_HEADER_BYTES_123456")
        data = {
            'file': (corrupted_io, 'corrupt.png', 'image/png')
        }
        response = self.client.post(
            '/api/scan',
            data=data,
            content_type='multipart/form-data'
        )
        self.assertEqual(response.status_code, 400)
        json_data = response.get_json()
        self.assertFalse(json_data.get("success"))

if __name__ == '__main__':
    unittest.main()

