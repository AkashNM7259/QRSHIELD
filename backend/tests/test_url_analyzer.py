"""
Tests for URL Forensics and Threat Intelligence Service.
Covers:
  - Test 3: Suspicious URL (IP address, unencrypted HTTP, shortener)
  - Test 4: Known malicious URL test fixture
  - Test 10: Threat intelligence API unavailable handling
"""

import sys
from pathlib import Path
import unittest
from unittest.mock import patch
import requests

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import create_app
from config import TestConfig
from services.url_analyzer import url_analyzer
from services.threat_intelligence import ThreatIntelligenceService

class TestURLAnalyzer(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()

    def test_03_suspicious_url(self):
        """Test 3: Suspicious URL with multiple heuristic warning flags."""
        suspicious_url = "https://bit.ly/airdrop-free-crypto-bonus-claim?token=xyz"
        response = self.client.post('/api/analyze-url', json={"url": suspicious_url})
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        self.assertTrue(data.get("success"))
        self.assertTrue(data.get("is_shortened"))
        self.assertIn("MEDIUM", (data.get("safety_verdict"), data.get("risk_level")))
        # Check that threat flags list contains explanation of shortener
        findings_types = [f.get("type") for f in data.get("findings", [])]
        self.assertIn("URL_SHORTENER_OBFUSCATION", findings_types)

    def test_04_known_malicious_url_fixture(self):
        """Test 4: Known malicious phishing URL fixture triggers HIGH risk and critical finding."""
        malicious_url = "http://185.220.101.5/bank/sbi-kyc-update.php?ref=qr89"
        response = self.client.post('/api/analyze-url', json={"url": malicious_url})
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data.get("safety_verdict"), "MALICIOUS")
        self.assertEqual(data.get("risk_level"), "HIGH")
        self.assertGreaterEqual(data.get("risk_score"), 60)

        findings_types = [f.get("type") for f in data.get("findings", [])]
        self.assertIn("RAW_IP_HOSTNAME", findings_types)
        self.assertIn("UNENCRYPTED_TRANSPORT", findings_types)

    def test_10_threat_intelligence_api_unavailable(self):
        """
        Test 10: Threat intelligence API unavailable handling.
        Prompt rule: If external API is unavailable, report status as unavailable rather than declaring safe.
        """
        threat_service = ThreatIntelligenceService()
        threat_service.api_key = "MOCK_KEY_FOR_TEST"

        # Mock requests.post to simulate a network outage or API error
        with patch('requests.post', side_effect=requests.RequestException("Connection timed out")):
            result = threat_service.check_url_reputation("https://unknown-domain-test-incident.org")
            self.assertEqual(result.get("service_status"), "UNAVAILABLE")
            self.assertFalse(result.get("is_malicious"))
            self.assertIn("unreachable", result.get("details"))

    def test_10b_homograph_punycode_detection(self):
        """Test detection of Punycode homograph domain lookalikes."""
        punycode_url = "https://xn--pple-43d.com/login"  # apple lookalike
        analysis = url_analyzer.analyze(punycode_url)
        self.assertTrue(analysis["has_punycode"])
        findings_types = [f.get("type") for f in analysis.get("findings", [])]
        self.assertIn("PUNYCODE_HOMOGRAPH", findings_types)

if __name__ == '__main__':
    unittest.main()

