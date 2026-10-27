import { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, Edit3, Loader2 } from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';
import PriorityBadge from '../components/ui/PriorityBadge';
import Modal from '../components/ui/Modal';
import { adminService } from '../services/adminService';
import { formatDate } from '../utils/format';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import type { Report, Status } from '../types';

export default function AdminReportsPage() {
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Status Change Modal State
  const [editReport, setEditReport] = useState<Report | null>(null);
  const [newStatus, setNewStatus] = useState<Status>('in_progress');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await adminService.listReports({
        status: (filterStatus as Status) || undefined,
        limit: 50,
      });
      setReports(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filterStatus]);

  const handleOpenStatusModal = (r: Report) => {
    setEditReport(r);
    setNewStatus(r.status === 'pending' ? 'in_progress' : r.status === 'in_progress' ? 'resolved' : 'pending');
    setNote('');
  };

  const handleSaveStatus = async () => {
    if (!editReport) return;
    try {
      setSaving(true);
      await adminService.updateStatus(editReport.reportId, {
        status: newStatus,
        note: note.trim() || undefined,
      });
      toast.success(`Report #${editReport.reportId} updated to ${newStatus}`);
      setEditReport(null);
      fetchReports();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Staff / Maintenance Portal</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Manage All Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review submitted facilities complaints and update statuses with maintenance notes
          </p>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <button
            onClick={fetchReports}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800"
            aria-label="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Reports Table & Mobile Cards */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Mobile View (< md) */}
        <div className="block md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="px-6 py-12 text-center text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
              Loading campus reports...
            </div>
          ) : reports.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400">No reports found.</div>
          ) : (
            reports.map((r) => (
              <div key={r.reportId} className="p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">#{r.reportId}</span>
                  <div className="flex items-center gap-1.5">
                    <PriorityBadge priority={r.priority} size="sm" />
                    <StatusBadge status={r.status} size="sm" />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-800 leading-snug">{r.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {r.room} • {r.category}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-50 text-[11px] text-slate-400">
                  <span>Reported by: <span className="text-slate-600 font-medium">{r.reporter?.name || 'Student'}</span></span>
                  <button
                    onClick={() => handleOpenStatusModal(r)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Update</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-400 font-medium border-b border-slate-100">
              <tr>
                <th className="px-5 py-3 font-semibold">ID</th>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Reporter</th>
                <th className="px-4 py-3 font-semibold">Location</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Priority</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Date</th>
                <th className="px-5 py-3 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading campus reports...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                    No reports found.
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.reportId} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-bold text-slate-800">#{r.reportId}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800 max-w-xs truncate">
                      {r.title}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {r.reporter?.name || 'Student'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">{r.room}</td>
                    <td className="px-4 py-3.5 text-slate-600 capitalize">{r.category}</td>
                    <td className="px-4 py-3.5">
                      <PriorityBadge priority={r.priority} size="sm" />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={r.status} size="sm" />
                    </td>
                    <td className="px-4 py-3.5 text-right text-slate-400">
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => handleOpenStatusModal(r)}
                        className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition"
                        title="Change status"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Change Status Modal */}
      <Modal
        isOpen={Boolean(editReport)}
        onClose={() => setEditReport(null)}
        title={`Update Status - #${editReport?.reportId}`}
      >
        <div className="space-y-4 text-xs">
          <div>
            <p className="font-semibold text-slate-800">{editReport?.title}</p>
            <p className="text-slate-500 mt-0.5">{editReport?.room}</p>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">New Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as Status)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Update Note / Reason</label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Technician dispatched to replace tap washer"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              onClick={() => setEditReport(null)}
              className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveStatus}
              disabled={saving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl font-semibold shadow-sm flex items-center gap-1.5"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Update Status</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
