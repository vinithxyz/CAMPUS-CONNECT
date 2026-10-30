import { overdueCutoff, scopeFilter } from '../middleware/adminScope.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function buildAdminReportFilter(user, q) {
  const f = { ...scopeFilter(user) };
  if (q.status) f.status = q.status;
  if (q.category) f.category = q.category;
  if (q.priority) f.priority = q.priority;
  if (q.building) f.building = q.building;
  if (user.role !== 'staff' && q.assignedTo) {
    f.assignedTo = q.assignedTo === 'unassigned' ? null : q.assignedTo; // null matches missing field too
  }
  const created = {};
  if (q.from) created.$gte = q.from;
  if (q.to) created.$lte = q.to;
  if (q.overdue) {
    f.status = 'pending';
    created.$lt = overdueCutoff();
  }
  if (Object.keys(created).length) f.createdAt = created;
  if (q.search) {
    const rx = new RegExp(escapeRegex(q.search), 'i');
    f.$or = [{ title: rx }, { reportId: rx }, { room: rx }];
  }
  return f;
}

const SORT_FIELD = { priority: 'priorityRank' };
export function sortSpec(sort = '-createdAt') {
  const desc = sort.startsWith('-');
  const key = sort.replace(/^-/, '');
  return { [SORT_FIELD[key] ?? key]: desc ? -1 : 1, _id: -1 };
}
