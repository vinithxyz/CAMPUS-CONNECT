import { api } from './api';
import type { Paginated, Report, Status } from '../types';

export const adminService = {
  listReports: (q: { status?: Status; category?: string; page?: number; limit?: number } = {}) =>
    api.get<Paginated<Report>>('/admin/reports', { params: q }).then((r) => r.data),
  updateStatus: (reportId: string, d: { status: Status; note?: string }) =>
    api.patch<{ data: Report }>(`/admin/reports/${reportId}/status`, d).then((r) => r.data.data),
};
