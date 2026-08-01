import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Save } from 'lucide-react';
import api from '@/services/api';
import { Settings } from '@/types';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [form, setForm] = useState<Partial<Settings>>({});

  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data.settings as Settings;
    },
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const mutation = useMutation({
    mutationFn: (data: Partial<Settings>) => api.put('/settings', data),
    onSuccess: () => toast.success('Settings saved'),
    onError: () => toast.error('Failed to save settings'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-dark-100">Settings</h1>

      <motion.form
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* General */}
        <div className="card space-y-4">
          <h3 className="text-lg font-semibold text-dark-100">General</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">Theme</label>
              <select className="input-field" value={form.theme || 'dark'} onChange={(e) => setForm({ ...form, theme: e.target.value })}>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">Report Format</label>
              <select className="input-field" value={form.report_format || 'html'} onChange={(e) => setForm({ ...form, report_format: e.target.value })}>
                <option value="html">HTML</option>
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Execution Path</label>
            <input className="input-field" value={form.execution_path || ''} onChange={(e) => setForm({ ...form, execution_path: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Base URL</label>
            <input className="input-field" value={form.base_url || ''} onChange={(e) => setForm({ ...form, base_url: e.target.value })} />
          </div>
        </div>

        {/* Execution */}
        <div className="card space-y-4">
          <h3 className="text-lg font-semibold text-dark-100">Execution Configuration</h3>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">Parallel Workers</label>
              <input type="number" min={1} max={20} className="input-field" value={form.parallel_workers || 4} onChange={(e) => setForm({ ...form, parallel_workers: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">Timeout (ms)</label>
              <input type="number" className="input-field" value={form.timeout || 30000} onChange={(e) => setForm({ ...form, timeout: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">Retries</label>
              <input type="number" min={0} max={5} className="input-field" value={form.retries || 1} onChange={(e) => setForm({ ...form, retries: Number(e.target.value) })} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Default Browser</label>
            <select className="input-field" value={form.default_browser || 'chromium'} onChange={(e) => setForm({ ...form, default_browser: e.target.value })}>
              <option value="chromium">Chromium (Chrome/Edge)</option>
              <option value="firefox">Firefox</option>
              <option value="webkit">WebKit (Safari)</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={form.headless || false} onChange={(e) => setForm({ ...form, headless: e.target.checked })} className="rounded border-dark-600" />
              <span className="text-sm text-dark-300">Run tests in headless mode</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={form.screenshot_on_failure || false} onChange={(e) => setForm({ ...form, screenshot_on_failure: e.target.checked })} className="rounded border-dark-600" />
              <span className="text-sm text-dark-300">Capture screenshots on failure</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={form.video_recording || false} onChange={(e) => setForm({ ...form, video_recording: e.target.checked })} className="rounded border-dark-600" />
              <span className="text-sm text-dark-300">Enable video recording</span>
            </label>
          </div>
        </div>

        {/* Notifications */}
        <div className="card space-y-4">
          <h3 className="text-lg font-semibold text-dark-100">Notifications</h3>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Notification Email</label>
            <input className="input-field" type="email" value={form.notification_email || ''} onChange={(e) => setForm({ ...form, notification_email: e.target.value })} placeholder="alerts@team.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Slack Webhook URL</label>
            <input className="input-field" value={form.slack_webhook || ''} onChange={(e) => setForm({ ...form, slack_webhook: e.target.value })} placeholder="https://hooks.slack.com/services/..." />
          </div>
        </div>

        <button type="submit" className="btn-primary flex items-center gap-2" disabled={mutation.isPending}>
          <Save className="w-4 h-4" /> {mutation.isPending ? 'Saving...' : 'Save Settings'}
        </button>
      </motion.form>
    </div>
  );
}
