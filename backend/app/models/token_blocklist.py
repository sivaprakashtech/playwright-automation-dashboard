"""JWT Token Blocklist model for logout/revocation."""
from datetime import datetime

from app import db


class TokenBlocklist(db.Model):
    """Store revoked JWT tokens for logout functionality."""

    __tablename__ = 'token_blocklist'

    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(36), nullable=False, unique=True, index=True)
    token_type = db.Column(db.String(10), nullable=False)  # access or refresh
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)

    def __repr__(self) -> str:
        return f'<TokenBlocklist {self.jti}>'
