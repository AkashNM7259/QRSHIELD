"""
Tests for PDF Security Report Generation and Download.
"""

import sys
from pathlib import Path
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import create_app
from config import TestConfig

class TestReport(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()

    def test_generate_and_download_pdf_report(self):
        """Test PDF report generation and download for a scanned QR incident."""
        # 1. Create a scan
        scan_resp = self.client.post('/api/scan', json={"rawData": "https://checkout.decathlon.in/store/402/express"})
        self.assertEqual(scan_resp.status_code, 200)
        scan_id = scan_resp.get_json()["scan_id"]

        # 2. Request JSON metadata format
        json_rep = self.client.get(f'/api/report/{scan_id}?format=json')
        self.assertEqual(json_rep.status_code, 200)
        data = json_rep.get_json()
        self.assertTrue(data.get("success"))
        self.assertIn("complianceChecks", data)

        # 3. Request PDF download
        pdf_resp = self.client.get(f'/api/report/{scan_id}')
        self.assertEqual(pdf_resp.status_code, 200)
        self.assertEqual(pdf_resp.mimetype, 'application/pdf')
        self.assertTrue(len(pdf_resp.data) > 1000)
        # Check standard PDF magic header
        self.assertTrue(pdf_resp.data.startswith(b'%PDF-'))

if __name__ == '__main__':
    unittest.main()

