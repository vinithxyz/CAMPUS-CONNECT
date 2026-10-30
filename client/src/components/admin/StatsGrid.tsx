import { Link } from 'react-router-dom';
import { ClipboardList, Clock, AlertTriangle, CheckCircle2, AlertCircle, Timer } from 'lucide-react';
import type { AdminStats } from '../../types/admin';

interface Props {
  totals?: AdminStats['totals'];
  loading?: boolean;
}

export default function StatsGrid({ totals, loading }: Props) {
  if (loading || !totals) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-slate-100 animate-pulse h-24" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: 'Total Reports',
      value: totals.total,
      icon: <ClipboardList className="w-5 h-5 text-indigo-600" />,
      bg: 'bg-indigo-50 border-indigo-100',
    },
    {
      label: 'Pending',
      value: totals.pending,
      icon: <Clock className="w-5 h-5 text-rose-600" />,
      bg: 'bg-rose-50 border-rose-100',
    },
    {
      label: 'In Progress',
      value: totals.inProgress,
      icon: <AlertCircle className="w-5 h-5 text-sky-600" />,
      bg: 'bg-sky-50 border-sky-100',
    },
    {
      label: 'Resolved',
      value: totals.resolved,
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      bg: 'bg-emerald-50 border-emerald-100',
    },
    {
      label: 'Overdue',
      value: totals.overdue,
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
      bg: 'bg-amber-50 border-amber-200 hover:border-amber-300 transition',
      link: '/admin/reports?overdue=true',
      badge: 'Action Needed',
    },
    {
      label: 'Avg Resolution',
      value: totals.avgResolutionHours != null ? `${totals.avgResolutionHours}h` : 'n/a',
      icon: <Timer className="w-5 h-5 text-purple-600" />,
      bg: 'bg-purple-50 border-purple-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {cards.map((c, i) => {
        const inner = (
          <div
            className={`rounded-xl p-4 border flex flex-col justify-between h-full bg-white shadow-2xs ${
              c.link ? 'hover:shadow-md cursor-pointer group' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">{c.label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.bg}`}>
                {c.icon}
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition">
                {c.value}
              </span>
              {c.badge && (
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                  {c.badge}
                </span>
              )}
            </div>
          </div>
        );

        return c.link ? (
          <Link key={i} to={c.link} className="block">
            {inner}
          </Link>
        ) : (
          <div key={i}>{inner}</div>
        );
      })}
    </div>
  );
}
