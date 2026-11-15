"""
SQLAlchemy Data Models for QRShield.
"""

from datetime import datetime
import hashlib
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from database import Base, db

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    scans = relationship('QRScan', back_populates='user', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }

class QRScan(Base):
    __tablename__ = 'qr_scans'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True, index=True)
    qr_content = Column(Text, nullable=False)
    content_type = Column(String(50), nullable=False, index=True)
    risk_score = Column(Integer, nullable=False)
    risk_level = Column(String(20), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = relationship('User', back_populates='scans')
    threat_analyses = relationship('ThreatAnalysis', back_populates='scan', cascade='all, delete-orphan')
    report = relationship('SecurityReport', back_populates='scan', uselist=False, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'scan_id': self.id,
            'user_id': self.user_id,
            'qr_content': self.qr_content,
            'rawData': self.qr_content,
            'content_type': self.content_type,
            'contentType': self.content_type,
            'risk_score': self.risk_score,
            'riskScore': self.risk_score,
            'risk_level': self.risk_level,
            'riskLevel': 'SAFE' if self.risk_level == 'LOW' else ('SUSPICIOUS' if self.risk_level == 'MEDIUM' else 'HIGH_RISK'),
            'created_at': self.created_at.isoformat(),
            'timestamp': self.created_at.isoformat(),
            'threat_analyses': [t.to_dict() for t in self.threat_analyses],
            'threatIndicators': [t.to_indicator_dict() for t in self.threat_analyses]
        }

class ThreatAnalysis(Base):
    __tablename__ = 'threat_analyses'

    id = Column(Integer, primary_key=True, autoincrement=True)
    scan_id = Column(Integer, ForeignKey('qr_scans.id'), nullable=False, index=True)
    threat_type = Column(String(100), nullable=False)
    severity = Column(String(20), nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    description = Column(Text, nullable=False)
    evidence = Column(Text, nullable=True)

    scan = relationship('QRScan', back_populates='threat_analyses')

    def to_dict(self):
        return {
            'id': self.id,
            'scan_id': self.scan_id,
            'threat_type': self.threat_type,
            'severity': self.severity,
            'description': self.description,
            'evidence': self.evidence
        }

    def to_indicator_dict(self):
        return {
            'id': f"THR-{self.id}",
            'title': self.threat_type.replace('_', ' ').title(),
            'severity': self.severity.lower(),
            'description': self.description,
            'category': 'url' if 'URL' in self.threat_type or 'DOMAIN' in self.threat_type else ('payment' if 'UPI' in self.threat_type or 'PAY' in self.threat_type else 'tamper')
        }

class RegisteredQR(Base):
    __tablename__ = 'registered_qrs'

    id = Column(String(50), primary_key=True)  # QRS-REG-XXXXXX
    business_name = Column(String(150), nullable=False, index=True)
    qr_name = Column(String(150), nullable=False)
    original_content = Column(Text, nullable=False)
    original_hash = Column(String(64), nullable=False, index=True)  # SHA-256
    verified_upi = Column(String(100), nullable=True)
    store_location = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'business_name': self.business_name,
            'businessName': self.business_name,
            'qr_name': self.qr_name,
            'qrName': self.qr_name,
            'original_content': self.original_content,
            'destination': self.original_content,
            'original_hash': self.original_hash,
            'securityHash': f"sha256-{self.original_hash}",
            'verified_upi': self.verified_upi,
            'verifiedUpiId': self.verified_upi,
            'store_location': self.store_location,
            'storeLocation': self.store_location,
            'category': 'Retail & Merchant',
            'status': 'VERIFIED',
            'created_at': self.created_at.isoformat(),
            'registrationDate': self.created_at.strftime('%Y-%m-%d')
        }

class VerifiedPayment(Base):
    __tablename__ = 'verified_payments'

    id = Column(Integer, primary_key=True, autoincrement=True)
    business_name = Column(String(150), nullable=False, index=True)
    verified_upi = Column(String(100), unique=True, nullable=False, index=True)
    merchant_code = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'business_name': self.business_name,
            'verified_upi': self.verified_upi,
            'merchant_code': self.merchant_code,
            'created_at': self.created_at.isoformat()
        }

class SecurityReport(Base):
    __tablename__ = 'security_reports'

    id = Column(Integer, primary_key=True, autoincrement=True)
    scan_id = Column(Integer, ForeignKey('qr_scans.id'), unique=True, nullable=False, index=True)
    report_path = Column(String(300), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    scan = relationship('QRScan', back_populates='report')

    def to_dict(self):
        return {
            'id': self.id,
            'scan_id': self.scan_id,
            'report_path': self.report_path,
            'created_at': self.created_at.isoformat()
        }


def seed_initial_data(session):
    """Seed authentic test records if tables are empty."""
    # 1. Seed Registered QRs
    if session.query(RegisteredQR).count() == 0:
        seed_records = [
            RegisteredQR(
                id="QRS-IND-001",
                business_name="Starbucks Coffee - Bandra Flagship",
                qr_name="Counter 1 Billing POS",
                original_content="upi://pay?pa=starbucks.bandra@hdfcbank&pn=Starbucks%20Coffee&mc=5812&cu=INR",
                original_hash=hashlib.sha256(b"upi://pay?pa=starbucks.bandra@hdfcbank&pn=Starbucks%20Coffee&mc=5812&cu=INR").hexdigest(),
                verified_upi="starbucks.bandra@hdfcbank",
                store_location="Linking Road, Bandra West, Mumbai"
            ),
            RegisteredQR(
                id="QRS-IND-002",
                business_name="Apollo Pharmacy Central",
                qr_name="Billing Desk 2 UPI",
                original_content="upi://pay?pa=apollopharmacy.pay@icici&pn=Apollo%20Pharmacy&mc=5912&cu=INR",
                original_hash=hashlib.sha256(b"upi://pay?pa=apollopharmacy.pay@icici&pn=Apollo%20Pharmacy&mc=5912&cu=INR").hexdigest(),
                verified_upi="apollopharmacy.pay@icici",
                store_location="Indiranagar 100ft Rd, Bangalore"
            ),
            RegisteredQR(
                id="QRS-IND-003",
                business_name="Decathlon Sports Arena",
                qr_name="Smart Self-Checkout Portal",
                original_content="https://checkout.decathlon.in/store/402/express",
                original_hash=hashlib.sha256(b"https://checkout.decathlon.in/store/402/express").hexdigest(),
                store_location="Cyber City, Gurugram"
            ),
            RegisteredQR(
                id="QRS-IND-004",
                business_name="Blue Tokai Coffee Roasters",
                qr_name="Table 7 Digital Menu & Pay",
                original_content="https://bluetokaicoffee.com/menu/table-7",
                original_hash=hashlib.sha256(b"https://bluetokaicoffee.com/menu/table-7").hexdigest(),
                store_location="Koramangala 4th Block, Bangalore"
            )
        ]
        session.add_all(seed_records)

    # 2. Seed Verified Payments
    if session.query(VerifiedPayment).count() == 0:
        payments = [
            VerifiedPayment(business_name="Starbucks Coffee", verified_upi="starbucks.bandra@hdfcbank", merchant_code="5812"),
            VerifiedPayment(business_name="Apollo Pharmacy", verified_upi="apollopharmacy.pay@icici", merchant_code="5912"),
            VerifiedPayment(business_name="Decathlon Sports", verified_upi="decathlon.express@axisbank", merchant_code="5941"),
            VerifiedPayment(business_name="Blue Tokai Coffee", verified_upi="bluetokai.table7@hdfcbank", merchant_code="5812")
        ]
        session.add_all(payments)

    session.commit()

