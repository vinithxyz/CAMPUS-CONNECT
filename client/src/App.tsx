import { Routes, Route } from 'react-router-dom';
import RequireAuth from './routes/RequireAuth';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ReportIssuePage from './pages/ReportIssuePage';
import CampusMapPage from './pages/CampusMapPage';
import MyComplaintsPage from './pages/MyComplaintsPage';
import ProfilePage from './pages/ProfilePage';
import AdminReportsPage from './pages/AdminReportsPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      {/* Public Landing */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Protected Student & General Routes */}
      <Route element={<RequireAuth />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/report" element={<ReportIssuePage />} />
          <Route path="/map" element={<CampusMapPage />} />
          <Route path="/complaints" element={<MyComplaintsPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Admin Protected Routes */}
          <Route element={<RequireAuth role="admin" />}>
            <Route path="/admin/reports" element={<AdminReportsPage />} />
          </Route>
        </Route>
      </Route>

      {/* 404 Catch All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
