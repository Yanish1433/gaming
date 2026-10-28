import mongoose from 'mongoose';
import { GAME_SLUGS, PROVINCES, RATING } from '../config/games.js';

const perGame = { pubg: String, freefire: String, efootball: String, fcmobile: String };
const perGameNum = {
  pubg: { type: Number, default: 0 },
  freefire: { type: Number, default: 0 },
  efootball: { type: Number, default: 0 },
  fcmobile: { type: Number, default: 0 },
};

const perGameRating = Object.fromEntries(GAME_SLUGS.map((g) => [g, { type: Number, default: RATING.start }]));

const rankedCounters = new mongoose.Schema(
  {
    played: { type: Number, default: 0 },
    won: { type: Number, default: 0 },
    lost: { type: Number, default: 0 },
    score: { type: Number, default: 0 }, // total kills/goals in ranked
    streak: { type: Number, default: 0 }, // current win streak
    bestStreak: { type: Number, default: 0 },
  },
  { _id: false },
);
const perGameRanked = Object.fromEntries(GAME_SLUGS.map((g) => [g, { type: rankedCounters, default: () => ({}) }]));

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 20 },
    usernameLower: { type: String, unique: true, select: false },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['player', 'organiser', 'admin'], default: 'player' },
    province: { type: String, enum: PROVINCES },
    avatarUrl: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 280 },
    dob: { type: Date, required: true },
    gameIds: { type: perGame, default: () => ({}) },
    xp: { type: Number, default: 0 },
    xpByGame: { type: perGameNum, default: () => ({}) },
    stats: {
      played: { type: Number, default: 0 },
      won: { type: Number, default: 0 },
    },
    ratingByGame: { type: perGameRating, default: () => ({}) },
    rankedByGame: { type: perGameRanked, default: () => ({}) },
    strikes: { type: Number, default: 0 },
    banned: { type: Boolean, default: false },
    // Seeded demo account; removable with `npm run seed:clear-demo`.
    isDemo: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

// Case-insensitive uniqueness for usernames without losing the display casing.
userSchema.pre('validate', function setLower(next) {
  if (this.username) this.usernameLower = this.username.toLowerCase();
  next();
});

userSchema.index({ xp: -1 });

export const User = mongoose.model('User', userSchema);
