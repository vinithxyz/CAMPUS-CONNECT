import DashboardLayout from './DashboardLayout';
import { adminNav } from '../routes/navConfig';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const { user } = useAuth();
  const badge = user?.role === 'staff' ? 'Staff' : 'Admin';
  return <DashboardLayout nav={adminNav} badge={badge} />;
}
