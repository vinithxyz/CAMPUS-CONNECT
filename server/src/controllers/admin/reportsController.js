import Report from '../../models/Report.js';
import ReportNote from '../../models/ReportNote.js';
import Notification from '../../models/Notification.js';
import User from '../../models/User.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { audit } from '../../utils/audit.js';
import { scopeFilter, overdueCutoff } from '../../middleware/adminScope.js';
import { buildAdminReportFilter, sortSpec } from '../../services/adminReportFilter.js';
import { applyStatusChange, statusLabel } from '../../services/statusService.js';

const findScoped = async (req) => {
  const r = await Report.findOne({ reportId: req.params.reportId.toUpperCase(), ...scopeFilter(req.user) });
  if (!r) throw new ApiError(404, 'Report not found');
  return r;
};

export const listReports = asyncHandler(async (req, res) => {
  const q = req.query;
  const filter = buildAdminReportFilter(req.user, q);
  const cutoff = overdueCutoff();
  const [rows, total] = await Promise.all([
    Report.find(filter)
      .select('-history')
      .sort(sortSpec(q.sort))
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .populate('building', 'name code')
      .populate('reporter', 'name rollNumber')
      .populate('assignedTo', 'name role')
      .lean(),
    Report.countDocuments(filter),
  ]);
  res.json({
    data: rows.map((r) => ({ ...r, isOverdue: r.status === 'pending' && r.createdAt < cutoff })),
    meta: { page: q.page, limit: q.limit, total },
  });
});

export const getReportDetail = asyncHandler(async (req, res) => {
  const r = await Report.findOne({ reportId: req.params.reportId.toUpperCase(), ...scopeFilter(req.user) })
    .populate('building', 'name code')
    .populate('reporter', 'name email rollNumber')
    .populate('assignedTo', 'name role')
    .populate('history.changedBy', 'name role')
    .lean();
  if (!r) throw new ApiError(404, 'Report not found');
  const notes = await ReportNote.find({ report: r._id }).sort('-createdAt').populate('author', 'name role').lean();
  res.json({ data: { ...r, isOverdue: r.status === 'pending' && r.createdAt < overdueCutoff(), notes } });
});

export const changeStatus = asyncHandler(async (req, res) => {
  const report = await findScoped(req);
  const { status, note } = req.body;
  if (!applyStatusChange(report, { status, note, actor: req.user })) {
    throw new ApiError(400, `Report is already ${statusLabel(status)}`);
  }
  await report.save();
  await Notification.create({
    user: report.reporter,
    report: report._id,
    message: `${report.reportId} "${report.title}" is now ${statusLabel(status)}`,
  });
  await audit(req, 'report.status', 'report', report.reportId, { status, note });
  res.json({ data: report });
});

export const assignReport = asyncHandler(async (req, res) => {
  const report = await Report.findOne({ reportId: req.params.reportId.toUpperCase() }); // admin only, no scope
  if (!report) throw new ApiError(404, 'Report not found');
  const { assigneeId } = req.body;
  let assignee = null;
  if (assigneeId) {
    assignee = await User.findOne({ _id: assigneeId, role: { $in: ['staff', 'admin'] }, isActive: true });
    if (!assignee) throw new ApiError(400, 'Assignee must be an active staff member or admin');
  }
  report.assignedTo = assignee?._id;
  if (assignee && report.status === 'pending') {
    applyStatusChange(report, { status: 'in_progress', note: `Assigned to ${assignee.name}`, actor: req.user });
  }
  await report.save();
  if (assignee) {
    await Notification.create({
      user: report.reporter,
      report: report._id,
      message: `${report.reportId} "${report.title}" has been assigned to the maintenance team`,
    });
  }
  await audit(req, 'report.assign', 'report', report.reportId, { assigneeId: assigneeId ?? null });
  res.json({
    data: {
      reportId: report.reportId,
      status: report.status,
      assignedTo: assignee ? { _id: assignee._id, name: assignee.name } : null,
    },
  });
});

export const addNote = asyncHandler(async (req, res) => {
  const report = await findScoped(req);
  const note = await ReportNote.create({ report: report._id, author: req.user._id, text: req.body.text });
  await audit(req, 'report.note', 'report', report.reportId);
  res.status(201).json({
    data: { ...note.toObject(), author: { _id: req.user._id, name: req.user.name, role: req.user.role } },
  });
});

export const bulkStatus = asyncHandler(async (req, res) => {
  const { reportIds, status, note } = req.body;
  const ids = [...new Set(reportIds.map((i) => i.toUpperCase()))];
  const reports = await Report.find({ reportId: { $in: ids } });
  const skipped = ids
    .filter((id) => !reports.some((r) => r.reportId === id))
    .map((id) => ({ reportId: id, reason: 'not found' }));
  const notifications = [];
  let updated = 0;

  for (const r of reports) {
    try {
      if (!applyStatusChange(r, { status, note, actor: req.user })) {
        skipped.push({ reportId: r.reportId, reason: `already ${statusLabel(status)}` });
        continue;
      }
      await r.save();
      updated++;
      notifications.push({
        user: r.reporter,
        report: r._id,
        message: `${r.reportId} "${r.title}" is now ${statusLabel(status)}`,
      });
    } catch (e) {
      skipped.push({ reportId: r.reportId, reason: e.message });
    }
  }

  if (notifications.length) await Notification.insertMany(notifications);
  await audit(req, 'report.bulk_status', 'report', ids.join(','), { status, note, updated, skipped: skipped.length });
  res.json({ data: { updated, skipped } });
});

// CSV: neutralise spreadsheet formula injection (cells starting with = + - @ tab CR)
const cell = (v) => {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export const exportCsv = asyncHandler(async (req, res) => {
  const rows = await Report.find(buildAdminReportFilter(req.user, req.query))
    .sort(sortSpec(req.query.sort))
    .limit(5000)
    .populate('building', 'name')
    .populate('reporter', 'name rollNumber')
    .populate('assignedTo', 'name')
    .lean();

  const head = [
    'Report ID',
    'Title',
    'Category',
    'Priority',
    'Status',
    'Building',
    'Room',
    'Reporter',
    'Roll number',
    'Assigned to',
    'Created',
    'Resolved',
  ];
  const lines = rows.map((r) =>
    [
      r.reportId,
      r.title,
      r.category,
      r.priority,
      r.status,
      r.building?.name,
      r.room,
      r.reporter?.name,
      r.reporter?.rollNumber,
      r.assignedTo?.name,
      r.createdAt?.toISOString(),
      r.resolvedAt?.toISOString(),
    ]
      .map(cell)
      .join(',')
  );

  await audit(req, 'report.export', 'report', 'csv', { rows: rows.length, filters: req.query });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="campusconnect-reports-${new Date().toISOString().slice(0, 10)}.csv"`
  );
  res.send([head.map(cell).join(','), ...lines].join('\n'));
});

export const listAssignable = asyncHandler(async (_req, res) => {
  const users = await User.find({ role: { $in: ['staff', 'admin'] }, isActive: true })
    .select('name role')
    .sort('name')
    .lean();
  res.json({ data: users });
});
