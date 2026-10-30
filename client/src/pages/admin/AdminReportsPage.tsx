import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAdminReportFilters } from '../../hooks/useAdminReportFilters';
import { useAdminReports } from '../../hooks/useAdminReports';
import ReportFilterBar from '../../components/admin/ReportFilterBar';
import AdminReportsTable from '../../components/admin/AdminReportsTable';
import BulkActionBar from '../../components/admin/BulkActionBar';
import StatusChangeDialog from '../../components/admin/StatusChangeDialog';
import ReportDrawer from '../../components/admin/ReportDrawer';
import ExportButton from '../../components/admin/ExportButton';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

export default function AdminReportsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const { filters, update, selected, clear } = useAdminReportFilters();
  const { data, loading, error, refetch } = useAdminReports(filters);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);

  // Clear selections when any filter or page changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [
    filters.status,
    filters.category,
    filters.priority,
    filters.building,
    filters.assignedTo,
    filters.overdue,
    filters.search,
    filters.from,
    filters.to,
    filters.page,
  ]);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (!data?.data) return;
    setSelectedIds((prev) =>
      prev.size === data.data.length ? new Set() : new Set(data.data.map((r) => r.reportId))
    );
  };

  const handleSort = (field: string) => {
    const current = filters.sort || '-createdAt';
    if (current === field) {
      update({ sort: `-${field}` });
    } else if (current === `-${field}`) {
      update({ sort: field });
    } else {
      update({ sort: `-${field}` });
    }
  };

  const totalPages = data?.meta ? Math.ceil(data.meta.total / (data.meta.limit || 20)) : 1;
  const currentPage = filters.page || 1;

  return (
    <div className="space-y-4 pb-12">
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Maintenance Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Filter, inspect, assign, and update campus problem reports
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && <ExportButton filters={filters} />}
          <button
            onClick={() => refetch()}
            disabled={loading}
            title="Refresh table"
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition shadow-2xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <ReportFilterBar
        filters={filters}
        update={update}
        clear={clear}
        isAdmin={isAdmin}
      />

      {error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
          {error}
        </div>
      ) : (
        <>
          {/* Reports Data Table */}
          <AdminReportsTable
            rows={data?.data || []}
            selectedIds={selectedIds}
            onToggle={toggle}
            onToggleAll={toggleAll}
            onOpen={(reportId) => update({ report: reportId })}
            sort={filters.sort || '-createdAt'}
            onSort={handleSort}
            isAdmin={isAdmin}
            loading={loading}
          />

          {/* Pagination Controls */}
          {data?.meta && data.meta.total > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2 py-2 text-xs text-slate-500">
              <span>
                Showing {(currentPage - 1) * (data.meta.limit || 20) + 1} to{' '}
                {Math.min(currentPage * (data.meta.limit || 20), data.meta.total)} of{' '}
                {data.meta.total} reports
              </span>

              <div className="flex items-center gap-1.5 self-center sm:self-auto">
                <button
                  disabled={currentPage <= 1 || loading}
                  onClick={() => update({ page: currentPage - 1 })}
                  className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <span className="px-2 font-medium text-slate-700">
                  {currentPage} / {totalPages || 1}
                </span>
                <button
                  disabled={currentPage >= totalPages || loading}
                  onClick={() => update({ page: currentPage + 1 })}
                  className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Bulk Action Bar (Admin only) */}
      {isAdmin && (
        <BulkActionBar
          count={selectedIds.size}
          onOpenStatusDialog={() => setBulkDialogOpen(true)}
          onClear={() => setSelectedIds(new Set())}
        />
      )}

      {/* Bulk Status Dialog */}
      {bulkDialogOpen && (
        <StatusChangeDialog
          isOpen={bulkDialogOpen}
          onClose={() => setBulkDialogOpen(false)}
          reportIds={Array.from(selectedIds)}
          onSuccess={() => {
            refetch();
            setSelectedIds(new Set());
          }}
        />
      )}

      {/* Right-side Detail Drawer (Deep linked via URL ?report=CPxxxx) */}
      <ReportDrawer
        reportId={selected}
        isOpen={Boolean(selected)}
        onClose={() => update({ report: undefined })}
        onReportUpdated={() => refetch()}
        isAdmin={isAdmin}
      />
    </div>
  );
}
