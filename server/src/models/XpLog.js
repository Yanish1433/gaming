import mongoose from 'mongoose';
import { GAME_SLUGS } from '../config/games.js';

// Append-only ledger of XP grants; powers week/season leaderboards.
const xpLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    game: { type: String, enum: GAME_SLUGS, required: true },
    amount: { type: Number, required: true },
    source: { type: String, enum: ['challenge', 'match', 'tournament', 'seed'], required: true },
    ref: { type: mongoose.Schema.Types.ObjectId },
  },
  { timestamps: true },
);

xpLogSchema.index({ createdAt: -1, game: 1 });

export const XpLog = mongoose.model('XpLog', xpLogSchema);
