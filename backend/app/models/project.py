"""Project model."""
from datetime import datetime

from app import db


class Project(db.Model):
    """Project model for organizing test suites and cases."""

    __tablename__ = 'projects'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    framework = db.Column(db.String(50), default='playwright')
    repository_url = db.Column(db.String(255), nullable=True)
    environment = db.Column(db.String(50), default='development')
    status = db.Column(db.String(20), default='active')
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    test_suites = db.relationship('TestSuite', backref='project', lazy='dynamic', cascade='all, delete-orphan')
    test_cases = db.relationship('TestCase', backref='project', lazy='dynamic', cascade='all, delete-orphan')
    executions = db.relationship('Execution', backref='project', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self) -> dict:
        """Serialize project to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'framework': self.framework,
            'repository_url': self.repository_url,
            'environment': self.environment,
            'status': self.status,
            'owner_id': self.owner_id,
            'owner_name': self.owner.full_name if self.owner else None,
            'test_suites_count': self.test_suites.count(),
            'test_cases_count': self.test_cases.count(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self) -> str:
        return f'<Project {self.name}>'
