import Report from '../models/Report.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const WEIGHT = { low: 0.25, medium: 0.5, high: 0.75, critical: 1 };

const buildFilter = ({ categories, includeResolved }) => {
  const f = {};
  if (categories && categories.length) f.category = { $in: categories };
  if (!includeResolved) f.status = { $ne: 'resolved' };
  return f;
};

export const mapReports = asyncHandler(async (req, res) => {
  const reports = await Report.find(buildFilter(req.query))
    .select('reportId title category priority status room location building createdAt isSample')
    .populate('building', 'name')
    .limit(1000)
    .lean();
  res.json({
    data: reports.map((r) => ({
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

export const heatPoints = asyncHandler(async (req, res) => {
  const reports = await Report.find(buildFilter(req.query))
    .select('priority location')
    .limit(5000)
    .lean();
  res.json({
    data: reports.map((r) => [
      r.location.coordinates[1],
      r.location.coordinates[0],
      WEIGHT[r.priority] ?? 0.5,
    ]),
  });
});
