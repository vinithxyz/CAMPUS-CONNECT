import Report from '../../models/Report.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const WEIGHT = { low: 0.25, medium: 0.5, high: 0.75, critical: 1 };

const filterFrom = ({ categories = [], statuses = [], from, to }) => {
  const f = {};
  if (categories.length) f.category = { $in: categories };
  if (statuses.length) f.status = { $in: statuses };
  if (from || to) f.createdAt = { ...(from && { $gte: from }), ...(to && { $lte: to }) };
  return f;
};

export const adminMapReports = asyncHandler(async (req, res) => {
  const rows = await Report.find(filterFrom(req.query))
    .select('reportId title category priority status room location building createdAt isSample')
    .populate('building', 'name')
    .limit(2000)
    .lean();
  res.json({
    data: rows.map((r) => ({
      reportId: r.reportId,
      title: r.title,
      category: r.category,
      priority: r.priority,
      status: r.status,
      room: r.room,
      building: r.building?.name,
      lat: r.location.coordinates[1],
      lng: r.location.coordinates[0],
      createdAt: r.createdAt,
      isSample: r.isSample,
    })),
  });
});

export const adminHeat = asyncHandler(async (req, res) => {
  const rows = await Report.find(filterFrom(req.query)).select('priority location').limit(10000).lean();
  res.json({
    data: rows.map((r) => [r.location.coordinates[1], r.location.coordinates[0], WEIGHT[r.priority] ?? 0.5]),
  });
});
