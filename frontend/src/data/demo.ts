/**
 * Enterprise Demo Data Generator
 * Provides realistic data for all modules when backend has no records.
 * Used as fallback to ensure no page ever appears empty.
 */

const NAMES = ['Rahul Sharma', 'Priya Patel', 'Arun Kumar', 'Sneha Reddy', 'Vikram Singh', 'Ananya Das', 'Karthik Nair', 'Deepa Menon', 'Sanjay Gupta', 'Meera Iyer', 'Rajesh Verma', 'Kavita Joshi', 'Amit Banerjee', 'Lakshmi Rajan', 'Suresh Pillai', 'Divya Krishnan', 'Manoj Tiwari', 'Pooja Saxena', 'Ravi Chauhan', 'Neha Agarwal'];
const BROWSERS = ['chromium', 'firefox', 'webkit'];
const ENVS = ['development', 'qa', 'staging', 'production'];
const STATUSES_EXEC = ['completed', 'completed', 'completed', 'completed', 'failed', 'running', 'queued'];
const PRIORITIES = ['critical', 'high', 'medium', 'low'];
const SUITE_TYPES = ['smoke', 'regression', 'sanity', 'api', 'ui', 'performance', 'security', 'integration'];
const MODULES = ['Authentication', 'Dashboard', 'Payments', 'Cart', 'Checkout', 'Search', 'Profile', 'Settings', 'Reports', 'Admin', 'Notifications', 'API Gateway', 'User Management', 'Inventory', 'Analytics'];

const PROJECT_NAMES = [
  'E-Commerce Platform', 'Banking Portal', 'Insurance CRM', 'Healthcare Portal', 'ERP System',
  'HRMS Application', 'Inventory Management', 'Retail POS', 'Mobile Banking', 'Admin Dashboard',
  'Payment Gateway', 'Customer Portal', 'Supply Chain', 'Fleet Management', 'EdTech Platform',
  'Social Media App', 'Food Delivery', 'Travel Booking', 'Real Estate Portal', 'Fintech App',
  'Logistics Platform', 'Telecom Portal', 'Media Streaming', 'Cloud Console', 'DevOps Pipeline',
  'CRM System', 'Marketing Hub', 'Sales Dashboard', 'Support Ticket', 'Project Tracker',
];

const SUITE_NAMES = [
  'Login Flow', 'Registration Suite', 'Payment Processing', 'Cart Operations', 'Checkout Flow',
  'Search Functionality', 'User Profile', 'Admin Panel', 'API Endpoints', 'Dashboard Widgets',
  'Notification System', 'File Upload', 'Data Export', 'Role Permissions', 'Email Templates',
  'Password Reset', 'Multi-Factor Auth', 'Session Management', 'Audit Logging', 'Performance Metrics',
];

const TEST_NAMES = [
  'User can login with valid credentials',
  'Invalid password shows error message',
  'Registration form validates all fields',
  'Password reset email is sent successfully',
  'Cart updates quantity correctly',
  'Checkout calculates tax properly',
  'Payment processes with valid card',
  'Search returns relevant results',
  'Filter narrows search results',
  'Sort by price works correctly',
  'Profile update saves changes',
  'Avatar upload accepts valid formats',
  'Admin can create new user',
  'Role permissions restrict access',
  'API returns 200 for valid request',
  'Rate limiting blocks excess requests',
  'File upload handles large files',
  'Export generates correct CSV',
  'Dashboard loads within 3 seconds',
  'Notification badge updates in real-time',
  'Session expires after inactivity',
  'Multi-factor auth validates OTP',
  'Pagination loads next page correctly',
  'Responsive layout on mobile viewport',
  'Accessibility: keyboard navigation works',
];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randDate(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - randInt(0, daysBack));
  d.setHours(randInt(6, 22), randInt(0, 59), randInt(0, 59));
  return d.toISOString();
}

// --- Projects ---
export function generateProjects(count: number = 30) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: i < PROJECT_NAMES.length ? PROJECT_NAMES[i] : `Project ${i + 1}`,
    description: `Comprehensive test automation suite for ${i < PROJECT_NAMES.length ? PROJECT_NAMES[i] : 'Project ' + (i + 1)} covering UI, API, and integration tests.`,
    framework: 'playwright',
    repository_url: `https://github.com/org/${(i < PROJECT_NAMES.length ? PROJECT_NAMES[i] : 'project-' + i).toLowerCase().replace(/\s+/g, '-')}-tests`,
    environment: rand(ENVS),
    status: Math.random() > 0.1 ? 'active' : 'archived',
    owner_id: randInt(1, 10),
    owner_name: rand(NAMES),
    test_suites_count: randInt(5, 25),
    test_cases_count: randInt(50, 300),
    created_at: randDate(365),
    updated_at: randDate(30),
  }));
}

