import mongoose from 'mongoose';

// Append-only record of admin mutations and key public events. Powers the activity feed and audit page.
const auditLogSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true }, // e.g. "user.update", "challenge.settled"
  targetType: String,
  targetId: String,
  summary: { type: String, default: '' },
  at: { type: Date, default: Date.now },
});

auditLogSchema.index({ at: -1 });
auditLogSchema.index({ actor: 1, at: -1 });
auditLogSchema.index({ action: 1, at: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
