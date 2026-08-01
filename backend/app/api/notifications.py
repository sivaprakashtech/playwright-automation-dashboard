"""Notifications API endpoints."""
import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from app import db
from app.models.notification import Notification
from app.middleware.decorators import get_current_user_id

logger = logging.getLogger(__name__)
notifications_bp = Blueprint('notifications', __name__)


@notifications_bp.route('', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get current user's notifications."""
    user_id = get_current_user_id()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    unread_only = request.args.get('unread_only', 'false').lower() == 'true'

    query = Notification.query.filter_by(user_id=user_id)

    if unread_only:
        query = query.filter_by(is_read=False)

    query = query.order_by(Notification.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    unread_count = Notification.query.filter_by(user_id=user_id, is_read=False).count()

    return jsonify({
        'notifications': [n.to_dict() for n in pagination.items],
        'total': pagination.total,
        'unread_count': unread_count,
        'pages': pagination.pages,
        'current_page': page,
    }), 200


@notifications_bp.route('/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    """Get count of unread notifications."""
    user_id = get_current_user_id()
    count = Notification.query.filter_by(user_id=user_id, is_read=False).count()
    return jsonify({'unread_count': count}), 200


@notifications_bp.route('/<int:notification_id>/read', methods=['POST'])
@jwt_required()
def mark_as_read(notification_id):
    """Mark a notification as read."""
    user_id = get_current_user_id()
    notification = Notification.query.filter_by(id=notification_id, user_id=user_id).first_or_404()

    notification.mark_read()
    db.session.commit()

    return jsonify({'message': 'Notification marked as read'}), 200


@notifications_bp.route('/read-all', methods=['POST'])
@jwt_required()
def mark_all_as_read():
    """Mark all notifications as read for current user."""
    user_id = get_current_user_id()

    Notification.query.filter_by(user_id=user_id, is_read=False).update({'is_read': True})
    db.session.commit()

    logger.info(f"All notifications marked as read for user {user_id}")
    return jsonify({'message': 'All notifications marked as read'}), 200


@notifications_bp.route('/<int:notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    """Delete a notification."""
    user_id = get_current_user_id()
    notification = Notification.query.filter_by(id=notification_id, user_id=user_id).first_or_404()

    db.session.delete(notification)
    db.session.commit()

    return jsonify({'message': 'Notification deleted'}), 200


@notifications_bp.route('/clear', methods=['DELETE'])
@jwt_required()
def clear_notifications():
    """Clear all read notifications for current user."""
    user_id = get_current_user_id()

    deleted_count = Notification.query.filter_by(user_id=user_id, is_read=True).delete()
    db.session.commit()

    logger.info(f"Cleared {deleted_count} read notifications for user {user_id}")
    return jsonify({'message': f'{deleted_count} notifications cleared'}), 200
