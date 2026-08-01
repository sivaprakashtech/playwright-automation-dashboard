"""Test Suites API endpoints."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from app import db
from app.models.test_suite import TestSuite

test_suites_bp = Blueprint('test_suites', __name__)


@test_suites_bp.route('', methods=['GET'])
@jwt_required()
def get_suites():
    """Get all test suites with optional filters."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    project_id = request.args.get('project_id', type=int)
    suite_type = request.args.get('suite_type', '')
    search = request.args.get('search', '')

    query = TestSuite.query

    if project_id:
        query = query.filter_by(project_id=project_id)
    if suite_type:
        query = query.filter_by(suite_type=suite_type)
    if search:
        query = query.filter(TestSuite.name.ilike(f'%{search}%'))

    query = query.order_by(TestSuite.updated_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'test_suites': [s.to_dict() for s in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page,
    }), 200


@test_suites_bp.route('/<int:suite_id>', methods=['GET'])
@jwt_required()
def get_suite(suite_id):
    """Get a specific test suite."""
    suite = TestSuite.query.get_or_404(suite_id)
    return jsonify({'test_suite': suite.to_dict()}), 200


@test_suites_bp.route('', methods=['POST'])
@jwt_required()
def create_suite():
    """Create a new test suite."""
    data = request.get_json()

    if not data.get('name') or not data.get('project_id'):
        return jsonify({'error': 'Name and project_id are required'}), 400

    suite = TestSuite(
        name=data['name'],
        description=data.get('description', ''),
        suite_type=data.get('suite_type', 'regression'),
        project_id=data['project_id'],
        priority=data.get('priority', 'medium'),
        tags=','.join(data.get('tags', [])),
    )

    db.session.add(suite)
    db.session.commit()

    return jsonify({'test_suite': suite.to_dict(), 'message': 'Test suite created successfully'}), 201


@test_suites_bp.route('/<int:suite_id>', methods=['PUT'])
@jwt_required()
def update_suite(suite_id):
    """Update a test suite."""
    suite = TestSuite.query.get_or_404(suite_id)
    data = request.get_json()

    if 'name' in data:
        suite.name = data['name']
    if 'description' in data:
        suite.description = data['description']
    if 'suite_type' in data:
        suite.suite_type = data['suite_type']
    if 'priority' in data:
        suite.priority = data['priority']
    if 'status' in data:
        suite.status = data['status']
    if 'tags' in data:
        suite.set_tags(data['tags'])

    db.session.commit()

    return jsonify({'test_suite': suite.to_dict(), 'message': 'Test suite updated successfully'}), 200


@test_suites_bp.route('/<int:suite_id>', methods=['DELETE'])
@jwt_required()
def delete_suite(suite_id):
    """Delete a test suite."""
    suite = TestSuite.query.get_or_404(suite_id)

    db.session.delete(suite)
    db.session.commit()

    return jsonify({'message': 'Test suite deleted successfully'}), 200
