import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, X, Presentation } from 'lucide-react';

const DEMO_SEQUENCE = [
  { path: '/dashboard', label: 'Dashboard', duration: 8000, caption: 'Real-time analytics with live KPI tracking' },
  { path: '/projects', label: 'Projects', duration: 6000, caption: '150 projects with full CRUD management' },
  { path: '/test-suites', label: 'Test Suites', duration: 5000, caption: 'Organized by type — Smoke, Regression, API, Security' },
  { path: '/test-cases', label: 'Test Cases', duration: 5000, caption: '5,000 test cases with priority and ownership' },
  { path: '/executions', label: 'Executions', duration: 7000, caption: 'Multi-browser execution with real-time status' },
  { path: '/reports', label: 'Reports', duration: 5000, caption: 'Export as JSON, CSV, or HTML' },
  { path: '/analytics', label: 'Analytics', duration: 7000, caption: 'Deep insights — trends, failures, heatmaps' },
  { path: '/scheduler', label: 'Scheduler', duration: 5000, caption: 'Cron-based automated test scheduling' },
  { path: '/users', label: 'Users', duration: 5000, caption: 'Role-based team management' },
  { path: '/settings', label: 'Settings', duration: 4000, caption: 'Execution configuration and preferences' },
];

export default function DemoMode() {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const startDemo = useCallback(() => {
    setIsActive(true);
    setIsPaused(false);
    setCurrentStep(0);
    setProgress(0);
    navigate(DEMO_SEQUENCE[0].path);
  }, [navigate]);

  const stopDemo = useCallback(() => {
    setIsActive(false);
    setIsPaused(false);
    setCurrentStep(0);
    setProgress(0);
  }, []);

  const skipStep = useCallback(() => {
    const next = (currentStep + 1) % DEMO_SEQUENCE.length;
    setCurrentStep(next);
    setProgress(0);
    navigate(DEMO_SEQUENCE[next].path);
  }, [currentStep, navigate]);

  // Auto-advance timer
  useEffect(() => {
    if (!isActive || isPaused) return;

    const step = DEMO_SEQUENCE[currentStep];
    const interval = 50; // Progress update frequency
    const increment = (interval / step.duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          const next = (currentStep + 1) % DEMO_SEQUENCE.length;
          setCurrentStep(next);
          navigate(DEMO_SEQUENCE[next].path);
          return 0;
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isActive, isPaused, currentStep, navigate]);

  return (
    <>
      {/* Demo Launch Button (bottom right) */}
      {!isActive && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={startDemo}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full
            bg-gradient-to-r from-primary-600 to-blue-600 text-white text-sm font-medium
            shadow-xl shadow-primary-500/30 hover:shadow-primary-500/50 hover:scale-105
            transition-all duration-200"
          title="Start Demo Mode"
        >
          <Presentation className="w-4 h-4" />
          <span className="hidden sm:inline">Demo Mode</span>
        </motion.button>
      )}

      {/* Demo Control Bar */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3
              px-5 py-3 rounded-2xl bg-dark-800/95 backdrop-blur-xl border border-dark-700/50
              shadow-2xl shadow-black/40"
          >
            {/* Step indicator */}
            <div className="flex items-center gap-1.5 mr-2">
              {DEMO_SEQUENCE.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    i === currentStep ? 'w-4 bg-primary-400' : i < currentStep ? 'bg-primary-600' : 'bg-dark-600'
                  }`}
                />
              ))}
            </div>

            {/* Current step info */}
            <div className="min-w-[180px]">
              <p className="text-xs font-semibold text-white">{DEMO_SEQUENCE[currentStep].label}</p>
              <p className="text-[10px] text-dark-400">{DEMO_SEQUENCE[currentStep].caption}</p>
            </div>

            {/* Progress bar */}
            <div className="w-24 h-1 bg-dark-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary-500 rounded-full"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.05 }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="p-1.5 rounded-lg hover:bg-dark-700/50 text-dark-300 transition-colors"
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>
              <button
                onClick={skipStep}
                className="p-1.5 rounded-lg hover:bg-dark-700/50 text-dark-300 transition-colors"
                title="Skip"
              >
                <SkipForward className="w-4 h-4" />
              </button>
              <button
                onClick={stopDemo}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-dark-400 hover:text-red-400 transition-colors"
                title="Stop Demo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step counter */}
            <span className="text-[10px] text-dark-500 ml-1">
              {currentStep + 1}/{DEMO_SEQUENCE.length}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Caption Overlay */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.4 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-40 px-5 py-2.5 rounded-xl
              bg-dark-800/90 backdrop-blur-xl border border-dark-700/50 shadow-lg"
          >
            <p className="text-sm font-medium text-white text-center">{DEMO_SEQUENCE[currentStep].caption}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
