import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../services/api';
import type { AdminReportFilters } from '../../types/admin';

interface Props {
  filters: AdminReportFilters;
}

export default function ExportButton({ filters }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      await adminService.exportCsv(filters);
      toast.success('Reports exported to CSV');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition disabled:opacity-60"
      aria-label="Export reports to CSV"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
      ) : (
        <Download className="w-3.5 h-3.5 text-slate-500" />
      )}
      <span>Export CSV</span>
    </button>
  );
}
