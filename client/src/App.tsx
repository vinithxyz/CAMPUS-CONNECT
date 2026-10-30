import { Routes, Route } from 'react-router-dom';
import RequireAuth from './routes/RequireAuth';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout from './layouts/AdminLayout';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ReportIssuePage from './pages/ReportIssuePage';
import CampusMapPage from './pages/CampusMapPage';
import MyComplaintsPage from './pages/MyComplaintsPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

import AdminOverviewPage from './pages/admin/AdminOverviewPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminMapPage from './pages/admin/AdminMapPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminBuildingsPage from './pages/admin/AdminBuildingsPage';
import AdminAuditPage from './pages/admin/AdminAuditPage';

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

      {/* Protected Student Routes */}
      <Route element={<RequireAuth />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/report" element={<ReportIssuePage />} />
          <Route path="/map" element={<CampusMapPage />} />
          <Route path="/complaints" element={<MyComplaintsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Admin and Staff Protected Routes */}
      <Route element={<RequireAuth roles={['admin', 'staff']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminOverviewPage />} />
          <Route path="/admin/reports" element={<AdminReportsPage />} />
          <Route path="/admin/map" element={<AdminMapPage />} />

          {/* Admin Only Routes */}
          <Route element={<RequireAuth roles={['admin']} />}>
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/buildings" element={<AdminBuildingsPage />} />
            <Route path="/admin/audit" element={<AdminAuditPage />} />
          </Route>
        </Route>
      </Route>

      {/* 404 Catch All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
