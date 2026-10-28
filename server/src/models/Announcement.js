import mongoose from 'mongoose';
import { GAME_SLUGS, PROVINCES } from '../config/games.js';

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    body: { type: String, default: '', maxlength: 2000 },
    link: { type: String, default: '' },
    game: { type: String, enum: GAME_SLUGS },
    audience: { type: String, enum: ['all', 'game', 'province'], default: 'all' },
    province: { type: String, enum: PROVINCES },
    pinned: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastBroadcastAt: Date,
    lastBroadcastCount: Number,
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true },
);

announcementSchema.index({ active: 1, pinned: -1, createdAt: -1 });

export const Announcement = mongoose.model('Announcement', announcementSchema);
