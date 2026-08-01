"""Authentication API endpoints with full JWT lifecycle."""
import logging
from datetime import datetime, timezone

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity,
    get_jwt,
)

from app import db
from app.models.token_blocklist import TokenBlocklist
from app.services.auth_service import AuthService
from app.services.validation import ValidationError
from app.middleware.security import rate_limit

logger = logging.getLogger(__name__)
auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['POST'])
@rate_limit(max_requests=10, window_seconds=60)
def login():
    """Authenticate user and return JWT access + refresh tokens."""
    data = request.get_json()

    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    try:
        result = AuthService.authenticate(
            username=data.get('username', ''),
            password=data.get('password', ''),
        )
        return jsonify(result), 200
    except ValidationError as e:
        return jsonify({'error': e.message}), 401


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Generate new access token using refresh token."""
    user_id = get_jwt_identity()

    try:
        result = AuthService.refresh_access_token(user_id)
        return jsonify(result), 200
    except ValidationError as e:
        return jsonify({'error': e.message}), 401


@auth_bp.route('/logout', methods=['POST'])
@jwt_required(verify_type=False)
def logout():
    """
    Revoke current token (access or refresh).
    Client should call this for both access and refresh tokens.
    """
    jwt_data = get_jwt()
    jti = jwt_data['jti']
    token_type = jwt_data['type']
    user_id = get_jwt_identity()
    expires_at = datetime.fromtimestamp(jwt_data['exp'], tz=timezone.utc)

    blocked_token = TokenBlocklist(
        jti=jti,
        token_type=token_type,
        user_id=int(user_id),
        expires_at=expires_at,
    )
    db.session.add(blocked_token)
    db.session.commit()

    logger.info(f"User {user_id} logged out (revoked {token_type} token)")
    return jsonify({'message': f'{token_type.capitalize()} token revoked successfully'}), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current authenticated user profile."""
    user_id = get_jwt_identity()
    user = AuthService.get_user_by_id(int(user_id))

    if not user:
        return jsonify({'error': 'User not found'}), 404

    return jsonify({'user': user.to_dict()}), 200


@auth_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update current user's profile (non-sensitive fields)."""
    user_id = get_jwt_identity()
    user = AuthService.get_user_by_id(int(user_id))

    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()

    if 'full_name' in data:
        user.full_name = data['full_name']
    if 'email' in data:
        from app.models.user import User
        existing = User.query.filter_by(email=data['email']).first()
        if existing and existing.id != user.id:
            return jsonify({'error': 'Email already in use'}), 409
        user.email = data['email']
    if 'avatar_url' in data:
        user.avatar_url = data['avatar_url']

    db.session.commit()
    logger.info(f"User {user.username} updated profile")

    return jsonify({'user': user.to_dict(), 'message': 'Profile updated'}), 200


@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change current user's password."""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    try:
        AuthService.change_password(
            user_id=int(user_id),
            current_password=data.get('current_password', ''),
            new_password=data.get('new_password', ''),
        )
        return jsonify({'message': 'Password updated successfully'}), 200
    except ValidationError as e:
        return jsonify({'error': e.message, 'details': e.errors}), 400


@auth_bp.route('/verify', methods=['GET'])
@jwt_required()
def verify_token():
    """Verify that the current access token is valid."""
    claims = get_jwt()
    return jsonify({
        'valid': True,
        'user_id': get_jwt_identity(),
        'role': claims.get('role'),
        'username': claims.get('username'),
    }), 200
