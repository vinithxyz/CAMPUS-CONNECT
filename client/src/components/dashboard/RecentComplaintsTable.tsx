import { Link, useNavigate } from 'react-router-dom';
import StatusBadge from '../ui/StatusBadge';
import PriorityBadge from '../ui/PriorityBadge';
import type { Report } from '../../types';
import { formatDate } from '../../utils/format';

interface Props {
  reports: Report[];
  loading?: boolean;
}

export default function RecentComplaintsTable({ reports, loading }: Props) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-800">Recent Complaints</h3>
        <Link
          to="/complaints"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
        >
          View All
        </Link>
      </div>

      {/* Mobile Card List (< sm) */}
      <div className="block sm:hidden divide-y divide-slate-100">
        {loading ? (
          <div className="p-6 text-center text-xs text-slate-400">Loading recent complaints...</div>
        ) : reports.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">No recent complaints reported.</div>
        ) : (
          reports.map((r) => (
            <div
              key={r.reportId}
              onClick={() => navigate(`/complaints?selected=${r.reportId}`)}
              className="p-3.5 hover:bg-slate-50 active:bg-slate-100 transition cursor-pointer space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-600 text-xs">#{r.reportId}</span>
                <div className="flex items-center gap-1.5">
                  <PriorityBadge priority={r.priority} size="sm" />
                  <StatusBadge status={r.status} size="sm" />
                </div>
              </div>
              <p className="text-xs font-semibold text-slate-800 leading-snug line-clamp-1">{r.title}</p>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="truncate max-w-[180px]">{r.room}</span>
                <span>{formatDate(r.createdAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table (>= sm) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/70 text-slate-400 font-medium border-b border-slate-100">
            <tr>
              <th className="px-6 py-3 font-semibold">ID</th>
              <th className="px-4 py-3 font-semibold">Issue</th>
              <th className="px-4 py-3 font-semibold">Location</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Priority</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 font-semibold text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                  Loading recent complaints...
                </td>
              </tr>
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                  No recent complaints reported.
                </td>
              </tr>
            ) : (
              reports.map((r) => (
                <tr
                  key={r.reportId}
                  onClick={() => navigate(`/complaints?selected=${r.reportId}`)}
                  className="hover:bg-slate-50/80 cursor-pointer transition"
                >
                  <td className="px-6 py-3.5 font-semibold text-slate-700">
                    #{r.reportId}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-800">
                    {r.title}
                  </td>
                  <td className="px-4 py-3.5 text-slate-500">
                    {r.room}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 capitalize">
                    {r.category}
                  </td>
                  <td className="px-4 py-3.5">
                    <PriorityBadge priority={r.priority} size="sm" />
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={r.status} size="sm" />
                  </td>
                  <td className="px-6 py-3.5 text-right text-slate-400">
                    {formatDate(r.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
