import Report from '../models/Report.js';
import Building from '../models/Building.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { nextReportId } from '../utils/reportId.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const createReport = asyncHandler(async (req, res) => {
  const b = req.body;
  const building = await Building.findById(b.building);
  if (!building) throw new ApiError(400, 'Selected building does not exist');

  const report = await Report.create({
    reportId: await nextReportId(),
    title: b.title,
    description: b.description,
    category: b.category,
    priority: b.priority,
    building: building._id,
    room: b.room,
    location: { type: 'Point', coordinates: [b.lng, b.lat] },
    images: (req.files ?? []).map((f) => ({ url: `/uploads/${f.filename}`, filename: f.originalname })),
    reporter: req.user._id,
    history: [{ status: 'pending', note: 'Report submitted', changedBy: req.user._id }],
  });
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
  const match = { reporter: req.user._id };
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
                    { $ne: ['$status', 'resolved'] },
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
    .populate('history.changedBy', 'name role');
  if (!report) throw new ApiError(404, 'Report not found');
  const isOwner = report.reporter.equals(req.user._id);
  if (!isOwner && req.user.role !== 'admin') throw new ApiError(404, 'Report not found');
  res.json({ data: report });
});
