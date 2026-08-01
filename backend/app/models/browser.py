"""Browser model."""
from datetime import datetime

from app import db


class Browser(db.Model):
    """Browser model for managing supported test browsers."""

    __tablename__ = 'browsers'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False, index=True)
    display_name = db.Column(db.String(100), nullable=False)
    engine = db.Column(db.String(50), nullable=False)  # chromium, firefox, webkit
    version = db.Column(db.String(50), nullable=True)
    is_installed = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    channel = db.Column(db.String(50), nullable=True)  # stable, beta, dev, canary
    executable_path = db.Column(db.String(500), nullable=True)
    last_checked = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self) -> dict:
        """Serialize browser to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'display_name': self.display_name,
            'engine': self.engine,
            'version': self.version,
            'is_installed': self.is_installed,
            'is_active': self.is_active,
            'channel': self.channel,
            'executable_path': self.executable_path,
            'last_checked': self.last_checked.isoformat() if self.last_checked else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self) -> str:
        return f'<Browser {self.display_name}>'
