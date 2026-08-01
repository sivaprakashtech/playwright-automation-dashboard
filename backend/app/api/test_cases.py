"""Test Cases API endpoints."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app import db
from app.models.test_case import TestCase

test_cases_bp = Blueprint('test_cases', __name__)


@test_cases_bp.route('', methods=['GET'])
@jwt_required()
def get_test_cases():
    """Get all test cases with filters."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    project_id = request.args.get('project_id', type=int)
    suite_id = request.args.get('suite_id', type=int)
    priority = request.args.get('priority', '')
    search = request.args.get('search', '')

    query = TestCase.query

    if project_id:
        query = query.filter_by(project_id=project_id)
    if suite_id:
        query = query.filter_by(suite_id=suite_id)
    if priority:
        query = query.filter_by(priority=priority)
    if search:
        query = query.filter(TestCase.title.ilike(f'%{search}%'))

    query = query.order_by(TestCase.updated_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'test_cases': [tc.to_dict() for tc in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page,
    }), 200


@test_cases_bp.route('/<int:case_id>', methods=['GET'])
@jwt_required()
def get_test_case(case_id):
    """Get a specific test case."""
    test_case = TestCase.query.get_or_404(case_id)
    return jsonify({'test_case': test_case.to_dict()}), 200


@test_cases_bp.route('', methods=['POST'])
@jwt_required()
def create_test_case():
    """Create a new test case."""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data.get('title') or not data.get('project_id'):
        return jsonify({'error': 'Title and project_id are required'}), 400

    test_case = TestCase(
        title=data['title'],
        description=data.get('description', ''),
        file_path=data.get('file_path', ''),
        priority=data.get('priority', 'medium'),
        module=data.get('module', ''),
        test_type=data.get('test_type', 'functional'),
        project_id=data['project_id'],
        suite_id=data.get('suite_id'),
        owner_id=int(user_id),
        expected_duration=data.get('expected_duration', 30),
        tags=','.join(data.get('tags', [])),
        preconditions=data.get('preconditions', ''),
        steps=data.get('steps', ''),
        expected_result=data.get('expected_result', ''),
    )

    db.session.add(test_case)
    db.session.commit()

    return jsonify({'test_case': test_case.to_dict(), 'message': 'Test case created successfully'}), 201


@test_cases_bp.route('/<int:case_id>', methods=['PUT'])
@jwt_required()
def update_test_case(case_id):
    """Update a test case."""
    test_case = TestCase.query.get_or_404(case_id)
    data = request.get_json()

    fields = ['title', 'description', 'file_path', 'priority', 'module',
              'test_type', 'suite_id', 'expected_duration', 'preconditions',
              'steps', 'expected_result', 'status']

    for field in fields:
        if field in data:
            setattr(test_case, field, data[field])

    if 'tags' in data:
        test_case.tags = ','.join(data['tags'])

    db.session.commit()

    return jsonify({'test_case': test_case.to_dict(), 'message': 'Test case updated successfully'}), 200


@test_cases_bp.route('/<int:case_id>', methods=['DELETE'])
@jwt_required()
def delete_test_case(case_id):
    """Delete a test case."""
    test_case = TestCase.query.get_or_404(case_id)

    db.session.delete(test_case)
    db.session.commit()

    return jsonify({'message': 'Test case deleted successfully'}), 200
