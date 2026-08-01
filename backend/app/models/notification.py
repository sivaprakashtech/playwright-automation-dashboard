"""Notification model."""
from datetime import datetime

from app import db


class Notification(db.Model):
    """Notification model for alerting users about events."""

    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    notification_type = db.Column(db.String(50), nullable=False, default='info')
    # Types: execution_complete, execution_failed, schedule_triggered, system
    severity = db.Column(db.String(20), default='info')  # info, success, warning, error
    is_read = db.Column(db.Boolean, default=False, index=True)

    # Target user
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Related entity for navigation
    related_entity_type = db.Column(db.String(50), nullable=True)  # execution, project, etc.
    related_entity_id = db.Column(db.Integer, nullable=True)

    # Email delivery tracking
    email_sent = db.Column(db.Boolean, default=False)
    email_sent_at = db.Column(db.DateTime, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = db.relationship('User', backref=db.backref('notifications', lazy='dynamic'))

    def mark_read(self) -> None:
        """Mark notification as read."""
        self.is_read = True

    def to_dict(self) -> dict:
        """Serialize notification to dictionary."""
        return {
            'id': self.id,
            'title': self.title,
            'message': self.message,
            'notification_type': self.notification_type,
            'severity': self.severity,
            'is_read': self.is_read,
            'user_id': self.user_id,
            'related_entity_type': self.related_entity_type,
            'related_entity_id': self.related_entity_id,
            'email_sent': self.email_sent,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self) -> str:
        return f'<Notification {self.title[:30]}>'
