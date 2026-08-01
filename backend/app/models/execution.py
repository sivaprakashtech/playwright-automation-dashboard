"""Execution and ExecutionResult models."""
from datetime import datetime, timezone

from app import db


def _utcnow():
    return datetime.now(timezone.utc)


class Execution(db.Model):
    """Execution model representing a test run."""

    __tablename__ = 'executions'
    __table_args__ = (
        db.Index('ix_executions_status_created', 'status', 'created_at'),
        db.Index('ix_executions_project_status', 'project_id', 'status'),
    )

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    status = db.Column(db.String(20), default='queued', index=True)
    execution_type = db.Column(db.String(30), default='suite')

    # Configuration
    browser = db.Column(db.String(30), default='chromium', index=True)
    environment = db.Column(db.String(50), default='development')
    headless = db.Column(db.Boolean, default=True)
    parallel_workers = db.Column(db.Integer, default=1)
    timeout = db.Column(db.Integer, default=30000)
    retries = db.Column(db.Integer, default=0)

    # Results summary
    total_tests = db.Column(db.Integer, default=0)
    passed = db.Column(db.Integer, default=0)
    failed = db.Column(db.Integer, default=0)
    skipped = db.Column(db.Integer, default=0)
    duration = db.Column(db.Float, default=0.0)

    # Foreign keys
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    suite_id = db.Column(db.Integer, db.ForeignKey('test_suites.id'), nullable=True)
    triggered_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # File paths
    report_path = db.Column(db.String(500), nullable=True)
    log_path = db.Column(db.String(500), nullable=True)

    # Timestamps
    started_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=_utcnow, index=True)

    # Relationships
    results = db.relationship('ExecutionResult', backref='execution', lazy='dynamic', cascade='all, delete-orphan')

    @property
    def success_rate(self) -> float:
        """Calculate success rate."""
        if self.total_tests == 0:
            return 0.0
        return round((self.passed / self.total_tests) * 100, 2)

    def to_dict(self) -> dict:
        """Serialize execution to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'status': self.status,
            'execution_type': self.execution_type,
            'browser': self.browser,
            'environment': self.environment,
            'headless': self.headless,
            'parallel_workers': self.parallel_workers,
            'timeout': self.timeout,
            'retries': self.retries,
            'total_tests': self.total_tests,
            'passed': self.passed,
            'failed': self.failed,
            'skipped': self.skipped,
            'duration': self.duration,
            'success_rate': self.success_rate,
            'project_id': self.project_id,
            'project_name': self.project.name if self.project else None,
            'suite_id': self.suite_id,
            'triggered_by': self.triggered_by,
            'triggered_by_name': self.triggered_by_user.full_name if self.triggered_by_user else None,
            'report_path': self.report_path,
            'log_path': self.log_path,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self) -> str:
        return f'<Execution {self.name} [{self.status}]>'


class ExecutionResult(db.Model):
    """Individual test result within an execution."""

    __tablename__ = 'execution_results'
    __table_args__ = (
        db.Index('ix_results_execution_status', 'execution_id', 'status'),
    )

    id = db.Column(db.Integer, primary_key=True)
    execution_id = db.Column(db.Integer, db.ForeignKey('executions.id'), nullable=False, index=True)
    test_case_id = db.Column(db.Integer, db.ForeignKey('test_cases.id'), nullable=True)
    test_name = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(20), default='pending', index=True)
    duration = db.Column(db.Float, default=0.0)
    error_message = db.Column(db.Text, nullable=True)
    stack_trace = db.Column(db.Text, nullable=True)
    screenshot_path = db.Column(db.String(500), nullable=True)
    video_path = db.Column(db.String(500), nullable=True)
    retry_count = db.Column(db.Integer, default=0)
    browser = db.Column(db.String(30), nullable=True)
    suggested_cause = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=_utcnow)

    def to_dict(self) -> dict:
        """Serialize execution result to dictionary."""
        return {
            'id': self.id,
            'execution_id': self.execution_id,
            'test_case_id': self.test_case_id,
            'test_name': self.test_name,
            'status': self.status,
            'duration': self.duration,
            'error_message': self.error_message,
            'stack_trace': self.stack_trace,
            'screenshot_path': self.screenshot_path,
            'video_path': self.video_path,
            'retry_count': self.retry_count,
            'browser': self.browser,
            'suggested_cause': self.suggested_cause,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self) -> str:
        return f'<ExecutionResult {self.test_name} [{self.status}]>'
