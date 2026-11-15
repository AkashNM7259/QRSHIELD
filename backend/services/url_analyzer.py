"""
Comprehensive URL Security Analysis Service.
Performs structural forensics, homograph detection, brand proximity checks, and threat intelligence.
"""

import math
import re
import urllib.parse
from utils.security import validate_ssrf_safe_url
from services.threat_intelligence import threat_intelligence

SUSPICIOUS_TLDS = {
    '.xyz', '.top', '.tk', '.ml', '.ga', '.cf', '.gq', '.buzz', '.cam',
    '.work', '.click', '.rest', '.country', '.gdn', '.mom', '.monster', '.kim', '.sbs'
}

SHORTENER_DOMAINS = {
    'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'is.gd', 'ow.ly', 'cutt.ly',
    'buff.ly', 'rb.gy', 'shorte.st', 'linktr.ee', 'qrco.de', 'v.gd'
}

TARGETED_BRANDS = [
    'google', 'paypal', 'amazon', 'microsoft', 'apple', 'netflix', 'facebook',
    'instagram', 'twitter', 'binance', 'coinbase', 'sbi', 'hdfcbank', 'icicibank',
    'axisbank', 'paytm', 'phonepe', 'gpay', 'whatsapp', 'github', 'dropbox',
    'starbucks', 'mcdonalds', 'zomato', 'swiggy', 'uber', 'ola'
]

SUSPICIOUS_PATH_KEYWORDS = [
    'login', 'signin', 'verify', 'update-account', 'banking', 'secure-payment',
    'kyc-approval', 'airdrop', 'bonus-claim', 'recover-password', 'otp-submit',
    '.apk', '.exe', '.scr', '.vbs', '.bat'
]

def calculate_shannon_entropy(text: str) -> float:
    """Calculate Shannon entropy to detect algorithmically generated domains (DGA)."""
    if not text:
        return 0.0
    entropy = 0.0
    length = len(text)
    char_counts = {}
    for char in text:
        char_counts[char] = char_counts.get(char, 0) + 1
    for count in char_counts.values():
        p = count / length
        entropy -= p * math.log2(p)
    return round(entropy, 2)

