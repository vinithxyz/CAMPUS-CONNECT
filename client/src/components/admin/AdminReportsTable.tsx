import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import PriorityBadge from '../ui/PriorityBadge';
import StatusBadge from '../ui/StatusBadge';
import type { AdminReportRow } from '../../types/admin';

interface Props {
  rows: AdminReportRow[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onOpen: (id: string) => void;
  sort: string;
  onSort: (field: string) => void;
  isAdmin: boolean;
  loading?: boolean;
}

export default function AdminReportsTable({
  rows,
  selectedIds,
  onToggle,
  onToggleAll,
  onOpen,
  sort,
  onSort,
  isAdmin,
  loading,
}: Props) {
  const isAllSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.reportId));

  const renderSortIcon = (field: string) => {
    if (sort === field) return <ArrowUp className="w-3.5 h-3.5 text-blue-600 inline ml-1" />;
    if (sort === `-${field}`) return <ArrowDown className="w-3.5 h-3.5 text-blue-600 inline ml-1" />;
    return <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 inline ml-1 opacity-0 group-hover:opacity-100 transition" />;
  };

  const formatAge = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-2xs">
        <div className="p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-slate-50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80 sticky top-0 z-10 select-none">
            <tr>
              {isAdmin && (
                <th className="py-3 px-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={onToggleAll}
                    aria-label="Select all reports"
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                </th>
              )}
              <th
                onClick={() => onSort('createdAt')}
                className="py-3 px-3.5 cursor-pointer group hover:text-slate-800"
              >
                <span>ID</span>
                {renderSortIcon('createdAt')}
              </th>
              <th
                onClick={() => onSort('title')}
                className="py-3 px-3.5 cursor-pointer group hover:text-slate-800"
              >
                <span>Title</span>
                {renderSortIcon('title')}
              </th>
              <th className="py-3 px-3.5">Building & Room</th>
              <th className="py-3 px-3.5">Category</th>
              <th
                onClick={() => onSort('priority')}
                className="py-3 px-3.5 cursor-pointer group hover:text-slate-800"
              >
                <span>Priority</span>
                {renderSortIcon('priority')}
              </th>
              <th
                onClick={() => onSort('status')}
                className="py-3 px-3.5 cursor-pointer group hover:text-slate-800"
              >
                <span>Status</span>
                {renderSortIcon('status')}
              </th>
              <th className="py-3 px-3.5">Assignee</th>
              <th className="py-3 px-3.5">Age</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 9 : 8} className="py-12 text-center text-slate-400">
                  No maintenance reports matching current filters.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const isSelected = selectedIds.has(r.reportId);
                return (
                  <tr
                    key={r.reportId}
                    tabIndex={0}
                    onClick={() => onOpen(r.reportId)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onOpen(r.reportId);
                    }}
                    className={`hover:bg-blue-50/40 cursor-pointer transition focus:outline-none focus:bg-blue-50/60 ${
                      isSelected ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    {isAdmin && (
                      <td
                        className="py-2.5 px-3.5 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggle(r.reportId)}
                          aria-label={`Select report ${r.reportId}`}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                        />
                      </td>
                    )}
                    <td className="py-2.5 px-3.5 font-mono font-bold text-slate-800">
                      {r.reportId}
                    </td>
                    <td className="py-2.5 px-3.5 max-w-[200px] truncate font-medium text-slate-800">
                      {r.title}
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-600 truncate">
                      {r.building?.name || 'Campus'} - {r.room}
                    </td>
                    <td className="py-2.5 px-3.5 capitalize text-slate-600">{r.category}</td>
                    <td className="py-2.5 px-3.5">
                      <PriorityBadge priority={r.priority} size="sm" />
                    </td>
                    <td className="py-2.5 px-3.5">
                      <StatusBadge status={r.status} size="sm" />
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-600">
                      {r.assignedTo ? (
                        <span className="font-medium text-slate-700">{r.assignedTo.name}</span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span className="text-slate-500">{formatAge(r.createdAt)}</span>
                      {r.isOverdue && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                          Overdue
                        </span>
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
