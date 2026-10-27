import type { Priority } from '../../types';

interface Props {
  priority: Priority;
  size?: 'sm' | 'md';
}

export default function PriorityBadge({ priority, size = 'md' }: Props) {
  const styles: Record<Priority, { text: string; label: string; bg?: string }> = {
    low: { text: 'text-emerald-600', label: 'Low', bg: 'bg-emerald-50 border-emerald-100' },
    medium: { text: 'text-amber-500', label: 'Medium', bg: 'bg-amber-50 border-amber-100' },
    high: { text: 'text-rose-600', label: 'High', bg: 'bg-rose-50 border-rose-100' },
    critical: { text: 'text-purple-600', label: 'Critical', bg: 'bg-purple-50 border-purple-100' },
  };

  const current = styles[priority] ?? styles.medium;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center rounded-md border ${current.bg} ${current.text} ${padding}`}
    >
      {current.label}
    </span>
  );
}
