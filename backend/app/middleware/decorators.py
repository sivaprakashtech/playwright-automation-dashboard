"""Custom decorators for authorization and rate limiting."""
from functools import wraps

from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity


def admin_required(fn):
    """Restrict endpoint to admin users only."""
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({
                'error': 'Admin access required',
                'message': 'You do not have permission to perform this action',
            }), 403
        return fn(*args, **kwargs)
    return wrapper


def role_required(*roles):
    """Restrict endpoint to specific roles."""
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            claims = get_jwt()
            user_role = claims.get('role')
            if user_role not in roles:
                return jsonify({
                    'error': 'Insufficient permissions',
                    'message': f'Required role: {" or ".join(roles)}',
                }), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def get_current_user_id() -> int:
    """Extract current user ID from JWT."""
    return int(get_jwt_identity())


def get_current_user_role() -> str:
    """Extract current user role from JWT claims."""
    claims = get_jwt()
    return claims.get('role', 'qa_engineer')
