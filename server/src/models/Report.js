import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

// A player reporting another player (cheating, abuse, fake results...).
const reportSchema = new mongoose.Schema(
  {
    reporter: { type: ObjectId, ref: 'User', required: true },
    target: { type: ObjectId, ref: 'User', required: true, index: true },
    challenge: { type: ObjectId, ref: 'Challenge' },
    reason: { type: String, enum: ['cheating', 'abuse', 'fake_result', 'other'], required: true },
    details: { type: String, default: '', maxlength: 1000 },
    evidenceUrl: String,
    status: { type: String, enum: ['open', 'actioned', 'dismissed'], default: 'open' },
    action: { type: String, enum: ['dismiss', 'strike', 'ban'] },
    adminNote: { type: String, default: '' },
    reviewedBy: { type: ObjectId, ref: 'User' },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Report = mongoose.model('Report', reportSchema);
