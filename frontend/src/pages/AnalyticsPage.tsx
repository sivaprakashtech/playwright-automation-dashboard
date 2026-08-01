import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import { TrendingUp, Activity, Clock, Target, Zap, AlertTriangle, Users, Bug } from 'lucide-react';
import { analyticsService } from '@/services/analyticsService';
import { executionService } from '@/services/executionService';
import { format } from 'date-fns';

const COLORS = ['#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const TOOLTIP_STYLE = { backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.4)' };

// Rich demo data
const DEMO_TREND = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - 29 + i);
  return { date: format(d, 'MMM dd'), passed: Math.floor(560 + Math.random() * 100), failed: Math.floor(25 + Math.random() * 35), skipped: Math.floor(5 + Math.random() * 15), success_rate: +(87 + Math.random() * 10).toFixed(1) };
});
const DEMO_WEEKLY = Array.from({ length: 12 }, (_, i) => ({ week: `W${i + 1}`, executions: Math.floor(300 + Math.random() * 400), passed: Math.floor(250 + Math.random() * 350) }));
const DEMO_MONTHLY = [
  { month: 'Jan', executions: 1450 }, { month: 'Feb', executions: 1620 }, { month: 'Mar', executions: 1890 },
  { month: 'Apr', executions: 2100 }, { month: 'May', executions: 1950 }, { month: 'Jun', executions: 2340 },
  { month: 'Jul', executions: 2560 }, { month: 'Aug', executions: 2180 },
];
const DEMO_BROWSER = [{ browser: 'Chromium', count: 12400 }, { browser: 'Firefox', count: 4800 }, { browser: 'WebKit', count: 2800 }];
const DEMO_FAILED_MODULES = [
  { module: 'Checkout', failures: 34 }, { module: 'Authentication', failures: 28 }, { module: 'Payments', failures: 22 },
  { module: 'Cart', failures: 18 }, { module: 'Search', failures: 14 }, { module: 'Profile', failures: 11 },
];
const DEMO_DURATION = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 13 + i); return { date: format(d, 'MMM dd'), duration: +(38 + Math.random() * 55).toFixed(1) }; });
const DEMO_TEAM = [
  { name: 'Rahul S.', executions: 4200, pass_rate: 94.2 }, { name: 'Priya P.', executions: 3800, pass_rate: 92.8 },
  { name: 'Arun K.', executions: 3400, pass_rate: 91.5 }, { name: 'Sneha R.', executions: 2900, pass_rate: 93.7 },
  { name: 'Vikram S.', executions: 2600, pass_rate: 89.4 },
];
const DEMO_FLAKY = [
  { test: 'Checkout timeout on slow network', flaky_rate: 42 }, { test: 'Modal animation race condition', flaky_rate: 35 },
  { test: 'Session restore after refresh', flaky_rate: 28 }, { test: 'File upload progress tracking', flaky_rate: 22 },
  { test: 'WebSocket reconnection', flaky_rate: 18 },
];

