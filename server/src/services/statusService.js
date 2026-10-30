import { ApiError } from '../utils/ApiError.js';

/** Mutates the report document (does not save). Returns false if nothing changed. */
export function applyStatusChange(report, { status, note, actor }) {
  if (report.status === status) return false;
  if (report.status === 'resolved' && actor.role !== 'admin') {
    throw new ApiError(403, 'Only an admin can reopen a resolved report');
  }
  report.status = status;
  report.resolvedAt = status === 'resolved' ? new Date() : undefined;
  report.history.push({ status, note, changedBy: actor._id });
  return true;
}

export const statusLabel = (s) => s.replace('_', ' ');
