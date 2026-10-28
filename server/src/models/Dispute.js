import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

const disputeSchema = new mongoose.Schema(
  {
    challenge: { type: ObjectId, ref: 'Challenge', required: true },
    raisedBy: { type: ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true, maxlength: 1000 },
    evidenceUrl: String,
    status: { type: String, enum: ['open', 'resolved'], default: 'open' },
    resolution: String,
    resolvedBy: { type: ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export const Dispute = mongoose.model('Dispute', disputeSchema);
