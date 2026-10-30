import type { Category, Priority, Report, Role, Status, HistoryEntry } from './index';

export interface AdminReportRow extends Omit<Report, 'building' | 'history'> {
  building: { _id: string; name: string; code: string };
  reporter: { _id: string; name: string; rollNumber?: string };
  assignedTo?: { _id: string; name: string; role: Role } | null;
  isOverdue: boolean;
}

export interface ReportNote {
  _id: string;
  text: string;
  createdAt: string;
  author: { _id: string; name: string; role: Role };
}

export interface AdminReportDetail extends AdminReportRow {
  reporter: { _id: string; name: string; email: string; rollNumber?: string };
  history: HistoryEntry[];
  notes: ReportNote[];
}

export interface AdminStats {
  totals: {
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    overdue: number;
    avgResolutionHours: number | null;
  };
  trend: { date: string; created: number; resolved: number }[];
  byCategory: { category: Category; count: number }[];
  byBuilding: { name: string; count: number }[];
  byPriority: { priority: Priority; count: number }[];
  attention: { reportId: string; title: string; priority: Priority; status: Status; createdAt: string }[];
  rangeDays: number;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  rollNumber?: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface AuditEntry {
  _id: string;
  actor: { _id: string; name: string; role: Role };
  actorRole: Role;
  action: string;
  targetType: string;
  targetId: string;
  meta?: unknown;
  createdAt: string;
}

export interface BulkResult {
  updated: number;
  skipped: { reportId: string; reason: string }[];
}

export interface AdminReportFilters {
  status?: Status;
  category?: Category;
  priority?: Priority;
  building?: string;
  assignedTo?: string;
  overdue?: boolean;
  search?: string;
  from?: string;
  to?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface KnowledgeArticleItem {
  _id: string;
  title: string;
  body: string;
  category: 'hostel' | 'canteen' | 'wifi' | 'contacts' | 'emergency' | 'reporting' | 'general';
  tags: string[];
  published: boolean;
  updatedBy?: { _id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

