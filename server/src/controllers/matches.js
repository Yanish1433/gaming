import { Match, User } from '../models/index.js';
import { gameConfig } from '../services/settings.js';
import { ApiError } from '../utils/ApiError.js';
import { PUBLIC_USER_FIELDS } from '../utils/sanitize.js';
import { exactInsensitive } from '../utils/escapeRegex.js';
import { isAdmin } from '../middleware/auth.js';
import { notify } from '../services/notify.js';
import { awardMatch } from '../services/xp.js';

export const ROOM_REVEAL_MS = 15 * 60 * 1000;

const isHost = (match, user) => user && String(match.host?._id ?? match.host) === String(user._id);
const isRegistered = (match, user) =>
  user && match.registrations.some((r) => String(r.user?._id ?? r.user) === String(user._id));
const hasRoom = (match) => Boolean(match.room?.roomId);
const roomRevealAt = (match) => new Date(new Date(match.startsAt).getTime() - ROOM_REVEAL_MS);

// Room goes to registered players only from startsAt - 15 min; host/admin always see it.
function canSeeRoom(match, user) {
  if (!user) return false;
  if (isHost(match, user) || isAdmin(user)) return true;
  return isRegistered(match, user) && Date.now() >= roomRevealAt(match).getTime();
}

function serialize(match, user) {
  const o = match.toObject();
  const visible = canSeeRoom(match, user);
  if (!visible) delete o.room;
  o.roomRevealAt = roomRevealAt(match);
  o.roomSet = hasRoom(match);
  o.slotsTaken = match.registrations.length;
  o.viewer = { isRegistered: Boolean(isRegistered(match, user)), isHost: Boolean(isHost(match, user)), canSeeRoom: visible };
  return o;
}

// Sends the one-time "room revealed" notification once the reveal window opens.
async function maybeNotifyRoom(match) {
  if (match.roomNotified || !hasRoom(match) || Date.now() < roomRevealAt(match).getTime()) return;
  const claimed = await Match.updateOne({ _id: match._id, roomNotified: false }, { $set: { roomNotified: true } });
  if (!claimed.modifiedCount) return;
  match.roomNotified = true;
  await notify(match.registrations.map((r) => r.user?._id ?? r.user), {
    type: 'match_room',
    text: `Room for "${match.title}" is live. Grab the ID and password.`,
    link: `/matches/${match._id}`,
  });
}

async function loadMatch(id) {
  const match = await Match.findById(id)
    .populate('host', PUBLIC_USER_FIELDS)
    .populate('registrations.user', PUBLIC_USER_FIELDS)
    .populate('results.user', PUBLIC_USER_FIELDS);
  if (!match) throw ApiError.notFound('Match not found');
  return match;
}

async function checkMatchRules({ game, mode, map }) {
  const cfg = await gameConfig(game);
  if (!cfg) throw ApiError.unprocessable('Unknown game');
  if (mode && !cfg.modes.includes(mode)) throw ApiError.unprocessable(`Mode must be one of: ${cfg.modes.join(', ')}`);
  if (map && !cfg.maps.includes(map)) throw ApiError.unprocessable(`Map must be one of: ${cfg.maps.join(', ') || 'none'}`);
}

export async function listMatches(req, res) {
  const { game, status } = req.validQuery;
  const filter = {};
  if (game) filter.game = game;
  if (status) filter.status = status;
  const items = await Match.find(filter)
    .sort({ startsAt: status === 'completed' ? -1 : 1 })
    .limit(100)
    .select('-room -registrations -results')
    .populate('host', PUBLIC_USER_FIELDS)
    .lean();
  // Slot counts without shipping the full registration list.
  const counts = await Match.aggregate([
    { $match: { _id: { $in: items.map((m) => m._id) } } },
    { $project: { n: { $size: '$registrations' } } },
  ]);
  const byId = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
  res.json({
    items: items.map((m) => ({ ...m, slotsTaken: byId[String(m._id)] || 0, roomRevealAt: new Date(new Date(m.startsAt).getTime() - ROOM_REVEAL_MS) })),
    total: items.length,
    page: 1,
  });
}

export async function getMatch(req, res) {
  const match = await loadMatch(req.params.id);
  await maybeNotifyRoom(match);
  res.json(serialize(match, req.user));
}

