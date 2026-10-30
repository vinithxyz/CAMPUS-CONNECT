import Report from '../models/Report.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { ApiError } from '../utils/ApiError.js';
import { audit } from '../utils/audit.js';
import { scopeFilter } from '../middleware/adminScope.js';
import { applyStatusChange, statusLabel } from './statusService.js';

export async function changeStatusAs(ctx, reportId, { status, note }, via = 'ui') {
  const filter = {
    reportId: reportId.toUpperCase(),
    ...scopeFilter(ctx.user),
  };
  const report = await Report.findOne(filter);
  if (!report) throw new ApiError(404, 'Report not found or not assigned to you');

  if (!applyStatusChange(report, { status, note, actor: ctx.user })) {
    throw new ApiError(400, `Report is already ${statusLabel(status)}`);
  }
  await report.save();

  await Notification.create({
    user: report.reporter,
    report: report._id,
    type: 'status',
    message: `${report.reportId} "${report.title}" is now ${statusLabel(status)}`,
    link: `/complaints?selected=${report.reportId}`,
  });

  await audit(ctx, 'report.status', 'report', report.reportId, { status, note }, via);
  return report;
}

export async function assignReportAs(ctx, reportId, assigneeId, via = 'ui') {
  if (ctx.user.role !== 'admin') {
    throw new ApiError(403, 'Only admins can assign reports');
  }

  const report = await Report.findOne({ reportId: reportId.toUpperCase() });
  if (!report) throw new ApiError(404, 'Report not found');

  let assignee = null;
  if (assigneeId) {
    assignee = await User.findOne({ _id: assigneeId, role: { $in: ['staff', 'admin'] }, isActive: true });
    if (!assignee) throw new ApiError(400, 'Assignee must be an active staff member or admin');
  }

  report.assignedTo = assignee?._id;
  if (assignee && report.status === 'pending') {
    applyStatusChange(report, {
      status: 'in_progress',
      note: `Assigned to ${assignee.name}`,
      actor: ctx.user,
    });
  }
  await report.save();

  if (assignee) {
    await Notification.create({
      user: report.reporter,
      report: report._id,
      type: 'status',
      message: `${report.reportId} "${report.title}" has been assigned to the maintenance team`,
      link: `/complaints?selected=${report.reportId}`,
    });
  }

  await audit(ctx, 'report.assign', 'report', report.reportId, { assigneeId: assigneeId ?? null }, via);
  return {
    reportId: report.reportId,
    status: report.status,
    assignedTo: assignee ? { _id: assignee._id, name: assignee.name } : null,
  };
}
