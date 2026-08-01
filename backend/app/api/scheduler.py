"""Scheduler API endpoints."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app import db
from app.models.schedule import Schedule

scheduler_bp = Blueprint('scheduler', __name__)


@scheduler_bp.route('', methods=['GET'])
@jwt_required()
def get_schedules():
    """Get all schedules."""
    schedules = Schedule.query.order_by(Schedule.created_at.desc()).all()
    return jsonify({'schedules': [s.to_dict() for s in schedules]}), 200


@scheduler_bp.route('/<int:schedule_id>', methods=['GET'])
@jwt_required()
def get_schedule(schedule_id):
    """Get a specific schedule."""
    schedule = Schedule.query.get_or_404(schedule_id)
    return jsonify({'schedule': schedule.to_dict()}), 200


@scheduler_bp.route('', methods=['POST'])
@jwt_required()
def create_schedule():
    """Create a new schedule."""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data.get('name') or not data.get('project_id'):
        return jsonify({'error': 'Name and project_id are required'}), 400

    schedule = Schedule(
        name=data['name'],
        schedule_type=data.get('schedule_type', 'daily'),
        cron_expression=data.get('cron_expression'),
        is_active=data.get('is_active', True),
        project_id=data['project_id'],
        suite_id=data.get('suite_id'),
        browser=data.get('browser', 'chromium'),
        environment=data.get('environment', 'development'),
        created_by=int(user_id),
    )

    db.session.add(schedule)
    db.session.commit()

    return jsonify({'schedule': schedule.to_dict(), 'message': 'Schedule created'}), 201


@scheduler_bp.route('/<int:schedule_id>', methods=['PUT'])
@jwt_required()
def update_schedule(schedule_id):
    """Update a schedule."""
    schedule = Schedule.query.get_or_404(schedule_id)
    data = request.get_json()

    fields = ['name', 'schedule_type', 'cron_expression', 'is_active',
              'suite_id', 'browser', 'environment']

    for field in fields:
        if field in data:
            setattr(schedule, field, data[field])

    db.session.commit()

    return jsonify({'schedule': schedule.to_dict(), 'message': 'Schedule updated'}), 200


@scheduler_bp.route('/<int:schedule_id>', methods=['DELETE'])
@jwt_required()
def delete_schedule(schedule_id):
    """Delete a schedule."""
    schedule = Schedule.query.get_or_404(schedule_id)

    db.session.delete(schedule)
    db.session.commit()

    return jsonify({'message': 'Schedule deleted'}), 200


@scheduler_bp.route('/<int:schedule_id>/toggle', methods=['POST'])
@jwt_required()
def toggle_schedule(schedule_id):
    """Toggle schedule active state."""
    schedule = Schedule.query.get_or_404(schedule_id)
    schedule.is_active = not schedule.is_active
    db.session.commit()

    return jsonify({'schedule': schedule.to_dict()}), 200
