import { AuditLog } from '../models/index.js';

// Never lets an audit failure break the action being audited.
export async function logAudit({ actor, action, targetType, targetId, summary = '' }) {
  try {
    await AuditLog.create({ actor: actor?._id ?? actor, action, targetType, targetId: targetId ? String(targetId) : undefined, summary });
  } catch (err) {
    console.error('audit failed:', err.message);
  }
}

const MUTATIONS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

/**
 * Router middleware: writes an AuditLog for every successful mutation.
 * Controllers describe what they did via `res.locals.audit = { action, targetType, targetId, summary }`;
 * anything that doesn't still gets a generic "<METHOD> <path>" entry (never the body), so no mutation goes unlogged.
 */
export function auditMutations(req, res, next) {
  if (!MUTATIONS.has(req.method)) return next();
  res.on('finish', () => {
    if (res.statusCode >= 400 || !req.user) return;
    const a = res.locals.audit || {};
    logAudit({
      actor: req.user,
      action: a.action || `${req.method.toLowerCase()} ${req.baseUrl}${req.route?.path ?? ''}`,
      targetType: a.targetType,
      targetId: a.targetId ?? req.params?.id,
      summary: a.summary || `${req.method} ${req.originalUrl.split('?')[0]}`,
    });
  });
  next();
}
