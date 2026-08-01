"""Settings model."""
from datetime import datetime

from app import db


class Settings(db.Model):
    """Application settings model."""

    __tablename__ = 'settings'

    id = db.Column(db.Integer, primary_key=True)
    theme = db.Column(db.String(20), default='dark')
    execution_path = db.Column(db.String(500), default='./tests')
    parallel_workers = db.Column(db.Integer, default=4)
    timeout = db.Column(db.Integer, default=30000)
    retries = db.Column(db.Integer, default=1)
    default_browser = db.Column(db.String(30), default='chromium')
    headless = db.Column(db.Boolean, default=True)
    screenshot_on_failure = db.Column(db.Boolean, default=True)
    video_recording = db.Column(db.Boolean, default=False)
    trace_recording = db.Column(db.Boolean, default=False)
    base_url = db.Column(db.String(255), default='http://localhost:3000')
    report_format = db.Column(db.String(30), default='html')
    notification_email = db.Column(db.String(255), nullable=True)
    slack_webhook = db.Column(db.String(500), nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self) -> dict:
        """Serialize settings to dictionary."""
        return {
            'id': self.id,
            'theme': self.theme,
            'execution_path': self.execution_path,
            'parallel_workers': self.parallel_workers,
            'timeout': self.timeout,
            'retries': self.retries,
            'default_browser': self.default_browser,
            'headless': self.headless,
            'screenshot_on_failure': self.screenshot_on_failure,
            'video_recording': self.video_recording,
            'trace_recording': self.trace_recording,
            'base_url': self.base_url,
            'report_format': self.report_format,
            'notification_email': self.notification_email,
            'slack_webhook': self.slack_webhook,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self) -> str:
        return '<Settings>'