class URLAnalyzer:
    """URL forensics engine examining syntax, homographs, IP hosts, and reputation."""

    def normalize_url(self, raw_url: str) -> str:
        """Ensure standard scheme and clean whitespace."""
        cleaned = raw_url.strip()
        if not cleaned.startswith(('http://', 'https://')):
            cleaned = 'https://' + cleaned
        return cleaned

    def extract_domain(self, parsed_url: urllib.parse.ParseResult) -> tuple[str, str]:
        """Extract hostname and root domain."""
        hostname = (parsed_url.hostname or '').lower()
        parts = hostname.split('.')
        if len(parts) >= 2:
            root_domain = f"{parts[-2]}.{parts[-1]}"
        else:
            root_domain = hostname
        return hostname, root_domain

    def analyze(self, raw_url: str) -> dict:
        """
        Execute deep security analysis on the provided URL.
        Returns detailed structural findings, domain metrics, and reputation results.
        """
        findings = []
        evidence = []
        normalized = self.normalize_url(raw_url)

        try:
            parsed = urllib.parse.urlsplit(normalized)
        except Exception as e:
            return {
                "url": raw_url,
                "is_valid": False,
                "domain": "invalid",
                "findings": [{
                    "type": "MALFORMED_URL",
                    "severity": "HIGH",
                    "description": f"URL could not be parsed: {str(e)}"
                }],
                "evidence": ["Syntax error in URL components"],
                "threat_intelligence": {"service_status": "SKIPPED", "is_malicious": False}
            }

        hostname, root_domain = self.extract_domain(parsed)
        scheme = parsed.scheme.lower()
        is_https = scheme == 'https'

        # 1. Transport Layer Check (Do not classify every non-HTTPS website as malicious)
        if not is_https:
            findings.append({
                "type": "UNENCRYPTED_TRANSPORT",
                "severity": "MEDIUM",
                "description": "Cleartext HTTP protocol in use. Vulnerable to interception on untrusted networks."
            })
            evidence.append(f"Scheme is '{scheme}' rather than HTTPS")

        # 2. Raw IP Hostname Check
        is_ip = bool(re.match(r'^(\d{1,3}\.){3}\d{1,3}$', hostname))
        if is_ip:
            findings.append({
                "type": "RAW_IP_HOSTNAME",
                "severity": "HIGH",
                "description": "Direct numerical IP address hostname used instead of registered domain name."
            })
            evidence.append(f"Host '{hostname}' is an IPv4 address; common in phishing kits to bypass domain categorization")

        # 3. URL Shortener Detection (Do not treat as automatically malicious)
        is_shortener = any(hostname == s or hostname.endswith('.' + s) for s in SHORTENER_DOMAINS)
        if is_shortener:
            findings.append({
                "type": "URL_SHORTENER_OBFUSCATION",
                "severity": "MEDIUM",
                "description": "URL shortener obscures ultimate target destination and skips visual scrutiny."
            })
            evidence.append(f"Domain '{hostname}' is a known public shortening service")

        # 4. Homograph & Punycode Detection
        has_punycode = 'xn--' in hostname
        if has_punycode:
            findings.append({
                "type": "PUNYCODE_HOMOGRAPH",
                "severity": "HIGH",
                "description": "Internationalized Domain Name (Punycode) detected. High probability of visual homograph spoofing."
            })
            evidence.append(f"Punycode token found in hostname '{hostname}'")

        # Check for deceptive Cyrillic/Greek characters
        for char in hostname:
            code = ord(char)
            # Cyrillic range: 0x0400 to 0x04FF
            if 0x0400 <= code <= 0x04FF:
                findings.append({
                    "type": "HOMOGRAPH_GLYPH_SPOOF",
                    "severity": "HIGH",
                    "description": "Non-Latin Cyrillic glyph identified in domain name mimicking standard Latin alphabet."
                })
                evidence.append(f"Deceptive unicode character U+{code:04X} detected in '{hostname}'")
                break

        # 5. Suspicious TLD Check
        has_suspicious_tld = any(hostname.endswith(tld) for tld in SUSPICIOUS_TLDS)
        if has_suspicious_tld:
            tld = hostname[hostname.rfind('.'):]
            findings.append({
                "type": "HIGH_ABUSE_TLD",
                "severity": "MEDIUM",
                "description": f"Domain utilizes high-abuse top-level extension ({tld}) frequently leveraged by disposable phishing."
            })
            evidence.append(f"Top-level domain extension '{tld}' flagged for disproportionate threat activity")

        # 6. Typosquatting & Brand Impersonation
        typosquat_target = None
        for brand in TARGETED_BRANDS:
            if brand in hostname:
                # If brand is present, check if authentic domain
                authentic_ends = (f"{brand}.com", f"{brand}.in", f"{brand}.org", f"{brand}.co.in", f"{brand}.net")
                if not any(hostname == auth or hostname.endswith('.' + auth) for auth in authentic_ends):
                    typosquat_target = brand
                    findings.append({
                        "type": "BRAND_TYPOSQUATTING",
                        "severity": "HIGH",
                        "description": f"Potential brand impersonation: domain mimics authentic enterprise entity '{brand}'."
                    })
                    evidence.append(f"Scanned domain '{hostname}' contains protected trademark '{brand}' but lacks authorized root ownership")
                    break

        # 7. Suspicious Path & Query Keywords
        full_path = (parsed.path + '?' + parsed.query).lower()
        matched_keywords = [kw for kw in SUSPICIOUS_PATH_KEYWORDS if kw in full_path]
        if matched_keywords:
            findings.append({
                "type": "SENSITIVE_CREDENTIAL_KEYWORDS",
                "severity": "MEDIUM",
                "description": f"Query path solicits authentication credentials or executable artifacts ({', '.join(matched_keywords)})."
            })
            evidence.append(f"Path contains sensitive keywords: {matched_keywords}")

        # 8. Subdomain Nesting Depth & Entropy
        subdomain_parts = hostname.split('.')
        if len(subdomain_parts) >= 4 and not is_ip:
            findings.append({
                "type": "EXCESSIVE_SUBDOMAIN_NESTING",
                "severity": "LOW",
                "description": f"Unusual subdomain hierarchy depth ({len(subdomain_parts) - 2} levels) detected."
            })
            evidence.append(f"Subdomain structure has {len(subdomain_parts)} tiers")

        hostname_entropy = calculate_shannon_entropy(hostname.replace('.', ''))
        if hostname_entropy > 4.2 and len(hostname) > 15:
            findings.append({
                "type": "HIGH_DOMAIN_ENTROPY",
                "severity": "MEDIUM",
                "description": "Elevated domain character randomness indicating possible Domain Generation Algorithm (DGA)."
            })
            evidence.append(f"Hostname entropy is {hostname_entropy} (threshold 4.2)")

        # 9. Threat Intelligence Reputation Lookup
        threat_rep = threat_intelligence.check_url_reputation(normalized)
        if threat_rep.get("is_malicious"):
            findings.append({
                "type": "MALICIOUS_REPUTATION_MATCH",
                "severity": "CRITICAL",
                "description": threat_rep.get("details", "Domain confirmed malicious by threat intelligence database.")
            })
            evidence.append(f"Provider '{threat_rep.get('provider')}' flagged threats: {threat_rep.get('threat_types')}")

        return {
            "url": raw_url,
            "normalized_url": normalized,
            "is_valid": True,
            "domain": hostname,
            "root_domain": root_domain,
            "scheme": scheme,
            "is_https": is_https,
            "is_ip": is_ip,
            "is_shortener": is_shortener,
            "has_punycode": has_punycode,
            "typosquat_target": typosquat_target,
            "hostname_entropy": hostname_entropy,
            "threat_intelligence": threat_rep,
            "findings": findings,
            "evidence": evidence
        }

url_analyzer = URLAnalyzer()

