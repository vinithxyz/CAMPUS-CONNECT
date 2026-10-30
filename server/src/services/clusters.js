import Report from '../models/Report.js';

export async function findClusters({ windowHours = 72, minCount = 3 }) {
  const since = new Date(Date.now() - windowHours * 3600 * 1000);
  return Report.aggregate([
    { $match: { status: { $in: ['pending', 'in_progress'] }, createdAt: { $gte: since } } },
    {
      $group: {
        _id: { building: '$building', category: '$category' },
        count: { $sum: 1 },
        reportIds: { $push: '$reportId' },
      },
    },
    { $match: { count: { $gte: minCount } } },
    { $lookup: { from: 'buildings', localField: '_id.building', foreignField: '_id', as: 'b' } },
    {
      $project: {
        _id: 0,
        buildingId: '$_id.building',
        category: '$_id.category',
        building: { $arrayElemAt: ['$b.name', 0] },
        count: 1,
        reportIds: { $slice: ['$reportIds', 10] },
      },
    },
    { $sort: { count: -1 } },
  ]);
}
