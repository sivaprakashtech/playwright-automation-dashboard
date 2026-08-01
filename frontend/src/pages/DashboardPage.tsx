import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban, FileText, CheckCircle2, XCircle, SkipForward,
  Play, TrendingUp, Clock, Activity, Zap,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, RadialBarChart, RadialBar,
} from 'recharts';
import { analyticsService } from '@/services/analyticsService';
import { Execution } from '@/types';
import { format } from 'date-fns';

const CHART_COLORS = ['#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

// Enterprise demo data — always shown regardless of API
const DEMO_STATS = {
  total_projects: 150,
  total_test_cases: 5000,
  total_executions: 20000,
  passed: 18340,
  failed: 1320,
  skipped: 340,
  running: 18,
  success_rate: 91.7,
};

const DEMO_TREND = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - 29 + i);
  return {
    date: format(d, 'MMM dd'),
    passed: Math.floor(580 + Math.random() * 80),
    failed: Math.floor(30 + Math.random() * 30),
    skipped: Math.floor(8 + Math.random() * 12),
    success_rate: +(88 + Math.random() * 8).toFixed(1),
  };
});

const DEMO_BROWSER = [
  { browser: 'Chromium', count: 12400 },
  { browser: 'Firefox', count: 4800 },
  { browser: 'WebKit', count: 2800 },
];

const DEMO_DURATION = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - 13 + i);
  return { date: format(d, 'MMM dd'), duration: +(40 + Math.random() * 50).toFixed(1) };
});

const DEMO_RECENT: Execution[] = [
  { id: 1, name: 'E-Commerce Regression', status: 'running', browser: 'chromium', environment: 'staging', total_tests: 245, passed: 180, failed: 3, skipped: 2, duration: 42.5, success_rate: 97.3, created_at: new Date().toISOString() } as Execution,
  { id: 2, name: 'API Gateway Smoke', status: 'completed', browser: 'chromium', environment: 'qa', total_tests: 89, passed: 87, failed: 2, skipped: 0, duration: 18.2, success_rate: 97.8, created_at: new Date(Date.now() - 3600000).toISOString() } as Execution,
  { id: 3, name: 'Dashboard UI Tests', status: 'completed', browser: 'firefox', environment: 'development', total_tests: 156, passed: 148, failed: 5, skipped: 3, duration: 67.8, success_rate: 94.9, created_at: new Date(Date.now() - 7200000).toISOString() } as Execution,
  { id: 4, name: 'Auth Flow Sanity', status: 'failed', browser: 'webkit', environment: 'production', total_tests: 32, passed: 28, failed: 4, skipped: 0, duration: 12.1, success_rate: 87.5, created_at: new Date(Date.now() - 10800000).toISOString() } as Execution,
  { id: 5, name: 'Payment Integration', status: 'completed', browser: 'chromium', environment: 'staging', total_tests: 67, passed: 65, failed: 1, skipped: 1, duration: 34.6, success_rate: 97.0, created_at: new Date(Date.now() - 14400000).toISOString() } as Execution,
];

