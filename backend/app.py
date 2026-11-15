"""
QRShield Flask Application Entry Point.
Modular REST API server powering the AI QR Code Security and Fraud Detection System.
"""

import logging
import os
from datetime import datetime
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from database import db
from models import seed_initial_data

# Import Blueprints
from routes.scan_routes import scan_bp
from routes.url_routes import url_bp
from routes.payment_routes import payment_bp
from routes.verification_routes import verification_bp
from routes.history_routes import history_bp
from routes.report_routes import report_bp
from routes.dashboard_routes import dashboard_bp
from routes.auth_routes import auth_bp

def create_app(config_class=Config):
    """Application factory for QRShield backend."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Configure Logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
    )
    logger = logging.getLogger('QRShield')
    logger.info("Initializing QRShield Cybersecurity Platform Backend...")

    # Enable CORS
    CORS(
        app,
        resources={r"/api/*": {"origins": config_class.CORS_ORIGINS}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    )

    # Initialize Database & Seed Authentic Records
    db.init_db(config_class.SQLALCHEMY_DATABASE_URI)
    session = db.get_session()
    try:
        seed_initial_data(session)
        logger.info("Database initialized and verified merchant records anchored.")
    finally:
        session.close()

    # Register Blueprints
    app.register_blueprint(scan_bp)
    app.register_blueprint(url_bp)
    app.register_blueprint(payment_bp)
    app.register_blueprint(verification_bp)
    app.register_blueprint(history_bp)
    app.register_blueprint(report_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(auth_bp)

    # Health Check Endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            "status": "healthy",
            "service": "QRShield Cybersecurity Engine",
            "version": "2.6.4",
            "threat_intelligence_status": "ONLINE" if config_class.SAFE_BROWSING_API_KEY else "LOCAL_HEURISTICS_ACTIVE",
            "database": "CONNECTED",
            "timestamp": datetime.utcnow().isoformat()
        }), 200

    # Custom Error Handlers
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({"success": False, "error": str(error), "code": 400}), 400

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"success": False, "error": "Endpoint or resource not found.", "code": 404}), 404

    @app.errorhandler(413)
    def request_entity_too_large(error):
        return jsonify({
            "success": False,
            "error": f"Uploaded file exceeds maximum size limit ({config_class.MAX_CONTENT_LENGTH // (1024 * 1024)} MB).",
            "code": 413
        }), 413

    @app.errorhandler(500)
    def internal_server_error(error):
        logger.error(f"Internal Server Error: {error}")
        return jsonify({
            "success": False,
            "error": "Internal security engine processing error. Incident logged.",
            "code": 500
        }), 500

    return app

# WSGI application instance for production servers (Gunicorn, uWSGI)
app = create_app()

if __name__ == '__main__':
    print(f"\n=======================================================")
    print(f"🛡️  QRShield Security REST API running on http://{Config.HOST}:{Config.PORT}")
    print(f"    - Health: http://localhost:{Config.PORT}/api/health")
    print(f"    - Dashboard: http://localhost:{Config.PORT}/api/dashboard")
    print(f"=======================================================\n")
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)
