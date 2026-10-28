import { Announcement, Notification, User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';

const BATCH = 1000;

// Public: active announcements, pinned first. With ?game= only that game's (plus site-wide) ones;
// province announcements show for signed-in users of that province.
export async function listPublic(req, res) {
  const { game } = req.validQuery;
  const or = [{ audience: 'all' }, game ? { audience: 'game', game } : { audience: 'game' }];
  if (req.user?.province) or.push({ audience: 'province', province: req.user.province });
  const items = await Announcement.find({ active: true, $or: or })
    .sort({ pinned: -1, createdAt: -1 })
    .limit(20)
    .select('title body link game audience province pinned createdAt')
    .lean();
  res.json(items);
}

// ---- admin CRUD
export async function list(req, res) {
  const items = await Announcement.find().sort({ pinned: -1, createdAt: -1 }).populate('createdBy', 'username').lean();
  res.json({ items, total: items.length, page: 1 });
}

function checkAudience(a) {
  if (a.audience === 'game' && !a.game) throw ApiError.unprocessable('game is required for a game audience');
  if (a.audience === 'province' && !a.province) throw ApiError.unprocessable('province is required for a province audience');
}

export async function create(req, res) {
  checkAudience(req.body);
  const a = await Announcement.create({ ...req.body, createdBy: req.user._id });
  res.locals.audit = { action: 'announcement.create', targetType: 'Announcement', targetId: a._id, summary: a.title };
  res.status(201).json(a);
}

export async function update(req, res) {
  const a = await Announcement.findById(req.params.id);
  if (!a) throw ApiError.notFound('Announcement not found');
  a.set(req.body);
  checkAudience(a);
  await a.save();
  res.locals.audit = { action: 'announcement.update', targetType: 'Announcement', targetId: a._id, summary: `${a.title}: ${Object.keys(req.body).join(', ')}` };
  res.json(a);
}

export async function remove(req, res) {
  const a = await Announcement.findByIdAndDelete(req.params.id);
  if (!a) throw ApiError.notFound('Announcement not found');
  res.locals.audit = { action: 'announcement.delete', targetType: 'Announcement', targetId: a._id, summary: a.title };
  res.json({ ok: true });
}

// Sends the announcement as a notification to every matching (non-banned) user, in batches.
export async function broadcast(req, res) {
  const a = await Announcement.findById(req.params.id);
  if (!a) throw ApiError.notFound('Announcement not found');
  const filter = { banned: false };
  if (a.audience === 'game') filter[`gameIds.${a.game}`] = { $exists: true, $nin: [null, ''] };
  if (a.audience === 'province') filter.province = a.province;

  let sent = 0;
  let batch = [];
  const flush = async () => {
    if (!batch.length) return;
    await Notification.insertMany(batch, { ordered: false });
    sent += batch.length;
    batch = [];
  };
  for await (const u of User.find(filter).select('_id').lean().cursor()) {
    batch.push({ user: u._id, type: 'announcement', text: a.body ? `${a.title}: ${a.body}`.slice(0, 500) : a.title, link: a.link || '/' });
    if (batch.length >= BATCH) await flush();
  }
  await flush();

  a.lastBroadcastAt = new Date();
  a.lastBroadcastCount = sent;
  await a.save();
  res.locals.audit = { action: 'announcement.broadcast', targetType: 'Announcement', targetId: a._id, summary: `"${a.title}" sent to ${sent} users (${a.audience}${a.game ? `:${a.game}` : ''}${a.province ? `:${a.province}` : ''})` };
  res.json({ ok: true, sent });
}
