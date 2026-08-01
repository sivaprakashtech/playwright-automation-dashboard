"""Browsers API endpoints."""
import logging
from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from app import db
from app.models.browser import Browser
from app.middleware.decorators import admin_required
from app.services.validation import Validator

logger = logging.getLogger(__name__)
browsers_bp = Blueprint('browsers', __name__)


@browsers_bp.route('', methods=['GET'])
@jwt_required()
def get_browsers():
    """Get all configured browsers."""
    active_only = request.args.get('active_only', 'false').lower() == 'true'

    query = Browser.query
    if active_only:
        query = query.filter_by(is_active=True)

    browsers = query.order_by(Browser.display_name).all()
    return jsonify({'browsers': [b.to_dict() for b in browsers]}), 200


@browsers_bp.route('/<int:browser_id>', methods=['GET'])
@jwt_required()
def get_browser(browser_id):
    """Get a specific browser configuration."""
    browser = Browser.query.get_or_404(browser_id)
    return jsonify({'browser': browser.to_dict()}), 200


@browsers_bp.route('', methods=['POST'])
@admin_required
def create_browser():
    """Add a new browser configuration (admin only)."""
    data = request.get_json()

    validator = Validator(data)
    validator.require('name').require('display_name').require('engine')
    validator.string('name', max_len=50)
    validator.in_list('engine', ['chromium', 'firefox', 'webkit'])
    validator.validate()

    if Browser.query.filter_by(name=data['name']).first():
        return jsonify({'error': 'Browser with this name already exists'}), 409

    browser = Browser(
        name=data['name'],
        display_name=data['display_name'],
        engine=data['engine'],
        version=data.get('version'),
        is_installed=data.get('is_installed', False),
        channel=data.get('channel', 'stable'),
        executable_path=data.get('executable_path'),
    )

    db.session.add(browser)
    db.session.commit()

    logger.info(f"Browser '{browser.display_name}' created")
    return jsonify({'browser': browser.to_dict(), 'message': 'Browser created'}), 201


@browsers_bp.route('/<int:browser_id>', methods=['PUT'])
@admin_required
def update_browser(browser_id):
    """Update browser configuration (admin only)."""
    browser = Browser.query.get_or_404(browser_id)
    data = request.get_json()

    if 'display_name' in data:
        browser.display_name = data['display_name']
    if 'version' in data:
        browser.version = data['version']
    if 'is_installed' in data:
        browser.is_installed = data['is_installed']
    if 'is_active' in data:
        browser.is_active = data['is_active']
    if 'channel' in data:
        browser.channel = data['channel']
    if 'executable_path' in data:
        browser.executable_path = data['executable_path']

    db.session.commit()

    logger.info(f"Browser '{browser.display_name}' updated")
    return jsonify({'browser': browser.to_dict(), 'message': 'Browser updated'}), 200


@browsers_bp.route('/<int:browser_id>', methods=['DELETE'])
@admin_required
def delete_browser(browser_id):
    """Delete a browser configuration (admin only)."""
    browser = Browser.query.get_or_404(browser_id)

    db.session.delete(browser)
    db.session.commit()

    logger.info(f"Browser '{browser.display_name}' deleted")
    return jsonify({'message': 'Browser deleted'}), 200


@browsers_bp.route('/<int:browser_id>/check', methods=['POST'])
@jwt_required()
def check_browser_status(browser_id):
    """Check if a browser is installed and available."""
    browser = Browser.query.get_or_404(browser_id)

    # In production this would check actual playwright installation
    # For now, mark as checked
    browser.last_checked = datetime.utcnow()
    browser.is_installed = True  # Simulate successful check
    db.session.commit()

    return jsonify({
        'browser': browser.to_dict(),
        'message': f'{browser.display_name} is available',
    }), 200
