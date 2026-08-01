import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/layout/Layout';
import ErrorBoundary from '@/components/ErrorBoundary';

// Lazy-loaded pages for code splitting
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage'));
const TestSuitesPage = lazy(() => import('@/pages/TestSuitesPage'));
const TestCasesPage = lazy(() => import('@/pages/TestCasesPage'));
const ExecutionsPage = lazy(() => import('@/pages/ExecutionsPage'));
const ExecutionDetailPage = lazy(() => import('@/pages/ExecutionDetailPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const ScreenshotsPage = lazy(() => import('@/pages/ScreenshotsPage'));
const VideosPage = lazy(() => import('@/pages/VideosPage'));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'));
const SchedulerPage = lazy(() => import('@/pages/SchedulerPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const UsersPage = lazy(() => import('@/pages/UsersPage'));
const EnvironmentsPage = lazy(() => import('@/pages/EnvironmentsPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-dark-400">Loading...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
          <Route path="projects" element={<Suspense fallback={<PageLoader />}><ProjectsPage /></Suspense>} />
          <Route path="test-suites" element={<Suspense fallback={<PageLoader />}><TestSuitesPage /></Suspense>} />
          <Route path="test-cases" element={<Suspense fallback={<PageLoader />}><TestCasesPage /></Suspense>} />
          <Route path="executions" element={<Suspense fallback={<PageLoader />}><ExecutionsPage /></Suspense>} />
          <Route path="executions/:id" element={<Suspense fallback={<PageLoader />}><ExecutionDetailPage /></Suspense>} />
          <Route path="reports" element={<Suspense fallback={<PageLoader />}><ReportsPage /></Suspense>} />
          <Route path="screenshots" element={<Suspense fallback={<PageLoader />}><ScreenshotsPage /></Suspense>} />
          <Route path="videos" element={<Suspense fallback={<PageLoader />}><VideosPage /></Suspense>} />
          <Route path="analytics" element={<Suspense fallback={<PageLoader />}><AnalyticsPage /></Suspense>} />
          <Route path="scheduler" element={<Suspense fallback={<PageLoader />}><SchedulerPage /></Suspense>} />
          <Route path="environments" element={<Suspense fallback={<PageLoader />}><EnvironmentsPage /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
          <Route path="users" element={<Suspense fallback={<PageLoader />}><UsersPage /></Suspense>} />
        </Route>

        {/* 404 Catch-all */}
        <Route path="*" element={
          <Suspense fallback={<PageLoader />}>
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <p className="text-7xl font-bold gradient-text mb-4">404</p>
                <h2 className="text-xl font-bold text-white mb-2">Page Not Found</h2>
                <p className="text-sm text-dark-400 mb-6">The page you're looking for doesn't exist.</p>
                <a href="/dashboard" className="btn-primary inline-block">Go to Dashboard</a>
              </div>
            </div>
          </Suspense>
        } />
      </Routes>
    </Suspense>
    </ErrorBoundary>
  );
}

export default App;
