"""Users API endpoints with admin RBAC."""
import logging

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from app import db
from app.models.user import User
from app.middleware.decorators import admin_required, get_current_user_id
from app.services.validation import Validator, ValidationError, validate_pagination

logger = logging.getLogger(__name__)
users_bp = Blueprint('users', __name__)


@users_bp.route('', methods=['GET'])
@admin_required
def get_users():
    """Get all users (admin only) with pagination."""
    page, per_page = validate_pagination(request.args)
    search = request.args.get('search', '').strip()
    role = request.args.get('role', '').strip()

    query = User.query

    if search:
        query = query.filter(
            db.or_(
                User.username.ilike(f'%{search}%'),
                User.full_name.ilike(f'%{search}%'),
                User.email.ilike(f'%{search}%'),
            )
        )
    if role:
        query = query.filter_by(role=role)

    query = query.order_by(User.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'users': [u.to_dict() for u in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page,
    }), 200


@users_bp.route('/<int:user_id>', methods=['GET'])
@admin_required
def get_user(user_id):
    """Get a specific user (admin only)."""
    user = User.query.get_or_404(user_id)
    return jsonify({'user': user.to_dict()}), 200


@users_bp.route('', methods=['POST'])
@admin_required
def create_user():
    """Create a new user (admin only)."""
    data = request.get_json()

    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    # Validate input
    validator = Validator(data)
    validator.require('username', 'Username')
    validator.require('email', 'Email')
    validator.require('password', 'Password')
    validator.require('full_name', 'Full Name')
    validator.string('username', min_len=3, max_len=80, label='Username')
    validator.string('password', min_len=6, max_len=128, label='Password')
    validator.string('full_name', min_len=2, max_len=120, label='Full Name')
    validator.email('email')
    validator.in_list('role', ['admin', 'qa_engineer'])

    try:
        validator.validate()
    except ValidationError as e:
        return jsonify({'error': 'Validation failed', 'details': e.errors}), 400

    # Check uniqueness
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 409
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 409

    user = User(
        username=data['username'].strip(),
        email=data['email'].strip().lower(),
        full_name=data['full_name'].strip(),
        role=data.get('role', 'qa_engineer'),
        is_active=data.get('is_active', True),
    )
    user.set_password(data['password'])

    db.session.add(user)
    db.session.commit()

    logger.info(f"User '{user.username}' created by admin")
    return jsonify({'user': user.to_dict(), 'message': 'User created successfully'}), 201


@users_bp.route('/<int:user_id>', methods=['PUT'])
@admin_required
def update_user(user_id):
    """Update a user (admin only)."""
    user = User.query.get_or_404(user_id)
    data = request.get_json()

    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    # Validate updatable fields
    if 'email' in data:
        validator = Validator(data)
        validator.email('email')
        try:
            validator.validate()
        except ValidationError as e:
            return jsonify({'error': 'Validation failed', 'details': e.errors}), 400

        existing = User.query.filter_by(email=data['email']).first()
        if existing and existing.id != user_id:
            return jsonify({'error': 'Email already in use'}), 409
        user.email = data['email'].strip().lower()

    if 'full_name' in data:
        if len(data['full_name'].strip()) < 2:
            return jsonify({'error': 'Full name must be at least 2 characters'}), 400
        user.full_name = data['full_name'].strip()

    if 'role' in data:
        if data['role'] not in ('admin', 'qa_engineer'):
            return jsonify({'error': 'Invalid role'}), 400
        user.role = data['role']

    if 'is_active' in data:
        user.is_active = bool(data['is_active'])

    if 'password' in data and data['password']:
        if len(data['password']) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        user.set_password(data['password'])

    db.session.commit()

    logger.info(f"User '{user.username}' updated by admin")
    return jsonify({'user': user.to_dict(), 'message': 'User updated successfully'}), 200


@users_bp.route('/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    """Delete a user (admin only). Cannot delete yourself or the root admin."""
    user = User.query.get_or_404(user_id)
    current_user_id = get_current_user_id()

    if user.id == current_user_id:
        return jsonify({'error': 'Cannot delete your own account'}), 400

    if user.username == 'admin':
        return jsonify({'error': 'Cannot delete the root admin user'}), 400

    db.session.delete(user)
    db.session.commit()

    logger.info(f"User '{user.username}' deleted")
    return jsonify({'message': 'User deleted successfully'}), 200


@users_bp.route('/<int:user_id>/toggle-status', methods=['POST'])
@admin_required
def toggle_user_status(user_id):
    """Enable or disable a user account."""
    user = User.query.get_or_404(user_id)
    current_user_id = get_current_user_id()

    if user.id == current_user_id:
        return jsonify({'error': 'Cannot disable your own account'}), 400

    user.is_active = not user.is_active
    db.session.commit()

    status = 'enabled' if user.is_active else 'disabled'
    logger.info(f"User '{user.username}' {status}")
    return jsonify({
        'user': user.to_dict(),
        'message': f'User {status} successfully',
    }), 200
