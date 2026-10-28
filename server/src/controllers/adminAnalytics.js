import { AuditLog, Challenge, Match, TopupOrder, User, XpLog } from '../models/index.js';
import { exactInsensitive, escapeRegex } from '../utils/escapeRegex.js';

const TZ = 'Asia/Kathmandu';
const DAY = 24 * 60 * 60 * 1000;
const RANGES = { '7d': 7, '30d': 30, '90d': 90 };

const dayKey = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d); // YYYY-MM-DD
const dayExpr = (field) => ({ $dateToString: { format: '%Y-%m-%d', date: `$${field}`, timezone: TZ } });

// Every day in the range, oldest first, so charts get explicit zeros.
function dayList(days) {
  const out = [];
  for (let i = days - 1; i >= 0; i -= 1) out.push(dayKey(new Date(Date.now() - i * DAY)));
  return out;
}

function fill(days, rows, value = 'count') {
  const byDate = new Map(rows.map((r) => [r._id, r]));
  return days.map((date) => ({ date, [value]: byDate.get(date)?.[value] ?? 0 }));
}

const pct = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : 0);

export async function analytics(req, res) {
  const days = RANGES[req.validQuery.range];
  const since = new Date(Date.now() - days * DAY);
  const list = dayList(days);

  const [signups, challenges, challengesByGame, settledByGame, revenue, ordersByStatus, provinces, active, newUsers, organisers] =
    await Promise.all([
      User.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: dayExpr('createdAt'), count: { $sum: 1 } } }]),
      Challenge.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: dayExpr('createdAt'), count: { $sum: 1 } } }]),
      Challenge.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { date: dayExpr('createdAt'), game: '$game' }, count: { $sum: 1 } } },
      ]),
      Challenge.aggregate([
        { $match: { status: 'settled', settledAt: { $gte: since } } },
        { $group: { _id: '$game', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      TopupOrder.aggregate([
        { $match: { status: 'fulfilled', createdAt: { $gte: since } } },
        { $group: { _id: dayExpr('createdAt'), npr: { $sum: '$priceNpr' } } },
      ]),
      TopupOrder.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      User.aggregate([{ $group: { _id: '$province', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      XpLog.distinct('user', { createdAt: { $gte: new Date(Date.now() - 7 * DAY) } }),
      User.find({ createdAt: { $gte: since } }).select('createdAt').lean(),
      Match.aggregate([
        { $group: { _id: '$host', matches: { $sum: 1 }, registrations: { $sum: { $size: '$registrations' } } } },
        { $sort: { registrations: -1, matches: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'u' } },
        { $unwind: '$u' },
      ]),
    ]);

  // Retention (approx.): share of users created in range whose first settled challenge came within 1 / 7 days.
  const firstSettle = await Challenge.aggregate([
    { $match: { status: 'settled', 'playerStats.user': { $in: newUsers.map((u) => u._id) } } },
    { $unwind: '$playerStats' },
    { $group: { _id: '$playerStats.user', first: { $min: '$settledAt' } } },
  ]);
  const firstBy = new Map(firstSettle.map((f) => [String(f._id), f.first]));
  const within = (limit) =>
    newUsers.filter((u) => {
      const first = firstBy.get(String(u._id));
      return first && first - u.createdAt <= limit;
    }).length;

  const byGameDay = new Map();
  for (const r of challengesByGame) {
    const m = byGameDay.get(r._id.date) ?? {};
    m[r._id.game] = r.count;
    byGameDay.set(r._id.date, m);
  }

  res.json({
    range: req.validQuery.range,
    signupsByDay: fill(list, signups),
    challengesByDay: fill(list, challenges).map((d) => ({ ...d, byGame: byGameDay.get(d.date) ?? {} })),
    settledByGame: settledByGame.map((r) => ({ game: r._id, count: r.count })),
    revenueByDay: fill(list, revenue, 'npr'),
    ordersByStatus: ['pending', 'paid', 'fulfilled', 'failed'].map((status) => ({
      status,
      count: ordersByStatus.find((r) => r._id === status)?.count ?? 0,
    })),
    usersByProvince: provinces.filter((r) => r._id).map((r) => ({ province: r._id, count: r.count })),
    activePlayers7d: active.length,
    retention: { d1: pct(within(DAY), newUsers.length), d7: pct(within(7 * DAY), newUsers.length), cohort: newUsers.length },
    topOrganisers: organisers.map((o) => ({ username: o.u.username, role: o.u.role, matches: o.matches, registrations: o.registrations })),
  });
}

const withActor = (q) => q.populate('actor', 'username avatarUrl role');

export async function activity(req, res) {
  const items = await withActor(AuditLog.find().sort({ at: -1 }).limit(req.validQuery.limit)).lean();
  res.json(items);
}

const AUDIT_PAGE = 50;

export async function auditLog(req, res) {
  const { actor, action, targetType, targetId, page } = req.validQuery;
  const filter = {};
  if (actor) {
    const user = await User.findOne({ username: exactInsensitive(actor) }).select('_id').lean();
    if (!user) return res.json({ items: [], total: 0, page });
    filter.actor = user._id;
  }
  if (action) filter.action = new RegExp(`^${escapeRegex(action)}`); // prefix: "user." matches all user actions
  if (targetType) filter.targetType = targetType;
  if (targetId) filter.targetId = targetId;
  const [items, total] = await Promise.all([
    withActor(AuditLog.find(filter).sort({ at: -1 }).skip((page - 1) * AUDIT_PAGE).limit(AUDIT_PAGE)).lean(),
    AuditLog.countDocuments(filter),
  ]);
  res.json({ items, total, page });
}
