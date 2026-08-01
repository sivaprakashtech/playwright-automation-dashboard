"""Reports API endpoints."""
import os
import json
from datetime import datetime

from flask import Blueprint, request, jsonify, send_file, current_app
from flask_jwt_extended import jwt_required

from app import db
from app.models.execution import Execution, ExecutionResult

reports_bp = Blueprint('reports', __name__)


@reports_bp.route('/execution/<int:execution_id>', methods=['GET'])
@jwt_required()
def get_execution_report(execution_id):
    """Get detailed report for an execution."""
    execution = Execution.query.get_or_404(execution_id)
    results = ExecutionResult.query.filter_by(execution_id=execution_id).all()

    report = {
        'execution': execution.to_dict(),
        'results': [r.to_dict() for r in results],
        'summary': {
            'total': execution.total_tests,
            'passed': execution.passed,
            'failed': execution.failed,
            'skipped': execution.skipped,
            'success_rate': execution.success_rate,
            'duration': execution.duration,
        },
        'failures': [
            {
                'test_name': r.test_name,
                'error_message': r.error_message,
                'stack_trace': r.stack_trace,
                'screenshot_path': r.screenshot_path,
                'video_path': r.video_path,
                'suggested_cause': r.suggested_cause,
            }
            for r in results if r.status == 'failed'
        ],
        'generated_at': datetime.utcnow().isoformat(),
    }

    return jsonify({'report': report}), 200


@reports_bp.route('/export/<int:execution_id>', methods=['GET'])
@jwt_required()
def export_report(execution_id):
    """Export report as JSON or CSV."""
    format_type = request.args.get('format', 'json')
    execution = Execution.query.get_or_404(execution_id)
    results = ExecutionResult.query.filter_by(execution_id=execution_id).all()

    if format_type == 'csv':
        import csv
        import io

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['Test Name', 'Status', 'Duration (s)', 'Error', 'Browser'])

        for r in results:
            writer.writerow([r.test_name, r.status, r.duration, r.error_message or '', r.browser or ''])

        reports_dir = current_app.config['REPORTS_DIR']
        filename = f'report_{execution_id}_{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}.csv'
        filepath = os.path.join(reports_dir, filename)

        with open(filepath, 'w', newline='') as f:
            f.write(output.getvalue())

        return send_file(filepath, as_attachment=True, download_name=filename)

    # JSON export
    report_data = {
        'execution': execution.to_dict(),
        'results': [r.to_dict() for r in results],
        'exported_at': datetime.utcnow().isoformat(),
    }

    reports_dir = current_app.config['REPORTS_DIR']
    filename = f'report_{execution_id}_{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}.json'
    filepath = os.path.join(reports_dir, filename)

    with open(filepath, 'w') as f:
        json.dump(report_data, f, indent=2)

    return send_file(filepath, as_attachment=True, download_name=filename)


@reports_bp.route('/history', methods=['GET'])
@jwt_required()
def get_report_history():
    """List all generated reports."""
    reports_dir = current_app.config['REPORTS_DIR']
    reports = []

    if os.path.exists(reports_dir):
        for filename in sorted(os.listdir(reports_dir), reverse=True):
            filepath = os.path.join(reports_dir, filename)
            stats = os.stat(filepath)
            reports.append({
                'filename': filename,
                'size': stats.st_size,
                'created_at': datetime.fromtimestamp(stats.st_ctime).isoformat(),
            })

    return jsonify({'reports': reports}), 200
