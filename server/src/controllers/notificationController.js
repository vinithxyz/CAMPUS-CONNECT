import Notification from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const [data, unreadCount] = await Promise.all([
    Notification.find({ user: req.user._id })
      .sort('-createdAt')
      .limit(20)
      .populate('report', 'reportId title'),
    Notification.countDocuments({ user: req.user._id, readAt: { $exists: false } }),
  ]);
  res.json({ data, meta: { unreadCount } });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, readAt: { $exists: false } }, { readAt: new Date() });
  res.status(204).end();
});
