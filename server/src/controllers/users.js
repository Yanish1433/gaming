import { User, Challenge } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { publicUser, selfUser, PUBLIC_USER_FIELDS } from '../utils/sanitize.js';
import { exactInsensitive } from '../utils/escapeRegex.js';
import { RATING } from '../config/games.js';

const RECORDS_PAGE_SIZE = 20;

async function findByUsername(username) {
  const user = await User.findOne({ username: exactInsensitive(username) });
  if (!user) throw ApiError.notFound('Player not found');
  return user;
}

export async function getProfile(req, res) {
  const user = await findByUsername(req.params.username);

  const recentChallenges = await Challenge.find({ $or: [{ teamA: user._id }, { teamB: user._id }] })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('-room -reports -playerStats')
    .populate('teamA teamB creator', PUBLIC_USER_FIELDS)
    .lean();

  res.json({ ...publicUser(user), recentChallenges });
}

export async function updateMe(req, res) {
  const { bio, province, avatarUrl, gameIds } = req.body;
  const user = req.user;
  if (bio !== undefined) user.bio = bio;
  if (province !== undefined) user.province = province;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
  if (gameIds) {
    for (const [slug, value] of Object.entries(gameIds)) user.set(`gameIds.${slug}`, value);
  }
  await user.save();
  res.json(selfUser(user));
}

// Settled challenges for a player, newest first, with their own score and rating change.
export async function getRecords(req, res) {
  const user = await findByUsername(req.params.username);
  const { game, page } = req.validQuery;
  const filter = { status: 'settled', 'playerStats.user': user._id };
  if (game) filter.game = game;

  const challenges = await Challenge.find(filter)
    .sort({ settledAt: -1 })
    .skip((page - 1) * RECORDS_PAGE_SIZE)
    .limit(RECORDS_PAGE_SIZE)
    .select('game mode map teamSize ranked settledAt playerStats')
    .populate('playerStats.user', 'username')
    .lean();

  res.json(
    challenges.map((c) => {
      const me = c.playerStats.find((p) => String(p.user?._id) === String(user._id));
      const names = (fn) => c.playerStats.filter(fn).map((p) => p.user?.username).filter(Boolean);
      return {
        challengeId: c._id,
        game: c.game,
        mode: c.mode,
        map: c.map,
        teamSize: c.teamSize,
        ranked: c.ranked,
        at: c.settledAt,
        won: me.won,
        score: me.score,
        ratingDelta: me.ratingDelta,
        ratingAfter: me.ratingAfter,
        opponents: names((p) => p.side !== me.side),
        teammates: names((p) => p.side === me.side && String(p.user?._id) !== String(user._id)),
      };
    }),
  );
}

// Rating over time for a progress chart. Starts with the rating before the first ranked game.
// Without ?game= every point carries its game.
export async function getRatingHistory(req, res) {
  const user = await findByUsername(req.params.username);
  const { game } = req.validQuery;
  const filter = { status: 'settled', ranked: true, 'playerStats.user': user._id };
  if (game) filter.game = game;

  const challenges = await Challenge.find(filter).sort({ settledAt: 1 }).select('game settledAt playerStats').lean();
  const points = [];
  const started = new Set();
  for (const c of challenges) {
    const me = c.playerStats.find((p) => String(p.user) === String(user._id));
    if (!started.has(c.game)) {
      started.add(c.game);
      points.push({ at: c.settledAt, rating: me.ratingBefore ?? RATING.start, ...(game ? {} : { game: c.game }) });
    }
    points.push({ at: c.settledAt, rating: me.ratingAfter, ...(game ? {} : { game: c.game }) });
  }
  res.json(points);
}
