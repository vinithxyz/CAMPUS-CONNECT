import { useEffect, useState } from 'react';
import { AlertCircle, Clock, CheckCircle2, Flame } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import RecentComplaintsTable from '../components/dashboard/RecentComplaintsTable';
import CategoryDoughnut from '../components/dashboard/CategoryDoughnut';
import QuickActions from '../components/dashboard/QuickActions';
import { useAuth } from '../context/AuthContext';
import { reportService } from '../services/reportService';
import type { Report, ReportStats } from '../types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ReportStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    highPriority: 0,
    byCategory: [],
  });
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        setLoading(true);
        const [statsRes, reportsRes] = await Promise.all([
          reportService.stats(),
          reportService.list({ limit: 4, sort: '-createdAt' }),
        ]);
        if (active) {
          setStats(statsRes);
          setRecentReports(reportsRes.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Greeting Banner */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          Hello, {user?.name || 'User 123'}
        </h1>
        <p className="text-xs font-medium text-slate-500 mt-0.5">
          Here's what's happening on your campus
        </p>
      </div>

      {/* 4 Stat Cards matching PDF page 4 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Complaints"
          value={loading ? '...' : stats.total}
          icon={<AlertCircle className="w-5 h-5" />}
          tone="red"
        />
        <StatCard
          label="In Progress"
          value={loading ? '...' : stats.inProgress}
          icon={<Clock className="w-5 h-5" />}
          tone="amber"
        />
        <StatCard
          label="Resolved"
          value={loading ? '...' : stats.resolved}
          icon={<CheckCircle2 className="w-5 h-5" />}
          tone="green"
        />
        <StatCard
          label="High Priority"
          value={loading ? '...' : stats.highPriority}
          icon={<Flame className="w-5 h-5" />}
          tone="purple"
        />
      </div>

      {/* Main Grid: Left Recent Complaints (2 cols), Right Categories & Actions (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Recent Complaints */}
        <div className="lg:col-span-2">
          <RecentComplaintsTable reports={recentReports} loading={loading} />
        </div>

        {/* Right Column: Categories Doughnut & Quick Actions */}
        <div className="space-y-6">
          <CategoryDoughnut data={stats.byCategory} total={stats.total} />
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
