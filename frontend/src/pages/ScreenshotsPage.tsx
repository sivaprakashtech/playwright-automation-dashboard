import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Monitor, Camera, Image, HardDrive } from 'lucide-react';
import api from '@/services/api';
import { format } from 'date-fns';

const PAGES = ['Login', 'Dashboard', 'Checkout', 'Profile', 'Analytics', 'Settings', 'Cart', 'Search', 'Payment', 'Registration', 'Reports', 'Products'];
const BROWSERS = ['chromium', 'firefox', 'webkit'];
const RESOLUTIONS = ['1920×1080', '1366×768', '1440×900', '375×667', '768×1024'];
const COLORS_MAP: Record<string, string> = { Login: 'from-primary-600 to-blue-700', Dashboard: 'from-blue-600 to-cyan-700', Checkout: 'from-emerald-600 to-teal-700', Profile: 'from-purple-600 to-pink-700', Analytics: 'from-amber-600 to-orange-700', Settings: 'from-dark-600 to-dark-700', Cart: 'from-rose-600 to-red-700', Search: 'from-cyan-600 to-blue-700', Payment: 'from-green-600 to-emerald-700', Registration: 'from-indigo-600 to-violet-700', Reports: 'from-teal-600 to-cyan-700', Products: 'from-orange-600 to-amber-700' };
const rand = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

function generateScreenshots(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const page = PAGES[i % PAGES.length];
    const d = new Date(); d.setDate(d.getDate() - randInt(0, 30)); d.setHours(randInt(6, 22));
    return {
      id: i + 1, filename: `${page.toLowerCase()}_${rand(['error', 'success', 'timeout', 'assertion'])}_${randInt(1000, 9999)}.png`,
      page, browser: rand(BROWSERS), resolution: rand(RESOLUTIONS),
      status: rand(['failed', 'failed', 'failed', 'passed']),
      size: randInt(80000, 2500000), created_at: d.toISOString(),
      gradient: COLORS_MAP[page] || 'from-dark-600 to-dark-700',
    };
  });
}

const DEMO = generateScreenshots(30);
const STATS = [
  { label: 'Total Captures', value: '2,580', icon: Camera, gradient: 'from-primary-500 to-primary-600' },
  { label: 'This Week', value: '124', icon: Image, gradient: 'from-blue-500 to-blue-600' },
  { label: 'Storage Used', value: '4.2 GB', icon: HardDrive, gradient: 'from-amber-500 to-amber-600' },
  { label: 'Failure Captures', value: '78%', icon: Monitor, gradient: 'from-red-500 to-red-600' },
];

export default function ScreenshotsPage() {
  const [search, setSearch] = useState('');

  const { data: apiData } = useQuery({ queryKey: ['screenshots'], queryFn: async () => { const res = await api.get('/screenshots'); return res.data.screenshots; } });
  const screenshots = (apiData && apiData.length > 0) ? apiData : DEMO;
  const filtered = screenshots.filter((s: { filename: string; page?: string }) => (s.filename + (s.page || '')).toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Screenshots</h1>
        <p className="text-sm text-dark-400 mt-0.5">Captured from test executions</p>
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
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" placeholder="Search screenshots..." />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {filtered.map((shot: { id?: number; filename: string; page?: string; browser: string; resolution: string; status: string; size: number; created_at: string; gradient?: string }, index: number) => (
          <motion.div key={index} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.02 }} className="card-hover !p-3 group cursor-pointer">
            {/* Mock Screenshot Preview */}
            <div className={`aspect-video rounded-xl bg-gradient-to-br ${shot.gradient || 'from-dark-700 to-dark-800'} flex items-center justify-center relative overflow-hidden border border-white/5 mb-3`}>
              <div className="text-center">
                <Monitor className="w-5 h-5 text-white/40 mx-auto" />
                <p className="text-[8px] text-white/30 mt-1 uppercase font-medium">{shot.page || 'Page'}</p>
              </div>
              <div className="absolute top-1.5 right-1.5"><span className={`text-[7px] px-1.5 py-0.5 rounded font-medium ${shot.status === 'failed' ? 'bg-red-500/30 text-red-200' : 'bg-emerald-500/30 text-emerald-200'}`}>{shot.status}</span></div>
              <div className="absolute bottom-1.5 left-1.5"><span className="text-[7px] px-1.5 py-0.5 rounded bg-black/40 text-white/70">{shot.resolution}</span></div>
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"><Camera className="w-4 h-4 text-white" /></div>
              </div>
            </div>
            <p className="text-[11px] text-dark-300 truncate font-medium">{shot.filename}</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[9px] text-dark-500">{shot.browser} • {format(new Date(shot.created_at), 'MMM d')}</p>
              <p className="text-[9px] text-dark-600">{(shot.size / 1024).toFixed(0)}KB</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
