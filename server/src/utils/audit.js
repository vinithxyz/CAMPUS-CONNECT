import AuditLog from '../models/AuditLog.js';

/** ctx is req, or { user, ip }. via: 'assistant' marks actions that originated in chat. */
export const audit = (ctx, action, targetType, targetId, meta = {}, via = 'ui') =>
  AuditLog.create({
    actor: ctx.user._id,
    actorRole: ctx.user.role,
    action,
    targetType,
    targetId: String(targetId),
    meta: { ...meta, via },
    ip: ctx.ip,
  }).catch((e) => console.error('AUDIT WRITE FAILED', action, targetId, e));
