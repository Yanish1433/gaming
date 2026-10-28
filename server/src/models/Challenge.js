import mongoose from 'mongoose';
import { GAME_SLUGS } from '../config/games.js';

const { ObjectId } = mongoose.Schema.Types;

export const CHALLENGE_STATUSES = [
  'open', 'accepted', 'room_ready', 'in_progress', 'reported', 'disputed', 'settled', 'cancelled', 'expired',
];

const challengeSchema = new mongoose.Schema(
  {
    game: { type: String, enum: GAME_SLUGS, required: true },
    mode: { type: String, required: true },
    map: { type: String },
    teamSize: { type: Number, min: 1, max: 4, required: true },
    creator: { type: ObjectId, ref: 'User', required: true },
    teamA: [{ type: ObjectId, ref: 'User' }],
    teamB: [{ type: ObjectId, ref: 'User' }],
    status: { type: String, enum: CHALLENGE_STATUSES, default: 'open' },
    scheduledAt: { type: Date },
    // Never sent to non-participants; controllers strip it explicitly.
    room: {
      roomId: { type: String },
      password: { type: String },
    },
    reports: [
      {
        by: { type: ObjectId, ref: 'User' },
        winnerSide: { type: String, enum: ['A', 'B'] },
        screenshotUrl: String,
        // Reporter's own side only: kills or goals per player.
        scores: [{ _id: false, user: { type: ObjectId, ref: 'User' }, score: { type: Number, min: 0 } }],
        at: { type: Date, default: Date.now },
      },
    ],
    winnerSide: { type: String, enum: ['A', 'B'] },
    // Only ranked challenges move rating.
    ranked: { type: Boolean, default: true },
    // Written once on settle; ratingDelta is 0 for unranked challenges.
    playerStats: [
      {
        _id: false,
        user: { type: ObjectId, ref: 'User' },
        side: { type: String, enum: ['A', 'B'] },
        score: { type: Number, default: 0 },
        won: Boolean,
        ratingBefore: Number,
        ratingAfter: Number,
        ratingDelta: Number,
      },
    ],
    settledAt: Date,
    isDemo: { type: Boolean, default: false },
    notes: { type: String, maxlength: 500 },
  },
  { timestamps: true },
);

challengeSchema.index({ game: 1, status: 1, createdAt: -1 });
challengeSchema.index({ 'playerStats.user': 1, settledAt: -1 });

export const Challenge = mongoose.model('Challenge', challengeSchema);
