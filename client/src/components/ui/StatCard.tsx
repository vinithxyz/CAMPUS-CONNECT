import type { ReactNode } from 'react';

interface Props {
  label: string;
  value: number | string;
  icon: ReactNode;
  tone: 'red' | 'amber' | 'green' | 'purple';
}

export default function StatCard({ label, value, icon, tone }: Props) {
  const tones = {
    red: 'bg-rose-500 text-white',
    amber: 'bg-amber-400 text-white',
    green: 'bg-emerald-500 text-white',
    purple: 'bg-indigo-600 text-white',
  };

  return (
    <div className="bg-white rounded-xl p-3.5 sm:p-5 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] flex items-center gap-3 sm:gap-4 transition hover:shadow-md">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${tones[tone]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] sm:text-xs font-medium text-slate-400 tracking-wide truncate">{label}</p>
        <p className="text-xl sm:text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
