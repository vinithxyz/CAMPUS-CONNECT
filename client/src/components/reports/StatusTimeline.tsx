import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import type { HistoryEntry } from '../../types';
import StatusBadge from '../ui/StatusBadge';
import { formatDateTime } from '../../utils/format';

interface Props {
  history: HistoryEntry[];
}

export default function StatusTimeline({ history }: Props) {
  // Sort newest first
  const sorted = [...history].sort(
    (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
  );

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {sorted.map((item, index) => {
        const isResolved = item.status === 'resolved';
        const isInProgress = item.status === 'in_progress';

        return (
          <div key={index} className="relative">
            {/* Timeline icon */}
            <div
              className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white ${
                isResolved
                  ? 'bg-emerald-500 text-white'
                  : isInProgress
                  ? 'bg-sky-500 text-white'
                  : 'bg-amber-400 text-white'
              }`}
            >
              {isResolved ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : isInProgress ? (
                <Clock className="w-3 h-3" />
              ) : (
                <AlertCircle className="w-3 h-3" />
              )}
            </div>

            {/* Entry content */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
              <div className="flex items-center justify-between gap-2 mb-1">
                <StatusBadge status={item.status} size="sm" />
                <span className="text-[11px] text-slate-400">{formatDateTime(item.changedAt)}</span>
              </div>
              {item.note && (
                <p className="text-xs text-slate-700 font-medium mt-1.5 leading-relaxed">
                  {item.note}
                </p>
              )}
              {item.changedBy && (
                <p className="text-[11px] text-slate-400 mt-1">
                  Updated by: <span className="font-semibold text-slate-600">{item.changedBy.name}</span>
                  {item.changedBy.role === 'admin' && (
                    <span className="ml-1 text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                      Admin
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
