import { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../services/api';
import { UserCheck, Loader2 } from 'lucide-react';

interface Props {
  reportId: string;
  currentAssigneeId?: string | null;
  currentAssigneeName?: string;
  onSuccess: () => void;
}

export default function AssignSelect({
  reportId,
  currentAssigneeId,
  currentAssigneeName,
  onSuccess,
}: Props) {
  const { toast } = useToast();
  const [staffList, setStaffList] = useState<{ _id: string; name: string; role: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string>(currentAssigneeId || '');

  useEffect(() => {
    adminService.assignable().then(setStaffList).catch(() => {});
  }, []);

  useEffect(() => {
    setSelected(currentAssigneeId || '');
  }, [currentAssigneeId]);

  const handleChange = async (newVal: string) => {
    const targetName =
      newVal === ''
        ? 'Unassigned'
        : staffList.find((s) => s._id === newVal)?.name || 'staff member';

    if (
      !confirm(
        `Are you sure you want to assign report ${reportId} to ${targetName}?`
      )
    ) {
      setSelected(currentAssigneeId || '');
      return;
    }

    try {
      setLoading(true);
      await adminService.assign(reportId, newVal === '' ? null : newVal);
      toast.success(
        newVal === ''
          ? `Report ${reportId} unassigned`
          : `Report ${reportId} assigned to ${targetName}`
      );
      setSelected(newVal);
      onSuccess();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setSelected(currentAssigneeId || '');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
          Assignee
        </span>
        {loading && <Loader2 className="w-3 h-3 animate-spin text-blue-600" />}
      </label>
      <select
        value={selected}
        disabled={loading}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
      >
        <option value="">Unassigned</option>
        {staffList.map((s) => (
          <option key={s._id} value={s._id}>
            {s.name} ({s.role})
          </option>
        ))}
      </select>
    </div>
  );
}
