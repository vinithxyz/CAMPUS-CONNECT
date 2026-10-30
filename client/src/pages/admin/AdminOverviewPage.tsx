import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAdminStats } from '../../hooks/useAdminStats';
import StatsGrid from '../../components/admin/StatsGrid';
import TrendChart from '../../components/admin/TrendChart';
import BreakdownCharts from '../../components/admin/BreakdownCharts';
import AttentionList from '../../components/admin/AttentionList';
import { Calendar, RefreshCw, Info } from 'lucide-react';

export default function AdminOverviewPage() {
  const { user } = useAuth();
  const [days, setDays] = useState(30);
  const { data, loading, error, refetch } = useAdminStats(days);

  const isStaff = user?.role === 'staff';

  return (
    <div className="space-y-6">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Admin Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Campus-wide maintenance performance, status summaries, and problem analytics
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Days range selector */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2" />
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  days === d
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>

          <button
            onClick={() => refetch()}
            disabled={loading}
            title="Refresh data"
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition shadow-2xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Staff scope notice */}
      {isStaff && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs font-medium">
          <Info className="w-4 h-4 shrink-0 text-blue-600" />
          <span>Showing reports and metrics assigned to your maintenance team account.</span>
        </div>
      )}

      {error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
          {error}
        </div>
      ) : (
        <>
          {/* 6 Status Cards */}
          <StatsGrid totals={data?.totals} loading={loading} />

          {/* Full-width Trend Chart */}
          <TrendChart data={data?.trend || []} loading={loading} />

          {/* 3 Categorical Breakdown Charts */}
          <BreakdownCharts
            byCategory={data?.byCategory || []}
            byBuilding={data?.byBuilding || []}
            byPriority={data?.byPriority || []}
            loading={loading}
          />

          {/* Needs Attention / Overdue Section */}
          <AttentionList items={data?.attention || []} loading={loading} />
        </>
      )}
    </div>
  );
}
