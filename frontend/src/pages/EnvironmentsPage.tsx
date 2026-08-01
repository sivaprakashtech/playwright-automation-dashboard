import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Globe, CheckCircle2, XCircle } from 'lucide-react';
import api from '@/services/api';
import { Environment } from '@/types';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';

export default function EnvironmentsPage() {
  const [showModal, setShowModal] = useState(false);
  const [editEnv, setEditEnv] = useState<Environment | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['environments'],
    queryFn: async () => {
      const res = await api.get('/environments');
      return res.data.environments;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/environments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['environments'] });
      toast.success('Environment deleted');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-100">Environments</h1>
        <button onClick={() => { setEditEnv(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Environment
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.map((env: Environment, index: number) => (
            <motion.div
              key={env.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card flex items-start justify-between"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-dark-100">{env.display_name}</h3>
                  <p className="text-xs text-dark-400 font-mono mt-0.5">{env.base_url}</p>
                  <p className="text-xs text-dark-500 mt-1">{env.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {env.is_active ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="w-3 h-3" /> Active</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-red-400"><XCircle className="w-3 h-3" /> Inactive</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditEnv(env); setShowModal(true); }} className="p-1.5 rounded hover:bg-dark-700">
                  <Pencil className="w-3.5 h-3.5 text-dark-400" />
                </button>
                <button onClick={() => deleteMutation.mutate(env.id)} className="p-1.5 rounded hover:bg-dark-700">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showModal && <EnvironmentModal env={editEnv} onClose={() => setShowModal(false)} />}
    </div>
  );
}

function EnvironmentModal({ env, onClose }: { env: Environment | null; onClose: () => void }) {
  const [form, setForm] = useState({
    name: env?.name || '',
    display_name: env?.display_name || '',
    base_url: env?.base_url || '',
    description: env?.description || '',
  });

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      env ? api.put(`/environments/${env.id}`, data) : api.post('/environments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['environments'] });
      toast.success(env ? 'Updated' : 'Created');
      onClose();
    },
  });

  return (
    <Modal title={env ? 'Edit Environment' : 'New Environment'} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Name (slug)</label>
            <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required disabled={!!env} placeholder="staging" />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Display Name</label>
            <input className="input-field" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} required placeholder="Staging" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-1">Base URL</label>
          <input className="input-field" value={form.base_url} onChange={(e) => setForm({ ...form, base_url: e.target.value })} required placeholder="https://staging.example.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-1">Description</label>
          <textarea className="input-field" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>{env ? 'Update' : 'Create'}</button>
        </div>
      </form>
    </Modal>
  );
}
