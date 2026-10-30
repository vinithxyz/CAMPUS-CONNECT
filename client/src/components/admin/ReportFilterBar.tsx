import { useEffect, useState } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { buildingService } from '../../services/buildingService';
import { adminService } from '../../services/adminService';
import type { Building, Category, Priority, Status } from '../../types';
import type { AdminReportFilters } from '../../types/admin';

const CATEGORIES: Category[] = [
  'electrical',
  'plumbing',
  'mechanical',
  'civil',
  'sanitation',
  'wifi',
  'hostel',
  'canteen',
  'safety',
  'other',
];

const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'critical'];
const STATUSES: { value: Status; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
];

interface Props {
  filters: AdminReportFilters;
  update: (patch: Partial<Record<string, string | number | boolean | undefined>>) => void;
  clear: () => void;
  isAdmin: boolean;
}

export default function ReportFilterBar({ filters, update, clear, isAdmin }: Props) {
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [staffList, setStaffList] = useState<{ _id: string; name: string; role: string }[]>([]);

  useEffect(() => {
    buildingService.list().then(setBuildings).catch(() => {});
    if (isAdmin) {
      adminService.assignable().then(setStaffList).catch(() => {});
    }
  }, [isAdmin]);

  // Sync external search filter changes
  useEffect(() => {
    setSearchInput(filters.search || '');
  }, [filters.search]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== (filters.search || '')) {
        update({ search: searchInput || undefined });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, filters.search, update]);

  const hasActiveFilters = Boolean(
    filters.status ||
      filters.category ||
      filters.priority ||
      filters.building ||
      filters.assignedTo ||
      filters.overdue ||
      filters.search ||
      filters.from ||
      filters.to
  );

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-2xs space-y-3">
      {/* Top row: Search & Primary filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search report ID, title, room..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput('');
                update({ search: undefined });
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Select */}
        <div className="w-36">
          <select
            value={filters.overdue ? 'pending' : filters.status || ''}
            disabled={Boolean(filters.overdue)}
            onChange={(e) => update({ status: e.target.value || undefined })}
            className={`w-full py-2 px-2.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition ${
              filters.overdue
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                : 'bg-slate-50 text-slate-700 border-slate-200 focus:bg-white focus:border-blue-500'
            }`}
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Category Select */}
        <div className="w-36">
          <select
            value={filters.category || ''}
            onChange={(e) => update({ category: e.target.value || undefined })}
            className="w-full py-2 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Select */}
        <div className="w-32">
          <select
            value={filters.priority || ''}
            onChange={(e) => update({ priority: e.target.value || undefined })}
            className="w-full py-2 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          >
            <option value="">All Priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Building Select */}
        <div className="w-40">
          <select
            value={filters.building || ''}
            onChange={(e) => update({ building: e.target.value || undefined })}
            className="w-full py-2 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          >
            <option value="">All Buildings</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Assignee Select (Admin only) */}
        {isAdmin && (
          <div className="w-40">
            <select
              value={filters.assignedTo || ''}
              onChange={(e) => update({ assignedTo: e.target.value || undefined })}
              className="w-full py-2 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            >
              <option value="">All Assignees</option>
              <option value="unassigned">Unassigned</option>
              {staffList.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.role})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Bottom row: Overdue toggle, Date ranges, Clear button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-4">
          {/* Overdue Switch */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={Boolean(filters.overdue)}
              onChange={(e) => update({ overdue: e.target.checked || undefined })}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
            <span
              className={`text-xs font-semibold ${
                filters.overdue ? 'text-amber-700' : 'text-slate-600'
              }`}
            >
              Overdue Only (&gt;48h pending)
            </span>
          </label>

          {/* Date range */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>From:</span>
            <input
              type="date"
              value={filters.from ? filters.from.slice(0, 10) : ''}
              onChange={(e) => update({ from: e.target.value || undefined })}
              className="py-1 px-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
            />
            <span>To:</span>
            <input
              type="date"
              value={filters.to ? filters.to.slice(0, 10) : ''}
              onChange={(e) => update({ to: e.target.value || undefined })}
              className="py-1 px-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>
    </div>
  );
}
