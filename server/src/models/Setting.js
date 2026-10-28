import mongoose from 'mongoose';
import { GAME_SLUGS } from '../config/games.js';

// Single document (key "site") holding site-wide switches.
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'site', unique: true },
    siteName: { type: String, default: 'Arena Nepal' },
    tickerEnabled: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: 'We are tuning the arena. Back soon.' },
    gamesEnabled: {
      type: Object.fromEntries(GAME_SLUGS.map((g) => [g, { type: Boolean, default: true }])),
      default: () => ({}),
    },
    // Per-game map list overriding config/games.js; a missing key means "use the config maps".
    mapsByGame: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
  },
  { timestamps: true, minimize: false },
);

export const Setting = mongoose.model('Setting', settingSchema);
