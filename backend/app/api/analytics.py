"""Analytics API endpoints."""
from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import func

from app import db
from app.models.execution import Execution, ExecutionResult
from app.models.project import Project
from app.models.test_case import TestCase

analytics_bp = Blueprint('analytics', __name__)


@analytics_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    """Get dashboard overview statistics."""
    total_projects = Project.query.count()
    total_test_cases = TestCase.query.count()

    exec_stats = db.session.query(
        func.count(Execution.id).label('total'),
        func.sum(Execution.passed).label('passed'),
        func.sum(Execution.failed).label('failed'),
        func.sum(Execution.skipped).label('skipped'),
        func.sum(Execution.total_tests).label('total_tests'),
    ).filter(Execution.status == 'completed').first()

    running = Execution.query.filter_by(status='running').count()
    total_tests_run = exec_stats.total_tests or 0
    passed = exec_stats.passed or 0
    failed = exec_stats.failed or 0
    skipped = exec_stats.skipped or 0
    success_rate = round((passed / total_tests_run * 100), 2) if total_tests_run > 0 else 0

    return jsonify({
        'total_projects': total_projects,
        'total_test_cases': total_test_cases,
        'total_executions': exec_stats.total or 0,
        'passed': passed,
        'failed': failed,
        'skipped': skipped,
        'running': running,
        'success_rate': success_rate,
    }), 200


@analytics_bp.route('/trend', methods=['GET'])
@jwt_required()
def get_execution_trend():
    """Get pass/fail trend over time."""
    days = request.args.get('days', 30, type=int)
    start_date = datetime.utcnow() - timedelta(days=days)

    executions = Execution.query.filter(
        Execution.created_at >= start_date,
        Execution.status == 'completed'
    ).order_by(Execution.created_at.asc()).all()

    trend_data = []
    for e in executions:
        trend_data.append({
            'date': e.created_at.strftime('%Y-%m-%d'),
            'passed': e.passed,
            'failed': e.failed,
            'skipped': e.skipped,
            'success_rate': e.success_rate,
        })

    return jsonify({'trend': trend_data}), 200


@analytics_bp.route('/browser-distribution', methods=['GET'])
@jwt_required()
def get_browser_distribution():
    """Get test execution distribution by browser."""
    distribution = db.session.query(
        Execution.browser,
        func.count(Execution.id).label('count'),
    ).filter(
        Execution.status == 'completed'
    ).group_by(Execution.browser).all()

    data = [{'browser': d.browser, 'count': d.count} for d in distribution]

    return jsonify({'distribution': data}), 200


@analytics_bp.route('/execution-time', methods=['GET'])
@jwt_required()
def get_execution_time():
    """Get average execution time over time."""
    days = request.args.get('days', 30, type=int)
    start_date = datetime.utcnow() - timedelta(days=days)

    executions = Execution.query.filter(
        Execution.created_at >= start_date,
        Execution.status == 'completed'
    ).order_by(Execution.created_at.asc()).all()

    data = [{
        'date': e.created_at.strftime('%Y-%m-%d'),
        'duration': e.duration,
        'name': e.name,
    } for e in executions]

    return jsonify({'execution_times': data}), 200


@analytics_bp.route('/most-failed', methods=['GET'])
@jwt_required()
def get_most_failed_tests():
    """Get top most frequently failed tests."""
    limit = request.args.get('limit', 10, type=int)

    failed_tests = db.session.query(
        ExecutionResult.test_name,
        func.count(ExecutionResult.id).label('failure_count'),
    ).filter(
        ExecutionResult.status == 'failed'
    ).group_by(
        ExecutionResult.test_name
    ).order_by(
        func.count(ExecutionResult.id).desc()
    ).limit(limit).all()

    data = [{'test_name': t.test_name, 'failure_count': t.failure_count} for t in failed_tests]

    return jsonify({'most_failed': data}), 200


@analytics_bp.route('/heatmap', methods=['GET'])
@jwt_required()
def get_execution_heatmap():
    """Get execution heatmap data (executions by day of week and hour)."""
    executions = Execution.query.filter(
        Execution.status == 'completed'
    ).all()

    heatmap = {}
    for e in executions:
        if e.started_at:
            day = e.started_at.strftime('%A')
            hour = e.started_at.hour
            key = f'{day}_{hour}'
            heatmap[key] = heatmap.get(key, 0) + 1

    data = [{'day': k.split('_')[0], 'hour': int(k.split('_')[1]), 'count': v} for k, v in heatmap.items()]

    return jsonify({'heatmap': data}), 200
