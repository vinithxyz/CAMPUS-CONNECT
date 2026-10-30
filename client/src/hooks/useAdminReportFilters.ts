import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { AdminReportFilters } from '../types/admin';

export function useAdminReportFilters() {
  const [params, setParams] = useSearchParams();

  const filters = useMemo<AdminReportFilters>(
    () => ({
      status: (params.get('status') as AdminReportFilters['status']) ?? undefined,
      category: (params.get('category') as AdminReportFilters['category']) ?? undefined,
      priority: (params.get('priority') as AdminReportFilters['priority']) ?? undefined,
      building: params.get('building') ?? undefined,
      assignedTo: params.get('assignedTo') ?? undefined,
      overdue: params.get('overdue') === 'true' || undefined,
      search: params.get('search') ?? undefined,
      from: params.get('from') ?? undefined,
      to: params.get('to') ?? undefined,
      sort: params.get('sort') ?? '-createdAt',
      page: Number(params.get('page') ?? 1),
      limit: 20,
    }),
    [params]
  );

  const update = (patch: Partial<Record<string, string | number | boolean | undefined>>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(patch)) {
          if (v === undefined || v === '' || v === false) next.delete(k);
          else next.set(k, String(v));
        }
        if (!('page' in patch)) next.delete('page'); // any filter change resets paging
        return next;
      },
      { replace: true }
    );

  const selected = params.get('report') ?? undefined; // drawer deep link: ?report=CP0012
  return { filters, update, selected, clear: () => setParams({}, { replace: true }) };
}
