import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  CheckCircle2, XCircle, SkipForward, Clock, AlertTriangle, ArrowLeft,
  Download, Terminal, Image, Video, RefreshCw, ChevronDown, ChevronRight,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';
import { executionService } from '@/services/executionService';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const RESULT_COLORS = { passed: '#10b981', failed: '#ef4444', skipped: '#f59e0b' };

export default function ExecutionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'results' | 'logs' | 'failures'>('results');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [expandedResults, setExpandedResults] = useState<Set<number>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['execution', id],
    queryFn: () => executionService.getById(Number(id)),
    refetchInterval: (query) =>
      query.state.data?.execution?.status === 'running' ? 3000 : false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-60">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-500" />
      </div>
    );
  }

  const execution = data?.execution;
  const results = data?.results || [];
  const failures = results.filter((r) => r.status === 'failed');
  const filteredResults = statusFilter ? results.filter((r) => r.status === statusFilter) : results;

  const pieData = [
    { name: 'Passed', value: execution?.passed || 0, color: RESULT_COLORS.passed },
    { name: 'Failed', value: execution?.failed || 0, color: RESULT_COLORS.failed },
    { name: 'Skipped', value: execution?.skipped || 0, color: RESULT_COLORS.skipped },
  ].filter((d) => d.value > 0);

  const toggleExpand = (id: number) => {
    const next = new Set(expandedResults);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedResults(next);
  };

  const handleExport = async (formatType: string) => {
    try {
      const response = await api.get(`/reports/export/${id}`, { params: { format: formatType }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `execution_${id}_report.${formatType}`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`${formatType.toUpperCase()} report downloaded`);
    } catch {
      toast.error('Export failed');
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'skipped': return <SkipForward className="w-4 h-4 text-amber-400" />;
      default: return <Clock className="w-4 h-4 text-dark-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/executions')} className="p-2 rounded-lg hover:bg-dark-800 text-dark-400">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-dark-100">{execution?.name}</h1>
          <div className="flex items-center gap-3 mt-1 text-xs text-dark-400">
            <span>{execution?.browser}</span>
            <span>•</span>
            <span>{execution?.environment}</span>
            <span>•</span>
            <span>{execution?.triggered_by_name}</span>
            <span>•</span>
            <span>{execution?.started_at ? format(new Date(execution.started_at), 'MMM d, yyyy HH:mm') : '—'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleExport('json')} className="btn-secondary text-xs flex items-center gap-1">
            <Download className="w-3.5 h-3.5" /> JSON
          </button>
          <button onClick={() => handleExport('csv')} className="btn-secondary text-xs flex items-center gap-1">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          {execution?.status === 'running' && (
            <span className="flex items-center gap-1.5 badge-running">
              <RefreshCw className="w-3 h-3 animate-spin" /> Running
            </span>
          )}
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {/* Mini Pie Chart */}
        <div className="card !p-4 md:col-span-2 flex items-center gap-4">
          <ResponsiveContainer width={80} height={80}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={22} outerRadius={36} dataKey="value" strokeWidth={0}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div>
            <p className="text-2xl font-bold text-dark-100">{execution?.success_rate}%</p>
            <p className="text-xs text-dark-400">Pass Rate</p>
            <p className="text-xs text-dark-500 mt-1">{execution?.duration}s total duration</p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="card !p-4 text-center">
          <p className="text-2xl font-bold text-dark-100">{execution?.total_tests}</p>
          <p className="text-xs text-dark-400">Total</p>
        </div>
        <div className="card !p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{execution?.passed}</p>
          <p className="text-xs text-dark-400">Passed</p>
        </div>
        <div className="card !p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{execution?.failed}</p>
          <p className="text-xs text-dark-400">Failed</p>
        </div>
        <div className="card !p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{execution?.skipped}</p>
          <p className="text-xs text-dark-400">Skipped</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-dark-700 pb-0">
        {[
          { key: 'results', label: 'Test Results', count: results.length },
          { key: 'failures', label: 'Failure Analysis', count: failures.length },
          { key: 'logs', label: 'Execution Log', count: null },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'text-primary-400 border-primary-500'
                : 'text-dark-400 border-transparent hover:text-dark-200'
            }`}
          >
            {tab.label} {tab.count !== null && <span className="ml-1 text-xs text-dark-500">({tab.count})</span>}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'results' && (
        <div className="space-y-3">
          {/* Filter */}
          <div className="flex gap-2">
            {['', 'passed', 'failed', 'skipped'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`text-xs px-3 py-1.5 rounded-lg ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-dark-800 text-dark-300 hover:bg-dark-700'}`}
              >
                {s || 'All'} {s && `(${results.filter((r) => r.status === s).length})`}
              </button>
            ))}
          </div>

          <div className="card !p-0 overflow-hidden">
            <div className="divide-y divide-dark-700">
              {filteredResults.map((result, index) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.015 }}
                  className="hover:bg-dark-800/30"
                >
                  <div
                    className="px-5 py-3 flex items-center justify-between cursor-pointer"
                    onClick={() => result.status === 'failed' && toggleExpand(result.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {result.status === 'failed' && (
                        expandedResults.has(result.id) ? <ChevronDown className="w-3.5 h-3.5 text-dark-500 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-dark-500 shrink-0" />
                      )}
                      {statusIcon(result.status)}
                      <p className="text-sm text-dark-100 truncate">{result.test_name}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-dark-500">{result.duration}s</span>
                      {result.retry_count > 0 && <span className="text-[10px] text-amber-400">retry:{result.retry_count}</span>}
                      <span className={`badge-${result.status === 'passed' ? 'passed' : result.status === 'failed' ? 'failed' : 'skipped'}`}>{result.status}</span>
                    </div>
                  </div>

                  {/* Expanded failure details */}
                  {result.status === 'failed' && expandedResults.has(result.id) && (
                    <div className="px-5 pb-4 ml-10">
                      <div className="p-3 bg-dark-900 rounded-lg border border-red-500/20 space-y-3">
                        {result.error_message && (
                          <div>
                            <p className="text-xs font-medium text-red-400 mb-1">Error Message</p>
                            <p className="text-xs text-dark-300 font-mono">{result.error_message}</p>
                          </div>
                        )}
                        {result.stack_trace && (
                          <div>
                            <p className="text-xs font-medium text-dark-400 mb-1">Stack Trace</p>
                            <pre className="text-xs text-dark-500 font-mono overflow-x-auto whitespace-pre-wrap">{result.stack_trace}</pre>
                          </div>
                        )}
                        {result.suggested_cause && (
                          <div className="p-2 bg-amber-500/5 border border-amber-500/20 rounded">
                            <p className="text-xs text-amber-400">💡 <span className="font-medium">Suggested Fix:</span> {result.suggested_cause}</p>
                          </div>
                        )}
                        <div className="flex gap-2">
                          {result.screenshot_path && (
                            <span className="text-[10px] text-dark-500 flex items-center gap-1"><Image className="w-3 h-3" /> Screenshot attached</span>
                          )}
                          {result.video_path && (
                            <span className="text-[10px] text-dark-500 flex items-center gap-1"><Video className="w-3 h-3" /> Video attached</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'failures' && (
        <div className="space-y-4">
          {failures.length === 0 ? (
            <div className="card text-center py-12">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <p className="text-dark-300">No failures in this execution</p>
            </div>
          ) : (
            failures.map((result, index) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card border-red-500/20"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <h4 className="font-medium text-dark-100">{result.test_name}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-dark-500">{result.duration}s</span>
                    <span className="badge-failed">FAILED</span>
                  </div>
                </div>

                {/* Error */}
                <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg mb-3">
                  <p className="text-xs font-medium text-red-400 mb-1">Error</p>
                  <p className="text-sm text-dark-200 font-mono">{result.error_message}</p>
                </div>

                {/* Stack trace */}
                {result.stack_trace && (
                  <div className="p-3 bg-dark-900 rounded-lg mb-3">
                    <p className="text-xs font-medium text-dark-400 mb-2">Stack Trace</p>
                    <pre className="text-xs text-dark-400 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">{result.stack_trace}</pre>
                  </div>
                )}

                {/* Suggested cause */}
                {result.suggested_cause && (
                  <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-amber-400 mb-0.5">Root Cause Analysis</p>
                      <p className="text-sm text-dark-300">{result.suggested_cause}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="card !p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-dark-900 border-b border-dark-700">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-dark-100">Execution Log</span>
            </div>
            <span className="text-xs text-dark-500">
              {execution?.started_at ? format(new Date(execution.started_at), 'HH:mm:ss') : ''} — {execution?.completed_at ? format(new Date(execution.completed_at), 'HH:mm:ss') : 'running'}
            </span>
          </div>
          <div className="p-4 bg-dark-950 font-mono text-xs leading-relaxed max-h-[500px] overflow-y-auto">
            <p className="text-emerald-400">[{execution?.started_at ? format(new Date(execution.started_at), 'HH:mm:ss') : ''}] Starting execution...</p>
            <p className="text-dark-400">[INFO] Browser: {execution?.browser} (headless: {execution?.headless ? 'yes' : 'no'})</p>
            <p className="text-dark-400">[INFO] Environment: {execution?.environment}</p>
            <p className="text-dark-400">[INFO] Workers: {execution?.parallel_workers} | Timeout: {execution?.timeout}ms | Retries: {execution?.retries}</p>
            <p className="text-dark-500">───────────────────────────────────────</p>
            {results.map((r, i) => (
              <p key={i} className={r.status === 'passed' ? 'text-emerald-400' : r.status === 'failed' ? 'text-red-400' : 'text-amber-400'}>
                [{r.status === 'passed' ? '✓' : r.status === 'failed' ? '✗' : '○'}] {r.test_name} ({r.duration}s)
                {r.status === 'failed' && r.error_message && <span className="text-red-300 ml-2">— {r.error_message}</span>}
              </p>
            ))}
            <p className="text-dark-500">───────────────────────────────────────</p>
            <p className="text-dark-300">[SUMMARY] {execution?.total_tests} tests | {execution?.passed} passed | {execution?.failed} failed | {execution?.skipped} skipped</p>
            <p className="text-dark-300">[SUMMARY] Duration: {execution?.duration}s | Pass rate: {execution?.success_rate}%</p>
            <p className={execution?.failed === 0 ? 'text-emerald-400' : 'text-red-400'}>
              [{execution?.completed_at ? format(new Date(execution.completed_at), 'HH:mm:ss') : ''}] Execution {execution?.status}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
