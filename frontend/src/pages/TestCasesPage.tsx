import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import api from '@/services/api';
import { generateTestCases } from '@/data/demo';
import { TestCase } from '@/types';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';

const DEMO_CASES = generateTestCases(50);

export default function TestCasesPage() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCase, setEditCase] = useState<TestCase | null>(null);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['test-cases', search],
    queryFn: async () => { const res = await api.get('/test-cases', { params: { search } }); return res.data; },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/test-cases/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['test-cases'] }); toast.success('Deleted'); },
  });

  const testCases = (data?.test_cases && data.test_cases.length > 0) ? data.test_cases : DEMO_CASES;
  const filtered = search ? testCases.filter((tc: TestCase) => tc.title.toLowerCase().includes(search.toLowerCase())) : testCases;

  const priorityColor: Record<string, string> = { critical: 'text-red-400 bg-red-500/10', high: 'text-orange-400 bg-orange-500/10', medium: 'text-amber-400 bg-amber-500/10', low: 'text-emerald-400 bg-emerald-500/10' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Test Cases</h1>
          <p className="text-sm text-dark-400 mt-0.5">{filtered.length} test cases</p>
        </div>
        <button onClick={() => { setEditCase(null); setShowModal(true); }} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> New Case
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" placeholder="Search test cases..." />
      </div>

      <div className="card !p-0 overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-dark-700/50">
              <th className="text-left text-[11px] font-semibold text-dark-400 uppercase tracking-wider px-5 py-3">Title</th>
              <th className="text-left text-[11px] font-semibold text-dark-400 uppercase tracking-wider px-5 py-3">Priority</th>
              <th className="text-left text-[11px] font-semibold text-dark-400 uppercase tracking-wider px-5 py-3">Module</th>
              <th className="text-left text-[11px] font-semibold text-dark-400 uppercase tracking-wider px-5 py-3">Type</th>
              <th className="text-left text-[11px] font-semibold text-dark-400 uppercase tracking-wider px-5 py-3">Owner</th>
              <th className="text-right text-[11px] font-semibold text-dark-400 uppercase tracking-wider px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-700/30">
            {filtered.slice(0, 50).map((tc: TestCase, index: number) => (
              <motion.tr key={tc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.015 }} className="hover:bg-dark-800/30 transition-colors">
                <td className="px-5 py-3">
                  <p className="text-sm font-medium text-dark-200">{tc.title}</p>
                  <p className="text-[10px] text-dark-500 mt-0.5">{tc.file_path}</p>
                </td>
                <td className="px-5 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-medium ${priorityColor[tc.priority] || ''}`}>{tc.priority}</span></td>
                <td className="px-5 py-3 text-xs text-dark-300">{tc.module || '—'}</td>
                <td className="px-5 py-3 text-xs text-dark-400 capitalize">{tc.test_type}</td>
                <td className="px-5 py-3 text-xs text-dark-400">{tc.owner_name || '—'}</td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => { setEditCase(tc); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-dark-700/50 text-dark-500 inline-block"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => deleteMutation.mutate(tc.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-dark-500 hover:text-red-400 inline-block ml-1"><Trash2 className="w-3.5 h-3.5" /></button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && <TestCaseModal testCase={editCase} onClose={() => setShowModal(false)} />}
    </div>
  );
}

function TestCaseModal({ testCase, onClose }: { testCase: TestCase | null; onClose: () => void }) {
  const [form, setForm] = useState({ title: testCase?.title || '', description: testCase?.description || '', file_path: testCase?.file_path || '', priority: testCase?.priority || 'medium', module: testCase?.module || '', test_type: testCase?.test_type || 'functional', project_id: testCase?.project_id || 1, tags: testCase?.tags?.join(', ') || '' });
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => testCase ? api.put(`/test-cases/${testCase.id}`, data) : api.post('/test-cases', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['test-cases'] }); toast.success(testCase ? 'Updated' : 'Created'); onClose(); },
  });
  return (
    <Modal title={testCase ? 'Edit Test Case' : 'New Test Case'} onClose={onClose} size="lg">
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate({ ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) }); }} className="space-y-4">
        <div><label className="block text-sm font-medium text-dark-300 mb-1.5">Title</label><input className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="block text-sm font-medium text-dark-300 mb-1.5">Priority</label><select className="input-field" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></div>
          <div><label className="block text-sm font-medium text-dark-300 mb-1.5">Type</label><select className="input-field" value={form.test_type} onChange={(e) => setForm({ ...form, test_type: e.target.value })}><option value="functional">Functional</option><option value="e2e">E2E</option><option value="api">API</option><option value="unit">Unit</option></select></div>
          <div><label className="block text-sm font-medium text-dark-300 mb-1.5">Module</label><input className="input-field" value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })} /></div>
        </div>
        <div><label className="block text-sm font-medium text-dark-300 mb-1.5">File Path</label><input className="input-field font-mono text-xs" value={form.file_path} onChange={(e) => setForm({ ...form, file_path: e.target.value })} placeholder="tests/auth/login.spec.ts" /></div>
        <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button><button type="submit" className="btn-primary text-sm" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : testCase ? 'Update' : 'Create'}</button></div>
      </form>
    </Modal>
  );
}