export default function DashboardPage() {
  const navigate = useNavigate();

  const { data: apiStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: analyticsService.getDashboardStats,
    refetchInterval: 15000,
  });

  const { data: apiTrend } = useQuery({
    queryKey: ['execution-trend'],
    queryFn: () => analyticsService.getTrend(30),
  });

  // Use API data if available, otherwise fall back to demo
  const stats = (apiStats && apiStats.total_projects > 0) ? apiStats : DEMO_STATS;
  const trend = (apiTrend && apiTrend.length > 0) ? apiTrend : DEMO_TREND;
  const browserDist = DEMO_BROWSER;
  const execTimes = DEMO_DURATION;
  const recentExec = DEMO_RECENT;

  const cards = [
    { label: 'Projects', value: stats.total_projects, icon: FolderKanban, color: 'from-primary-500 to-primary-600', textColor: 'text-primary-400' },
    { label: 'Test Cases', value: stats.total_test_cases.toLocaleString(), icon: FileText, color: 'from-blue-500 to-blue-600', textColor: 'text-blue-400' },
    { label: 'Passed', value: stats.passed.toLocaleString(), icon: CheckCircle2, color: 'from-emerald-500 to-emerald-600', textColor: 'text-emerald-400' },
    { label: 'Failed', value: stats.failed.toLocaleString(), icon: XCircle, color: 'from-red-500 to-red-600', textColor: 'text-red-400' },
    { label: 'Skipped', value: stats.skipped, icon: SkipForward, color: 'from-amber-500 to-amber-600', textColor: 'text-amber-400' },
    { label: 'Running', value: stats.running, icon: Play, color: 'from-cyan-500 to-cyan-600', textColor: 'text-cyan-400' },
    { label: 'Pass Rate', value: `${stats.success_rate}%`, icon: TrendingUp, color: 'from-emerald-500 to-teal-600', textColor: 'text-emerald-400' },
  ];

  const coverageData = [{ name: 'Pass Rate', value: stats.success_rate, fill: '#6366f1' }];

  const statusIcon = (status: string) => {
    const map: Record<string, JSX.Element> = {
      running: <Play className="w-3.5 h-3.5 text-blue-400 animate-pulse" />,
      completed: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
      failed: <XCircle className="w-3.5 h-3.5 text-red-400" />,
      queued: <Clock className="w-3.5 h-3.5 text-amber-400" />,
    };
    return map[status] || <Clock className="w-3.5 h-3.5 text-dark-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-dark-400 mt-0.5">Real-time test automation overview</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-emerald-400">Live</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {cards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="stat-card"
          >
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3 shadow-lg`}>
              <card.icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-xl font-bold text-white">{card.value}</p>
            <p className="text-[11px] text-dark-400 mt-0.5">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Pass/Fail Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-white">Execution Trend</h3>
              <p className="text-[11px] text-dark-500 mt-0.5">Last 30 days</p>
            </div>
            <Activity className="w-4 h-4 text-primary-400" />
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="passGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="failGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.4)' }} labelStyle={{ color: '#e2e8f0' }} />
              <Area type="monotone" dataKey="passed" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#passGrad)" />
              <Area type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#failGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Coverage Radial */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card flex flex-col items-center justify-center">
          <h3 className="text-sm font-semibold text-white mb-2">Test Coverage</h3>
          <ResponsiveContainer width="100%" height={160}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="95%" data={coverageData} startAngle={180} endAngle={0}>
              <RadialBar dataKey="value" cornerRadius={10} fill="#6366f1" background={{ fill: '#1e293b' }} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="text-center -mt-6">
            <p className="text-3xl font-bold gradient-text">{stats.success_rate}%</p>
            <p className="text-[11px] text-dark-500 mt-1">Overall Pass Rate</p>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-5 w-full text-center">
            <div><p className="text-sm font-bold text-emerald-400">{(stats.passed / 1000).toFixed(1)}k</p><p className="text-[10px] text-dark-500">Passed</p></div>
            <div><p className="text-sm font-bold text-red-400">{(stats.failed / 1000).toFixed(1)}k</p><p className="text-[10px] text-dark-500">Failed</p></div>
            <div><p className="text-sm font-bold text-amber-400">{stats.skipped}</p><p className="text-[10px] text-dark-500">Skipped</p></div>
          </div>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Browser Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card">
          <h3 className="text-sm font-semibold text-white mb-4">Browser Usage</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={browserDist} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="count" nameKey="browser" strokeWidth={0}>
                {browserDist.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {browserDist.map((b, i) => (
              <div key={b.browser} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />
                <span className="text-[10px] text-dark-400">{b.browser}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Duration */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Avg Duration</h3>
            <span className="text-[10px] text-dark-500 flex items-center gap-1"><Clock className="w-3 h-3" /> ~52s</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={execTimes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} unit="s" />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} />
              <Bar dataKey="duration" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Recent Runs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Recent Runs</h3>
            <Zap className="w-4 h-4 text-primary-400" />
          </div>
          <div className="space-y-2 max-h-[220px] overflow-y-auto">
            {recentExec.map((exec) => (
              <div
                key={exec.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-dark-900/50 hover:bg-dark-900 cursor-pointer transition-all border border-transparent hover:border-dark-700/50"
                onClick={() => navigate(`/executions/${exec.id}`)}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {statusIcon(exec.status)}
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-dark-200 truncate">{exec.name}</p>
                    <p className="text-[9px] text-dark-500">{exec.browser} • {exec.environment}</p>
                  </div>
                </div>
                <span className={`badge-${exec.status === 'completed' ? 'passed' : exec.status}`}>{exec.status}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
