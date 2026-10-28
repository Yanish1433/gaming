import { Challenge, User } from '../models/index.js';
import { RATING, tierFor } from '../config/games.js';

const PAGE_SIZE = 25;

function ladderRow({ user, rating, played, won, lost, score, streak, bestStreak }, rank) {
  return {
    rank,
    username: user.username,
    avatarUrl: user.avatarUrl,
    province: user.province,
    rating,
    tier: tierFor(rating),
    played,
    won,
    lost,
    winRate: played ? Math.round((won / played) * 100) : 0,
    score,
    avgScore: played ? Math.round((score / played) * 10) / 10 : 0,
    streak,
    bestStreak,
  };
}

// Whole-game ladder straight from the per-game counters on User.
async function gameLadder({ game, province, page }) {
  const filter = { banned: false, [`rankedByGame.${game}.played`]: { $gte: 1 } };
  if (province) filter.province = province;
  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ [`ratingByGame.${game}`]: -1, username: 1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .select(`username avatarUrl province ratingByGame.${game} rankedByGame.${game}`)
      .lean(),
    User.countDocuments(filter),
  ]);
  const items = users.map((u, i) =>
    ladderRow({ user: u, rating: u.ratingByGame?.[game] ?? RATING.start, ...u.rankedByGame[game] }, (page - 1) * PAGE_SIZE + i + 1),
  );
  return { items, total };
}

// Team-size ladder: counters are rebuilt from settled ranked challenges of that size; rating is the game rating.
async function teamSizeLadder({ game, teamSize, province, page }) {
  const rows = await Challenge.aggregate([
    { $match: { status: 'settled', ranked: true, game, teamSize } },
    { $sort: { settledAt: 1 } },
    { $unwind: '$playerStats' },
    {
      $group: {
        _id: '$playerStats.user',
        results: { $push: '$playerStats.won' },
        score: { $sum: '$playerStats.score' },
      },
    },
  ]);
  const userFilter = { _id: { $in: rows.map((r) => r._id) }, banned: false };
  if (province) userFilter.province = province;
  const users = await User.find(userFilter).select(`username avatarUrl province ratingByGame.${game}`).lean();
  const byId = new Map(users.map((u) => [String(u._id), u]));

  const all = rows
    .filter((r) => byId.has(String(r._id)))
    .map((r) => {
      let streak = 0;
      let bestStreak = 0;
      for (const won of r.results) {
        streak = won ? streak + 1 : 0;
        bestStreak = Math.max(bestStreak, streak);
      }
      const won = r.results.filter(Boolean).length;
      const user = byId.get(String(r._id));
      return {
        user,
        rating: user.ratingByGame?.[game] ?? RATING.start,
        played: r.results.length,
        won,
        lost: r.results.length - won,
        score: r.score,
        streak,
        bestStreak,
      };
    })
    .sort((a, b) => b.rating - a.rating || a.user.username.localeCompare(b.user.username));

  const start = (page - 1) * PAGE_SIZE;
  return { items: all.slice(start, start + PAGE_SIZE).map((r, i) => ladderRow(r, start + i + 1)), total: all.length };
}

export async function getLadder(req, res) {
  const q = req.validQuery;
  const { items, total } = q.teamSize ? await teamSizeLadder(q) : await gameLadder(q);
  res.json({ items, total, page: q.page, game: q.game, teamSize: q.teamSize ?? null });
}
