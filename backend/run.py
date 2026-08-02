"""Flask application entry point with SPA serving."""
import os
from app import create_app

app = create_app()

# ─────────────────────────────────────────────────────────────
# Production SPA Serving
# ─────────────────────────────────────────────────────────────
# In production, Flask serves the React frontend from /static.
# The Dockerfile copies frontend/dist → backend/static.
# On Render, the build script builds frontend and copies dist.
# ─────────────────────────────────────────────────────────────

STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_spa(path):
    """
    Serve React SPA.
    - If the requested path matches a real file in static/ → serve it.
    - Otherwise → serve index.html (SPA client-side routing).
    - API routes (/api/*) are handled by blueprints and never reach here.
    """
    from flask import send_from_directory, abort

    # Only serve if static dir exists (production)
    if not os.path.isdir(STATIC_DIR):
        abort(404)

    # Serve actual static files (JS, CSS, images, favicon)
    if path:
        file_path = os.path.join(STATIC_DIR, path)
        if os.path.isfile(file_path):
            return send_from_directory(STATIC_DIR, path)

    # SPA fallback: serve index.html for all other routes
    index_path = os.path.join(STATIC_DIR, 'index.html')
    if os.path.isfile(index_path):
        return send_from_directory(STATIC_DIR, 'index.html')

    from flask import jsonify
    return jsonify({'error': 'Frontend not built. Run: cd frontend && npm run build'}), 404


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
