import User from '../../models/User.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { audit } from '../../utils/audit.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const listUsers = asyncHandler(async (req, res) => {
  const { role, search, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { rollNumber: rx }];
  }
  const [data, total] = await Promise.all([
    User.find(filter)
      .select('name email rollNumber role isActive createdAt')
      .sort('name')
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);
  res.json({ data, meta: { page: Number(page), limit: Number(limit), total } });
});

export const updateUser = asyncHandler(async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) throw new ApiError(404, 'User not found');
  // Self-protection also guarantees at least one active admin always remains (the actor).
  if (target._id.equals(req.user._id)) {
    throw new ApiError(400, 'You cannot change your own role or active status');
  }
  const before = { role: target.role, isActive: target.isActive };
  if (req.body.role !== undefined) target.role = req.body.role;
  if (req.body.isActive !== undefined) target.isActive = req.body.isActive;
  await target.save();
  await audit(req, 'user.update', 'user', target.id, {
    before,
    after: { role: target.role, isActive: target.isActive },
  });
  res.json({
    data: {
      id: target.id,
      _id: target.id,
      name: target.name,
      email: target.email,
      role: target.role,
      isActive: target.isActive,
    },
  });
});
