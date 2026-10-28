import { z } from 'zod';
import mongoose from 'mongoose';
import { GAME_SLUGS, PROVINCES } from '../config/games.js';
import { CHALLENGE_STATUSES } from '../models/Challenge.js';

export const objectId = z.string().refine((v) => mongoose.isValidObjectId(v), 'Invalid id');
export const idParams = z.object({ id: objectId });

const game = z.enum(GAME_SLUGS);
const province = z.enum(PROVINCES);
const username = z.string().trim().min(3).max(20).regex(/^[A-Za-z0-9_.]+$/, 'Only letters, numbers, _ and .');
const text = (max) => z.string().trim().max(max);
const url = z.string().trim().max(500).refine((v) => v === '' || v.startsWith('/uploads/') || /^https?:\/\//.test(v), 'Must be an http(s) URL');
const futureDate = z.coerce.date();
const page = z.coerce.number().int().min(1).max(1000).default(1);
const boolish = z.enum(['true', 'false']).transform((v) => v === 'true');

// Per-player kills/goals. Multipart sends this as a JSON string, so accept both.
const scoresField = z.preprocess(
  (v) => {
    if (typeof v !== 'string') return v;
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  },
  z
    .array(z.object({ username: z.string().trim().min(3).max(20), score: z.coerce.number().int().min(0) }))
    .max(8),
);

// ---- auth / users
export const registerSchema = z.object({
  username,
  email: z.string().trim().toLowerCase().email().max(120),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  dob: z.coerce.date().refine((d) => d < new Date() && d.getFullYear() > 1900, 'Invalid date of birth'),
  province,
});

export const loginSchema = z.object({
  emailOrUsername: z.string().trim().min(3).max(120),
  password: z.string().min(1).max(100),
});

export const updateMeSchema = z.object({
  bio: text(280).optional(),
  province: province.optional(),
  avatarUrl: url.optional(),
  gameIds: z
    .object(Object.fromEntries(GAME_SLUGS.map((g) => [g, text(40).optional()])))
    .strict()
    .optional(),
}).strict();

// ---- challenges
const teammates = z.array(username).max(3).default([]);

export const challengeQuery = z.object({
  game: game.optional(),
  status: z.enum(CHALLENGE_STATUSES).optional(),
  teamSize: z.coerce.number().int().min(1).max(4).optional(),
  ranked: boolish.optional(),
  page,
});

export const createChallengeSchema = z.object({
  game,
  mode: text(40).min(1),
  map: text(40).optional().or(z.literal('')),
  teamSize: z.coerce.number().int().min(1).max(4),
  scheduledAt: futureDate.refine((d) => d.getTime() > Date.now() - 5 * 60 * 1000, 'Schedule must be in the future').optional(),
  notes: text(500).optional(),
  ranked: z.boolean().optional(),
  teammates,
});

export const acceptChallengeSchema = z.object({ teammates });

export const roomSchema = z.object({
  roomId: text(40).min(1),
  password: text(40).min(1),
});

export const reportSchema = z.object({ winnerSide: z.enum(['A', 'B']), scores: scoresField });

// ---- matches
export const listQuery = z.object({ game: game.optional(), status: z.string().max(20).optional() });

const matchFields = {
  title: text(80).min(3),
  game,
  mode: text(40).min(1),
  map: text(40).optional(),
  startsAt: futureDate,
  maxSlots: z.coerce.number().int().min(2).max(200),
  teamSize: z.coerce.number().int().min(1).max(4).default(1),
};

export const createMatchSchema = z.object({ ...matchFields, room: roomSchema.optional() });

export const updateMatchSchema = z
  .object({
    title: matchFields.title,
    mode: matchFields.mode,
    map: matchFields.map,
    startsAt: matchFields.startsAt,
    maxSlots: matchFields.maxSlots,
    teamSize: z.coerce.number().int().min(1).max(4),
    room: roomSchema,
    status: z.enum(['upcoming', 'live', 'cancelled']),
  })
  .partial()
  .strict();

export const teamNameSchema = z.object({ teamName: text(40).optional() });

export const resultsSchema = z.object({
  results: z
    .array(
      z
        .object({
          user: objectId.optional(),
          username: username.optional(),
          placement: z.coerce.number().int().min(1).max(200),
          kills: z.coerce.number().int().min(0).max(200).default(0),
          points: z.coerce.number().min(0).max(10000).default(0),
        })
        .refine((r) => r.user || r.username, 'Each result needs a user or username'),
    )
    .min(1)
    .max(200),
});

// ---- tournaments
export const createTournamentSchema = z.object({
  title: text(100).min(3),
  game,
  format: z.enum(['knockout', 'points']).default('knockout'),
  startsAt: futureDate,
  prize: text(120).optional(),
  sponsor: text(80).optional(),
  maxTeams: z.coerce.number().int().min(2).max(256).default(16),
  description: text(2000).optional(),
  bannerUrl: url.optional(),
});

export const tournamentRegisterSchema = z.object({ teamName: text(40).min(2) });

// ---- leaderboard
export const leaderboardQuery = z.object({
  game: game.optional(),
  province: province.optional(),
  period: z.enum(['week', 'season', 'all']).default('all'),
});

// ---- ranked
export const ladderQuery = z.object({
  game: game.default('pubg'),
  teamSize: z.coerce.number().int().min(1).max(4).optional(),
  province: province.optional(),
  page,
});

export const recordsQuery = z.object({ game: game.optional(), page });
export const historyQuery = z.object({ game: game.optional() });

// ---- disputes
export const disputeSchema = z.object({
  challengeId: objectId,
  reason: text(1000).min(5, 'Tell us what went wrong (5+ characters)'),
});

// ---- store
export const productQuery = z.object({ game: game.optional() });

export const orderSchema = z.object({
  productId: objectId,
  gameUid: text(40).min(3),
  paymentMethod: z.enum(['esewa', 'khalti', 'bank']),
  paymentRef: text(80).min(3),
});

// ---- admin
export const userSearchQuery = z.object({ q: z.string().trim().max(60).optional() });

export const adminUpdateUserSchema = z
  .object({
    role: z.enum(['player', 'organiser', 'admin']),
    banned: z.boolean(),
    strikes: z.coerce.number().int().min(0).max(100),
  })
  .partial()
  .strict();

export const disputeStatusQuery = z.object({ status: z.enum(['open', 'resolved']).optional() });

export const resolveSchema = z.object({
  winnerSide: z.enum(['A', 'B']),
  resolution: text(500).min(3),
  scores: scoresField.optional(),
});

export const orderStatusQuery = z.object({ status: z.enum(['pending', 'paid', 'fulfilled', 'failed']).optional() });

export const adminUpdateOrderSchema = z
  .object({
    status: z.enum(['pending', 'paid', 'fulfilled', 'failed']),
    adminNote: text(300),
  })
  .partial()
  .strict();

export const productSchema = z.object({
  game,
  name: text(60).min(1),
  amount: z.coerce.number().int().min(1),
  priceNpr: z.coerce.number().min(1),
  active: z.boolean().default(true),
  popular: z.boolean().default(false),
});

// No defaults here, so a partial PATCH never silently resets active/popular.
export const productUpdateSchema = z
  .object({
    game,
    name: text(60).min(1),
    amount: z.coerce.number().int().min(1),
    priceNpr: z.coerce.number().min(1),
    active: z.boolean(),
    popular: z.boolean(),
  })
  .partial()
  .strict();

// ======== Admin control room (addendum 2) ========

// Booleans/dates arrive as strings in multipart forms.
const formBool = z.union([z.boolean(), boolish]);
const optionalDate = z.union([z.coerce.date(), z.literal('').transform(() => null), z.null()]);

export const analyticsQuery = z.object({ range: z.enum(['7d', '30d', '90d']).default('30d') });
export const activityQuery = z.object({ limit: z.coerce.number().int().min(1).max(100).default(30) });
export const auditQuery = z.object({
  actor: z.string().trim().max(20).optional(),
  action: z.string().trim().max(60).optional(),
  targetType: z.string().trim().max(40).optional(),
  targetId: z.string().trim().max(40).optional(),
  page,
});

// ---- challenges
export const adminChallengeQuery = z.object({
  game: game.optional(),
  status: z.enum(CHALLENGE_STATUSES).optional(),
  q: z.string().trim().max(40).optional(),
  page,
});
export const reasonSchema = z.object({ reason: text(300).min(3, 'Give a short reason') });
export const forceSettleSchema = z.object({
  winnerSide: z.enum(['A', 'B']),
  scores: scoresField.optional(),
  reason: text(300).min(3, 'Give a short reason'),
});

// ---- tournaments
export const adminTournamentQuery = z.object({
  game: game.optional(),
  status: z.enum(['registration', 'ongoing', 'completed']).optional(),
});
export const adminTournamentUpdateSchema = z
  .object({
    title: text(100).min(3),
    prize: text(120),
    sponsor: text(80),
    status: z.enum(['registration', 'ongoing', 'completed']),
    description: text(2000),
    startsAt: z.coerce.date(),
    maxTeams: z.coerce.number().int().min(2).max(256),
    bannerUrl: url,
  })
  .partial()
  .strict();
export const registrationParams = z.object({ id: objectId, userId: objectId });
export const winnersSchema = z.object({
  winners: z
    .array(z.object({ place: z.coerce.number().int().min(1).max(3), username, teamName: text(40).optional() }))
    .min(1)
    .max(3)
    .refine((w) => new Set(w.map((x) => x.place)).size === w.length, 'Each place can only be given once'),
});

// ---- organiser applications
export const organiserApplicationSchema = z.object({
  orgName: text(80).min(2),
  type: z.enum(['cafe', 'clan', 'creator', 'college', 'other']),
  contact: text(120).min(3),
  socialLink: url.optional(),
  note: text(1000).optional(),
});
export const applicationStatusQuery = z.object({ status: z.enum(['pending', 'approved', 'rejected']).optional() });
export const reviewSchema = z.object({ approve: z.boolean(), note: text(500).optional() });

// ---- announcements
export const announcementQuery = z.object({ game: game.optional() });
const announcementFields = {
  title: text(120).min(3),
  body: text(2000),
  link: z.string().trim().max(300),
  game: game.nullable(),
  audience: z.enum(['all', 'game', 'province']),
  province: province.nullable(),
  pinned: z.boolean(),
  active: z.boolean(),
};
export const announcementSchema = z.object({
  ...announcementFields,
  body: announcementFields.body.default(''),
  link: announcementFields.link.default(''),
  game: game.optional(),
  province: province.optional(),
  audience: announcementFields.audience.default('all'),
  pinned: z.boolean().default(false),
  active: z.boolean().default(true),
});
export const announcementUpdateSchema = z.object(announcementFields).partial().strict();

// ---- sponsors (multipart-friendly)
const sponsorSlot = z.enum(['home_banner', 'hub_banner', 'tournament']);
export const sponsorActiveQuery = z.object({ slot: sponsorSlot.optional(), game: game.optional() });
const sponsorFields = {
  name: text(80).min(2),
  website: url,
  slot: sponsorSlot,
  game: z.union([game, z.literal('').transform(() => null), z.null()]),
  active: formBool,
  startsAt: optionalDate,
  endsAt: optionalDate,
};
export const sponsorSchema = z.object({
  ...sponsorFields,
  website: url.default(''),
  game: sponsorFields.game.optional(),
  active: formBool.default(true),
  startsAt: optionalDate.optional(),
  endsAt: optionalDate.optional(),
});
export const sponsorUpdateSchema = z.object(sponsorFields).partial().strict();

// ---- player reports
export const reportCreateSchema = z.object({
  target: z.string().trim().min(3).max(40),
  challengeId: objectId.optional().or(z.literal('').transform(() => undefined)),
  reason: z.enum(['cheating', 'abuse', 'fake_result', 'other']),
  details: text(1000).optional(),
});
export const reportStatusQuery = z.object({ status: z.enum(['open', 'actioned', 'dismissed']).optional() });
export const reportActionSchema = z.object({ action: z.enum(['dismiss', 'strike', 'ban']), note: text(500).optional() });

// ---- settings & data tools
const mapName = z.string().trim().min(1).max(40);
export const settingsUpdateSchema = z
  .object({
    siteName: text(60).min(2),
    tickerEnabled: z.boolean(),
    maintenanceMode: z.boolean(),
    maintenanceMessage: text(300),
    gamesEnabled: z.object(Object.fromEntries(GAME_SLUGS.map((g) => [g, z.boolean().optional()]))).strict(),
    mapsByGame: z.object(Object.fromEntries(GAME_SLUGS.map((g) => [g, z.array(mapName).max(30).nullable().optional()]))).strict(),
  })
  .partial()
  .strict();
export const confirmSchema = z.object({ confirm: z.literal('YES', { message: 'Type YES to confirm' }) });
export const exportParams = z.object({ what: z.enum(['users', 'orders', 'challenges']) });
