"""User model."""
from datetime import datetime, timezone

import bcrypt

from app import db


def _utcnow():
    return datetime.now(timezone.utc)


class User(db.Model):
    """User model for authentication and authorization."""

    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='qa_engineer', index=True)
    is_active = db.Column(db.Boolean, default=True, index=True)
    avatar_url = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=_utcnow)
    updated_at = db.Column(db.DateTime, default=_utcnow, onupdate=_utcnow)
    last_login = db.Column(db.DateTime, nullable=True)

    # Relationships
    projects = db.relationship('Project', backref='owner', lazy='dynamic')
    test_cases = db.relationship('TestCase', backref='owner', lazy='dynamic')
    executions = db.relationship('Execution', backref='triggered_by_user', lazy='dynamic')

    def set_password(self, password: str) -> None:
        """Hash and set the user's password."""
        self.password_hash = bcrypt.hashpw(
            password.encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')

    def check_password(self, password: str) -> bool:
        """Verify the user's password."""
        return bcrypt.checkpw(
            password.encode('utf-8'),
            self.password_hash.encode('utf-8')
        )

    def to_dict(self) -> dict:
        """Serialize user to dictionary."""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'full_name': self.full_name,
            'role': self.role,
            'is_active': self.is_active,
            'avatar_url': self.avatar_url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
        }

    def __repr__(self) -> str:
        return f'<User {self.username}>'
