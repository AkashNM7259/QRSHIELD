"""
Input validation utilities for files, URLs, and UPI strings.
"""

import re
import urllib.parse
from config import Config

ALLOWED_MIME_TYPES = {
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/bmp',
    'image/gif'
}

def validate_image_file(file_storage) -> tuple[bool, str]:
    """
    Validate uploaded file size, extension, and MIME type.
    Returns (is_valid, error_message).
    """
    if not file_storage or file_storage.filename == '':
        return False, "No file provided or empty filename."

    filename = file_storage.filename.lower()
    ext = filename.rsplit('.', 1)[-1] if '.' in filename else ''
    if ext not in Config.ALLOWED_EXTENSIONS:
        return False, f"Unsupported file extension '.{ext}'. Allowed: {', '.join(Config.ALLOWED_EXTENSIONS)}"

    content_type = getattr(file_storage, 'content_type', '')
    if content_type and content_type.lower() not in ALLOWED_MIME_TYPES:
        return False, f"Disallowed MIME type '{content_type}'. Must be a valid image."

    # Validate size via stream seek if available
    try:
        file_storage.seek(0, 2)
        size = file_storage.tell()
        file_storage.seek(0)
        if size > Config.MAX_CONTENT_LENGTH:
            return False, f"File size exceeds maximum allowed limit ({Config.MAX_CONTENT_LENGTH // (1024 * 1024)} MB)."
        if size == 0:
            return False, "Uploaded file is empty (0 bytes)."
    except Exception:
        pass

    return True, ""

def is_valid_url_syntax(url: str) -> bool:
    """Check if string parses as a valid URL."""
    if not url or len(url) > 2048:
        return False
    try:
        parsed = urllib.parse.urlparse(url)
        return bool(parsed.scheme and (parsed.netloc or parsed.path))
    except Exception:
        return False

def is_valid_upi_syntax(uri: str) -> bool:
    """Check if string matches UPI URI format."""
    if not uri or not uri.strip().lower().startswith('upi://pay'):
        return False
    try:
        query_part = uri.split('?', 1)[1] if '?' in uri else ''
        params = urllib.parse.parse_qs(query_part)
        return 'pa' in params and len(params['pa'][0]) > 3
    except Exception:
        return False

