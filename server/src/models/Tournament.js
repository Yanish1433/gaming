import mongoose from 'mongoose';
import { GAME_SLUGS } from '../config/games.js';

const { ObjectId } = mongoose.Schema.Types;

const tournamentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    game: { type: String, enum: GAME_SLUGS, required: true },
    format: { type: String, enum: ['knockout', 'points'], default: 'knockout' },
    startsAt: { type: Date, required: true },
    // Sponsor-funded prize described as text; players never pay to enter.
    prize: { type: String, default: '' },
    sponsor: { type: String, default: '' },
    maxTeams: { type: Number, min: 2, default: 16 },
    organiser: { type: ObjectId, ref: 'User', required: true },
    registrations: [
      {
        user: { type: ObjectId, ref: 'User' },
        teamName: String,
      },
    ],
    status: { type: String, enum: ['registration', 'ongoing', 'completed'], default: 'registration' },
    winners: [
      {
        _id: false,
        place: { type: Number, min: 1, max: 3 },
        user: { type: ObjectId, ref: 'User' },
        teamName: String,
      },
    ],
    isDemo: { type: Boolean, default: false },
    description: { type: String, default: '' },
    bannerUrl: { type: String, default: '' },
  },
  { timestamps: true },
);

export const Tournament = mongoose.model('Tournament', tournamentSchema);
