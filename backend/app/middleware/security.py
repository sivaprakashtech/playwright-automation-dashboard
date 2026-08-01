"""Security middleware: headers, rate limiting, and request sanitization."""
import logging
import re
from functools import wraps
from collections import defaultdict
from time import time

from flask import Flask, request, jsonify, g

logger = logging.getLogger(__name__)

# In-memory rate limiter (use Redis in production)
_rate_limit_store: dict = defaultdict(list)


def register_security_middleware(app: Flask) -> None:
    """Register security-related middleware on the Flask app."""

    @app.after_request
    def set_security_headers(response):
        """Apply OWASP-recommended security headers."""
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        response.headers['Pragma'] = 'no-cache'

        # Remove server version disclosure
        response.headers.pop('Server', None)

        # Content Security Policy for API
        if request.path.startswith('/api'):
            response.headers['Content-Security-Policy'] = "default-src 'none'; frame-ancestors 'none'"

        return response

    @app.before_request
    def check_content_type():
        """Ensure JSON content-type for POST/PUT/PATCH requests."""
        if request.method in ('POST', 'PUT', 'PATCH') and request.path.startswith('/api'):
            if request.content_length and request.content_length > 0:
                content_type = request.content_type or ''
                if 'application/json' not in content_type and 'multipart/form-data' not in content_type:
                    return jsonify({'error': 'Content-Type must be application/json'}), 415

    @app.before_request
    def log_request():
        """Log incoming requests for audit trail."""
        g.request_start_time = time()
        if app.debug:
            logger.debug(f"{request.method} {request.path}")

    @app.after_request
    def log_response(response):
        """Log response timing."""
        if hasattr(g, 'request_start_time'):
            duration = round((time() - g.request_start_time) * 1000, 2)
            if duration > 1000:  # Log slow requests (>1s)
                logger.warning(f"SLOW: {request.method} {request.path} took {duration}ms")
        return response


def rate_limit(max_requests: int = 10, window_seconds: int = 60):
    """Simple in-memory rate limiter decorator."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            key = f"{request.remote_addr}:{request.endpoint}"
            now = time()

            # Clean expired entries
            _rate_limit_store[key] = [t for t in _rate_limit_store[key] if now - t < window_seconds]

            if len(_rate_limit_store[key]) >= max_requests:
                logger.warning(f"Rate limit exceeded for {request.remote_addr} on {request.endpoint}")
                return jsonify({
                    'error': 'Too Many Requests',
                    'message': f'Rate limit: {max_requests} requests per {window_seconds}s',
                }), 429

            _rate_limit_store[key].append(now)
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def sanitize_string(value: str) -> str:
    """Basic XSS prevention: strip dangerous HTML tags from string input."""
    if not isinstance(value, str):
        return value
    # Remove script tags and event handlers
    value = re.sub(r'<script[^>]*>.*?</script>', '', value, flags=re.IGNORECASE | re.DOTALL)
    value = re.sub(r'on\w+\s*=\s*["\'][^"\']*["\']', '', value, flags=re.IGNORECASE)
    value = re.sub(r'javascript:', '', value, flags=re.IGNORECASE)
    return value.strip()
