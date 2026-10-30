import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import MobileBottomNav from '../components/layout/MobileBottomNav';
import ChatWidget from '../components/chat/ChatWidget';
import { useAuth } from '../context/AuthContext';
import { studentNav, type NavItem } from '../routes/navConfig';

interface DashboardLayoutProps {
  nav?: NavItem[];
  badge?: string;
}

export default function DashboardLayout({ nav = studentNav, badge }: DashboardLayoutProps) {
  const { user } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex flex-col lg:flex-row">
      {/* Left Sidebar */}
      <Sidebar
        items={nav}
        badge={badge}
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0">
        <Header onToggleSidebar={() => setMobileSidebarOpen((prev) => !prev)} />
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar for phones & tablets */}
      <MobileBottomNav />

      {/* CampusConnect AI Chatbot Assistant - only rendered for students */}
      {user?.role === 'student' && <ChatWidget />}
    </div>
  );
}
