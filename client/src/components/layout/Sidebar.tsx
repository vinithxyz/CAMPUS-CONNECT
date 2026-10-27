import { NavLink, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Home,
  FilePlus,
  Map as MapIcon,
  FileText,
  User,
  ShieldAlert,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Props {
  mobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out?')) {
      await logout();
      navigate('/login');
    }
  };

  const navItems = [
    { to: '/dashboard', label: 'Home', icon: Home },
    { to: '/report', label: 'Report Issue', icon: FilePlus },
    { to: '/map', label: 'Campus Map', icon: MapIcon },
    { to: '/complaints', label: 'My Complaints', icon: FileText },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  if (user?.role === 'admin') {
    navItems.push({ to: '/admin/reports', label: 'Admin Portal', icon: ShieldAlert });
  }

  const content = (
    <div className="flex flex-col h-full bg-[#0b2545] text-white">
      {/* Brand */}
      <div className="flex items-center justify-between px-6 py-6 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white shadow">
            <MapPin className="w-4 h-4 fill-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">CampusConnect</span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1 text-slate-400 hover:text-white"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Logout */}
      <div className="p-4 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3.5 w-full px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 shrink-0 z-30">
        {content}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
            onClick={onClose}
          />
          <div className="fixed inset-y-0 left-0 w-64 max-w-xs shadow-2xl z-10 animate-slide-right">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
