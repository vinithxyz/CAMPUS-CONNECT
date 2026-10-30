import { env } from '../config/env.js';

/** Staff only see reports assigned to them. Admins see everything. */
export const scopeFilter = (user) => (user.role === 'staff' ? { assignedTo: user._id } : {});

export const overdueCutoff = () => new Date(Date.now() - env.OVERDUE_HOURS * 60 * 60 * 1000);
