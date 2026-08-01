import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Video, Search, Play, Clock, HardDrive, Film, Monitor } from 'lucide-react';
import api from '@/services/api';
import { format } from 'date-fns';

const MODULES = ['Login Flow', 'Checkout Process', 'Payment Gateway', 'User Registration', 'Search Results', 'Cart Update', 'Profile Edit', 'Dashboard Load', 'Report Export', 'API Integration', 'File Upload', 'Session Restore'];
const BROWSERS = ['chromium', 'firefox', 'webkit'];
const ENVS = ['staging', 'qa', 'production', 'development'];
const GRADIENTS = ['from-primary-700 to-blue-900', 'from-blue-700 to-cyan-900', 'from-emerald-700 to-teal-900', 'from-purple-700 to-indigo-900', 'from-amber-700 to-orange-900', 'from-rose-700 to-red-900'];
const rand = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

function generateVideos(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const module = MODULES[i % MODULES.length];
    const d = new Date(); d.setDate(d.getDate() - randInt(0, 30)); d.setHours(randInt(6, 22));
    return {
      id: i + 1, filename: `recording_${module.toLowerCase().replace(/\s/g, '_')}_${randInt(1000, 9999)}.webm`,
      module, browser: rand(BROWSERS), environment: rand(ENVS),
      resolution: rand(['1920×1080', '1366×768']), duration: randInt(12, 180),
      size: randInt(8000000, 65000000), status: rand(['completed', 'completed', 'failed']),
      created_at: d.toISOString(), gradient: rand(GRADIENTS),
    };
  });
}

const DEMO = generateVideos(20);
const STATS = [
  { label: 'Total Recordings', value: '1,840', icon: Film, gradient: 'from-primary-500 to-primary-600' },
  { label: 'This Week', value: '67', icon: Video, gradient: 'from-blue-500 to-blue-600' },
  { label: 'Storage Used', value: '28.4 GB', icon: HardDrive, gradient: 'from-amber-500 to-amber-600' },
  { label: 'Avg Duration', value: '1:42', icon: Clock, gradient: 'from-emerald-500 to-emerald-600' },
];

export default function VideosPage() {
  const [search, setSearch] = useState('');

  const { data: apiData } = useQuery({ queryKey: ['videos'], queryFn: async () => { const res = await api.get('/videos'); return res.data.videos; } });
  const videos = (apiData && apiData.length > 0) ? apiData : DEMO;
  const filtered = videos.filter((v: { filename: string; module?: string }) => (v.filename + (v.module || '')).toLowerCase().includes(search.toLowerCase()));

  const formatDuration = (sec: number) => `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;
  const formatSize = (bytes: number) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Video Recordings</h1>
        <p className="text-sm text-dark-400 mt-0.5">Full session recordings from test executions</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATS.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="stat-card !p-4">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-2 shadow-lg`}><s.icon className="w-3.5 h-3.5 text-white" /></div>
            <p className="text-lg font-bold text-white">{s.value}</p>
            <p className="text-[9px] text-dark-500">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" placeholder="Search recordings..." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((video: { id?: number; filename: string; module?: string; browser: string; environment: string; resolution: string; duration: number; size: number; status: string; created_at: string; gradient?: string }, index: number) => (
          <motion.div key={index} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.03 }} className="card-hover !p-3 group">
            {/* Video Thumbnail */}
            <div className={`aspect-video rounded-xl bg-gradient-to-br ${video.gradient || 'from-dark-700 to-dark-900'} flex items-center justify-center relative overflow-hidden border border-white/5`}>
              <div className="text-center">
                <Monitor className="w-6 h-6 text-white/30 mx-auto" />
                <p className="text-[8px] text-white/30 mt-1 uppercase">{video.module || 'Recording'}</p>
              </div>
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transform group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 text-white ml-0.5" />
                </div>
              </div>
              {/* Duration badge */}
              <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 rounded text-[9px] text-white flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" /> {formatDuration(video.duration)}
              </div>
              {/* Status */}
              <div className="absolute top-2 left-2">
                <span className={`text-[7px] px-1.5 py-0.5 rounded font-medium ${video.status === 'failed' ? 'bg-red-500/30 text-red-200' : 'bg-emerald-500/30 text-emerald-200'}`}>{video.status}</span>
              </div>
            </div>
            {/* Info */}
            <div className="mt-2.5">
              <p className="text-[11px] text-dark-200 truncate font-medium">{video.filename}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-[9px] text-dark-500">{video.browser} • {video.environment}</p>
                <p className="text-[9px] text-dark-600">{formatSize(video.size)}</p>
              </div>
              <p className="text-[9px] text-dark-600 mt-0.5">{format(new Date(video.created_at), 'MMM d, yyyy')}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
