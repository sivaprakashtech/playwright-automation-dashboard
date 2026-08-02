# Multi-stage build for Playwright Automation Dashboard
# Result: Single container serving React + Flask

# ─── Stage 1: Build Frontend ───
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --silent
COPY frontend/ ./
RUN npm run build

# ─── Stage 2: Production Backend ───
FROM python:3.11-slim AS production
WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy backend source
COPY backend/ ./

# Copy frontend build output into backend/static
# run.py serves files from this exact directory
COPY --from=frontend-build /app/frontend/dist ./static

# Create runtime directories
RUN mkdir -p storage/reports storage/screenshots storage/videos storage/logs instance

# Verify the static folder exists
RUN test -f static/index.html && echo "✓ Frontend build verified" || (echo "✗ index.html missing" && exit 1)

# Environment
ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/health')" || exit 1

# Start with gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--timeout", "120", "run:app"]
