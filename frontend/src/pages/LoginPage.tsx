import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap, Eye, EyeOff, TestTubes, BarChart3, Image, Video,
  Calendar, Users, FileText, Shield, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

const features = [
  { icon: TestTubes, label: 'Test Automation', desc: 'Playwright-powered execution' },
  { icon: BarChart3, label: 'Real-Time Analytics', desc: 'Live dashboards & trends' },
  { icon: FileText, label: 'Smart Reports', desc: 'PDF, CSV, HTML exports' },
  { icon: Image, label: 'Screenshot Capture', desc: 'Automatic failure evidence' },
  { icon: Video, label: 'Video Recording', desc: 'Full session playback' },
  { icon: Calendar, label: 'Scheduling', desc: 'Cron-based automation' },
  { icon: Users, label: 'Team Collaboration', desc: 'Role-based access control' },
  { icon: Shield, label: 'Enterprise Security', desc: 'JWT + RBAC + audit logs' },
];

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please enter username and password');
      return;
    }
    try {
      await login(username, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch {
      toast.error('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-dark-950">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-950/50 via-dark-950 to-blue-950/30" />
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, 15, 0], y: [0, 15, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/2 right-1/3 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl"
        />
      </div>

      {/* Left Side — Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-blue-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Playwright Dashboard</h1>
              <p className="text-xs text-dark-400">Enterprise QA Platform</p>
            </div>
          </div>

          {/* Login Card */}
          <div className="glass p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">Welcome back</h2>
              <p className="text-dark-400 text-sm mt-1">Sign in to your automation workspace</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field"
                  placeholder="Enter your username"
                  autoComplete="username"
                  aria-label="Username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pr-11"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    aria-label="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="btn-primary w-full !py-3 text-sm">
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Authenticating...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>

            {/* Quick Access */}
            <div className="mt-6 pt-5 border-t border-white/10">
              <p className="text-[11px] text-dark-500 text-center mb-3 uppercase tracking-wider">Quick Access</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setUsername('admin'); setPassword('1231231234'); }}
                  className="text-left p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                >
                  <p className="text-xs font-medium text-dark-200">Admin</p>
                  <p className="text-[10px] text-dark-500">Full access</p>
                </button>
                <button
                  onClick={() => { setUsername('qa_engineer'); setPassword('1231231234'); }}
                  className="text-left p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                >
                  <p className="text-xs font-medium text-dark-200">QA Engineer</p>
                  <p className="text-[10px] text-dark-500">Standard access</p>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-[11px] text-dark-600">v1.0.0 • © 2024 Playwright Dashboard • Enterprise Edition</p>
          </div>
        </motion.div>
      </div>

      {/* Right Side — Features Showcase */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-lg"
        >
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-3">
              Enterprise Test
              <span className="gradient-text"> Automation</span>
            </h2>
            <p className="text-dark-400 text-sm leading-relaxed">
              Manage, execute, and analyze your Playwright test suites with
              real-time dashboards, intelligent failure analysis, and team collaboration.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.08 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
              >
                <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center shrink-0">
                  <feature.icon className="w-4 h-4 text-primary-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-dark-200">{feature.label}</p>
                  <p className="text-[10px] text-dark-500">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-8 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-dark-300">20,000+ Tests Run</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-dark-300">91.7% Pass Rate</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-dark-300">3 Browsers</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
