"""Videos API endpoints."""
import os
from datetime import datetime

from flask import Blueprint, jsonify, send_file, current_app
from flask_jwt_extended import jwt_required

videos_bp = Blueprint('videos', __name__)


@videos_bp.route('', methods=['GET'])
@jwt_required()
def get_videos():
    """List all recorded videos."""
    videos_dir = current_app.config['VIDEOS_DIR']
    videos = []

    if os.path.exists(videos_dir):
        for filename in sorted(os.listdir(videos_dir), reverse=True):
            if filename.lower().endswith(('.webm', '.mp4', '.avi')):
                filepath = os.path.join(videos_dir, filename)
                stats = os.stat(filepath)
                videos.append({
                    'filename': filename,
                    'path': f'/api/videos/file/{filename}',
                    'size': stats.st_size,
                    'created_at': datetime.fromtimestamp(stats.st_ctime).isoformat(),
                })

    return jsonify({'videos': videos, 'total': len(videos)}), 200


@videos_bp.route('/file/<path:filename>', methods=['GET'])
@jwt_required()
def get_video_file(filename):
    """Serve a video file."""
    videos_dir = current_app.config['VIDEOS_DIR']
    filepath = os.path.join(videos_dir, filename)

    if not os.path.exists(filepath):
        return jsonify({'error': 'Video not found'}), 404

    return send_file(filepath)


@videos_bp.route('/file/<path:filename>', methods=['DELETE'])
@jwt_required()
def delete_video(filename):
    """Delete a video."""
    videos_dir = current_app.config['VIDEOS_DIR']
    filepath = os.path.join(videos_dir, filename)

    if os.path.exists(filepath):
        os.remove(filepath)

    return jsonify({'message': 'Video deleted'}), 200
