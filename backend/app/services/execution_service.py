"""Execution business logic service."""
import logging
import random
import time
import threading
from datetime import datetime

from flask import Flask

from app import db
from app.models.execution import Execution, ExecutionResult
from app.models.test_case import TestCase
from app.models.test_suite import TestSuite
from app.models.project import Project
from app.models.notification import Notification
from app.services.validation import Validator, ValidationError

logger = logging.getLogger(__name__)

# Error message templates for realistic failure simulation
FAILURE_MESSAGES = [
    'AssertionError: Expected element to be visible',
    'TimeoutError: Waiting for selector ".btn-submit" exceeded 30000ms',
    'Error: Element is not clickable at point (340, 250)',
    'AssertionError: Expected "Welcome" to equal "Dashboard"',
    'NetworkError: Request failed: net::ERR_CONNECTION_REFUSED',
    'Error: Page crashed while navigating to /checkout',
    'AssertionError: Expected array length 5 but got 0',
    'TypeError: Cannot read properties of null (reading "click")',
]

SUGGESTED_CAUSES = [
    'Element not rendered before assertion timeout — consider adding explicit wait',
    'Page load performance degradation in target environment',
    'Selector is stale or element removed from DOM during interaction',
    'API endpoint returned unexpected response causing UI inconsistency',
    'Race condition between async data fetch and DOM assertion',
    'Network latency exceeded configured timeout threshold',
    'Test data dependency not properly seeded before execution',
    'CSS animation blocking element interactivity — use force option',
]


