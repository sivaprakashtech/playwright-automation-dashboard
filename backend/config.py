"""Application configuration module with security hardening."""
import os
from datetime import timedelta

basedir = os.path.abspath(os.path.dirname(__file__))


class Config:
    """Base configuration with security defaults."""

    # Core Security
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')

    # JWT Configuration
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=7)
    JWT_TOKEN_LOCATION = ['headers']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'
    JWT_ERROR_MESSAGE_KEY = 'error'
    JWT_COOKIE_SECURE = True
    JWT_COOKIE_CSRF_PROTECT = True

    # Database
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
    }

    # File storage paths
    REPORTS_DIR = os.path.join(basedir, 'storage', 'reports')
    SCREENSHOTS_DIR = os.path.join(basedir, 'storage', 'screenshots')
    VIDEOS_DIR = os.path.join(basedir, 'storage', 'videos')
    LOGS_DIR = os.path.join(basedir, 'storage', 'logs')

    # Execution settings
    MAX_PARALLEL_WORKERS = int(os.environ.get('MAX_PARALLEL_WORKERS', 4))
    DEFAULT_TIMEOUT = int(os.environ.get('DEFAULT_TIMEOUT', 30000))
    DEFAULT_RETRIES = int(os.environ.get('DEFAULT_RETRIES', 1))

    # Playwright settings
    PLAYWRIGHT_BROWSERS = ['chromium', 'firefox', 'webkit']
    HEADLESS = os.environ.get('HEADLESS', 'true').lower() == 'true'

    # Security: File upload limits
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB max upload

    # Rate limiting
    RATELIMIT_ENABLED = True
    RATELIMIT_DEFAULT = '200/hour'
    RATELIMIT_LOGIN = '10/minute'

    # CORS
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        f'sqlite:///{os.path.join(basedir, "instance", "dashboard_dev.db")}'
    )
    CORS_ORIGINS = ['*']


class ProductionConfig(Config):
    """Production configuration with strict security."""
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        f'sqlite:///{os.path.join(basedir, "instance", "dashboard.db")}'
    )
    # Override in production - must be set
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'


class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'


config_map = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
}
