"""Management commands for the application."""
import sys
import os

from app import create_app, db

app = create_app()


def reset_database():
    """Drop all tables and recreate them."""
    with app.app_context():
        print("⚠️  Dropping all tables...")
        db.drop_all()
        print("✅ Creating all tables...")
        db.create_all()
        print("✅ Database reset complete.")
        print("   Run `python seed.py` to populate with sample data.")


def create_migration(message: str = 'auto migration'):
    """Create a new database migration."""
    os.system(f'flask --app run:app db migrate -m "{message}"')


def run_migration():
    """Apply pending migrations."""
    os.system('flask --app run:app db upgrade')


def show_routes():
    """Display all registered API routes."""
    with app.app_context():
        print(f"\n{'Method':<10} {'Endpoint':<50} {'View Function'}")
        print('─' * 90)
        for rule in sorted(app.url_map.iter_rules(), key=lambda r: r.rule):
            if rule.rule.startswith('/api'):
                methods = ','.join(sorted(rule.methods - {'HEAD', 'OPTIONS'}))
                print(f"{methods:<10} {rule.rule:<50} {rule.endpoint}")
        print()


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python manage.py <command>")
        print("Commands:")
        print("  reset_db     - Reset database (drop + recreate)")
        print("  routes       - Show all API routes")
        print("  seed         - Seed sample data")
        sys.exit(1)

    command = sys.argv[1]

    if command == 'reset_db':
        reset_database()
    elif command == 'routes':
        show_routes()
    elif command == 'seed':
        from seed import seed_sample_data
        seed_sample_data()
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
