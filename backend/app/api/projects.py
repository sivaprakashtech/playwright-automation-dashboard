"""Projects API endpoints with validation."""
import logging

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from app import db
from app.models.project import Project
from app.middleware.decorators import get_current_user_id
from app.services.validation import Validator, ValidationError, validate_pagination

logger = logging.getLogger(__name__)
projects_bp = Blueprint('projects', __name__)


@projects_bp.route('', methods=['GET'])
@jwt_required()
def get_projects():
    """Get all projects with pagination and filters."""
    page, per_page = validate_pagination(request.args)
    search = request.args.get('search', '').strip()
    status = request.args.get('status', '').strip()
    environment = request.args.get('environment', '').strip()

    query = Project.query

    if search:
        query = query.filter(
            db.or_(
                Project.name.ilike(f'%{search}%'),
                Project.description.ilike(f'%{search}%'),
            )
        )
    if status:
        query = query.filter_by(status=status)
    if environment:
        query = query.filter_by(environment=environment)

    query = query.order_by(Project.updated_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'projects': [p.to_dict() for p in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page,
    }), 200


@projects_bp.route('/<int:project_id>', methods=['GET'])
@jwt_required()
def get_project(project_id):
    """Get a specific project with related counts."""
    project = Project.query.get_or_404(project_id)
    return jsonify({'project': project.to_dict()}), 200


@projects_bp.route('', methods=['POST'])
@jwt_required()
def create_project():
    """Create a new project."""
    user_id = get_current_user_id()
    data = request.get_json()

    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    # Validate
    validator = Validator(data)
    validator.require('name', 'Project name')
    validator.string('name', min_len=2, max_len=150, label='Project name')
    validator.string('description', max_len=1000, label='Description')
    validator.in_list('framework', ['playwright', 'cypress', 'selenium', 'puppeteer'])
    validator.in_list('environment', ['development', 'qa', 'staging', 'production'])
    validator.url('repository_url')

    try:
        validator.validate()
    except ValidationError as e:
        return jsonify({'error': 'Validation failed', 'details': e.errors}), 400

    # Check uniqueness
    if Project.query.filter_by(name=data['name'].strip()).first():
        return jsonify({'error': 'A project with this name already exists'}), 409

    project = Project(
        name=data['name'].strip(),
        description=data.get('description', '').strip(),
        framework=data.get('framework', 'playwright'),
        repository_url=data.get('repository_url', '').strip(),
        environment=data.get('environment', 'development'),
        owner_id=user_id,
    )

    db.session.add(project)
    db.session.commit()

    logger.info(f"Project '{project.name}' created by user {user_id}")
    return jsonify({'project': project.to_dict(), 'message': 'Project created successfully'}), 201


@projects_bp.route('/<int:project_id>', methods=['PUT'])
@jwt_required()
def update_project(project_id):
    """Update a project."""
    project = Project.query.get_or_404(project_id)
    data = request.get_json()

    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    # Name uniqueness check
    if 'name' in data:
        existing = Project.query.filter_by(name=data['name'].strip()).first()
        if existing and existing.id != project_id:
            return jsonify({'error': 'A project with this name already exists'}), 409
        project.name = data['name'].strip()

    updatable_fields = {
        'description': lambda v: v.strip() if isinstance(v, str) else v,
        'framework': lambda v: v if v in ('playwright', 'cypress', 'selenium', 'puppeteer') else project.framework,
        'repository_url': lambda v: v.strip() if isinstance(v, str) else v,
        'environment': lambda v: v if v in ('development', 'qa', 'staging', 'production') else project.environment,
        'status': lambda v: v if v in ('active', 'archived', 'draft') else project.status,
    }

    for field, transform in updatable_fields.items():
        if field in data:
            setattr(project, field, transform(data[field]))

    db.session.commit()

    logger.info(f"Project '{project.name}' updated")
    return jsonify({'project': project.to_dict(), 'message': 'Project updated successfully'}), 200


@projects_bp.route('/<int:project_id>', methods=['DELETE'])
@jwt_required()
def delete_project(project_id):
    """Delete a project and all associated data."""
    project = Project.query.get_or_404(project_id)

    project_name = project.name
    db.session.delete(project)
    db.session.commit()

    logger.info(f"Project '{project_name}' deleted")
    return jsonify({'message': 'Project deleted successfully'}), 200


@projects_bp.route('/<int:project_id>/stats', methods=['GET'])
@jwt_required()
def get_project_stats(project_id):
    """Get statistics for a specific project."""
    project = Project.query.get_or_404(project_id)

    from app.models.execution import Execution
    from sqlalchemy import func

    exec_stats = db.session.query(
        func.count(Execution.id).label('total_executions'),
        func.sum(Execution.passed).label('total_passed'),
        func.sum(Execution.failed).label('total_failed'),
        func.avg(Execution.duration).label('avg_duration'),
    ).filter(
        Execution.project_id == project_id,
        Execution.status == 'completed',
    ).first()

    return jsonify({
        'project_id': project_id,
        'project_name': project.name,
        'test_suites_count': project.test_suites.count(),
        'test_cases_count': project.test_cases.count(),
        'total_executions': exec_stats.total_executions or 0,
        'total_passed': exec_stats.total_passed or 0,
        'total_failed': exec_stats.total_failed or 0,
        'avg_duration': round(exec_stats.avg_duration or 0, 2),
    }), 200