export default function AnalyticsPage() {
  const { data: apiStats } = useQuery({ queryKey: ['analytics-stats'], queryFn: analyticsService.getDashboardStats });
  const { data: apiTrend } = useQuery({ queryKey: ['analytics-trend'], queryFn: () => analyticsService.getTrend(30) });
  const { data: apiExecStats } = useQuery({ queryKey: ['exec-stats'], queryFn: executionService.getStats });

  const stats = apiStats && apiStats.total_projects > 0 ? apiStats : { total_projects: 150, total_test_cases: 5000, total_executions: 20000, passed: 18340, failed: 1320, skipped: 340, running: 18, success_rate: 91.7 };
  const trend = apiTrend && apiTrend.length > 0 ? apiTrend : DEMO_TREND;
  const execStats = apiExecStats || { total_executions: 20000, avg_duration: 52.3, total_tests: 20000, queued: 5, running: 18, completed: 19800, passed: 18340, failed: 1320, skipped: 340, success_rate: 91.7 };

  const kpis = [
    { label: 'Total Executions', value: execStats.total_executions.toLocaleString(), icon: Activity, gradient: 'from-primary-500 to-primary-600' },
    { label: 'Success Rate', value: `${stats.success_rate}%`, icon: TrendingUp, gradient: 'from-emerald-500 to-emerald-600' },
    { label: 'Avg Duration', value: `${execStats.avg_duration}s`, icon: Clock, gradient: 'from-amber-500 to-amber-600' },
    { label: 'Tests Run', value: execStats.total_tests.toLocaleString(), icon: Target, gradient: 'from-blue-500 to-blue-600' },
    { label: 'Active Runs', value: execStats.running, icon: Zap, gradient: 'from-cyan-500 to-cyan-600' },
    { label: 'Failures', value: stats.failed.toLocaleString(), icon: AlertTriangle, gradient: 'from-red-500 to-red-600' },
    { label: 'Team Size', value: '20', icon: Users, gradient: 'from-purple-500 to-purple-600' },
    { label: 'Flaky Tests', value: '12', icon: Bug, gradient: 'from-pink-500 to-pink-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-sm text-dark-400 mt-0.5">Comprehensive test automation insights</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="stat-card !p-4">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${kpi.gradient} flex items-center justify-center mb-2 shadow-lg`}>
              <kpi.icon className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-lg font-bold text-white">{kpi.value}</p>
            <p className="text-[9px] text-dark-500 mt-0.5">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Row 1: Trend + Browser */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card lg:col-span-2">
          <h3 className="text-sm font-semibold text-white mb-4">Pass / Fail Trend (30 Days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="apGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                <linearGradient id="afGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#e2e8f0' }} />
              <Area type="monotone" dataKey="passed" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#apGrad)" />
              <Area type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#afGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
          <h3 className="text-sm font-semibold text-white mb-4">Browser Usage</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={DEMO_BROWSER} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="count" nameKey="browser" strokeWidth={0}>
                {DEMO_BROWSER.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4">
            {DEMO_BROWSER.map((b, i) => (
              <div key={b.browser} className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} /><span className="text-[10px] text-dark-400">{b.browser}</span></div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Row 2: Weekly + Monthly + Duration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card">
          <h3 className="text-sm font-semibold text-white mb-4">Weekly Executions</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={DEMO_WEEKLY}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="executions" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card">
          <h3 className="text-sm font-semibold text-white mb-4">Monthly Volume</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={DEMO_MONTHLY}>
              <defs><linearGradient id="mGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="executions" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#mGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="card">
          <h3 className="text-sm font-semibold text-white mb-4">Avg Duration</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={DEMO_DURATION}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 8 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} unit="s" />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="duration" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Row 3: Top Failed Modules + Team Performance + Flaky Tests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card">
          <h3 className="text-sm font-semibold text-white mb-4">Top Failed Modules</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={DEMO_FAILED_MODULES} layout="vertical" margin={{ left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="module" type="category" tick={{ fill: '#94a3b8', fontSize: 10 }} width={85} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="failures" fill="#ef4444" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="card">
          <h3 className="text-sm font-semibold text-white mb-4">Team Performance</h3>
          <div className="space-y-3">
            {DEMO_TEAM.map((member, i) => (
              <div key={member.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500/20 to-blue-500/20 flex items-center justify-center text-[10px] font-bold text-primary-400">{i + 1}</div>
                  <div>
                    <p className="text-xs font-medium text-dark-200">{member.name}</p>
                    <p className="text-[9px] text-dark-500">{member.executions.toLocaleString()} runs</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-400">{member.pass_rate}%</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-semibold text-white">Flaky Tests</h3>
            <Bug className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="space-y-3">
            {DEMO_FLAKY.map((test) => (
              <div key={test.test} className="flex items-center justify-between gap-3">
                <p className="text-[11px] text-dark-300 truncate flex-1">{test.test}</p>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-16 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${test.flaky_rate}%` }} />
                  </div>
                  <span className="text-[10px] text-amber-400 font-medium w-8 text-right">{test.flaky_rate}%</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
