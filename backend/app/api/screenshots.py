"""Screenshots API endpoints."""
import os
from datetime import datetime

from flask import Blueprint, jsonify, send_file, current_app
from flask_jwt_extended import jwt_required

screenshots_bp = Blueprint('screenshots', __name__)


@screenshots_bp.route('', methods=['GET'])
@jwt_required()
def get_screenshots():
    """List all screenshots."""
    screenshots_dir = current_app.config['SCREENSHOTS_DIR']
    screenshots = []

    if os.path.exists(screenshots_dir):
        for filename in sorted(os.listdir(screenshots_dir), reverse=True):
            if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                filepath = os.path.join(screenshots_dir, filename)
                stats = os.stat(filepath)
                screenshots.append({
                    'filename': filename,
                    'path': f'/api/screenshots/file/{filename}',
                    'size': stats.st_size,
                    'created_at': datetime.fromtimestamp(stats.st_ctime).isoformat(),
                })

    return jsonify({'screenshots': screenshots, 'total': len(screenshots)}), 200


@screenshots_bp.route('/file/<path:filename>', methods=['GET'])
@jwt_required()
def get_screenshot_file(filename):
    """Serve a screenshot file."""
    screenshots_dir = current_app.config['SCREENSHOTS_DIR']
    filepath = os.path.join(screenshots_dir, filename)

    if not os.path.exists(filepath):
        return jsonify({'error': 'Screenshot not found'}), 404

    return send_file(filepath)


@screenshots_bp.route('/file/<path:filename>', methods=['DELETE'])
@jwt_required()
def delete_screenshot(filename):
    """Delete a screenshot."""
    screenshots_dir = current_app.config['SCREENSHOTS_DIR']
    filepath = os.path.join(screenshots_dir, filename)

    if os.path.exists(filepath):
        os.remove(filepath)

    return jsonify({'message': 'Screenshot deleted'}), 200
