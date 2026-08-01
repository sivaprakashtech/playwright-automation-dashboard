import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Square, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { executionService } from '@/services/executionService';
import { generateExecutions } from '@/data/demo';
import { Execution } from '@/types';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';

const DEMO_EXECUTIONS = generateExecutions(30);

export default function ExecutionsPage() {
  const [showRunModal, setShowRunModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['executions', statusFilter],
    queryFn: () => executionService.getAll({ status: statusFilter }),
    refetchInterval: 5000,
  });

  const cancelMutation = useMutation({
    mutationFn: executionService.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executions'] });
      toast.success('Execution cancelled');
    },
  });

  const executions = (data?.data && data.data.length > 0) ? data.data : DEMO_EXECUTIONS as unknown as Execution[];
  const filtered = statusFilter ? executions.filter(e => e.status === statusFilter) : executions;

  const statusIcon = (status: string) => {
    const map: Record<string, JSX.Element> = {
      completed: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
      failed: <XCircle className="w-4 h-4 text-red-400" />,
      running: <Play className="w-4 h-4 text-blue-400 animate-pulse" />,
      queued: <Clock className="w-4 h-4 text-amber-400" />,
      cancelled: <Square className="w-4 h-4 text-dark-500" />,
    };
    return map[status] || <Clock className="w-4 h-4 text-dark-400" />;
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      completed: 'badge-passed', failed: 'badge-failed',
      running: 'badge-running', queued: 'badge-skipped',
      cancelled: 'bg-dark-700/50 text-dark-400 px-2.5 py-0.5 rounded-full text-xs font-medium',
    };
    return map[status] || '';
  };

  const counts = {
    all: executions.length,
    running: executions.filter(e => e.status === 'running').length,
    completed: executions.filter(e => e.status === 'completed').length,
    failed: executions.filter(e => e.status === 'failed').length,
    queued: executions.filter(e => e.status === 'queued').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Execution Center</h1>
          <p className="text-sm text-dark-400 mt-0.5">{counts.all} executions • {counts.running} running</p>
        </div>
        <button onClick={() => setShowRunModal(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Play className="w-4 h-4" /> Run Tests
        </button>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: '', label: 'All', count: counts.all },
          { key: 'running', label: 'Running', count: counts.running },
          { key: 'completed', label: 'Passed', count: counts.completed },
          { key: 'failed', label: 'Failed', count: counts.failed },
          { key: 'queued', label: 'Queued', count: counts.queued },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`text-xs px-3.5 py-1.5 rounded-full transition-all ${
              statusFilter === f.key
                ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                : 'bg-dark-800/50 text-dark-400 border border-dark-700/50 hover:border-dark-600'
            }`}
          >
            {f.label} <span className="ml-1 opacity-60">{f.count}</span>
          </button>
        ))}
      </div>

      {/* Executions List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card animate-pulse"><div className="h-12 bg-dark-700 rounded" /></div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((exec, index) => (
            <motion.div
              key={exec.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className="card !p-4 flex items-center justify-between hover:border-primary-500/20 transition-all cursor-pointer"
              onClick={() => navigate(`/executions/${exec.id}`)}
            >
              <div className="flex items-center gap-4 min-w-0">
                {statusIcon(exec.status)}
                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-white truncate">{exec.name}</h3>
                  <p className="text-[11px] text-dark-500">{exec.browser} • {exec.environment} • {exec.triggered_by_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-5 shrink-0">
                <div className="text-right hidden md:block">
                  <div className="flex gap-2.5 text-[11px]">
                    <span className="text-emerald-400">{exec.passed}P</span>
                    <span className="text-red-400">{exec.failed}F</span>
                    <span className="text-amber-400">{exec.skipped}S</span>
                  </div>
                  <p className="text-[10px] text-dark-500 mt-0.5">{exec.duration}s</p>
                </div>
                <span className={statusBadge(exec.status)}>{exec.status}</span>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  {(exec.status === 'running' || exec.status === 'queued') && (
                    <button onClick={() => cancelMutation.mutate(exec.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-dark-500 hover:text-red-400" title="Cancel">
                      <Square className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showRunModal && <RunExecutionModal onClose={() => setShowRunModal(false)} />}
    </div>
  );
}

function RunExecutionModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ project_id: 1, execution_type: 'suite', browser: 'chromium', environment: 'development', headless: true, parallel_workers: 1 });
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: executionService.run,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['executions'] }); toast.success('Execution started'); onClose(); },
    onError: () => toast.error('Failed to start execution'),
  });

  return (
    <Modal title="Run Test Execution" onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Type</label>
            <select className="input-field" value={form.execution_type} onChange={(e) => setForm({ ...form, execution_type: e.target.value })}>
              <option value="single">Single Test</option><option value="suite">Test Suite</option><option value="project">Full Project</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Browser</label>
            <select className="input-field" value={form.browser} onChange={(e) => setForm({ ...form, browser: e.target.value })}>
              <option value="chromium">Chromium</option><option value="firefox">Firefox</option><option value="webkit">WebKit</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Environment</label>
            <select className="input-field" value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value })}>
              <option value="development">Development</option><option value="qa">QA</option><option value="staging">Staging</option><option value="production">Production</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Workers</label>
            <input type="number" min={1} max={10} className="input-field" value={form.parallel_workers} onChange={(e) => setForm({ ...form, parallel_workers: Number(e.target.value) })} />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
          <button type="submit" className="btn-primary text-sm flex items-center gap-2" disabled={mutation.isPending}>
            <Play className="w-3.5 h-3.5" /> {mutation.isPending ? 'Starting...' : 'Execute'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
