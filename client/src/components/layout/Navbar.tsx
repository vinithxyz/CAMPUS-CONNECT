import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Menu, X, Home, FilePlus, Map as MapIcon, Info, LogIn, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-slate-900/90 via-slate-900/50 to-transparent">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-12 py-4 sm:py-5">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 text-white group">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <MapPin className="w-4 h-4 fill-white" />
          </div>
          <span className="text-lg sm:text-xl font-bold tracking-tight">CampusConnect</span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-200">
          <Link to="/" className="hover:text-white transition">
            Home
          </Link>
          <Link to="/report" className="hover:text-white transition">
            Report Issue
          </Link>
          <Link to="/map" className="hover:text-white transition">
            Map
          </Link>
          <a href="#about" className="hover:text-white transition">
            About
          </a>
        </div>

        {/* Right Action / Mobile Toggle */}
        <div className="flex items-center gap-3">
          {/* Desktop Auth Action */}
          <div className="hidden sm:block">
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
              >
                Dashboard
              </button>
            ) : (
              <Link
                to="/login"
                className="px-6 py-2 text-sm font-medium text-white border border-white/40 hover:border-white hover:bg-white/10 rounded-lg transition"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-200 hover:text-white rounded-lg hover:bg-white/10 transition"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900/95 backdrop-blur-md border-b border-white/10 px-4 pt-2 pb-6 space-y-3 animate-fade-in">
          <div className="flex flex-col space-y-1 text-sm font-medium text-slate-200">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 hover:text-white transition"
            >
              <Home className="w-4 h-4 text-blue-400" />
              <span>Home</span>
            </Link>
            <Link
              to="/report"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 hover:text-white transition"
            >
              <FilePlus className="w-4 h-4 text-blue-400" />
              <span>Report Issue</span>
            </Link>
            <Link
              to="/map"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 hover:text-white transition"
            >
              <MapIcon className="w-4 h-4 text-blue-400" />
              <span>Campus Map</span>
            </Link>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 hover:text-white transition"
            >
              <Info className="w-4 h-4 text-blue-400" />
              <span>About CampusConnect</span>
            </a>
          </div>

          <div className="pt-2 border-t border-white/10">
            {user ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/dashboard');
                }}
                className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Go to Dashboard</span>
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-semibold text-white border border-white/30 hover:bg-white/10 rounded-xl transition"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
