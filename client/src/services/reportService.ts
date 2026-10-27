import { api } from './api';
import type { Paginated, Report, ReportStats, Status, Category } from '../types';

export interface ReportQuery {
  status?: Status;
  category?: Category;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export const reportService = {
  list: (q: ReportQuery = {}) =>
    api.get<Paginated<Report>>('/reports', { params: q }).then((r) => r.data),
  get: (id: string) => api.get<{ data: Report }>(`/reports/${id}`).then((r) => r.data.data),
  stats: () => api.get<{ data: ReportStats }>('/reports/stats').then((r) => r.data.data),
  create: (form: FormData) =>
    api.post<{ data: Report }>('/reports', form).then((r) => r.data.data),
};
