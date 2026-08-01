"""Test Case model."""
from datetime import datetime

from app import db


class TestCase(db.Model):
    """Test Case model representing individual test scenarios."""

    __tablename__ = 'test_cases'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    file_path = db.Column(db.String(500), nullable=True)
    priority = db.Column(db.String(20), default='medium')  # low, medium, high, critical
    module = db.Column(db.String(100), nullable=True)
    status = db.Column(db.String(20), default='active')  # active, deprecated, draft
    test_type = db.Column(db.String(30), default='functional')  # functional, api, e2e, unit

    # Foreign keys
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    suite_id = db.Column(db.Integer, db.ForeignKey('test_suites.id'), nullable=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    # Metadata
    expected_duration = db.Column(db.Integer, default=30)  # seconds
    tags = db.Column(db.Text, default='')
    preconditions = db.Column(db.Text, nullable=True)
    steps = db.Column(db.Text, nullable=True)
    expected_result = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    execution_results = db.relationship('ExecutionResult', backref='test_case', lazy='dynamic')

    def get_tags(self) -> list:
        """Return tags as a list."""
        if not self.tags:
            return []
        return [t.strip() for t in self.tags.split(',') if t.strip()]

    def to_dict(self) -> dict:
        """Serialize test case to dictionary."""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'file_path': self.file_path,
            'priority': self.priority,
            'module': self.module,
            'status': self.status,
            'test_type': self.test_type,
            'project_id': self.project_id,
            'suite_id': self.suite_id,
            'suite_name': self.test_suite.name if self.test_suite else None,
            'owner_id': self.owner_id,
            'owner_name': self.owner.full_name if self.owner else None,
            'expected_duration': self.expected_duration,
            'tags': self.get_tags(),
            'preconditions': self.preconditions,
            'steps': self.steps,
            'expected_result': self.expected_result,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self) -> str:
        return f'<TestCase {self.title}>'
