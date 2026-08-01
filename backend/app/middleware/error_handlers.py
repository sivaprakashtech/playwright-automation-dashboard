"""Global error handlers for the Flask application."""
import logging
from flask import jsonify, Flask
from werkzeug.exceptions import HTTPException
from sqlalchemy.exc import IntegrityError, OperationalError

from app.services.validation import ValidationError

logger = logging.getLogger(__name__)


def register_error_handlers(app: Flask) -> None:
    """Register all error handlers on the app."""

    @app.errorhandler(ValidationError)
    def handle_validation_error(error: ValidationError):
        """Handle custom validation errors."""
        response = {
            'error': 'Validation Error',
            'message': error.message,
        }
        if error.errors:
            response['details'] = error.errors
        if error.field:
            response['field'] = error.field
        return jsonify(response), 400

    @app.errorhandler(400)
    def bad_request(error):
        """Handle 400 Bad Request."""
        return jsonify({
            'error': 'Bad Request',
            'message': str(error.description) if hasattr(error, 'description') else 'Invalid request',
        }), 400

    @app.errorhandler(401)
    def unauthorized(error):
        """Handle 401 Unauthorized."""
        return jsonify({
            'error': 'Unauthorized',
            'message': 'Authentication required',
        }), 401

    @app.errorhandler(403)
    def forbidden(error):
        """Handle 403 Forbidden."""
        return jsonify({
            'error': 'Forbidden',
            'message': 'You do not have permission to access this resource',
        }), 403

    @app.errorhandler(404)
    def not_found(error):
        """Handle 404 Not Found."""
        return jsonify({
            'error': 'Not Found',
            'message': 'The requested resource was not found',
        }), 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        """Handle 405 Method Not Allowed."""
        return jsonify({
            'error': 'Method Not Allowed',
            'message': 'The HTTP method is not allowed for this endpoint',
        }), 405

    @app.errorhandler(409)
    def conflict(error):
        """Handle 409 Conflict."""
        return jsonify({
            'error': 'Conflict',
            'message': str(error.description) if hasattr(error, 'description') else 'Resource conflict',
        }), 409

    @app.errorhandler(422)
    def unprocessable(error):
        """Handle 422 Unprocessable Entity."""
        return jsonify({
            'error': 'Unprocessable Entity',
            'message': 'The request was well-formed but contains semantic errors',
        }), 422

    @app.errorhandler(429)
    def too_many_requests(error):
        """Handle 429 Too Many Requests."""
        return jsonify({
            'error': 'Too Many Requests',
            'message': 'Rate limit exceeded. Please try again later.',
        }), 429

    @app.errorhandler(500)
    def internal_error(error):
        """Handle 500 Internal Server Error."""
        logger.exception("Internal server error")
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'An unexpected error occurred',
        }), 500

    @app.errorhandler(IntegrityError)
    def handle_integrity_error(error):
        """Handle database integrity constraint violations."""
        from app import db
        db.session.rollback()
        logger.error(f"Database integrity error: {error}")
        return jsonify({
            'error': 'Conflict',
            'message': 'A resource with the same unique constraint already exists',
        }), 409

    @app.errorhandler(OperationalError)
    def handle_operational_error(error):
        """Handle database operational errors."""
        from app import db
        db.session.rollback()
        logger.error(f"Database operational error: {error}")
        return jsonify({
            'error': 'Service Unavailable',
            'message': 'Database operation failed. Please try again.',
        }), 503

    @app.errorhandler(HTTPException)
    def handle_http_exception(error):
        """Catch-all for unhandled HTTP exceptions."""
        return jsonify({
            'error': error.name,
            'message': error.description,
        }), error.code
