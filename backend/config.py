import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / '.env')

class Config:
    """Base application configuration."""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'qrshield-super-secret-key-change-in-production')
    
    # SQLite Database
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL', 
        f"sqlite:///{BASE_DIR / 'qrshield.db'}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Server settings
    HOST = os.environ.get('HOST', '0.0.0.0')
    PORT = int(os.environ.get('PORT', 5000))
    DEBUG = os.environ.get('DEBUG', 'True').lower() in ('true', '1', 't')

    # Security & Uploads
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH', 10 * 1024 * 1024))  # 10 MB max upload
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif'}
    REPORTS_DIR = BASE_DIR / 'storage' / 'reports'
    TEMP_UPLOADS_DIR = BASE_DIR / 'storage' / 'temp'

    # External Threat Intelligence APIs
    SAFE_BROWSING_API_KEY = os.environ.get('SAFE_BROWSING_API_KEY', '')
    THREAT_API_TIMEOUT = int(os.environ.get('THREAT_API_TIMEOUT', 3))  # seconds

    # Risk Scoring Weights (Configurable)
    WEIGHT_MALICIOUS_DOMAIN = int(os.environ.get('WEIGHT_MALICIOUS_DOMAIN', 60))
    WEIGHT_DESTINATION_MISMATCH = int(os.environ.get('WEIGHT_DESTINATION_MISMATCH', 50))
    WEIGHT_PAYMENT_MISMATCH = int(os.environ.get('WEIGHT_PAYMENT_MISMATCH', 35))
    WEIGHT_SUSPICIOUS_URL_STRUCTURE = int(os.environ.get('WEIGHT_SUSPICIOUS_URL_STRUCTURE', 20))
    WEIGHT_UNVERIFIED_SHORTENER = int(os.environ.get('WEIGHT_UNVERIFIED_SHORTENER', 10))
    WEIGHT_UNENCRYPTED_HTTP = int(os.environ.get('WEIGHT_UNENCRYPTED_HTTP', 15))
    WEIGHT_RAW_IP_HOST = int(os.environ.get('WEIGHT_RAW_IP_HOST', 35))
    WEIGHT_PUNYCODE_HOMOGRAPH = int(os.environ.get('WEIGHT_PUNYCODE_HOMOGRAPH', 30))

    # Risk Classification Thresholds
    RISK_THRESHOLD_LOW_MAX = 29
    RISK_THRESHOLD_MEDIUM_MAX = 59

    # CORS Settings
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')

class TestConfig(Config):
    """Testing configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    DEBUG = False
    SAFE_BROWSING_API_KEY = ''

