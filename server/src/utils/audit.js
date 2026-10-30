import AuditLog from '../models/AuditLog.js';

/** Logs failures instead of throwing, so an audit write problem never breaks the admin action. Monitor these logs. */
export const audit = (req, action, targetType, targetId, meta = {}) =>
  AuditLog.create({
    actor: req.user._id,
    actorRole: req.user.role,
    action,
    targetType,
    targetId: String(targetId),
    meta,
    ip: req.ip,
  }).catch((e) => console.error('AUDIT WRITE FAILED', action, targetId, e));
