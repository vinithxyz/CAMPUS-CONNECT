import { useCallback, useEffect, useRef, useState } from 'react';
import { adminService } from '../services/adminService';
import type { Paginated } from '../types';
import type { AdminReportFilters, AdminReportRow } from '../types/admin';
import { getErrorMessage } from '../services/api';

export function useAdminReports(filters: AdminReportFilters) {
  const [data, setData] = useState<Paginated<AdminReportRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const fetchReports = useCallback(async () => {
    const currentId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.reports(filters);
      if (currentId === requestIdRef.current) {
        setData(res);
      }
    } catch (err) {
      if (currentId === requestIdRef.current) {
        setError(getErrorMessage(err));
      }
    } finally {
      if (currentId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [filters]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return { data, loading, error, refetch: fetchReports };
}
