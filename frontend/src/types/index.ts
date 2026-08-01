// Authentication Types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

// User Types
export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'qa_engineer';
  is_active: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

// Project Types
export interface Project {
  id: number;
  name: string;
  description: string;
  framework: string;
  repository_url: string;
  environment: string;
  status: string;
  owner_id: number;
  owner_name: string | null;
  test_suites_count: number;
  test_cases_count: number;
  created_at: string;
  updated_at: string;
}

// Test Suite Types
export interface TestSuite {
  id: number;
  name: string;
  description: string;
  suite_type: string;
  project_id: number;
  project_name: string | null;
  priority: string;
  status: string;
  tags: string[];
  test_cases_count: number;
  created_at: string;
  updated_at: string;
}

// Test Case Types
export interface TestCase {
  id: number;
  title: string;
  description: string;
  file_path: string;
  priority: string;
  module: string;
  status: string;
  test_type: string;
  project_id: number;
  suite_id: number | null;
  suite_name: string | null;
  owner_id: number | null;
  owner_name: string | null;
  expected_duration: number;
  tags: string[];
  preconditions: string;
  steps: string;
  expected_result: string;
  created_at: string;
  updated_at: string;
}

// Execution Types
export interface Execution {
  id: number;
  name: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  execution_type: string;
  browser: string;
  environment: string;
  headless: boolean;
  parallel_workers: number;
  timeout: number;
  retries: number;
  total_tests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  success_rate: number;
  project_id: number;
  project_name: string | null;
  suite_id: number | null;
  triggered_by: number;
  triggered_by_name: string | null;
  report_path: string | null;
  log_path: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface ExecutionResult {
  id: number;
  execution_id: number;
  test_case_id: number | null;
  test_name: string;
  status: 'passed' | 'failed' | 'skipped' | 'error';
  duration: number;
  error_message: string | null;
  stack_trace: string | null;
  screenshot_path: string | null;
  video_path: string | null;
  retry_count: number;
  browser: string | null;
  suggested_cause: string | null;
  created_at: string;
}

// Environment Types
export interface Environment {
  id: number;
  name: string;
  display_name: string;
  base_url: string;
  description: string;
  is_active: boolean;
  variables: Record<string, string>;
  created_at: string;
  updated_at: string;
}

// Settings Types
export interface Settings {
  id: number;
  theme: string;
  execution_path: string;
  parallel_workers: number;
  timeout: number;
  retries: number;
  default_browser: string;
  headless: boolean;
  screenshot_on_failure: boolean;
  video_recording: boolean;
  trace_recording: boolean;
  base_url: string;
  report_format: string;
  notification_email: string | null;
  slack_webhook: string | null;
  updated_at: string;
}

// Schedule Types
export interface Schedule {
  id: number;
  name: string;
  schedule_type: string;
  cron_expression: string | null;
  is_active: boolean;
  project_id: number;
  project_name: string | null;
  suite_id: number | null;
  suite_name: string | null;
  browser: string;
  environment: string;
  last_run: string | null;
  next_run: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

// Dashboard Stats
export interface DashboardStats {
  total_projects: number;
  total_test_cases: number;
  total_executions: number;
  passed: number;
  failed: number;
  skipped: number;
  running: number;
  success_rate: number;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  pages: number;
  currentPage: number;
}

// Analytics
export interface TrendData {
  date: string;
  passed: number;
  failed: number;
  skipped: number;
  success_rate: number;
}

export interface BrowserDistribution {
  browser: string;
  count: number;
}
