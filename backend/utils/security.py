"""
Cybersecurity utilities: SSRF protection, IP filtering, canonicalization, and hashing.
"""

import hashlib
import ipaddress
import re
import socket
import urllib.parse
from pathlib import Path
from werkzeug.utils import secure_filename

BLOCKED_HOSTNAMES = {
    'localhost',
    'metadata.google.internal',
    'instance-data',
    '169.254.169.254',
}

def canonicalize_destination(content: str) -> str:
    """
    Standardize destination string before hashing to ensure consistent cryptographic fingerprints.
    """
    cleaned = content.strip()
    if cleaned.startswith(('http://', 'https://')):
        try:
            parsed = urllib.parse.urlsplit(cleaned)
            scheme = parsed.scheme.lower()
            netloc = parsed.netloc.lower()
            # Remove standard default ports
            if netloc.endswith(':80') and scheme == 'http':
                netloc = netloc[:-3]
            elif netloc.endswith(':443') and scheme == 'https':
                netloc = netloc[:-4]
            path = parsed.path or '/'
            query = '&'.join(sorted(parsed.query.split('&'))) if parsed.query else ''
            return urllib.parse.urlunsplit((scheme, netloc, path, query, ''))
        except Exception:
            return cleaned.lower()
    elif cleaned.lower().startswith('upi://'):
        try:
            parts = cleaned.split('?', 1)
            base = parts[0].lower()
            if len(parts) > 1:
                params = urllib.parse.parse_qsl(parts[1], keep_blank_values=True)
                sorted_params = sorted([(k.lower(), v) for k, v in params])
                query = urllib.parse.urlencode(sorted_params)
                return f"{base}?{query}"
            return base
        except Exception:
            return cleaned.lower()
    return cleaned

def compute_sha256_fingerprint(content: str) -> str:
    """Generate SHA-256 hexadecimal digest of canonicalized content."""
    canonical = canonicalize_destination(content)
    return hashlib.sha256(canonical.encode('utf-8')).hexdigest()

def is_safe_ip(ip_str: str) -> bool:
    """
    Strict validation against SSRF.
    Rejects loopback, private, link-local, multicast, and cloud metadata addresses.
    """
    try:
        ip = ipaddress.ip_address(ip_str)
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast or ip.is_reserved or ip.is_unspecified:
            return False
        # Specific check for AWS/GCP/Azure link-local metadata address
        if str(ip) == '169.254.169.254':
            return False
        return True
    except ValueError:
        return False

def validate_ssrf_safe_url(url: str) -> tuple[bool, str]:
    """
    Inspect URL to ensure it cannot trigger SSRF or reach internal network boundaries.
    Returns (is_safe, reason).
    """
    try:
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme not in ('http', 'https'):
            return False, f"Disallowed scheme '{parsed.scheme}'. Only HTTP and HTTPS are permitted."

        hostname = (parsed.hostname or '').lower()
        if not hostname:
            return False, "Missing hostname in URL."

        if hostname in BLOCKED_HOSTNAMES or hostname.endswith('.internal') or hostname.endswith('.local'):
            return False, f"SSRF Blocked: Hostname '{hostname}' targets internal/cloud metadata scope."

        # Check if direct IP is used
        try:
            ip = ipaddress.ip_address(hostname)
            if not is_safe_ip(str(ip)):
                return False, f"SSRF Blocked: Target IP {ip} is within a private or restricted network boundary."
            return True, ""
        except ValueError:
            pass  # It is a domain name, not raw IP

        # Resolve domain to check resolved IP
        try:
            addr_info = socket.getaddrinfo(hostname, None)
            for item in addr_info:
                ip_addr = item[4][0]
                if not is_safe_ip(ip_addr):
                    return False, f"SSRF Blocked: Domain '{hostname}' resolves to restricted IP {ip_addr}."
        except socket.gaierror:
            return False, f"Domain name '{hostname}' could not be resolved."

        return True, ""
    except Exception as e:
        return False, f"URL safety evaluation failed: {str(e)}"

def safe_report_filename(scan_id: int) -> str:
    """Sanitize and construct report filename preventing path traversal."""
    safe_id = secure_filename(str(scan_id))
    return f"QRShield_Report_{safe_id}.pdf"

