# ── Stage 1: Build React Frontend ──
FROM node:18-alpine AS frontend
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --silent
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Production Backend ──
FROM python:3.11-slim
WORKDIR /app

# Install build deps, then clean up
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && find /usr/local -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true

# Copy backend source
COPY backend/ .

# Copy React build output
COPY --from=frontend /build/dist ./static

# Verify frontend build exists
RUN test -f static/index.html || (echo "FATAL: static/index.html missing" && exit 1)

# Create runtime directories
RUN mkdir -p storage/reports storage/screenshots storage/videos storage/logs instance

# Precompile Python bytecode for faster startup
RUN python -m compileall -q .

# Non-root user for security
RUN adduser --disabled-password --gecos "" appuser && chown -R appuser:appuser /app
USER appuser

ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

EXPOSE 5000

HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=5 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/health')" || exit 1

CMD ["gunicorn", "run:app", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "120", "--preload"]
