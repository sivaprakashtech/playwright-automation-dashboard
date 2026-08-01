import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, FolderKanban, TestTubes, FileText, Play, BarChart3,
  Image, Video, Calendar, Settings, Users, Globe, ClipboardList,
  ChevronLeft, Zap,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/projects', label: 'Projects', icon: FolderKanban },
  { path: '/test-suites', label: 'Test Suites', icon: TestTubes },
  { path: '/test-cases', label: 'Test Cases', icon: FileText },
  { path: '/executions', label: 'Executions', icon: Play },
  { path: '/reports', label: 'Reports', icon: ClipboardList },
  { path: '/screenshots', label: 'Screenshots', icon: Image },
  { path: '/videos', label: 'Videos', icon: Video },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/scheduler', label: 'Scheduler', icon: Calendar },
  { path: '/environments', label: 'Environments', icon: Globe },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const adminItems = [
  { path: '/users', label: 'Users', icon: Users },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { isAdmin } = useAuth();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 68 : 250 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="h-screen bg-dark-900/50 backdrop-blur-xl border-r border-dark-800/50 flex flex-col overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-dark-800/50">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-blue-500 shrink-0 shadow-lg shadow-primary-500/20">
          <Zap className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <span className="text-sm font-bold text-white">Playwright</span>
            <span className="text-[10px] text-dark-400 block -mt-0.5">Dashboard</span>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-0.5" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link'}
            title={item.label}
            aria-label={item.label}
          >
            <item.icon className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="whitespace-nowrap">
                {item.label}
              </motion.span>
            )}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="pt-4 pb-2 px-1">
              {!collapsed && <span className="text-[10px] font-semibold text-dark-600 uppercase tracking-widest">Admin</span>}
            </div>
            {adminItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link'}
                title={item.label}
                aria-label={item.label}
              >
                <item.icon className="w-[18px] h-[18px] shrink-0" />
                {!collapsed && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="whitespace-nowrap">
                    {item.label}
                  </motion.span>
                )}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Collapse */}
      <div className="border-t border-dark-800/50 p-2.5">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-dark-800/80 text-dark-500 transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </motion.aside>
  );
}
