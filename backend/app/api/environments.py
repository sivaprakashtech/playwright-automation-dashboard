"""Environments API endpoints."""
import json

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from app import db
from app.models.environment import Environment

environments_bp = Blueprint('environments', __name__)


@environments_bp.route('', methods=['GET'])
@jwt_required()
def get_environments():
    """Get all environments."""
    environments = Environment.query.order_by(Environment.name).all()
    return jsonify({'environments': [e.to_dict() for e in environments]}), 200


@environments_bp.route('/<int:env_id>', methods=['GET'])
@jwt_required()
def get_environment(env_id):
    """Get a specific environment."""
    env = Environment.query.get_or_404(env_id)
    return jsonify({'environment': env.to_dict()}), 200


@environments_bp.route('', methods=['POST'])
@jwt_required()
def create_environment():
    """Create a new environment."""
    data = request.get_json()

    if not data.get('name') or not data.get('base_url'):
        return jsonify({'error': 'Name and base_url are required'}), 400

    if Environment.query.filter_by(name=data['name']).first():
        return jsonify({'error': 'Environment name already exists'}), 409

    env = Environment(
        name=data['name'],
        display_name=data.get('display_name', data['name']),
        base_url=data['base_url'],
        description=data.get('description', ''),
        variables=json.dumps(data.get('variables', {})),
    )

    db.session.add(env)
    db.session.commit()

    return jsonify({'environment': env.to_dict(), 'message': 'Environment created'}), 201


@environments_bp.route('/<int:env_id>', methods=['PUT'])
@jwt_required()
def update_environment(env_id):
    """Update an environment."""
    env = Environment.query.get_or_404(env_id)
    data = request.get_json()

    if 'display_name' in data:
        env.display_name = data['display_name']
    if 'base_url' in data:
        env.base_url = data['base_url']
    if 'description' in data:
        env.description = data['description']
    if 'is_active' in data:
        env.is_active = data['is_active']
    if 'variables' in data:
        env.variables = json.dumps(data['variables'])

    db.session.commit()

    return jsonify({'environment': env.to_dict(), 'message': 'Environment updated'}), 200


@environments_bp.route('/<int:env_id>', methods=['DELETE'])
@jwt_required()
def delete_environment(env_id):
    """Delete an environment."""
    env = Environment.query.get_or_404(env_id)
    db.session.delete(env)
    db.session.commit()

    return jsonify({'message': 'Environment deleted'}), 200