export async function createMatch(req, res) {
  await checkMatchRules(req.body);
  const match = await Match.create({ ...req.body, host: req.user._id });
  res.locals.audit = { action: 'match.create', targetType: 'Match', targetId: match._id, summary: `${match.title} (${match.game} ${match.map || match.mode})` };
  res.status(201).json(serialize(await loadMatch(match._id), req.user));
}

export async function updateMatch(req, res) {
  const match = await Match.findById(req.params.id);
  if (!match) throw ApiError.notFound('Match not found');
  if (!isHost(match, req.user) && !isAdmin(req.user)) throw ApiError.forbidden('Only the host can edit this match');
  await checkMatchRules({ game: match.game, ...req.body });

  if (req.body.maxSlots !== undefined && req.body.maxSlots < match.registrations.length) {
    throw ApiError.unprocessable('maxSlots is below the number of registered players');
  }
  const roomChanged = req.body.room && (req.body.room.roomId !== match.room?.roomId || req.body.room.password !== match.room?.password);
  match.set(req.body);
  if (roomChanged) match.roomNotified = false;
  await match.save();
  res.locals.audit = { action: 'match.update', targetType: 'Match', targetId: match._id, summary: `${match.title}: ${Object.keys(req.body).join(', ')}` };

  await maybeNotifyRoom(match);
  res.json(serialize(await loadMatch(match._id), req.user));
}

export async function registerForMatch(req, res) {
  const match = await Match.findById(req.params.id);
  if (!match) throw ApiError.notFound('Match not found');
  if (match.status !== 'upcoming') throw ApiError.conflict('Registration is closed');
  if (isRegistered(match, req.user)) throw ApiError.conflict('You are already registered');

  // Atomic slot check so the match can't overfill.
  const updated = await Match.findOneAndUpdate(
    {
      _id: match._id,
      status: 'upcoming',
      'registrations.user': { $ne: req.user._id },
      $expr: { $lt: [{ $size: '$registrations' }, '$maxSlots'] },
    },
    { $push: { registrations: { user: req.user._id, teamName: req.body.teamName || req.user.username } } },
    { new: true },
  );
  if (!updated) throw ApiError.conflict('Match is full');
  res.json(serialize(await loadMatch(match._id), req.user));
}

export async function unregisterFromMatch(req, res) {
  const match = await Match.findById(req.params.id);
  if (!match) throw ApiError.notFound('Match not found');
  if (match.status !== 'upcoming') throw ApiError.conflict('Match already started');
  if (!isRegistered(match, req.user)) throw ApiError.conflict('You are not registered');
  await Match.updateOne({ _id: match._id }, { $pull: { registrations: { user: req.user._id } } });
  res.json(serialize(await loadMatch(match._id), req.user));
}

export async function submitResults(req, res) {
  const match = await Match.findById(req.params.id);
  if (!match) throw ApiError.notFound('Match not found');
  if (!isHost(match, req.user) && !isAdmin(req.user)) throw ApiError.forbidden('Only the host can submit results');
  if (match.status === 'completed') throw ApiError.conflict('Results already submitted');
  if (match.status === 'cancelled') throw ApiError.conflict('Match was cancelled');

  const results = [];
  for (const r of req.body.results) {
    const user = r.user
      ? await User.findById(r.user)
      : await User.findOne({ username: exactInsensitive(r.username) });
    if (!user) throw ApiError.unprocessable(`Player "${r.username || r.user}" not found`);
    if (!isRegistered(match, user)) throw ApiError.unprocessable(`${user.username} is not registered in this match`);
    if (results.some((x) => String(x.user) === String(user._id))) throw ApiError.unprocessable(`${user.username} listed twice`);
    results.push({ user: user._id, placement: r.placement, kills: r.kills ?? 0, points: r.points ?? 0 });
  }

  match.results = results;
  match.status = 'completed';
  await match.save();
  res.locals.audit = { action: 'match.results', targetType: 'Match', targetId: match._id, summary: `${match.title}: ${results.length} results` };
  await awardMatch(match);
  await notify(results.map((r) => r.user), {
    type: 'match_results',
    text: `Results are up for "${match.title}". XP added to your rank.`,
    link: `/matches/${match._id}`,
  });
  res.json(serialize(await loadMatch(match._id), req.user));
}
