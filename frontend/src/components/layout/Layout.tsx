import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import DemoMode from '@/components/DemoMode';

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-dark-950">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

        <main className="flex-1 overflow-y-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            key={undefined}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Demo Mode Controller */}
      <DemoMode />
    </div>
  );
}
