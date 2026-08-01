"""Authentication business logic service."""
import logging
from datetime import datetime
from typing import Optional, Tuple

from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
)

from app import db
from app.models.user import User
from app.services.validation import Validator, ValidationError

logger = logging.getLogger(__name__)


class AuthService:
    """Service handling all authentication operations."""

    @staticmethod
    def authenticate(username: str, password: str) -> Tuple[dict, int]:
        """
        Authenticate user credentials and generate JWT tokens.
        Returns (response_dict, status_code).
        """
        # Validate input
        validator = Validator({'username': username, 'password': password})
        validator.require('username').require('password')
        validator.string('password', min_len=4)
        validator.validate()

        user = User.query.filter_by(username=username).first()

        if not user or not user.check_password(password):
            logger.warning(f"Failed login attempt for username: {username}")
            raise ValidationError('Invalid username or password')

        if not user.is_active:
            logger.warning(f"Login attempt for disabled account: {username}")
            raise ValidationError('Account is disabled. Contact administrator.')

        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()

        # Generate tokens
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={
                'role': user.role,
                'username': user.username,
                'email': user.email,
            }
        )
        refresh_token = create_refresh_token(identity=str(user.id))

        logger.info(f"User '{username}' logged in successfully")

        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict(),
        }

    @staticmethod
    def refresh_access_token(user_id: str) -> dict:
        """Generate a new access token from refresh token."""
        user = User.query.get(int(user_id))

        if not user:
            raise ValidationError('User not found')

        if not user.is_active:
            raise ValidationError('Account is disabled')

        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={
                'role': user.role,
                'username': user.username,
                'email': user.email,
            }
        )

        return {'access_token': access_token}

    @staticmethod
    def change_password(user_id: int, current_password: str, new_password: str) -> None:
        """Change user password with validation."""
        validator = Validator({
            'current_password': current_password,
            'new_password': new_password,
        })
        validator.require('current_password').require('new_password')
        validator.string('new_password', min_len=6, max_len=128)
        validator.validate()

        user = User.query.get(user_id)
        if not user:
            raise ValidationError('User not found')

        if not user.check_password(current_password):
            raise ValidationError('Current password is incorrect')

        user.set_password(new_password)
        db.session.commit()

        logger.info(f"Password changed for user: {user.username}")

    @staticmethod
    def get_user_by_id(user_id: int) -> Optional[User]:
        """Retrieve user by ID."""
        return User.query.get(user_id)
