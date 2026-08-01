"""Test Suite model."""
from datetime import datetime

from app import db

# Many-to-many relationship for test suite tags
suite_tags = db.Table(
    'suite_tags',
    db.Column('suite_id', db.Integer, db.ForeignKey('test_suites.id'), primary_key=True),
    db.Column('tag', db.String(50), primary_key=True),
)


class TestSuite(db.Model):
    """Test Suite model for grouping test cases."""

    __tablename__ = 'test_suites'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    suite_type = db.Column(db.String(30), default='regression')  # smoke, regression, sanity, api, ui
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    priority = db.Column(db.String(20), default='medium')  # low, medium, high, critical
    status = db.Column(db.String(20), default='active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    test_cases = db.relationship('TestCase', backref='test_suite', lazy='dynamic', cascade='all, delete-orphan')
    tags = db.Column(db.Text, default='')  # Comma-separated tags

    def get_tags(self) -> list:
        """Return tags as a list."""
        if not self.tags:
            return []
        return [t.strip() for t in self.tags.split(',') if t.strip()]

    def set_tags(self, tags_list: list) -> None:
        """Set tags from a list."""
        self.tags = ','.join(tags_list)

    def to_dict(self) -> dict:
        """Serialize test suite to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'suite_type': self.suite_type,
            'project_id': self.project_id,
            'project_name': self.project.name if self.project else None,
            'priority': self.priority,
            'status': self.status,
            'tags': self.get_tags(),
            'test_cases_count': self.test_cases.count(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self) -> str:
        return f'<TestSuite {self.name}>'
