import Report from '../models/Report.js';
import Building from '../models/Building.js';
import ReportComment from '../models/ReportComment.js';
import Notification from '../models/Notification.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createReportForUser } from '../services/reportActions.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const createReport = asyncHandler(async (req, res) => {
  const b = req.body;
  const building = await Building.findById(b.building);
  if (!building) throw new ApiError(400, 'Selected building does not exist');

  const files = (req.files ?? []).map((f) => ({
    url: `/uploads/${f.filename}`,
    originalName: f.originalname,
    file: f.filename,
  }));

  const report = await createReportForUser(
    req.user,
    {
      title: b.title,
      description: b.description,
      category: b.category,
      priority: b.priority,
      building: building._id,
      room: b.room,
      lat: b.lat,
      lng: b.lng,
    },
    files
  );

  res.status(201).json({ data: report });
});

export const listMyReports = asyncHandler(async (req, res) => {
  const { status, category, search, sort = '-createdAt', page = 1, limit = 10 } = req.query;
  const filter = { reporter: req.user._id };
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ title: rx }, { reportId: rx }, { room: rx }];
  }
  const [data, total] = await Promise.all([
    Report.find(filter)
      .populate('building', 'name code')
      .sort(sort.startsWith('-') ? { [sort.slice(1)]: -1 } : { [sort]: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Report.countDocuments(filter),
  ]);
  res.json({ data, meta: { page: Number(page), limit: Number(limit), total } });
});

export const myStats = asyncHandler(async (req, res) => {
  const match = { reporter: req.user._id, status: { $ne: 'cancelled' } };
  const [counts, byCategory] = await Promise.all([
    Report.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          highPriority: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $in: ['$priority', ['high', 'critical']] },
                    { $nin: ['$status', ['resolved', 'cancelled']] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),
    Report.aggregate([
      { $match: match },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);
  const c = counts[0] ?? { total: 0, pending: 0, inProgress: 0, resolved: 0, highPriority: 0 };
  res.json({
    data: {
      ...c,
      _id: undefined,
      byCategory: byCategory.map((x) => ({ category: x._id, count: x.count })),
    },
  });
});

export const getReport = asyncHandler(async (req, res) => {
  const report = await Report.findOne({ reportId: req.params.reportId.toUpperCase() })
    .populate('building', 'name code')
    .populate('history.changedBy', 'name role')
    .lean();
  if (!report) throw new ApiError(404, 'Report not found');
  const isOwner = String(report.reporter) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin' && req.user.role !== 'staff') {
    throw new ApiError(404, 'Report not found');
  }
  const comments = await ReportComment.find({ report: report._id })
    .populate('author', 'name role')
    .sort('createdAt')
    .lean();
  res.json({ data: { ...report, comments } });
});

export const reportFeedback = asyncHandler(async (req, res) => {
  const { fixed } = req.body;
  const report = await Report.findOne({
    reportId: req.params.reportId.toUpperCase(),
    reporter: req.user._id,
  });
  if (!report) throw new ApiError(404, 'Report not found');
  if (report.status !== 'resolved') throw new ApiError(400, 'Report is not marked as resolved');

  if (fixed) {
    report.fixConfirmed = true;
    await report.save();
    await Notification.updateMany(
      { user: req.user._id, report: report._id, type: 'followup' },
      { $set: { readAt: new Date() } }
    );
  }
  res.json({ data: { reportId: report.reportId, fixConfirmed: report.fixConfirmed } });
});
