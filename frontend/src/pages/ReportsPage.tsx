import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FileText, Download, FileJson, FileSpreadsheet, File, Search, Globe, Eye, BarChart3, Clock, CheckCircle2 } from 'lucide-react';
import api from '@/services/api';
import { format } from 'date-fns';

const NAMES = ['Rahul Sharma', 'Priya Patel', 'Arun Kumar', 'Sneha Reddy', 'Vikram Singh', 'Ananya Das'];
const REPORT_TYPES = ['Regression', 'Smoke', 'Performance', 'Security', 'Coverage', 'Daily', 'Weekly', 'Monthly', 'API Health', 'Cross-Browser'];
const ENVS = ['Production', 'Staging', 'QA', 'Development'];
const rand = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

function generateDemoReports(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const ext = rand(['json', 'csv', 'html', 'pdf']);
    const type = rand(REPORT_TYPES);
    const d = new Date(); d.setDate(d.getDate() - randInt(0, 60)); d.setHours(randInt(6, 22));
    return {
      id: i + 1,
      filename: `${type.toLowerCase().replace(/\s/g, '_')}_report_${randInt(1000, 9999)}.${ext}`,
      format: ext,
      report_type: type,
      size: randInt(12000, 2500000),
      generated_by: rand(NAMES),
      environment: rand(ENVS),
      execution_count: randInt(20, 400),
      status: rand(['completed', 'completed', 'completed', 'processing']),
      created_at: d.toISOString(),
    };
  });
}

const DEMO_REPORTS = generateDemoReports(30);

const STATS = [
  { label: 'Total Reports', value: '3,240', icon: FileText, gradient: 'from-primary-500 to-primary-600' },
  { label: 'This Week', value: '47', icon: Clock, gradient: 'from-blue-500 to-blue-600' },
  { label: 'Avg Size', value: '1.2 MB', icon: BarChart3, gradient: 'from-amber-500 to-amber-600' },
  { label: 'Auto-Generated', value: '89%', icon: CheckCircle2, gradient: 'from-emerald-500 to-emerald-600' },
];

export default function ReportsPage() {
  const [search, setSearch] = useState('');
  const [formatFilter, setFormatFilter] = useState('');

  const { data: apiReports } = useQuery({
    queryKey: ['reports-history'],
    queryFn: async () => { const res = await api.get('/reports/history'); return res.data.reports; },
  });

  const reports = (apiReports && apiReports.length > 0) ? apiReports : DEMO_REPORTS;
  const filtered = reports.filter((r: { filename: string; format?: string }) => {
    const matchSearch = r.filename.toLowerCase().includes(search.toLowerCase());
    const matchFormat = !formatFilter || r.format === formatFilter || r.filename.endsWith(`.${formatFilter}`);
    return matchSearch && matchFormat;
  });

  const formatSize = (bytes: number) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  const getIcon = (ext: string) => {
    if (ext === 'json') return <FileJson className="w-4 h-4 text-blue-400" />;
    if (ext === 'csv') return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
    if (ext === 'html') return <Globe className="w-4 h-4 text-orange-400" />;
    if (ext === 'pdf') return <FileText className="w-4 h-4 text-red-400" />;
    return <File className="w-4 h-4 text-dark-400" />;
  };

  const formatBadge = (ext: string) => {
    const colors: Record<string, string> = { json: 'text-blue-400 bg-blue-500/10', csv: 'text-emerald-400 bg-emerald-500/10', html: 'text-orange-400 bg-orange-500/10', pdf: 'text-red-400 bg-red-500/10' };
    return colors[ext] || 'text-dark-400 bg-dark-700/50';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <p className="text-sm text-dark-400 mt-0.5">Generated execution reports and exports</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATS.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="stat-card !p-4">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-2 shadow-lg`}>
              <s.icon className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-lg font-bold text-white">{s.value}</p>
            <p className="text-[9px] text-dark-500">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" placeholder="Search reports..." />
        </div>
        <div className="flex gap-2">
          {['', 'pdf', 'csv', 'json', 'html'].map(f => (
            <button key={f} onClick={() => setFormatFilter(f)} className={`text-xs px-3 py-2 rounded-lg transition-all ${formatFilter === f ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30' : 'bg-dark-800/50 text-dark-400 border border-dark-700/50 hover:border-dark-600'}`}>
              {f === '' ? 'All' : f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Table */}
      <div className="card !p-0 overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-dark-700/50">
              <th className="text-left text-[11px] font-semibold text-dark-400 uppercase tracking-wider px-5 py-3">Report</th>
              <th className="text-left text-[11px] font-semibold text-dark-400 uppercase tracking-wider px-5 py-3">Type</th>
              <th className="text-left text-[11px] font-semibold text-dark-400 uppercase tracking-wider px-5 py-3">Format</th>
              <th className="text-left text-[11px] font-semibold text-dark-400 uppercase tracking-wider px-5 py-3">Environment</th>
              <th className="text-left text-[11px] font-semibold text-dark-400 uppercase tracking-wider px-5 py-3">Size</th>
              <th className="text-left text-[11px] font-semibold text-dark-400 uppercase tracking-wider px-5 py-3">Generated</th>
              <th className="text-right text-[11px] font-semibold text-dark-400 uppercase tracking-wider px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-700/30">
            {filtered.map((report: { id?: number; filename: string; format: string; report_type: string; size: number; generated_by: string; environment: string; created_at: string }, index: number) => (
              <motion.tr key={index} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.02 }} className="hover:bg-dark-800/30 transition-colors group">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    {getIcon(report.format)}
                    <div>
                      <p className="text-sm font-medium text-dark-200">{report.filename}</p>
                      <p className="text-[10px] text-dark-500">{report.generated_by}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5"><span className="text-[11px] px-2 py-0.5 rounded-full bg-dark-700/50 text-dark-300">{report.report_type}</span></td>
                <td className="px-5 py-3.5"><span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-semibold ${formatBadge(report.format)}`}>{report.format}</span></td>
                <td className="px-5 py-3.5 text-xs text-dark-400">{report.environment}</td>
                <td className="px-5 py-3.5 text-xs text-dark-400">{formatSize(report.size)}</td>
                <td className="px-5 py-3.5 text-xs text-dark-500">{format(new Date(report.created_at), 'MMM d, HH:mm')}</td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 rounded-lg hover:bg-dark-700/50 text-dark-500 hover:text-primary-400" title="Preview"><Eye className="w-3.5 h-3.5" /></button>
                    <button className="p-1.5 rounded-lg hover:bg-dark-700/50 text-dark-500 hover:text-emerald-400" title="Download"><Download className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
