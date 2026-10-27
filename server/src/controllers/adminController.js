import Report from '../models/Report.js';
import Notification from '../models/Notification.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listAllReports = asyncHandler(async (req, res) => {
  const { status, category, page = 1, limit = 10 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (category) filter.category = category;
  const [data, total] = await Promise.all([
    Report.find(filter)
      .populate('building', 'name')
      .populate('reporter', 'name rollNumber')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
    Report.countDocuments(filter),
  ]);
  res.json({ data, meta: { page: Number(page), limit: Number(limit), total } });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const report = await Report.findOne({ reportId: req.params.reportId.toUpperCase() });
  if (!report) throw new ApiError(404, 'Report not found');
  if (report.status === status) throw new ApiError(400, `Report is already ${status.replace('_', ' ')}`);

  report.status = status;
  report.resolvedAt = status === 'resolved' ? new Date() : undefined;
  report.history.push({ status, note, changedBy: req.user._id, changedAt: new Date() });
  await report.save();

  await Notification.create({
    user: report.reporter,
    report: report._id,
    message: `${report.reportId} "${report.title}" is now ${status.replace('_', ' ')}`,
  });
  res.json({ data: report });
});
