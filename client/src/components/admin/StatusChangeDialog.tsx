import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '../ui/Modal';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../services/api';
import type { Status } from '../../types';
import type { BulkResult } from '../../types/admin';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const schema = z.object({
  status: z.enum(['pending', 'in_progress', 'resolved'] as const),
  note: z.string().trim().max(500, 'Note must not exceed 500 characters').optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  reportId?: string; // single mode
  reportIds?: string[]; // bulk mode
  currentStatus?: Status;
  onSuccess: () => void;
}

export default function StatusChangeDialog({
  isOpen,
  onClose,
  reportId,
  reportIds,
  currentStatus,
  onSuccess,
}: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);

  const isBulk = Boolean(reportIds && reportIds.length > 0);
  const targetCount = isBulk ? reportIds!.length : 1;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: currentStatus === 'pending' ? 'in_progress' : 'resolved',
      note: '',
    },
  });

  const handleClose = () => {
    reset();
    setBulkResult(null);
    onClose();
  };

  const onSubmit = async (values: FormData) => {
    try {
      setLoading(true);
      if (isBulk) {
        const res = await adminService.bulkStatus(reportIds!, values.status, values.note);
        setBulkResult(res);
        toast.success(`Updated ${res.updated} reports (${res.skipped.length} skipped)`);
        onSuccess();
      } else if (reportId) {
        await adminService.changeStatus(reportId, values.status, values.note);
        toast.success(`Report ${reportId} updated to ${values.status.replace('_', ' ')}`);
        onSuccess();
        handleClose();
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isBulk ? `Change Status (${targetCount} Reports)` : `Update Status: ${reportId}`}
      maxWidth="md"
    >
      {bulkResult ? (
        <div className="space-y-4">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Successfully updated {bulkResult.updated} reports</span>
            </div>
            {bulkResult.skipped.length > 0 && (
              <div className="space-y-1 pt-2 border-t border-slate-200">
                <span className="font-semibold text-amber-700 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Skipped {bulkResult.skipped.length} reports:
                </span>
                <ul className="list-disc pl-5 space-y-0.5 text-slate-600">
                  {bulkResult.skipped.map((s) => (
                    <li key={s.reportId}>
                      <span className="font-mono font-medium">{s.reportId}</span>: {s.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
          >
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">New Status</label>
            <select
              {...register('status')}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="pending" disabled={currentStatus === 'pending'}>
                Pending {currentStatus === 'pending' ? '(current)' : ''}
              </option>
              <option value="in_progress" disabled={currentStatus === 'in_progress'}>
                In Progress {currentStatus === 'in_progress' ? '(current)' : ''}
              </option>
              <option value="resolved" disabled={currentStatus === 'resolved'}>
                Resolved {currentStatus === 'resolved' ? '(current)' : ''}
              </option>
            </select>
            {errors.status && <p className="text-[11px] text-rose-500">{errors.status.message}</p>}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Maintenance Note</label>
              <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                Visible to the student
              </span>
            </div>
            <textarea
              {...register('note')}
              rows={3}
              placeholder="Explain the update, repair steps, or resolution details..."
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none"
            />
            {errors.note && <p className="text-[11px] text-rose-500">{errors.note.message}</p>}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-60"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isBulk ? 'Apply to Selected' : 'Update Status'}</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
