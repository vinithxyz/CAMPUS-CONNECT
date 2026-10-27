import { NavLink } from 'react-router-dom';
import { Home, FilePlus, Map as MapIcon, FileText, User, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function MobileBottomNav() {
  const { user } = useAuth();

  const navItems = [
    { to: '/dashboard', label: 'Home', icon: Home },
    { to: '/report', label: 'Report', icon: FilePlus },
    { to: '/map', label: 'Map', icon: MapIcon },
    { to: '/complaints', label: 'Complaints', icon: FileText },
  ];

  if (user?.role === 'admin') {
    navItems.push({ to: '/admin/reports', label: 'Admin', icon: ShieldAlert });
  } else {
    navItems.push({ to: '/profile', label: 'Profile', icon: User });
  }

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 z-30 lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all rounded-xl ${
                isActive
                  ? 'text-blue-600 font-bold scale-105'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`p-1 rounded-xl transition ${
                    isActive ? 'bg-blue-50 text-blue-600' : ''
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
