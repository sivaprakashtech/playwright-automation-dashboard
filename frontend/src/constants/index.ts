/**
 * Application-wide constants.
 * Centralizes magic strings and configuration values.
 */

export const APP_NAME = 'Playwright Dashboard';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Enterprise QA Automation Platform';

// Roles
export const ROLES = {
  ADMIN: 'admin',
  QA_ENGINEER: 'qa_engineer',
} as const;

// Execution statuses
export const EXECUTION_STATUS = {
  QUEUED: 'queued',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

// Priority levels
export const PRIORITIES = ['critical', 'high', 'medium', 'low'] as const;

// Suite types
export const SUITE_TYPES = ['smoke', 'regression', 'sanity', 'api', 'ui', 'performance', 'security', 'integration'] as const;

// Browsers
export const BROWSERS = ['chromium', 'firefox', 'webkit'] as const;

// Environments
export const ENVIRONMENTS = ['development', 'qa', 'staging', 'production'] as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Refresh intervals (ms)
export const REFRESH_INTERVALS = {
  DASHBOARD: 10000,
  EXECUTIONS: 5000,
  RUNNING_EXECUTION: 3000,
} as const;

// Chart colors (consistent palette)
export const CHART_COLORS = {
  PRIMARY: '#6366f1',
  BLUE: '#3b82f6',
  CYAN: '#06b6d4',
  EMERALD: '#10b981',
  AMBER: '#f59e0b',
  RED: '#ef4444',
  PURPLE: '#8b5cf6',
  PINK: '#ec4899',
} as const;

export const CHART_PALETTE = Object.values(CHART_COLORS);

// Tooltip styling (Recharts)
export const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#0f172a',
  border: '1px solid #1e293b',
  borderRadius: '12px',
  boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.4)',
} as const;
