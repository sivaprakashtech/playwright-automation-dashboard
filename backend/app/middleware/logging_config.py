"""Application logging configuration."""
import os
import logging
import logging.handlers
from flask import Flask


def setup_logging(app: Flask) -> None:
    """Configure application-wide logging with file rotation and formatting."""
    log_level = logging.DEBUG if app.debug else logging.INFO
    log_dir = app.config.get('LOGS_DIR', 'storage/logs')
    os.makedirs(log_dir, exist_ok=True)

    # Format
    formatter = logging.Formatter(
        fmt='%(asctime)s | %(levelname)-8s | %(name)s | %(funcName)s:%(lineno)d | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S',
    )

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)

    # Rotating file handler (10MB per file, keep 5 backups)
    file_handler = logging.handlers.RotatingFileHandler(
        filename=os.path.join(log_dir, 'app.log'),
        maxBytes=10 * 1024 * 1024,
        backupCount=5,
        encoding='utf-8',
    )
    file_handler.setLevel(log_level)
    file_handler.setFormatter(formatter)

    # Error-only file handler
    error_handler = logging.handlers.RotatingFileHandler(
        filename=os.path.join(log_dir, 'errors.log'),
        maxBytes=10 * 1024 * 1024,
        backupCount=5,
        encoding='utf-8',
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(formatter)

    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)
    root_logger.addHandler(error_handler)

    # Suppress noisy third-party loggers
    logging.getLogger('werkzeug').setLevel(logging.WARNING)
    logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)

    app.logger.info("Logging configured successfully")
