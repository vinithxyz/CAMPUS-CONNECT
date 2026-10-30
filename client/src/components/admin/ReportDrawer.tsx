import { useEffect, useState } from 'react';
import {
  X,
  MapPin,
  Calendar,
  User,
  Mail,
  GraduationCap,
  Loader2,
  Maximize2,
  RefreshCw,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import StatusBadge from '../ui/StatusBadge';
import PriorityBadge from '../ui/PriorityBadge';
import StatusTimeline from '../reports/StatusTimeline';
import NotesPanel from './NotesPanel';
import AssignSelect from './AssignSelect';
import StatusChangeDialog from './StatusChangeDialog';
import type { AdminReportDetail } from '../../types/admin';
import { formatDateTime } from '../../utils/format';

interface Props {
  reportId?: string;
  isOpen: boolean;
  onClose: () => void;
  onReportUpdated: () => void;
  isAdmin: boolean;
}

export default function ReportDrawer({
  reportId,
  isOpen,
  onClose,
  onReportUpdated,
  isAdmin,
}: Props) {
  const [detail, setDetail] = useState<AdminReportDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchDetail = async () => {
    if (!reportId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.report(reportId);
      setDetail(data);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to load report details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && reportId) {
      fetchDetail();
    } else {
      setDetail(null);
    }
  }, [isOpen, reportId]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (previewImage) setPreviewImage(null);
        else if (statusDialogOpen) setStatusDialogOpen(false);
        else onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, previewImage, statusDialogOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Report ${reportId || ''} details`}
      className="fixed inset-0 z-50 flex justify-end animate-fade-in"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="relative w-full sm:max-w-xl bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-200 animate-slide-left">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-base font-bold text-slate-900">{reportId}</span>
            {detail && <StatusBadge status={detail.status} size="sm" />}
            {detail?.isOverdue && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                Overdue
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={fetchDetail}
              title="Refresh details"
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              aria-label="Close drawer"
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading && !detail ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-xs">Loading report...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
              {error}
            </div>
          ) : detail ? (
            <>
              {/* Title & Metadata */}
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-bold text-slate-900 leading-snug">
                    {detail.title}
                  </h2>
                  <PriorityBadge priority={detail.priority} size="sm" />
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span className="capitalize font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {detail.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDateTime(detail.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {detail.building?.name} ({detail.room})
                  </span>
                </div>
              </div>

              {/* Actions: Change Status & Assignee */}
              <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Actions</span>
                  <button
                    onClick={() => setStatusDialogOpen(true)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition"
                  >
                    Change Status
                  </button>
                </div>

                {isAdmin ? (
                  <AssignSelect
                    reportId={detail.reportId}
                    currentAssigneeId={detail.assignedTo?._id || null}
                    currentAssigneeName={detail.assignedTo?.name}
                    onSuccess={() => {
                      fetchDetail();
                      onReportUpdated();
                    }}
                  />
                ) : (
                  <div className="text-xs text-slate-600 flex items-center justify-between">
                    <span className="text-slate-400">Assigned To:</span>
                    <span className="font-semibold text-slate-700">
                      {detail.assignedTo?.name || 'Unassigned'}
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Description
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100 whitespace-pre-wrap">
                  {detail.description}
                </p>
              </div>

              {/* Photos */}
              {detail.images && detail.images.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Attached Photos ({detail.images.length})
                  </h4>
                  <div className="grid grid-cols-3 gap-2.5">
                    {detail.images.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setPreviewImage(img.url)}
                        className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 cursor-pointer bg-slate-100"
                      >
                        <img
                          src={img.url}
                          alt="Attachment"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                        />
                        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                          <Maximize2 className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reporter Contact Card */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Reporter Information
                </h4>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 font-medium text-slate-800">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{detail.reporter?.name || 'Unknown Student'}</span>
                  </div>
                  {detail.reporter?.rollNumber && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                      <span>Roll Number: {detail.reporter.rollNumber}</span>
                    </div>
                  )}
                  {detail.reporter?.email && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{detail.reporter.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Internal Notes Panel */}
              <NotesPanel
                reportId={detail.reportId}
                notes={detail.notes || []}
                onNoteAdded={fetchDetail}
              />

              {/* Status Timeline */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Status History
                </h4>
                <StatusTimeline history={detail.history || []} />
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Single status change modal */}
      {detail && (
        <StatusChangeDialog
          isOpen={statusDialogOpen}
          onClose={() => setStatusDialogOpen(false)}
          reportId={detail.reportId}
          currentStatus={detail.status}
          onSuccess={() => {
            fetchDetail();
            onReportUpdated();
          }}
        />
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img
              src={previewImage}
              alt="Enlarged attachment"
              className="max-w-full max-h-[85vh] rounded-lg object-contain"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
