"""Schedule model."""
from datetime import datetime

from app import db


class Schedule(db.Model):
    """Scheduler model for automated test execution."""

    __tablename__ = 'schedules'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    schedule_type = db.Column(db.String(20), default='daily')  # hourly, daily, weekly, cron
    cron_expression = db.Column(db.String(100), nullable=True)
    is_active = db.Column(db.Boolean, default=True)

    # Execution config
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    suite_id = db.Column(db.Integer, db.ForeignKey('test_suites.id'), nullable=True)
    browser = db.Column(db.String(30), default='chromium')
    environment = db.Column(db.String(50), default='development')

    # Metadata
    last_run = db.Column(db.DateTime, nullable=True)
    next_run = db.Column(db.DateTime, nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = db.relationship('Project', backref='schedules')
    suite = db.relationship('TestSuite', backref='schedules')
    creator = db.relationship('User', backref='schedules')

    def to_dict(self) -> dict:
        """Serialize schedule to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'schedule_type': self.schedule_type,
            'cron_expression': self.cron_expression,
            'is_active': self.is_active,
            'project_id': self.project_id,
            'project_name': self.project.name if self.project else None,
            'suite_id': self.suite_id,
            'suite_name': self.suite.name if self.suite else None,
            'browser': self.browser,
            'environment': self.environment,
            'last_run': self.last_run.isoformat() if self.last_run else None,
            'next_run': self.next_run.isoformat() if self.next_run else None,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self) -> str:
        return f'<Schedule {self.name}>'
