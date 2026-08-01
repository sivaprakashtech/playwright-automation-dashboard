"""Flask application entry point."""
import os
from app import create_app

app = create_app()


# Serve frontend static files in production (Docker)
if not app.debug:
    from flask import send_from_directory

    static_folder = os.path.join(os.path.dirname(__file__), 'static')

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        """Serve React SPA static files."""
        if path and os.path.exists(os.path.join(static_folder, path)):
            return send_from_directory(static_folder, path)
        return send_from_directory(static_folder, 'index.html')





if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
