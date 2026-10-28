import mongoose from 'mongoose';
import { GAME_SLUGS } from '../config/games.js';

const { ObjectId } = mongoose.Schema.Types;

const matchSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    game: { type: String, enum: GAME_SLUGS, required: true },
    mode: { type: String, required: true },
    map: { type: String },
    startsAt: { type: Date, required: true },
    maxSlots: { type: Number, min: 2, required: true },
    teamSize: { type: Number, min: 1, max: 4, default: 1 },
    host: { type: ObjectId, ref: 'User', required: true },
    registrations: [
      {
        user: { type: ObjectId, ref: 'User' },
        teamName: String,
        at: { type: Date, default: Date.now },
      },
    ],
    // Revealed only to registered users + host/admin, from startsAt - 15 min.
    room: {
      roomId: String,
      password: String,
    },
    roomNotified: { type: Boolean, default: false },
    status: { type: String, enum: ['upcoming', 'live', 'completed', 'cancelled'], default: 'upcoming' },
    isDemo: { type: Boolean, default: false },
    results: [
      {
        user: { type: ObjectId, ref: 'User' },
        placement: Number,
        kills: { type: Number, default: 0 },
        points: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true },
);

matchSchema.index({ game: 1, status: 1, startsAt: 1 });

export const Match = mongoose.model('Match', matchSchema);
