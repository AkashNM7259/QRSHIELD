"""
History routes: Query and manage persistent incident scan audit logs.
"""

from flask import Blueprint, request, jsonify
from database import db
from models import QRScan, ThreatAnalysis

history_bp = Blueprint('history_bp', __name__)

@history_bp.route('/api/history', methods=['GET'])
def get_history_endpoint():
    """
    Returns scan history with optional filtering.
    Query params:
        - limit: max items (default 50)
        - risk_level: filter by 'LOW', 'MEDIUM', 'HIGH'
        - search: keyword search in qr_content
    """
    limit = int(request.args.get('limit', 50))
    risk_level = request.args.get('risk_level') or request.args.get('riskLevel')
    search = request.args.get('search', '').strip()

    session = db.get_session()
    try:
        query = session.query(QRScan).order_by(QRScan.created_at.desc())

        if risk_level and risk_level.upper() != 'ALL':
            query = query.filter(QRScan.risk_level.ilike(risk_level))

        if search:
            query = query.filter(QRScan.qr_content.ilike(f"%{search}%"))

        scans = query.limit(limit).all()
        history_list = [s.to_dict() for s in scans]

        return jsonify({
            "success": True,
            "count": len(history_list),
            "history": history_list,
            "scans": history_list  # format alias for flexibility
        }), 200
    finally:
        session.close()

@history_bp.route('/api/history/<int:scan_id>', methods=['DELETE'])
def delete_scan_endpoint(scan_id):
    """Delete an individual scan record and associated threats from audit log."""
    session = db.get_session()
    try:
        scan = session.query(QRScan).filter(QRScan.id == scan_id).first()
        if not scan:
            return jsonify({"success": False, "error": f"Scan record {scan_id} not found."}), 404

        session.delete(scan)
        session.commit()
        return jsonify({"success": True, "message": f"Scan record {scan_id} deleted."}), 200
    finally:
        session.close()

@history_bp.route('/api/history', methods=['DELETE'])
def clear_all_history_endpoint():
    """Clear all incident scan records from audit log."""
    session = db.get_session()
    try:
        session.query(ThreatAnalysis).delete()
        deleted_count = session.query(QRScan).delete()
        session.commit()
        return jsonify({
            "success": True,
            "message": f"Cleared {deleted_count} incident records from audit log."
        }), 200
    finally:
        session.close()