// --- Test Suites ---
export function generateTestSuites(count: number = 40) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `${rand(SUITE_NAMES)} - ${rand(SUITE_TYPES).toUpperCase()}`,
    description: `Automated ${rand(SUITE_TYPES)} test suite covering critical user flows and edge cases.`,
    suite_type: rand(SUITE_TYPES),
    project_id: randInt(1, 30),
    project_name: rand(PROJECT_NAMES),
    priority: rand(PRIORITIES),
    status: 'active',
    tags: [rand(SUITE_TYPES), rand(PRIORITIES), rand(['automated', 'manual', 'hybrid'])],
    test_cases_count: randInt(10, 80),
    created_at: randDate(180),
    updated_at: randDate(14),
  }));
}

// --- Test Cases ---
export function generateTestCases(count: number = 50) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    title: rand(TEST_NAMES),
    description: 'Verify the expected behavior under normal and edge case conditions.',
    file_path: `tests/${rand(MODULES).toLowerCase().replace(/\s+/g, '-')}/${rand(['login', 'register', 'checkout', 'search', 'api', 'upload', 'export', 'dashboard'])}.spec.ts`,
    priority: rand(PRIORITIES),
    module: rand(MODULES),
    status: 'active',
    test_type: rand(['functional', 'e2e', 'api', 'unit']),
    project_id: randInt(1, 30),
    suite_id: randInt(1, 40),
    suite_name: rand(SUITE_NAMES),
    owner_id: randInt(1, 10),
    owner_name: rand(NAMES),
    expected_duration: randInt(5, 60),
    tags: [rand(MODULES).toLowerCase(), rand(PRIORITIES)],
    created_at: randDate(120),
    updated_at: randDate(7),
  }));
}

// --- Executions ---
export function generateExecutions(count: number = 30) {
  return Array.from({ length: count }, (_, i) => {
    const status = rand(STATUSES_EXEC);
    const total = randInt(20, 250);
    const passed = status === 'completed' ? Math.floor(total * (0.8 + Math.random() * 0.18)) : randInt(0, total);
    const failed = status === 'failed' ? randInt(5, 30) : randInt(0, total - passed);
    const skipped = total - passed - failed;
    const duration = +(randInt(15, 180) + Math.random()).toFixed(1);

    return {
      id: i + 1,
      name: `${rand(PROJECT_NAMES)} - ${rand(SUITE_TYPES)} #${randInt(100, 999)}`,
      status,
      execution_type: rand(['suite', 'project', 'single']),
      browser: rand(BROWSERS),
      environment: rand(ENVS),
      headless: true,
      parallel_workers: rand([1, 2, 4, 8]),
      timeout: 30000,
      retries: rand([0, 1, 2]),
      total_tests: total,
      passed,
      failed,
      skipped,
      duration,
      success_rate: total > 0 ? +((passed / total) * 100).toFixed(1) : 0,
      project_id: randInt(1, 30),
      project_name: rand(PROJECT_NAMES),
      suite_id: randInt(1, 40),
      triggered_by: randInt(1, 10),
      triggered_by_name: rand(NAMES),
      report_path: null,
      log_path: null,
      started_at: randDate(30),
      completed_at: status === 'running' || status === 'queued' ? null : randDate(30),
      created_at: randDate(30),
    };
  });
}

// --- Reports ---
export function generateReports(count: number = 25) {
  const types = ['json', 'csv', 'html'];
  const reportTypes = ['Regression', 'Smoke', 'Performance', 'Security', 'Coverage', 'Daily', 'Weekly'];
  return Array.from({ length: count }, () => {
    const ext = rand(types);
    const type = rand(reportTypes);
    return {
      filename: `${type.toLowerCase()}_report_${randInt(1000, 9999)}_${randDate(60).slice(0, 10)}.${ext}`,
      size: randInt(5000, 500000),
      created_at: randDate(60),
      type: ext,
      report_type: type,
      generated_by: rand(NAMES),
    };
  });
}

