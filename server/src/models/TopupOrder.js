import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

const topupOrderSchema = new mongoose.Schema(
  {
    user: { type: ObjectId, ref: 'User', required: true, index: true },
    product: { type: ObjectId, ref: 'TopupProduct', required: true },
    gameUid: { type: String, required: true, trim: true },
    paymentMethod: { type: String, enum: ['esewa', 'khalti', 'bank'], required: true },
    paymentRef: { type: String, required: true, trim: true },
    // Snapshot of the price at order time.
    priceNpr: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid', 'fulfilled', 'failed'], default: 'pending' },
    adminNote: { type: String, default: '' },
  },
  { timestamps: true },
);

export const TopupOrder = mongoose.model('TopupOrder', topupOrderSchema);
