import ChatUsage from '../../models/ChatUsage.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';

export async function checkDailyLimit(user) {
  const day = new Date().toISOString().slice(0, 10);
  const u = await ChatUsage.findOneAndUpdate(
    { user: user._id, day },
    { $inc: { count: 1 } },
    { new: true, upsert: true }
  );
  const limit = user.role === 'student' ? env.CHAT_DAILY_LIMIT_USER : env.CHAT_DAILY_LIMIT_ADMIN;
  if (u.count > limit) {
    throw new ApiError(
      429,
      'You have reached the daily assistant limit. You can still use the normal forms and pages.'
    );
  }
}
