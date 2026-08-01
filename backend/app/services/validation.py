"""Centralized validation service for request data."""
import re


class ValidationError(Exception):
    """Custom validation error with field-level details."""

    def __init__(self, message: str, field: str = None, errors: dict = None):
        self.message = message
        self.field = field
        self.errors = errors or {}
        super().__init__(message)


class Validator:
    """Reusable request data validator."""

    def __init__(self, data: dict):
        self.data = data or {}
        self.errors = {}

    def require(self, field: str, label: str = None) -> 'Validator':
        """Validate field is present and non-empty."""
        label = label or field
        value = self.data.get(field)
        if value is None or (isinstance(value, str) and not value.strip()):
            self.errors[field] = f'{label} is required'
        return self

    def string(self, field: str, min_len: int = None, max_len: int = None, label: str = None) -> 'Validator':
        """Validate string field constraints."""
        label = label or field
        value = self.data.get(field)
        if value is None:
            return self
        if not isinstance(value, str):
            self.errors[field] = f'{label} must be a string'
            return self
        if min_len and len(value.strip()) < min_len:
            self.errors[field] = f'{label} must be at least {min_len} characters'
        if max_len and len(value.strip()) > max_len:
            self.errors[field] = f'{label} must be at most {max_len} characters'
        return self

    def email(self, field: str = 'email') -> 'Validator':
        """Validate email format."""
        value = self.data.get(field)
        if value is None:
            return self
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, value):
            self.errors[field] = 'Invalid email format'
        return self

    def integer(self, field: str, min_val: int = None, max_val: int = None, label: str = None) -> 'Validator':
        """Validate integer field."""
        label = label or field
        value = self.data.get(field)
        if value is None:
            return self
        try:
            int_val = int(value)
        except (TypeError, ValueError):
            self.errors[field] = f'{label} must be an integer'
            return self
        if min_val is not None and int_val < min_val:
            self.errors[field] = f'{label} must be at least {min_val}'
        if max_val is not None and int_val > max_val:
            self.errors[field] = f'{label} must be at most {max_val}'
        return self

    def in_list(self, field: str, allowed: list, label: str = None) -> 'Validator':
        """Validate field value is in allowed list."""
        label = label or field
        value = self.data.get(field)
        if value is None:
            return self
        if value not in allowed:
            self.errors[field] = f'{label} must be one of: {", ".join(str(a) for a in allowed)}'
        return self

    def url(self, field: str) -> 'Validator':
        """Validate URL format."""
        value = self.data.get(field)
        if value is None or value == '':
            return self
        pattern = r'^https?://[^\s/$.?#].[^\s]*$'
        if not re.match(pattern, value):
            self.errors[field] = 'Invalid URL format'
        return self

    def boolean(self, field: str) -> 'Validator':
        """Validate boolean field."""
        value = self.data.get(field)
        if value is None:
            return self
        if not isinstance(value, bool):
            self.errors[field] = f'{field} must be a boolean'
        return self

    def validate(self) -> dict:
        """Execute validation and raise if errors exist."""
        if self.errors:
            raise ValidationError(
                message='Validation failed',
                errors=self.errors,
            )
        return self.data

    @property
    def is_valid(self) -> bool:
        """Check if validation passed."""
        return len(self.errors) == 0


def validate_pagination(args: dict) -> tuple:
    """Validate and extract pagination params."""
    page = max(1, args.get('page', 1, type=int))
    per_page = min(100, max(1, args.get('per_page', 20, type=int)))
    return page, per_page
