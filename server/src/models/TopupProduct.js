import mongoose from 'mongoose';
import { GAME_SLUGS } from '../config/games.js';

const topupProductSchema = new mongoose.Schema(
  {
    game: { type: String, enum: GAME_SLUGS, required: true },
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 1 },
    priceNpr: { type: Number, required: true, min: 1 },
    active: { type: Boolean, default: true },
    popular: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const TopupProduct = mongoose.model('TopupProduct', topupProductSchema);
