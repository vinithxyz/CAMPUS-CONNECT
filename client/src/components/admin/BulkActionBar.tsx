import { Layers, CheckSquare, X } from 'lucide-react';

interface Props {
  count: number;
  onOpenStatusDialog: () => void;
  onClear: () => void;
}

export default function BulkActionBar({ count, onOpenStatusDialog, onClear }: Props) {
  if (count === 0) return null;

  return (
    <aside
      aria-label="Bulk actions"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#0b2545] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-slide-up border border-white/10"
    >
      <div className="flex items-center gap-2 border-r border-white/20 pr-4">
        <CheckSquare className="w-4 h-4 text-blue-400" />
        <span className="text-xs font-bold tracking-wide">
          {count} {count === 1 ? 'report' : 'reports'} selected
        </span>
      </div>

      <button
        onClick={onOpenStatusDialog}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-xs transition"
      >
        <Layers className="w-3.5 h-3.5" />
        <span>Change Status</span>
      </button>

      <button
        onClick={onClear}
        className="flex items-center gap-1 text-xs text-slate-300 hover:text-white px-2 py-1 transition"
      >
        <X className="w-3.5 h-3.5" />
        <span>Clear</span>
      </button>
    </aside>
  );
}
