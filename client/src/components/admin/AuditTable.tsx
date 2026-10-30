import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, User, ShieldAlert } from 'lucide-react';
import type { AuditEntry } from '../../types/admin';
import { formatDateTime } from '../../utils/format';

interface Props {
  entries: AuditEntry[];
  loading?: boolean;
}

export default function AuditTable({ entries, loading }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden p-4 space-y-3 shadow-2xs">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 bg-slate-50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80 sticky top-0">
            <tr>
              <th className="py-3 px-4 w-8" />
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Actor</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Target Type</th>
              <th className="py-3 px-4">Target ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 font-sans">
                  No audit log entries found matching criteria.
                </td>
              </tr>
            ) : (
              entries.map((entry) => {
                const isExpanded = expandedIds.has(entry._id);
                const hasMeta = Boolean(
                  entry.meta && Object.keys(entry.meta as object).length > 0
                );

                return (
                  <tr key={entry._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-2 text-center">
                      {hasMeta && (
                        <button
                          onClick={() => toggleExpand(entry._id)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded"
                          aria-label="Expand audit details"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-sans whitespace-nowrap">
                      {formatDateTime(entry.createdAt)}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{entry.actor?.name || 'Unknown'}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase">
                        {entry.actorRole}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {entry.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 uppercase text-[11px] text-slate-600 font-semibold">
                      {entry.targetType}
                    </td>
                    <td className="py-3 px-4">
                      {entry.targetType === 'report' ? (
                        <Link
                          to={`/admin/reports?search=${entry.targetId}`}
                          className="text-blue-600 hover:underline font-bold"
                        >
                          {entry.targetId}
                        </Link>
                      ) : (
                        <span className="text-slate-700">{entry.targetId}</span>
                      )}
                      {isExpanded && hasMeta && (
                        <div className="mt-2 p-2.5 bg-slate-900 text-slate-200 rounded-lg text-[11px] font-mono overflow-x-auto">
                          <pre>{JSON.stringify(entry.meta, null, 2)}</pre>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
