import { Challenge, Match, Sponsor, User } from '../models/index.js';
import { getGame } from '../config/games.js';
import { ApiError } from '../utils/ApiError.js';
import { fileUrl } from '../middleware/upload.js';

const PUBLIC_FIELDS = 'name logoUrl website slot game';

const liveFilter = (now = new Date()) => ({
  active: true,
  $and: [
    { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
    { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
  ],
});

// Public: live sponsors for a slot; counts an impression for each one returned.
export async function active(req, res) {
  const { slot, game } = req.validQuery;
  const filter = liveFilter();
  if (slot) filter.slot = slot;
  // A hub banner with no game shows in every hub.
  if (game) filter.$and.push({ $or: [{ game }, { game: null }] });
  const items = await Sponsor.find(filter).sort({ createdAt: 1 }).select(PUBLIC_FIELDS).lean();
  if (items.length) await Sponsor.updateMany({ _id: { $in: items.map((s) => s._id) } }, { $inc: { impressions: 1 } });
  res.json(items);
}

export async function click(req, res) {
  const s = await Sponsor.findOneAndUpdate({ _id: req.params.id, active: true }, { $inc: { clicks: 1 } }, { new: true });
  if (!s) throw ApiError.notFound('Sponsor not found');
  res.json({ ok: true, website: s.website });
}

// ---- admin CRUD (multipart: optional `logo` image)
const withCtr = (s) => ({ ...s, ctr: s.impressions ? Math.round((s.clicks / s.impressions) * 10000) / 100 : 0 });

export async function list(req, res) {
  const items = await Sponsor.find().sort({ active: -1, createdAt: -1 }).lean();
  res.json({ items: items.map(withCtr), total: items.length, page: 1 });
}

export async function create(req, res) {
  const s = await Sponsor.create({ ...req.body, ...(req.file ? { logoUrl: fileUrl(req.file) } : {}) });
  res.locals.audit = { action: 'sponsor.create', targetType: 'Sponsor', targetId: s._id, summary: `${s.name} (${s.slot})` };
  res.status(201).json(withCtr(s.toObject()));
}

export async function update(req, res) {
  const s = await Sponsor.findById(req.params.id);
  if (!s) throw ApiError.notFound('Sponsor not found');
  s.set({ ...req.body, ...(req.file ? { logoUrl: fileUrl(req.file) } : {}) });
  await s.save();
  res.locals.audit = { action: 'sponsor.update', targetType: 'Sponsor', targetId: s._id, summary: `${s.name}: ${[...Object.keys(req.body), ...(req.file ? ['logo'] : [])].join(', ')}` };
  res.json(withCtr(s.toObject()));
}

export async function remove(req, res) {
  const s = await Sponsor.findByIdAndDelete(req.params.id);
  if (!s) throw ApiError.notFound('Sponsor not found');
  res.locals.audit = { action: 'sponsor.delete', targetType: 'Sponsor', targetId: s._id, summary: s.name };
  res.json({ ok: true });
}

// ---- public pitch stats (includes demo data, by the captain's decision), cached 60 s
const STATS_TTL = 60 * 1000;
let statsCache = null;

export async function publicStats(req, res) {
  if (!statsCache || Date.now() - statsCache.at > STATS_TTL) {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [players, settled, matchesDone, challengesThisWeek, provinces, byGame] = await Promise.all([
      User.countDocuments({ role: 'player', banned: false }),
      Challenge.countDocuments({ status: 'settled' }),
      Match.countDocuments({ status: 'completed' }),
      Challenge.countDocuments({ createdAt: { $gte: weekAgo } }),
      User.distinct('province', { banned: false, province: { $ne: null } }),
      Challenge.aggregate([{ $match: { status: 'settled' } }, { $group: { _id: '$game', n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 1 }]),
    ]);
    const top = byGame[0] && getGame(byGame[0]._id);
    statsCache = {
      at: Date.now(),
      data: {
        players,
        matchesPlayed: settled + matchesDone,
        challengesThisWeek,
        provinces: provinces.length,
        topGame: top ? { slug: top.slug, name: top.name, matches: byGame[0].n } : null,
      },
    };
  }
  res.set('Cache-Control', 'public, max-age=60');
  res.json(statsCache.data);
}
