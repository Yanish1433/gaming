import { User, XpLog } from '../models/index.js';

const LIMIT = 50;

// Seasons are calendar quarters (Jan, Apr, Jul, Oct).
function periodStart(period, now = new Date()) {
  if (period === 'week') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (period === 'season') return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  return null;
}

const row = (u, xp, i) => ({
  rank: i + 1,
  username: u.username,
  avatarUrl: u.avatarUrl,
  province: u.province,
  xp,
  won: u.stats?.won || 0,
  played: u.stats?.played || 0,
});

export async function getLeaderboard(req, res) {
  const { game, province, period = 'all' } = req.validQuery;
  const userFilter = { banned: false };
  if (province) userFilter.province = province;

  const since = periodStart(period);
  if (!since) {
    const xpField = game ? `xpByGame.${game}` : 'xp';
    const users = await User.find({ ...userFilter, [xpField]: { $gt: 0 } })
      .sort({ [xpField]: -1, username: 1 })
      .limit(LIMIT)
      .select('username avatarUrl province xp xpByGame stats')
      .lean();
    return res.json(users.map((u, i) => row(u, game ? u.xpByGame?.[game] || 0 : u.xp, i)));
  }

  const match = { createdAt: { $gte: since } };
  if (game) match.game = game;
  const totals = await XpLog.aggregate([
    { $match: match },
    { $group: { _id: '$user', xp: { $sum: '$amount' } } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'u' } },
    { $unwind: '$u' },
    { $match: Object.fromEntries(Object.entries(userFilter).map(([k, v]) => [`u.${k}`, v])) },
    { $sort: { xp: -1, 'u.username': 1 } },
    { $limit: LIMIT },
  ]);
  res.json(totals.map((t, i) => row(t.u, t.xp, i)));
}
