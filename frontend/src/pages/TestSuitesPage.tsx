import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Search, Pencil, Trash2, TestTubes } from 'lucide-react';
import api from '@/services/api';
import { generateTestSuites } from '@/data/demo';
import { TestSuite } from '@/types';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';

const DEMO_SUITES = generateTestSuites(40);

export default function TestSuitesPage() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editSuite, setEditSuite] = useState<TestSuite | null>(null);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['test-suites', search],
    queryFn: async () => { const res = await api.get('/test-suites', { params: { search } }); return res.data; },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/test-suites/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['test-suites'] }); toast.success('Suite deleted'); },
  });

  const suites = (data?.test_suites && data.test_suites.length > 0) ? data.test_suites : DEMO_SUITES;
  const filtered = search ? suites.filter((s: TestSuite) => s.name.toLowerCase().includes(search.toLowerCase())) : suites;

  const typeColor: Record<string, string> = {
    smoke: 'text-orange-400 bg-orange-500/10', regression: 'text-blue-400 bg-blue-500/10',
    sanity: 'text-emerald-400 bg-emerald-500/10', api: 'text-purple-400 bg-purple-500/10',
    ui: 'text-cyan-400 bg-cyan-500/10', performance: 'text-amber-400 bg-amber-500/10',
    security: 'text-red-400 bg-red-500/10', integration: 'text-indigo-400 bg-indigo-500/10',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Test Suites</h1>
          <p className="text-sm text-dark-400 mt-0.5">{filtered.length} suites across all projects</p>
        </div>
        <button onClick={() => { setEditSuite(null); setShowModal(true); }} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> New Suite
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" placeholder="Search suites..." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((suite: TestSuite, index: number) => (
          <motion.div key={suite.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="card-hover">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center">
                  <TestTubes className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">{suite.name}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${typeColor[suite.suite_type] || 'text-dark-400 bg-dark-700/50'}`}>{suite.suite_type}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditSuite(suite); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-dark-700/50 text-dark-500"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => deleteMutation.mutate(suite.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-dark-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <p className="text-xs text-dark-400 mt-3 line-clamp-2">{suite.description || 'No description'}</p>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-dark-700/50">
              <span className="text-[11px] text-dark-500"><strong className="text-dark-300">{suite.test_cases_count}</strong> cases</span>
              {suite.tags?.slice(0, 2).map((tag: string) => (
                <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-primary-500/10 text-primary-400">{tag}</span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {showModal && <SuiteModal suite={editSuite} onClose={() => setShowModal(false)} />}
    </div>
  );
}

function SuiteModal({ suite, onClose }: { suite: TestSuite | null; onClose: () => void }) {
  const [form, setForm] = useState({ name: suite?.name || '', description: suite?.description || '', suite_type: suite?.suite_type || 'regression', priority: suite?.priority || 'medium', project_id: suite?.project_id || 1, tags: suite?.tags?.join(', ') || '' });
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => suite ? api.put(`/test-suites/${suite.id}`, data) : api.post('/test-suites', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['test-suites'] }); toast.success(suite ? 'Updated' : 'Created'); onClose(); },
  });
  return (
    <Modal title={suite ? 'Edit Suite' : 'New Suite'} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate({ ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) }); }} className="space-y-4">
        <div><label className="block text-sm font-medium text-dark-300 mb-1.5">Name</label><input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
        <div><label className="block text-sm font-medium text-dark-300 mb-1.5">Description</label><textarea className="input-field" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-dark-300 mb-1.5">Type</label><select className="input-field" value={form.suite_type} onChange={(e) => setForm({ ...form, suite_type: e.target.value })}><option value="smoke">Smoke</option><option value="regression">Regression</option><option value="sanity">Sanity</option><option value="api">API</option><option value="ui">UI</option><option value="performance">Performance</option><option value="security">Security</option></select></div>
          <div><label className="block text-sm font-medium text-dark-300 mb-1.5">Priority</label><select className="input-field" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></div>
        </div>
        <div><label className="block text-sm font-medium text-dark-300 mb-1.5">Tags</label><input className="input-field" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="smoke, regression" /></div>
        <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button><button type="submit" className="btn-primary text-sm" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : suite ? 'Update' : 'Create'}</button></div>
      </form>
    </Modal>
  );
}
