"""Smoke test suite — verifies all endpoints return expected status codes."""
import time
from app import create_app


def run_smoke_tests():
    """Execute full smoke test suite."""
    app = create_app('testing')
    client = app.test_client()

    results = {'passed': 0, 'failed': 0, 'errors': []}

    def check(desc, response, expected_status):
        if response.status_code == expected_status:
            results['passed'] += 1
        else:
            results['failed'] += 1
            results['errors'].append(f"  FAIL: {desc} -> {response.status_code} (expected {expected_status})")

    # --- AUTH ---
    # Login with wrong credentials
    r = client.post('/api/auth/login', json={'username': 'bad', 'password': 'bad'})
    check('Login with invalid creds returns 401', r, 401)

    # Login with empty body
    r = client.post('/api/auth/login', json={})
    check('Login with empty body returns 400', r, 400)

    # Login success
    r = client.post('/api/auth/login', json={'username': 'admin', 'password': '1231231234'})
    check('Login with valid creds returns 200', r, 200)
    token = r.get_json()['access_token']
    refresh = r.get_json()['refresh_token']
    h = {'Authorization': f'Bearer {token}'}

    # Auth endpoints
    r = client.get('/api/auth/me', headers=h)
    check('GET /auth/me returns 200', r, 200)

    r = client.get('/api/auth/verify', headers=h)
    check('GET /auth/verify returns 200', r, 200)

    # No token
    r = client.get('/api/auth/me')
    check('GET /auth/me without token returns 401', r, 401)

    # Refresh token
    r = client.post('/api/auth/refresh', headers={'Authorization': f'Bearer {refresh}'})
    check('POST /auth/refresh returns 200', r, 200)

    # --- PROJECTS ---
    r = client.get('/api/projects', headers=h)
    check('GET /projects returns 200', r, 200)

    r = client.post('/api/projects', json={'name': f'Test {time.time()}', 'framework': 'playwright', 'environment': 'development'}, headers=h)
    check('POST /projects returns 201', r, 201)
    pid = r.get_json()['project']['id']

    r = client.get(f'/api/projects/{pid}', headers=h)
    check('GET /projects/:id returns 200', r, 200)

    r = client.get(f'/api/projects/{pid}/stats', headers=h)
    check('GET /projects/:id/stats returns 200', r, 200)

    # Duplicate project name
    r = client.post('/api/projects', json={'name': f'Test {time.time()}'}, headers=h)
    # Missing framework should still work with default
    check('POST /projects with defaults returns 201', r, 201)

    # --- TEST SUITES ---
    r = client.get('/api/test-suites', headers=h)
    check('GET /test-suites returns 200', r, 200)

    r = client.post('/api/test-suites', json={'name': 'Smoke', 'project_id': pid}, headers=h)
    check('POST /test-suites returns 201', r, 201)
    sid = r.get_json()['test_suite']['id']

    # --- TEST CASES ---
    r = client.get('/api/test-cases', headers=h)
    check('GET /test-cases returns 200', r, 200)

    r = client.post('/api/test-cases', json={'title': 'Test Login', 'project_id': pid, 'suite_id': sid}, headers=h)
    check('POST /test-cases returns 201', r, 201)

    # --- EXECUTIONS ---
    r = client.get('/api/executions', headers=h)
    check('GET /executions returns 200', r, 200)

    r = client.get('/api/executions/stats', headers=h)
    check('GET /executions/stats returns 200', r, 200)

    r = client.get('/api/executions/recent', headers=h)
    check('GET /executions/recent returns 200', r, 200)

    r = client.post('/api/executions/run', json={'project_id': pid}, headers=h)
    check('POST /executions/run returns 201', r, 201)
    eid = r.get_json()['execution']['id']

    # Wait for execution
    for _ in range(30):
        time.sleep(0.1)
        r = client.get(f'/api/executions/{eid}', headers=h)
        if r.get_json()['execution']['status'] == 'completed':
            break
    check('GET /executions/:id returns 200', r, 200)

    # --- ANALYTICS ---
    r = client.get('/api/analytics/dashboard', headers=h)
    check('GET /analytics/dashboard returns 200', r, 200)

    r = client.get('/api/analytics/trend', headers=h)
    check('GET /analytics/trend returns 200', r, 200)

    r = client.get('/api/analytics/browser-distribution', headers=h)
    check('GET /analytics/browser-distribution returns 200', r, 200)

    r = client.get('/api/analytics/most-failed', headers=h)
    check('GET /analytics/most-failed returns 200', r, 200)

    r = client.get('/api/analytics/heatmap', headers=h)
    check('GET /analytics/heatmap returns 200', r, 200)

    r = client.get('/api/analytics/execution-time', headers=h)
    check('GET /analytics/execution-time returns 200', r, 200)

    # --- REPORTS ---
    r = client.get(f'/api/reports/execution/{eid}', headers=h)
    check('GET /reports/execution/:id returns 200', r, 200)

    r = client.get('/api/reports/history', headers=h)
    check('GET /reports/history returns 200', r, 200)

    # --- BROWSERS ---
    r = client.get('/api/browsers', headers=h)
    check('GET /browsers returns 200', r, 200)

    # --- ENVIRONMENTS ---
    r = client.get('/api/environments', headers=h)
    check('GET /environments returns 200', r, 200)

    # --- NOTIFICATIONS ---
    r = client.get('/api/notifications', headers=h)
    check('GET /notifications returns 200', r, 200)

    r = client.get('/api/notifications/unread-count', headers=h)
    check('GET /notifications/unread-count returns 200', r, 200)

    # --- SCHEDULER ---
    r = client.get('/api/scheduler', headers=h)
    check('GET /scheduler returns 200', r, 200)

    # --- SETTINGS ---
    r = client.get('/api/settings', headers=h)
    check('GET /settings returns 200', r, 200)

    # --- USERS (admin only) ---
    r = client.get('/api/users', headers=h)
    check('GET /users (admin) returns 200', r, 200)

    # --- SCREENSHOTS ---
    r = client.get('/api/screenshots', headers=h)
    check('GET /screenshots returns 200', r, 200)

    # --- VIDEOS ---
    r = client.get('/api/videos', headers=h)
    check('GET /videos returns 200', r, 200)

    # --- HEALTH ---
    r = client.get('/health')
    check('GET /health returns 200', r, 200)

    # --- RBAC ---
    r = client.post('/api/auth/login', json={'username': 'qa_engineer', 'password': '1231231234'})
    qa_h = {'Authorization': f'Bearer {r.get_json()["access_token"]}'}
    r = client.get('/api/users', headers=qa_h)
    check('QA user accessing /users returns 403', r, 403)

    # --- LOGOUT ---
    r = client.post('/api/auth/logout', headers=h)
    check('POST /auth/logout returns 200', r, 200)

    r = client.get('/api/projects', headers=h)
    check('Revoked token returns 401', r, 401)

    # --- RESULTS ---
    total = results['passed'] + results['failed']
    print(f"\n{'='*60}")
    print(f"  SMOKE TEST RESULTS: {results['passed']}/{total} passed")
    print(f"{'='*60}")

    if results['errors']:
        for err in results['errors']:
            print(err)

    if results['failed'] == 0:
        print("  ✅ ALL TESTS PASSED")
    else:
        print(f"  ❌ {results['failed']} TESTS FAILED")

    print(f"{'='*60}\n")
    return results['failed'] == 0


if __name__ == '__main__':
    import sys
    success = run_smoke_tests()
    sys.exit(0 if success else 1)
