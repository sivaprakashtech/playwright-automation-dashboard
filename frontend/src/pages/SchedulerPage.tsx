import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Calendar, ToggleLeft, ToggleRight, Trash2, Clock } from 'lucide-react';
import api from '@/services/api';
import { generateSchedules } from '@/data/demo';
import { Schedule } from '@/types';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import { format } from 'date-fns';

const DEMO_SCHEDULES = generateSchedules(15);

export default function SchedulerPage() {
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['schedules'],
    queryFn: async () => { const res = await api.get('/scheduler'); return res.data.schedules; },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => api.post(`/scheduler/${id}/toggle`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['schedules'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/scheduler/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['schedules'] }); toast.success('Deleted'); },
  });

  const schedules = (data && data.length > 0) ? data : DEMO_SCHEDULES;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Scheduler</h1>
          <p className="text-sm text-dark-400 mt-0.5">{schedules.length} scheduled jobs • {schedules.filter((s: Schedule) => s.is_active).length} active</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> New Schedule
        </button>
      </div>

      <div className="space-y-2">
        {schedules.map((schedule: Schedule, index: number) => (
          <motion.div key={schedule.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="card !p-4 flex items-center justify-between hover:border-primary-500/20 transition-all">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${schedule.is_active ? 'bg-primary-500/10 border border-primary-500/20' : 'bg-dark-700/50 border border-dark-700'}`}>
                <Calendar className={`w-5 h-5 ${schedule.is_active ? 'text-primary-400' : 'text-dark-500'}`} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">{schedule.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-dark-500">{schedule.schedule_type}</span>
                  <span className="text-[10px] text-dark-600">•</span>
                  <span className="text-[10px] text-dark-500">{schedule.browser}</span>
                  <span className="text-[10px] text-dark-600">•</span>
                  <span className="text-[10px] text-dark-500">{schedule.environment}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] text-dark-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {schedule.cron_expression}</p>
                {schedule.next_run && <p className="text-[9px] text-dark-600 mt-0.5">Next: {format(new Date(schedule.next_run), 'MMM d, HH:mm')}</p>}
              </div>
              <button onClick={() => toggleMutation.mutate(schedule.id)}>
                {schedule.is_active ? <ToggleRight className="w-7 h-7 text-emerald-400" /> : <ToggleLeft className="w-7 h-7 text-dark-600" />}
              </button>
              <button onClick={() => deleteMutation.mutate(schedule.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-dark-500 hover:text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {showModal && <ScheduleModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

function ScheduleModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: '', schedule_type: 'daily', cron_expression: '0 2 * * *', project_id: 1, browser: 'chromium', environment: 'qa' });
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/scheduler', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['schedules'] }); toast.success('Created'); onClose(); },
  });
  return (
    <Modal title="New Schedule" onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} className="space-y-4">
        <div><label className="block text-sm font-medium text-dark-300 mb-1.5">Name</label><input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Nightly Regression" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-dark-300 mb-1.5">Frequency</label><select className="input-field" value={form.schedule_type} onChange={(e) => setForm({ ...form, schedule_type: e.target.value })}><option value="hourly">Hourly</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="cron">Custom Cron</option></select></div>
          <div><label className="block text-sm font-medium text-dark-300 mb-1.5">Cron</label><input className="input-field font-mono text-xs" value={form.cron_expression} onChange={(e) => setForm({ ...form, cron_expression: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-dark-300 mb-1.5">Browser</label><select className="input-field" value={form.browser} onChange={(e) => setForm({ ...form, browser: e.target.value })}><option value="chromium">Chromium</option><option value="firefox">Firefox</option><option value="webkit">WebKit</option></select></div>
          <div><label className="block text-sm font-medium text-dark-300 mb-1.5">Environment</label><select className="input-field" value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value })}><option value="development">Development</option><option value="qa">QA</option><option value="staging">Staging</option><option value="production">Production</option></select></div>
        </div>
        <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button><button type="submit" className="btn-primary text-sm" disabled={mutation.isPending}>Create</button></div>
      </form>
    </Modal>
  );
}