class ExecutionService:
    """Service handling test execution orchestration."""

    @staticmethod
    def create_execution(user_id: int, data: dict) -> Execution:
        """Create a new execution record with validation."""
        validator = Validator(data)
        validator.require('project_id', 'Project ID')
        validator.integer('project_id', min_val=1)
        validator.in_list('execution_type', ['single', 'suite', 'project'])
        validator.in_list('browser', ['chromium', 'firefox', 'webkit'])
        validator.in_list('environment', ['development', 'qa', 'staging', 'production'])
        validator.integer('parallel_workers', min_val=1, max_val=20)
        validator.integer('timeout', min_val=5000, max_val=300000)
        validator.integer('retries', min_val=0, max_val=5)
        validator.validate()

        project = Project.query.get(data['project_id'])
        if not project:
            raise ValidationError('Project not found', field='project_id')

        if data.get('suite_id'):
            suite = TestSuite.query.get(data['suite_id'])
            if not suite or suite.project_id != project.id:
                raise ValidationError('Suite not found or does not belong to project', field='suite_id')

        execution = Execution(
            name=data.get('name', f'{project.name} - {datetime.utcnow().strftime("%Y-%m-%d %H:%M")}'),
            execution_type=data.get('execution_type', 'suite'),
            browser=data.get('browser', 'chromium'),
            environment=data.get('environment', 'development'),
            headless=data.get('headless', True),
            parallel_workers=data.get('parallel_workers', 1),
            timeout=data.get('timeout', 30000),
            retries=data.get('retries', 0),
            project_id=project.id,
            suite_id=data.get('suite_id'),
            triggered_by=user_id,
            status='queued',
        )

        db.session.add(execution)
        db.session.commit()

        logger.info(f"Execution #{execution.id} created for project '{project.name}' by user {user_id}")
        return execution

    @staticmethod
    def start_async(app: Flask, execution_id: int, config: dict) -> None:
        """Start test execution in a background thread."""
        thread = threading.Thread(
            target=ExecutionService._run_execution,
            args=(app, execution_id, config),
            daemon=True,
        )
        thread.start()

    @staticmethod
    def _run_execution(app: Flask, execution_id: int, config: dict) -> None:
        """Execute tests and record results."""
        with app.app_context():
            execution = Execution.query.get(execution_id)
            if not execution:
                logger.error(f"Execution #{execution_id} not found")
                return

            execution.status = 'running'
            execution.started_at = datetime.utcnow()
            db.session.commit()

            logger.info(f"Execution #{execution_id} started")

            try:
                # Determine which test cases to run
                test_cases = ExecutionService._resolve_test_cases(execution, config)

                if not test_cases:
                    execution.status = 'completed'
                    execution.completed_at = datetime.utcnow()
                    db.session.commit()
                    logger.warning(f"Execution #{execution_id} completed with 0 test cases")
                    return

                execution.total_tests = len(test_cases)
                db.session.commit()

                # Execute each test case
                for tc in test_cases:
                    if execution.status == 'cancelled':
                        break

                    result = ExecutionService._execute_single_test(execution, tc)
                    db.session.add(result)
                    db.session.commit()

                # Finalize
                execution.status = 'completed'
                execution.completed_at = datetime.utcnow()
                execution.duration = round(execution.duration, 2)
                db.session.commit()

                # Create notification
                ExecutionService._create_completion_notification(execution)

                logger.info(
                    f"Execution #{execution_id} completed: "
                    f"{execution.passed}P/{execution.failed}F/{execution.skipped}S "
                    f"({execution.success_rate}% pass rate)"
                )

            except Exception as e:
                execution.status = 'failed'
                execution.completed_at = datetime.utcnow()
                db.session.commit()
                logger.exception(f"Execution #{execution_id} failed with error: {e}")

    @staticmethod
    def _resolve_test_cases(execution: Execution, config: dict) -> list:
        """Resolve which test cases to execute based on config."""
        if config.get('test_case_id'):
            tc = TestCase.query.get(config['test_case_id'])
            return [tc] if tc else []
        elif execution.suite_id:
            suite = TestSuite.query.get(execution.suite_id)
            return suite.test_cases.all() if suite else []
        else:
            project = Project.query.get(execution.project_id)
            return project.test_cases.all() if project else []

    @staticmethod
    def _execute_single_test(execution: Execution, test_case: TestCase) -> ExecutionResult:
        """Execute a single test case and return result."""
        duration = random.uniform(0.5, 8.0)
        time.sleep(0.05)  # Minimal delay for realistic async behavior

        # Determine result status with weighted randomness
        rand = random.random()
        if rand < 0.72:
            status = 'passed'
            execution.passed += 1
            error_message = None
            stack_trace = None
            suggested_cause = None
        elif rand < 0.92:
            status = 'failed'
            execution.failed += 1
            error_message = random.choice(FAILURE_MESSAGES)
            stack_trace = (
                f'  at tests/{test_case.file_path or "spec.ts"}:{random.randint(10, 200)}:{random.randint(1, 40)}\n'
                f'  at Object.<anonymous> (node_modules/playwright/lib/test/index.js:85:12)\n'
                f'  at processTicksAndRejections (node:internal/process/task_queues:95:5)'
            )
            suggested_cause = random.choice(SUGGESTED_CAUSES)
        else:
            status = 'skipped'
            execution.skipped += 1
            error_message = None
            stack_trace = None
            suggested_cause = None

        execution.duration += duration

        return ExecutionResult(
            execution_id=execution.id,
            test_case_id=test_case.id,
            test_name=test_case.title,
            status=status,
            duration=round(duration, 2),
            browser=execution.browser,
            error_message=error_message,
            stack_trace=stack_trace,
            suggested_cause=suggested_cause,
            retry_count=0,
        )

    @staticmethod
    def _create_completion_notification(execution: Execution) -> None:
        """Create notification for execution completion."""
        status_emoji = '✅' if execution.failed == 0 else '❌'
        notification = Notification(
            title=f'{status_emoji} Execution Complete: {execution.name}',
            message=(
                f'{execution.passed} passed, {execution.failed} failed, '
                f'{execution.skipped} skipped ({execution.success_rate}% success rate)'
            ),
            notification_type='execution_complete' if execution.failed == 0 else 'execution_failed',
            severity='info' if execution.failed == 0 else 'warning',
            user_id=execution.triggered_by,
            related_entity_type='execution',
            related_entity_id=execution.id,
        )
        db.session.add(notification)

    @staticmethod
    def cancel_execution(execution_id: int) -> Execution:
        """Cancel a running or queued execution."""
        execution = Execution.query.get(execution_id)
        if not execution:
            raise ValidationError('Execution not found')

        if execution.status not in ('queued', 'running'):
            raise ValidationError('Only queued or running executions can be cancelled')

        execution.status = 'cancelled'
        execution.completed_at = datetime.utcnow()
        db.session.commit()

        logger.info(f"Execution #{execution_id} cancelled")
        return execution
