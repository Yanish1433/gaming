import mongoose from 'mongoose';
import { GAME_SLUGS } from '../config/games.js';

export const SPONSOR_SLOTS = ['home_banner', 'hub_banner', 'tournament'];

const sponsorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    logoUrl: { type: String, default: '' },
    website: { type: String, default: '' },
    slot: { type: String, enum: SPONSOR_SLOTS, required: true },
    game: { type: String, enum: GAME_SLUGS }, // hub_banner only; empty = every hub
    active: { type: Boolean, default: true },
    startsAt: Date,
    endsAt: Date,
    clicks: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Sponsor = mongoose.model('Sponsor', sponsorSchema);
