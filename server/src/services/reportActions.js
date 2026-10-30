import Report from '../models/Report.js';
import ReportComment from '../models/ReportComment.js';
import ReportSupport from '../models/ReportSupport.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { nextReportId } from '../utils/reportId.js';

const imgs = (atts = []) => atts.map((a) => ({ url: a.url, filename: a.originalName ?? a.file }));

const own = async (user, reportId) => {
  const r = await Report.findOne({ reportId: reportId.toUpperCase(), reporter: user._id });
  if (!r) throw new ApiError(404, 'No report with that ID in your account');
  return r;
};

const notifyTeam = async (report, message) => {
  const targets = report.assignedTo
    ? [report.assignedTo]
    : (await User.find({ role: 'admin', isActive: true }).select('_id').lean()).map((u) => u._id);
  if (targets.length) {
    await Notification.insertMany(
      targets.map((user) => ({
        user,
        report: report._id,
        type: 'status',
        message,
        link: `/admin/reports?report=${report.reportId}`,
      }))
    );
  }
};

export async function createReportForUser(user, d, attachments = []) {
  return Report.create({
    reportId: await nextReportId(),
    title: d.title,
    description: d.description,
    originalDescription: d.originalDescription,
    category: d.category,
    priority: d.priority ?? 'medium',
    building: d.building,
    room: d.room,
    location: { type: 'Point', coordinates: [d.lng, d.lat] },
    images: imgs(attachments),
    reporter: user._id,
    history: [{ status: 'pending', note: 'Report submitted', changedBy: user._id }],
  });
}

export async function addStudentComment(user, reportId, { text = '', attachments = [] }) {
  const report = await own(user, reportId);
  if (report.status === 'cancelled') throw new ApiError(400, 'This report was cancelled');
  if (!text.trim() && !attachments.length) throw new ApiError(400, 'Add some text or a photo');
  if ((await ReportComment.countDocuments({ report: report._id })) >= 20) {
    throw new ApiError(400, 'This report has reached the update limit');
  }
  const c = await ReportComment.create({
    report: report._id,
    author: user._id,
    text,
    images: imgs(attachments),
  });
  await notifyTeam(report, `Student update on ${report.reportId} "${report.title}"`);
  return c;
}

export function assertReopenable(report) {
  if (report.status !== 'resolved') throw new ApiError(400, 'Only resolved reports can be reopened');
  const ageMs = Date.now() - new Date(report.resolvedAt ?? report.updatedAt).getTime();
  if (ageMs > env.REOPEN_WINDOW_DAYS * 86400000) {
    throw new ApiError(
      400,
      `The ${env.REOPEN_WINDOW_DAYS}-day reopen window has passed. Please submit a new report.`
    );
  }
  if ((report.reopenCount ?? 0) >= env.MAX_REOPENS) {
    throw new ApiError(
      400,
      'This report has already been reopened the maximum number of times. Please submit a new report.'
    );
  }
}

export async function reopenByReporter(user, reportId, reason) {
  const report = await own(user, reportId);
  assertReopenable(report);
  report.status = 'pending';
  report.resolvedAt = undefined;
  report.reopenCount = (report.reopenCount ?? 0) + 1;
  report.followUpAt = report.followUpSentAt = report.fixConfirmed = undefined;
  report.history.push({ status: 'pending', note: `Reopened by student: ${reason}`, changedBy: user._id });
  await report.save();
  await notifyTeam(report, `${report.reportId} "${report.title}" was reopened by the student`);
  return report;
}

export async function cancelByReporter(user, reportId, reason) {
  const report = await own(user, reportId);
  if (report.status !== 'pending') {
    throw new ApiError(
      400,
      report.status === 'in_progress'
        ? 'This report is already being worked on and cannot be cancelled. You can add an update instead.'
        : `This report is ${report.status.replace('_', ' ')} and cannot be cancelled`
    );
  }
  report.status = 'cancelled';
  report.history.push({
    status: 'cancelled',
    note: reason ? `Cancelled by student: ${reason}` : 'Cancelled by student',
    changedBy: user._id,
  });
  await report.save();
  return report;
}

export async function supportReport(user, reportId, { note, attachments = [] }) {
  const report = await Report.findOne({ reportId: reportId.toUpperCase() });
  if (!report || ['resolved', 'cancelled'].includes(report.status)) {
    throw new ApiError(404, 'That report is no longer open');
  }
  if (report.reporter.equals(user._id)) {
    throw new ApiError(400, 'That is your own report. Add an update instead.');
  }
  try {
    await ReportSupport.create({ report: report._id, user: user._id, note, images: imgs(attachments) });
  } catch (e) {
    if (e.code === 11000) throw new ApiError(409, 'You have already added support to this report');
    throw e;
  }
  await Report.updateOne({ _id: report._id }, { $inc: { supportCount: 1 } });
  return report;
}
