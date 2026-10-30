import { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import AuditTable from '../../components/admin/AuditTable';
import type { AuditEntry } from '../../types/admin';
import { ChevronLeft, ChevronRight, RefreshCw, Filter } from 'lucide-react';

export default function AdminAuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchAudit = async () => {
    try {
      setLoading(true);
      const res = await adminService.audit({
        action: action.trim() || undefined,
        from: from ? new Date(from).toISOString() : undefined,
        to: to ? new Date(to).toISOString() : undefined,
        page,
      });
      setEntries(res.data);
      setTotal(res.meta.total);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, [page, action, from, to]);

  const totalPages = Math.ceil(total / 30) || 1;

  const handleReset = () => {
    setAction('');
    setFrom('');
    setTo('');
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Security & Audit Logs
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable system logs tracking administrative mutations, status changes, and assignments
          </p>
        </div>

        <button
          onClick={fetchAudit}
          disabled={loading}
          title="Refresh audit log"
          className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Action filter */}
            <div className="w-48">
              <input
                type="text"
                value={action}
                onChange={(e) => {
                  setAction(e.target.value);
                  setPage(1);
                }}
                placeholder="Filter by action (e.g. report.status)..."
                className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Date range */}
            <div className="flex items-center gap-2 text-slate-500">
              <span>From:</span>
              <input
                type="date"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPage(1);
                }}
                className="py-1 px-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
              />
              <span>To:</span>
              <input
                type="date"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setPage(1);
                }}
                className="py-1 px-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {(action || from || to) && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Audit Log Table */}
      <AuditTable entries={entries} loading={loading} />

      {/* Pagination */}
      {total > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2 py-2 text-xs text-slate-500">
          <span>
            Showing {(page - 1) * 30 + 1} to {Math.min(page * 30, total)} of {total} log entries
          </span>

          <div className="flex items-center gap-1.5 self-center sm:self-auto">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
              className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <span className="px-2 font-medium text-slate-700">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
