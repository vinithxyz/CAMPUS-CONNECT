import { api } from './api';
import type { HeatPoint, MapReport, Paginated, Status } from '../types';
import type {
  AdminReportDetail,
  AdminReportFilters,
  AdminReportRow,
  AdminStats,
  AdminUser,
  AuditEntry,
  BulkResult,
  ReportNote,
} from '../types/admin';

const clean = (o: object) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== ''));

export const adminService = {
  stats: (days = 30) =>
    api.get<{ data: AdminStats }>('/admin/stats', { params: { days } }).then((r) => r.data.data),

  reports: (f: AdminReportFilters) =>
    api.get<Paginated<AdminReportRow>>('/admin/reports', { params: clean(f) }).then((r) => r.data),

  report: (id: string) =>
    api.get<{ data: AdminReportDetail }>(`/admin/reports/${id}`).then((r) => r.data.data),

  changeStatus: (id: string, status: Status, note?: string) =>
    api.patch(`/admin/reports/${id}/status`, { status, note }).then((r) => r.data.data),

  assign: (id: string, assigneeId: string | null) =>
    api.patch(`/admin/reports/${id}/assign`, { assigneeId }).then((r) => r.data.data),

  addNote: (id: string, text: string) =>
    api.post<{ data: ReportNote }>(`/admin/reports/${id}/notes`, { text }).then((r) => r.data.data),

  bulkStatus: (reportIds: string[], status: Status, note?: string) =>
    api
      .post<{ data: BulkResult }>('/admin/reports/bulk-status', { reportIds, status, note })
      .then((r) => r.data.data),

  assignable: () =>
    api
      .get<{ data: { _id: string; name: string; role: string }[] }>('/admin/staff')
      .then((r) => r.data.data),

  exportCsv: async (f: AdminReportFilters) => {
    const res = await api.get('/admin/reports/export', { params: clean(f), responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: `campusconnect-reports-${new Date().toISOString().slice(0, 10)}.csv`,
    });
    a.click();
    URL.revokeObjectURL(url);
  },

  mapReports: (p: { categories: string[]; statuses: string[]; from?: string; to?: string }) =>
    api
      .get<{ data: MapReport[] }>('/admin/map/reports', {
        params: clean({ ...p, categories: p.categories.join(','), statuses: p.statuses.join(',') }),
      })
      .then((r) => r.data.data),

  heat: (p: { categories: string[]; statuses: string[]; from?: string; to?: string }) =>
    api
      .get<{ data: HeatPoint[] }>('/admin/map/heat', {
        params: clean({ ...p, categories: p.categories.join(','), statuses: p.statuses.join(',') }),
      })
      .then((r) => r.data.data),

  users: (p: { role?: string; search?: string; page?: number }) =>
    api.get<Paginated<AdminUser>>('/admin/users', { params: clean(p) }).then((r) => r.data),

  updateUser: (id: string, body: { role?: string; isActive?: boolean }) =>
    api.patch(`/admin/users/${id}`, body).then((r) => r.data.data),

  createBuilding: (b: { name: string; code: string; lat: number; lng: number }) =>
    api.post('/admin/buildings', b).then((r) => r.data.data),

  updateBuilding: (id: string, b: Partial<{ name: string; code: string; lat: number; lng: number }>) =>
    api.patch(`/admin/buildings/${id}`, b).then((r) => r.data.data),

  deleteBuilding: (id: string) => api.delete(`/admin/buildings/${id}`),

  audit: (p: { actor?: string; action?: string; from?: string; to?: string; page?: number }) =>
    api.get<Paginated<AuditEntry>>('/admin/audit', { params: clean(p) }).then((r) => r.data),
};
