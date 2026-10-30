import Report from '../../models/Report.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { scopeFilter, overdueCutoff } from '../../middleware/adminScope.js';

const DAY = 24 * 60 * 60 * 1000;

function fillDays(days, created, resolved) {
  const c = Object.fromEntries(created.map((x) => [x._id, x.count]));
  const r = Object.fromEntries(resolved.map((x) => [x._id, x.count]));
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(Date.now() - (days - 1 - i) * DAY).toISOString().slice(0, 10); // UTC day
    return { date, created: c[date] ?? 0, resolved: r[date] ?? 0 };
  });
}

export const adminStats = asyncHandler(async (req, res) => {
  const { days } = req.query;
  const since = new Date(Date.now() - days * DAY);
  const scope = scopeFilter(req.user); // ObjectId already, safe inside aggregate $match
  const cutoff = overdueCutoff();
  const inRange = { ...scope, status: { $ne: 'cancelled' }, createdAt: { $gte: since } };
  const day = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };

  const [totals, byCategory, byBuilding, byPriority, createdByDay, resolvedByDay, attention] = await Promise.all([
    // All-time totals for the status cards
    Report.aggregate([
      { $match: scope },
      {
        $group: {
          _id: null,
          total: { $sum: { $cond: [{ $ne: ['$status', 'cancelled'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          overdue: {
            $sum: { $cond: [{ $and: [{ $eq: ['$status', 'pending'] }, { $lt: ['$createdAt', cutoff] }] }, 1, 0] },
          },
          avgResolutionMs: {
            $avg: {
              $cond: [
                { $and: [{ $eq: ['$status', 'resolved'] }, { $ne: ['$resolvedAt', null] }] },
                { $subtract: ['$resolvedAt', '$createdAt'] },
                null,
              ],
            },
          },
        },
      },
    ]),
    // Breakdowns and trend use the selected date range
    Report.aggregate([{ $match: inRange }, { $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Report.aggregate([
      { $match: inRange },
      { $group: { _id: '$building', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
      { $lookup: { from: 'buildings', localField: '_id', foreignField: '_id', as: 'b' } },
      { $project: { _id: 0, name: { $arrayElemAt: ['$b.name', 0] }, count: 1 } },
    ]),
    Report.aggregate([{ $match: inRange }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
    Report.aggregate([{ $match: inRange }, { $group: { _id: day, count: { $sum: 1 } } }]),
    Report.aggregate([
      { $match: { ...scope, resolvedAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$resolvedAt' } }, count: { $sum: 1 } } },
    ]),
    Report.find({
      ...scope,
      status: { $nin: ['resolved', 'cancelled'] },
      $or: [{ priority: 'critical' }, { status: 'pending', createdAt: { $lt: cutoff } }],
    })
      .sort({ priorityRank: -1, createdAt: 1 })
      .limit(5)
      .select('reportId title priority status createdAt')
      .lean(),
  ]);

  const t = totals[0] ?? { total: 0, pending: 0, inProgress: 0, resolved: 0, overdue: 0, avgResolutionMs: null };
  res.json({
    data: {
      totals: {
        total: t.total,
        pending: t.pending,
        inProgress: t.inProgress,
        resolved: t.resolved,
        overdue: t.overdue,
        avgResolutionHours: t.avgResolutionMs == null ? null : Math.round((t.avgResolutionMs / 3600000) * 10) / 10,
      },
      trend: fillDays(days, createdByDay, resolvedByDay),
      byCategory: byCategory.map((x) => ({ category: x._id, count: x.count })),
      byBuilding,
      byPriority: byPriority.map((x) => ({ priority: x._id, count: x.count })),
      attention,
      rangeDays: days,
    },
  });
});