// --- Screenshots ---
export function generateScreenshots(count: number = 30) {
  return Array.from({ length: count }, (_, i) => ({
    filename: `screenshot_${rand(MODULES).toLowerCase().replace(/\s/g, '_')}_${randInt(1000, 9999)}.png`,
    path: `/api/screenshots/file/screenshot_${i}.png`,
    size: randInt(50000, 2000000),
    created_at: randDate(30),
    browser: rand(BROWSERS),
    resolution: rand(['1920x1080', '1366x768', '1440x900', '375x667', '768x1024']),
    execution_id: randInt(1, 30),
    status: rand(['failed', 'failed', 'passed']),
    tester: rand(NAMES),
  }));
}

// --- Videos ---
export function generateVideos(count: number = 20) {
  return Array.from({ length: count }, (_, i) => ({
    filename: `recording_${rand(MODULES).toLowerCase().replace(/\s/g, '_')}_${randInt(1000, 9999)}.webm`,
    path: `/api/videos/file/video_${i}.webm`,
    size: randInt(5000000, 50000000),
    created_at: randDate(30),
    browser: rand(BROWSERS),
    resolution: rand(['1920x1080', '1366x768']),
    duration: randInt(10, 180),
    execution_id: randInt(1, 30),
    status: rand(['completed', 'failed']),
    tester: rand(NAMES),
  }));
}

// --- Schedules ---
export function generateSchedules(count: number = 15) {
  const scheduleNames = ['Nightly Regression', 'Hourly Smoke', 'Daily Sanity', 'Weekly Performance', 'Monthly Security', 'API Health Check', 'Cross-Browser Suite', 'Mobile Regression', 'Payment Flow', 'Auth Smoke'];
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: i < scheduleNames.length ? scheduleNames[i] : `Schedule #${i + 1}`,
    schedule_type: rand(['hourly', 'daily', 'weekly', 'cron']),
    cron_expression: rand(['0 2 * * *', '0 * * * *', '0 4 * * 1', '0 0 1 * *', '*/30 * * * *']),
    is_active: Math.random() > 0.2,
    project_id: randInt(1, 30),
    project_name: rand(PROJECT_NAMES),
    suite_id: randInt(1, 40),
    suite_name: rand(SUITE_NAMES),
    browser: rand(BROWSERS),
    environment: rand(ENVS),
    last_run: randDate(3),
    next_run: new Date(Date.now() + randInt(1, 48) * 3600000).toISOString(),
    created_by: randInt(1, 10),
    created_at: randDate(90),
    updated_at: randDate(7),
  }));
}

// --- Users ---
export function generateUsers(count: number = 20) {
  const roles = ['admin', 'admin', 'qa_engineer', 'qa_engineer', 'qa_engineer', 'qa_engineer'];
  return NAMES.slice(0, count).map((name, i) => ({
    id: i + 1,
    username: name.toLowerCase().replace(/\s+/g, '.'),
    email: `${name.toLowerCase().replace(/\s+/g, '.')}@company.com`,
    full_name: name,
    role: rand(roles),
    is_active: Math.random() > 0.05,
    avatar_url: null,
    created_at: randDate(365),
    updated_at: randDate(30),
    last_login: randDate(7),
  }));
}

// --- Environments ---
export function generateEnvironments() {
  return [
    { id: 1, name: 'development', display_name: 'Development', base_url: 'http://localhost:3000', description: 'Local development environment', is_active: true, variables: { DEBUG: 'true' }, created_at: randDate(365), updated_at: randDate(30) },
    { id: 2, name: 'qa', display_name: 'QA', base_url: 'https://qa.example.com', description: 'QA testing environment', is_active: true, variables: { DEBUG: 'false' }, created_at: randDate(365), updated_at: randDate(30) },
    { id: 3, name: 'staging', display_name: 'Staging', base_url: 'https://staging.example.com', description: 'Pre-production staging', is_active: true, variables: { DEBUG: 'false' }, created_at: randDate(365), updated_at: randDate(30) },
    { id: 4, name: 'production', display_name: 'Production', base_url: 'https://app.example.com', description: 'Live production environment', is_active: true, variables: { DEBUG: 'false' }, created_at: randDate(365), updated_at: randDate(30) },
    { id: 5, name: 'performance', display_name: 'Performance', base_url: 'https://perf.example.com', description: 'Load testing environment', is_active: true, variables: { WORKERS: '16' }, created_at: randDate(180), updated_at: randDate(14) },
  ];
}
