import { useNavigate } from 'react-router-dom';
import { Menu, Bell, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface TopNavbarProps {
  onMenuToggle: () => void;
}

export default function TopNavbar({ onMenuToggle }: TopNavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-14 bg-dark-900/50 backdrop-blur-xl border-b border-dark-800/50 flex items-center justify-between px-5">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-xl hover:bg-dark-800/80 text-dark-400 lg:hidden transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button
          className="relative p-2 rounded-xl hover:bg-dark-800/80 text-dark-400 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full ring-2 ring-dark-900" />
        </button>

        {/* User */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-dark-800/50">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-blue-500 flex items-center justify-center shadow-sm">
            <UserIcon className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-xs font-medium text-dark-200">{user?.full_name}</p>
            <p className="text-[10px] text-dark-500 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl hover:bg-red-500/10 text-dark-500 hover:text-red-400 transition-colors ml-1"
            title="Logout"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
