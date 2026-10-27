import { asyncHandler } from '../utils/asyncHandler.js';

export const updateMe = asyncHandler(async (req, res) => {
  if (req.body.name !== undefined) req.user.name = req.body.name;
  if (req.body.rollNumber !== undefined) req.user.rollNumber = req.body.rollNumber;
  await req.user.save();
  const u = req.user;
  res.json({
    data: {
      id: u.id || u._id,
      name: u.name,
      email: u.email,
      rollNumber: u.rollNumber,
      role: u.role,
    },
  });
});
