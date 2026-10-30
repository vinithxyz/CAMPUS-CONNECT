import { Link } from 'react-router-dom';
import { AlertTriangle, ChevronRight, CheckCircle2 } from 'lucide-react';
import PriorityBadge from '../ui/PriorityBadge';
import StatusBadge from '../ui/StatusBadge';
import type { Priority, Status } from '../../types';

interface Props {
  items: {
    reportId: string;
    title: string;
    priority: Priority;
    status: Status;
    createdAt: string;
  }[];
  loading?: boolean;
}

export default function AttentionList({ items, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-5 border border-slate-100 space-y-3 shadow-2xs">
        <div className="h-5 w-44 bg-slate-100 rounded animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 bg-slate-50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Requires Attention</h3>
            <p className="text-xs text-slate-400">Critical priority or overdue unresolved issues</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
          {items.length} items
        </span>
      </div>

      {items.length === 0 ? (
        <div className="py-8 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-slate-700">All clear!</p>
          <p className="text-xs text-slate-400">No overdue or critical issues pending right now.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {items.map((item) => (
            <Link
              key={item.reportId}
              to={`/admin/reports?report=${item.reportId}`}
              className="flex items-center justify-between py-3 hover:bg-slate-50/80 px-2 rounded-lg transition group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-xs font-bold text-slate-700 group-hover:text-blue-600 transition shrink-0">
                  {item.reportId}
                </span>
                <span className="text-xs font-medium text-slate-800 truncate">
                  {item.title}
                </span>
              </div>
              <div className="flex items-center gap-2.5 shrink-0 ml-4">
                <PriorityBadge priority={item.priority} size="sm" />
                <StatusBadge status={item.status} size="sm" />
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
