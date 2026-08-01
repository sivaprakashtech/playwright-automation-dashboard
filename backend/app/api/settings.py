"""Settings API endpoints."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from app import db
from app.models.settings import Settings

settings_bp = Blueprint('settings', __name__)


@settings_bp.route('', methods=['GET'])
@jwt_required()
def get_settings():
    """Get application settings."""
    settings = Settings.query.first()
    if not settings:
        settings = Settings()
        db.session.add(settings)
        db.session.commit()

    return jsonify({'settings': settings.to_dict()}), 200


@settings_bp.route('', methods=['PUT'])
@jwt_required()
def update_settings():
    """Update application settings."""
    settings = Settings.query.first()
    if not settings:
        settings = Settings()
        db.session.add(settings)

    data = request.get_json()

    fields = [
        'theme', 'execution_path', 'parallel_workers', 'timeout',
        'retries', 'default_browser', 'headless', 'screenshot_on_failure',
        'video_recording', 'trace_recording', 'base_url', 'report_format',
        'notification_email', 'slack_webhook',
    ]

    for field in fields:
        if field in data:
            setattr(settings, field, data[field])

    db.session.commit()

    return jsonify({'settings': settings.to_dict(), 'message': 'Settings updated'}), 200
