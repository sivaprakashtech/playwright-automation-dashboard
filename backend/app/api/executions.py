"""Executions API endpoints."""
import logging
from datetime import datetime

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required
from sqlalchemy import func

from app import db
from app.models.execution import Execution, ExecutionResult
from app.middleware.decorators import get_current_user_id
from app.services.execution_service import ExecutionService
from app.services.validation import ValidationError, validate_pagination

logger = logging.getLogger(__name__)
executions_bp = Blueprint('executions', __name__)


@executions_bp.route('', methods=['GET'])
@jwt_required()
def get_executions():
    """Get all executions with pagination and filters."""
    page, per_page = validate_pagination(request.args)
    project_id = request.args.get('project_id', type=int)
    status = request.args.get('status', '').strip()
    browser = request.args.get('browser', '').strip()
    environment = request.args.get('environment', '').strip()

    query = Execution.query

    if project_id:
        query = query.filter_by(project_id=project_id)
    if status:
        query = query.filter_by(status=status)
    if browser:
        query = query.filter_by(browser=browser)
    if environment:
        query = query.filter_by(environment=environment)

    query = query.order_by(Execution.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'executions': [e.to_dict() for e in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page,
    }), 200


@executions_bp.route('/<int:execution_id>', methods=['GET'])
@jwt_required()
def get_execution(execution_id):
    """Get a specific execution with all test results."""
    execution = Execution.query.get_or_404(execution_id)
    results = execution.results.order_by(ExecutionResult.created_at.asc()).all()

    return jsonify({
        'execution': execution.to_dict(),
        'results': [r.to_dict() for r in results],
    }), 200


@executions_bp.route('/<int:execution_id>/results', methods=['GET'])
@jwt_required()
def get_execution_results(execution_id):
    """Get paginated results for an execution with optional status filter."""
    Execution.query.get_or_404(execution_id)

    page, per_page = validate_pagination(request.args)
    status_filter = request.args.get('status', '').strip()

    query = ExecutionResult.query.filter_by(execution_id=execution_id)
    if status_filter:
        query = query.filter_by(status=status_filter)

    query = query.order_by(ExecutionResult.created_at.asc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'results': [r.to_dict() for r in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page,
    }), 200


@executions_bp.route('/run', methods=['POST'])
@jwt_required()
def run_execution():
    """Trigger a new test execution."""
    user_id = get_current_user_id()
    data = request.get_json()

    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    try:
        execution = ExecutionService.create_execution(user_id, data)
        ExecutionService.start_async(current_app._get_current_object(), execution.id, data)

        logger.info(f"Execution #{execution.id} triggered by user {user_id}")
        return jsonify({
            'execution': execution.to_dict(),
            'message': 'Execution started successfully',
        }), 201

    except ValidationError as e:
        return jsonify({'error': e.message, 'details': e.errors}), 400


@executions_bp.route('/<int:execution_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_execution(execution_id):
    """Cancel a running or queued execution."""
    try:
        execution = ExecutionService.cancel_execution(execution_id)
        return jsonify({
            'execution': execution.to_dict(),
            'message': 'Execution cancelled',
        }), 200
    except ValidationError as e:
        return jsonify({'error': e.message}), 400


@executions_bp.route('/<int:execution_id>/rerun', methods=['POST'])
@jwt_required()
def rerun_execution(execution_id):
    """Re-run a completed/failed execution with same config."""
    user_id = get_current_user_id()
    original = Execution.query.get_or_404(execution_id)

    if original.status in ('queued', 'running'):
        return jsonify({'error': 'Cannot rerun an active execution'}), 400

    rerun_data = {
        'project_id': original.project_id,
        'name': f'Rerun: {original.name}',
        'execution_type': original.execution_type,
        'browser': original.browser,
        'environment': original.environment,
        'headless': original.headless,
        'parallel_workers': original.parallel_workers,
        'timeout': original.timeout,
        'retries': original.retries,
        'suite_id': original.suite_id,
    }

    try:
        execution = ExecutionService.create_execution(user_id, rerun_data)
        ExecutionService.start_async(current_app._get_current_object(), execution.id, rerun_data)

        return jsonify({
            'execution': execution.to_dict(),
            'message': 'Execution re-run started',
        }), 201
    except ValidationError as e:
        return jsonify({'error': e.message}), 400


@executions_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_execution_stats():
    """Get execution statistics for the dashboard."""
    total_executions = Execution.query.count()
    running = Execution.query.filter_by(status='running').count()
    queued = Execution.query.filter_by(status='queued').count()
    completed = Execution.query.filter_by(status='completed').count()

    stats = db.session.query(
        func.sum(Execution.total_tests).label('total_tests'),
        func.sum(Execution.passed).label('passed'),
        func.sum(Execution.failed).label('failed'),
        func.sum(Execution.skipped).label('skipped'),
        func.avg(Execution.duration).label('avg_duration'),
    ).filter(Execution.status == 'completed').first()

    total_tests = stats.total_tests or 0
    passed = stats.passed or 0
    failed = stats.failed or 0
    skipped = stats.skipped or 0
    avg_duration = round(stats.avg_duration or 0, 2)
    success_rate = round((passed / total_tests * 100), 2) if total_tests > 0 else 0

    return jsonify({
        'total_executions': total_executions,
        'running': running,
        'queued': queued,
        'completed': completed,
        'total_tests': total_tests,
        'passed': passed,
        'failed': failed,
        'skipped': skipped,
        'success_rate': success_rate,
        'avg_duration': avg_duration,
    }), 200


@executions_bp.route('/recent', methods=['GET'])
@jwt_required()
def get_recent_executions():
    """Get the 5 most recent executions (for live dashboard)."""
    executions = Execution.query.order_by(
        Execution.created_at.desc()
    ).limit(5).all()

    return jsonify({
        'executions': [e.to_dict() for e in executions],
    }), 200
