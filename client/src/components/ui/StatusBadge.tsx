import type { Status } from '../../types';

interface Props {
  status: Status;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: Props) {
  const styles: Record<Status, { bg: string; text: string; border: string; label: string }> = {
    pending: {
      bg: 'bg-red-50',
      text: 'text-red-500',
      border: 'border-red-200',
      label: 'Pending',
    },
    in_progress: {
      bg: 'bg-sky-50',
      text: 'text-sky-500',
      border: 'border-sky-200',
      label: 'In Progress',
    },
    resolved: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-500',
      border: 'border-emerald-200',
      label: 'Resolved',
    },
  };

  const current = styles[status] ?? styles.pending;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center rounded-full border ${current.bg} ${current.text} ${current.border} ${padding}`}
    >
      {current.label}
    </span>
  );
}
