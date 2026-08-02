# Multi-stage Docker build: React frontend + Flask backend

# ── Stage 1: Build React ──
FROM node:18-alpine AS frontend
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --silent
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Production ──
FROM python:3.11-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends gcc \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy backend source
COPY backend/ .

# Copy React build into backend/static (Flask serves from here)
COPY --from=frontend /build/dist ./static

# Verify
RUN test -f static/index.html || (echo "ERROR: static/index.html missing" && exit 1)

# Runtime dirs
RUN mkdir -p storage/reports storage/screenshots storage/videos storage/logs instance

ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/health')" || exit 1

CMD ["gunicorn", "run:app", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "120"]
