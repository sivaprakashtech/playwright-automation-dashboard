"""Environment model."""
from datetime import datetime

from app import db


class Environment(db.Model):
    """Environment model for managing test environments."""

    __tablename__ = 'environments'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True, index=True)
    display_name = db.Column(db.String(150), nullable=False)
    base_url = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    variables = db.Column(db.Text, default='{}')  # JSON string of env variables
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self) -> dict:
        """Serialize environment to dictionary."""
        import json
        return {
            'id': self.id,
            'name': self.name,
            'display_name': self.display_name,
            'base_url': self.base_url,
            'description': self.description,
            'is_active': self.is_active,
            'variables': json.loads(self.variables) if self.variables else {},
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self) -> str:
        return f'<Environment {self.name}>'
