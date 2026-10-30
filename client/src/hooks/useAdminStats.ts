import { useCallback, useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import type { AdminStats } from '../types/admin';
import { getErrorMessage } from '../services/api';

export function useAdminStats(days = 30) {
  const [data, setData] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await adminService.stats(days);
      setData(stats);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { data, loading, error, refetch: fetchStats };
}
