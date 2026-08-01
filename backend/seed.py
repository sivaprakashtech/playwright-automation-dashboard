"""Database seeder with sample data for development."""
import random
from datetime import datetime, timedelta

from app import create_app, db
from app.models.user import User
from app.models.project import Project
from app.models.test_suite import TestSuite
from app.models.test_case import TestCase
from app.models.execution import Execution, ExecutionResult
from app.models.schedule import Schedule
from app.models.notification import Notification


def seed_sample_data():
    """Seed comprehensive sample data for development and demo."""
    app = create_app()

    with app.app_context():
        print("🌱 Seeding sample data...")

        # Get existing users
        admin = User.query.filter_by(username='admin').first()
        qa_user = User.query.filter_by(username='qa_engineer').first()

        if not admin or not qa_user:
            print("❌ Default users not found. Run the app first to create them.")
            return

        # --- Projects ---
        if Project.query.count() == 0:
            projects = [
                Project(
                    name='E-Commerce Platform',
                    description='End-to-end tests for the main e-commerce web application including checkout, payments, and user accounts.',
                    framework='playwright',
                    repository_url='https://github.com/org/ecommerce-tests',
                    environment='development',
                    owner_id=admin.id,
                ),
                Project(
                    name='Admin Dashboard',
                    description='Automated UI tests for the internal admin dashboard covering user management and analytics.',
                    framework='playwright',
                    repository_url='https://github.com/org/admin-tests',
                    environment='qa',
                    owner_id=admin.id,
                ),
                Project(
                    name='API Gateway',
                    description='API integration tests for the microservices gateway with authentication and rate limiting.',
                    framework='playwright',
                    repository_url='https://github.com/org/api-tests',
                    environment='staging',
                    owner_id=qa_user.id,
                ),
                Project(
                    name='Mobile Web App',
                    description='Cross-browser responsive testing for the mobile-optimized web application.',
                    framework='playwright',
                    repository_url='https://github.com/org/mobile-tests',
                    environment='development',
                    owner_id=qa_user.id,
                ),
            ]
            db.session.add_all(projects)
            db.session.commit()
            print(f"  ✅ Created {len(projects)} projects")
        else:
            projects = Project.query.all()
            print("  ⏭️ Projects already exist, skipping")

        # --- Test Suites ---
        if TestSuite.query.count() == 0:
            suite_data = [
                ('Smoke Tests', 'smoke', 'Critical path smoke tests', 'critical'),
                ('Regression Suite', 'regression', 'Full regression test suite', 'high'),
                ('Sanity Check', 'sanity', 'Quick sanity validation after deploy', 'high'),
                ('API Tests', 'api', 'REST API endpoint validation', 'medium'),
                ('UI Components', 'ui', 'Visual and interaction tests for UI components', 'medium'),
                ('Authentication', 'regression', 'Login, logout, password reset flows', 'critical'),
                ('Payment Flow', 'regression', 'Checkout and payment processing', 'critical'),
                ('Search & Filter', 'ui', 'Product search and filtering', 'medium'),
            ]

            suites = []
            for name, suite_type, desc, priority in suite_data:
                project = random.choice(projects)
                suite = TestSuite(
                    name=name,
                    description=desc,
                    suite_type=suite_type,
                    project_id=project.id,
                    priority=priority,
                    tags=f'{suite_type},{priority}',
                )
                suites.append(suite)

            db.session.add_all(suites)
            db.session.commit()
            print(f"  ✅ Created {len(suites)} test suites")
        else:
            suites = TestSuite.query.all()
            print("  ⏭️ Test suites already exist, skipping")

        # --- Test Cases ---
        if TestCase.query.count() == 0:
            test_case_templates = [
                ('User can login with valid credentials', 'auth/login.spec.ts', 'critical', 'Authentication'),
                ('User sees error for invalid password', 'auth/login.spec.ts', 'high', 'Authentication'),
                ('User can register new account', 'auth/register.spec.ts', 'high', 'Authentication'),
                ('Password reset email is sent', 'auth/reset.spec.ts', 'medium', 'Authentication'),
                ('User can logout successfully', 'auth/logout.spec.ts', 'high', 'Authentication'),
                ('Product search returns results', 'search/search.spec.ts', 'high', 'Search'),
                ('Filters narrow search results', 'search/filters.spec.ts', 'medium', 'Search'),
                ('Sort by price works correctly', 'search/sort.spec.ts', 'medium', 'Search'),
                ('Add item to cart', 'cart/add-to-cart.spec.ts', 'critical', 'Cart'),
                ('Remove item from cart', 'cart/remove-from-cart.spec.ts', 'high', 'Cart'),
                ('Cart persists after refresh', 'cart/persistence.spec.ts', 'medium', 'Cart'),
                ('Checkout completes with valid card', 'checkout/payment.spec.ts', 'critical', 'Payment'),
                ('Invalid card shows error', 'checkout/payment.spec.ts', 'high', 'Payment'),
                ('Order confirmation is displayed', 'checkout/confirmation.spec.ts', 'high', 'Payment'),
                ('Navigation menu renders correctly', 'ui/navigation.spec.ts', 'medium', 'UI'),
                ('Responsive layout on mobile', 'ui/responsive.spec.ts', 'high', 'UI'),
                ('Modal opens and closes', 'ui/modal.spec.ts', 'low', 'UI'),
                ('Form validation shows errors', 'ui/forms.spec.ts', 'medium', 'UI'),
                ('API returns 200 for health check', 'api/health.spec.ts', 'critical', 'API'),
                ('API handles rate limiting', 'api/rate-limit.spec.ts', 'medium', 'API'),
                ('Pagination works on product list', 'products/list.spec.ts', 'medium', 'Products'),
                ('Product detail page loads data', 'products/detail.spec.ts', 'high', 'Products'),
                ('User profile can be updated', 'profile/update.spec.ts', 'medium', 'Profile'),
                ('Avatar upload works', 'profile/avatar.spec.ts', 'low', 'Profile'),
                ('Dashboard loads analytics data', 'dashboard/analytics.spec.ts', 'high', 'Dashboard'),
            ]

            test_cases = []
            for title, file_path, priority, module in test_case_templates:
                project = random.choice(projects)
                suite = random.choice([s for s in suites if s.project_id == project.id] or suites)
                test_cases.append(TestCase(
                    title=title,
                    description=f'Verify that: {title.lower()}',
                    file_path=file_path,
                    priority=priority,
                    module=module,
                    test_type=random.choice(['functional', 'e2e', 'api']),
                    project_id=project.id,
                    suite_id=suite.id,
                    owner_id=random.choice([admin.id, qa_user.id]),
                    expected_duration=random.randint(5, 60),
                    tags=f'{module.lower()},{priority}',
                ))

            db.session.add_all(test_cases)
            db.session.commit()
            print(f"  ✅ Created {len(test_cases)} test cases")
        else:
            test_cases = TestCase.query.all()
            print("  ⏭️ Test cases already exist, skipping")

        # --- Executions ---
        if Execution.query.count() == 0:
            executions = []
            for i in range(15):
                project = random.choice(projects)
                started = datetime.utcnow() - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23))
                duration = random.uniform(10, 120)
                total = random.randint(5, 25)
                passed = int(total * random.uniform(0.6, 0.95))
                failed = random.randint(0, total - passed)
                skipped = total - passed - failed

                execution = Execution(
                    name=f'{project.name} - {started.strftime("%Y-%m-%d %H:%M")}',
                    status='completed',
                    execution_type=random.choice(['suite', 'project']),
                    browser=random.choice(['chromium', 'firefox', 'webkit']),
                    environment=random.choice(['development', 'qa', 'staging']),
                    headless=True,
                    parallel_workers=random.choice([1, 2, 4]),
                    timeout=30000,
                    retries=1,
                    total_tests=total,
                    passed=passed,
                    failed=failed,
                    skipped=skipped,
                    duration=round(duration, 2),
                    project_id=project.id,
                    triggered_by=random.choice([admin.id, qa_user.id]),
                    started_at=started,
                    completed_at=started + timedelta(seconds=duration),
                    created_at=started - timedelta(seconds=5),
                )
                executions.append(execution)

            db.session.add_all(executions)
            db.session.commit()

            # Add execution results
            for execution in executions:
                project_cases = [tc for tc in test_cases if tc.project_id == execution.project_id]
                selected_cases = random.sample(project_cases, min(execution.total_tests, len(project_cases)))

                for tc in selected_cases:
                    status = random.choices(
                        ['passed', 'failed', 'skipped'],
                        weights=[75, 15, 10],
                    )[0]

                    result = ExecutionResult(
                        execution_id=execution.id,
                        test_case_id=tc.id,
                        test_name=tc.title,
                        status=status,
                        duration=round(random.uniform(0.5, 8.0), 2),
                        browser=execution.browser,
                        error_message='AssertionError: Expected element to be visible' if status == 'failed' else None,
                        stack_trace='  at tests/spec.ts:42:5\n  at Object.<anonymous>' if status == 'failed' else None,
                        suggested_cause='Element not rendered before assertion timeout' if status == 'failed' else None,
                    )
                    db.session.add(result)

            db.session.commit()
            print(f"  ✅ Created {len(executions)} executions with results")
        else:
            print("  ⏭️ Executions already exist, skipping")

        # --- Schedules ---
        if Schedule.query.count() == 0:
            schedules = [
                Schedule(
                    name='Nightly Regression',
                    schedule_type='daily',
                    cron_expression='0 2 * * *',
                    is_active=True,
                    project_id=projects[0].id,
                    browser='chromium',
                    environment='qa',
                    created_by=admin.id,
                ),
                Schedule(
                    name='Hourly Smoke Test',
                    schedule_type='hourly',
                    cron_expression='0 * * * *',
                    is_active=True,
                    project_id=projects[0].id,
                    browser='chromium',
                    environment='development',
                    created_by=admin.id,
                ),
                Schedule(
                    name='Weekly Full Suite',
                    schedule_type='weekly',
                    cron_expression='0 4 * * 1',
                    is_active=False,
                    project_id=projects[1].id,
                    browser='firefox',
                    environment='staging',
                    created_by=qa_user.id,
                ),
            ]
            db.session.add_all(schedules)
            db.session.commit()
            print(f"  ✅ Created {len(schedules)} schedules")
        else:
            print("  ⏭️ Schedules already exist, skipping")

        # --- Notifications ---
        if Notification.query.count() == 0:
            notifications = [
                Notification(
                    title='✅ Regression Suite Passed',
                    message='All 25 tests passed in nightly regression run (100% pass rate)',
                    notification_type='execution_complete',
                    severity='success',
                    user_id=admin.id,
                    related_entity_type='execution',
                    related_entity_id=1,
                ),
                Notification(
                    title='❌ Smoke Test Failed',
                    message='3 tests failed in smoke suite: login, cart, checkout',
                    notification_type='execution_failed',
                    severity='error',
                    user_id=admin.id,
                    related_entity_type='execution',
                    related_entity_id=2,
                ),
                Notification(
                    title='⏰ Scheduled Run Triggered',
                    message='Nightly regression schedule executed automatically',
                    notification_type='schedule_triggered',
                    severity='info',
                    user_id=qa_user.id,
                ),
                Notification(
                    title='🆕 New Project Created',
                    message='Project "Mobile Web App" was created by QA Engineer',
                    notification_type='system',
                    severity='info',
                    user_id=admin.id,
                    related_entity_type='project',
                    related_entity_id=4,
                ),
            ]
            db.session.add_all(notifications)
            db.session.commit()
            print(f"  ✅ Created {len(notifications)} notifications")
        else:
            print("  ⏭️ Notifications already exist, skipping")

        print("\n🎉 Sample data seeding complete!")
        print(f"   Projects: {Project.query.count()}")
        print(f"   Test Suites: {TestSuite.query.count()}")
        print(f"   Test Cases: {TestCase.query.count()}")
        print(f"   Executions: {Execution.query.count()}")
        print(f"   Schedules: {Schedule.query.count()}")
        print(f"   Notifications: {Notification.query.count()}")


if __name__ == '__main__':
    seed_sample_data()
