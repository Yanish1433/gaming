import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

const organiserApplicationSchema = new mongoose.Schema(
  {
    user: { type: ObjectId, ref: 'User', required: true, index: true },
    orgName: { type: String, required: true, trim: true, maxlength: 80 },
    type: { type: String, enum: ['cafe', 'clan', 'creator', 'college', 'other'], required: true },
    contact: { type: String, required: true, trim: true, maxlength: 120 },
    socialLink: { type: String, default: '' },
    note: { type: String, default: '', maxlength: 1000 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reviewedBy: { type: ObjectId, ref: 'User' },
    reviewNote: { type: String, default: '' },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const OrganiserApplication = mongoose.model('OrganiserApplication', organiserApplicationSchema);
