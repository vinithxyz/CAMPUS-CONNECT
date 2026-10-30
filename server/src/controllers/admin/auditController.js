import AuditLog from '../../models/AuditLog.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const listAudit = asyncHandler(async (req, res) => {
  const { actor, action, from, to, page = 1, limit = 30 } = req.query;
  const f = {};
  if (actor) f.actor = actor;
  if (action) f.action = action;
  if (from || to) f.createdAt = { ...(from && { $gte: from }), ...(to && { $lte: to }) };

  const [data, total] = await Promise.all([
    AuditLog.find(f)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('actor', 'name role')
      .lean(),
    AuditLog.countDocuments(f),
  ]);
  res.json({ data, meta: { page: Number(page), limit: Number(limit), total } });
});
