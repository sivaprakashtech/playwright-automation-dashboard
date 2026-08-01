"""Flask application factory."""
import os
import logging

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_migrate import Migrate

from config import config_map

db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()

logger = logging.getLogger(__name__)


def create_app(config_name: str = None) -> Flask:
    """Create and configure the Flask application."""
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')

    app = Flask(__name__)
    app.config.from_object(config_map[config_name])

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    CORS(app, resources={r"/api/*": {"origins": app.config.get('CORS_ORIGINS', ['*'])}},
         supports_credentials=True,
         expose_headers=['Content-Disposition'])

    # Setup logging
    from app.middleware.logging_config import setup_logging
    setup_logging(app)

    # Register error handlers
    from app.middleware.error_handlers import register_error_handlers
    register_error_handlers(app)

    # Register security middleware
    from app.middleware.security import register_security_middleware
    register_security_middleware(app)

    # Configure JWT callbacks
    _configure_jwt(app)

    # Ensure storage directories exist
    for dir_path in [
        app.config['REPORTS_DIR'],
        app.config['SCREENSHOTS_DIR'],
        app.config['VIDEOS_DIR'],
        app.config['LOGS_DIR'],
    ]:
        os.makedirs(dir_path, exist_ok=True)

    os.makedirs(os.path.join(os.path.dirname(__file__), '..', 'instance'), exist_ok=True)

    # Register all blueprints
    _register_blueprints(app)

    # Register health check (no auth)
    @app.route('/health')
    def health_check():
        from flask import jsonify as jf
        return jf({'status': 'healthy', 'service': 'playwright-dashboard'}), 200

    # Create tables and seed data
    with app.app_context():
        from app import models  # noqa: F401
        db.create_all()
        _seed_default_data()

    logger.info(f"Application created with config: {config_name}")
    return app


def _configure_jwt(app: Flask) -> None:
    """Configure JWT callbacks for token validation and blocklist."""

    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload: dict) -> bool:
        """Check if a JWT token has been revoked (logout)."""
        from app.models.token_blocklist import TokenBlocklist
        jti = jwt_payload['jti']
        token = TokenBlocklist.query.filter_by(jti=jti).first()
        return token is not None

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        """Handle revoked token access."""
        from flask import jsonify
        return jsonify({
            'error': 'Token Revoked',
            'message': 'Token has been revoked. Please login again.',
        }), 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        """Handle expired token."""
        from flask import jsonify
        return jsonify({
            'error': 'Token Expired',
            'message': 'Access token has expired. Use refresh token to get a new one.',
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        """Handle invalid token."""
        from flask import jsonify
        return jsonify({
            'error': 'Invalid Token',
            'message': 'Token verification failed',
        }), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        """Handle missing token."""
        from flask import jsonify
        return jsonify({
            'error': 'Authorization Required',
            'message': 'Request does not contain an access token',
        }), 401


def _register_blueprints(app: Flask) -> None:
    """Register all API blueprints."""
    from app.api.auth import auth_bp
    from app.api.projects import projects_bp
    from app.api.test_suites import test_suites_bp
    from app.api.test_cases import test_cases_bp
    from app.api.executions import executions_bp
    from app.api.reports import reports_bp
    from app.api.screenshots import screenshots_bp
    from app.api.videos import videos_bp
    from app.api.analytics import analytics_bp
    from app.api.settings import settings_bp
    from app.api.users import users_bp
    from app.api.scheduler import scheduler_bp
    from app.api.environments import environments_bp
    from app.api.browsers import browsers_bp
    from app.api.notifications import notifications_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(projects_bp, url_prefix='/api/projects')
    app.register_blueprint(test_suites_bp, url_prefix='/api/test-suites')
    app.register_blueprint(test_cases_bp, url_prefix='/api/test-cases')
    app.register_blueprint(executions_bp, url_prefix='/api/executions')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(screenshots_bp, url_prefix='/api/screenshots')
    app.register_blueprint(videos_bp, url_prefix='/api/videos')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(settings_bp, url_prefix='/api/settings')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(scheduler_bp, url_prefix='/api/scheduler')
    app.register_blueprint(environments_bp, url_prefix='/api/environments')
    app.register_blueprint(browsers_bp, url_prefix='/api/browsers')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')


def _seed_default_data() -> None:
    """Seed default data: users, browsers, environments, settings."""
    from app.models.user import User
    from app.models.settings import Settings
    from app.models.browser import Browser
    from app.models.environment import Environment
    import json

    # --- Users ---
    if not User.query.filter_by(username='admin').first():
        admin = User(
            username='admin',
            email='siva0225@gmail.com',
            role='admin',
            full_name='System Administrator',
        )
        admin.set_password('1231231234')
        db.session.add(admin)

        qa_user = User(
            username='qa_engineer',
            email='qa@dashboard.com',
            role='qa_engineer',
            full_name='QA Engineer',
        )
        qa_user.set_password('1231231234')
        db.session.add(qa_user)

        qa_lead = User(
            username='qa_lead',
            email='lead@dashboard.com',
            role='admin',
            full_name='QA Lead',
        )
        qa_lead.set_password('1231231234')
        db.session.add(qa_lead)

    # --- Settings ---
    if not Settings.query.first():
        settings = Settings(
            theme='dark',
            execution_path='./tests',
            parallel_workers=4,
            timeout=30000,
            retries=1,
            default_browser='chromium',
            headless=True,
            screenshot_on_failure=True,
            video_recording=False,
            trace_recording=False,
            base_url='http://localhost:3000',
            report_format='html',
        )
        db.session.add(settings)

    # --- Browsers ---
    if not Browser.query.first():
        browsers = [
            Browser(
                name='chromium',
                display_name='Chromium (Chrome/Edge)',
                engine='chromium',
                version='120.0',
                is_installed=True,
                is_active=True,
                channel='stable',
            ),
            Browser(
                name='firefox',
                display_name='Firefox',
                engine='firefox',
                version='121.0',
                is_installed=True,
                is_active=True,
                channel='stable',
            ),
            Browser(
                name='webkit',
                display_name='WebKit (Safari)',
                engine='webkit',
                version='17.4',
                is_installed=True,
                is_active=True,
                channel='stable',
            ),
            Browser(
                name='chrome-canary',
                display_name='Chrome Canary',
                engine='chromium',
                version='122.0',
                is_installed=False,
                is_active=False,
                channel='canary',
            ),
        ]
        db.session.add_all(browsers)

    # --- Environments ---
    if not Environment.query.first():
        environments = [
            Environment(
                name='development',
                display_name='Development',
                base_url='http://localhost:3000',
                description='Local development environment',
                is_active=True,
                variables=json.dumps({'DEBUG': 'true', 'LOG_LEVEL': 'debug'}),
            ),
            Environment(
                name='qa',
                display_name='QA',
                base_url='https://qa.example.com',
                description='QA testing environment',
                is_active=True,
                variables=json.dumps({'DEBUG': 'false', 'LOG_LEVEL': 'info'}),
            ),
            Environment(
                name='staging',
                display_name='Staging',
                base_url='https://staging.example.com',
                description='Pre-production staging environment',
                is_active=True,
                variables=json.dumps({'DEBUG': 'false', 'LOG_LEVEL': 'warning'}),
            ),
            Environment(
                name='production',
                display_name='Production',
                base_url='https://app.example.com',
                description='Live production environment',
                is_active=True,
                variables=json.dumps({'DEBUG': 'false', 'LOG_LEVEL': 'error'}),
            ),
        ]
        db.session.add_all(environments)

    db.session.commit()
