import { Challenge, Dispute, User } from '../models/index.js';
import { getGame, maxScoreFor } from '../config/games.js';
import { gameConfig } from '../services/settings.js';
import { ApiError } from '../utils/ApiError.js';
import { PUBLIC_USER_FIELDS } from '../utils/sanitize.js';
import { exactInsensitive } from '../utils/escapeRegex.js';
import { isAdmin } from '../middleware/auth.js';
import { fileUrl } from '../middleware/upload.js';
import { notify } from '../services/notify.js';
import { sideOf, participantIds, resolveScores, settleChallenge } from '../services/challenges.js';

const PAGE_SIZE = 20;
// Open challenges whose scheduled time passed this long ago are expired lazily on read.
const EXPIRE_AFTER_MS = 60 * 60 * 1000;

async function expireStale() {
  await Challenge.updateMany(
    { status: 'open', scheduledAt: { $lt: new Date(Date.now() - EXPIRE_AFTER_MS) } },
    { $set: { status: 'expired' } },
  );
}

// Room credentials only go to participants and admins.
function serialize(challenge, viewer) {
  const o = challenge.toObject();
  const side = viewer ? sideOf(challenge, viewer._id) : null;
  if (!side && !isAdmin(viewer)) delete o.room;
  o.viewer = { side, isParticipant: Boolean(side), isCreator: Boolean(viewer && String(challenge.creator?._id ?? challenge.creator) === String(viewer._id)) };
  return o;
}

async function loadChallenge(id) {
  const challenge = await Challenge.findById(id).populate('teamA teamB creator playerStats.user', PUBLIC_USER_FIELDS);
  if (!challenge) throw ApiError.notFound('Challenge not found');
  return challenge;
}

async function checkGameRules({ game, mode, map, teamSize }) {
  const cfg = await gameConfig(game);
  if (!cfg) throw ApiError.unprocessable('Unknown game');
  if (!cfg.enabled) throw ApiError.unprocessable(`${cfg.name} is switched off right now`);
  if (!cfg.modes.includes(mode)) throw ApiError.unprocessable(`Mode must be one of: ${cfg.modes.join(', ')}`);
  if (!cfg.teamSizes.includes(teamSize)) throw ApiError.unprocessable(`${cfg.name} supports team sizes ${cfg.teamSizes.join(', ')}`);
  if (map && !cfg.maps.includes(map)) throw ApiError.unprocessable(`Map must be one of: ${cfg.maps.join(', ') || 'none'}`);
}

// Ranked defaults to on for ranked-eligible modes and can't be forced on for others.
function rankedFor({ game, mode, ranked }) {
  const eligible = getGame(game).rankedModes.includes(mode);
  if (ranked && !eligible) {
    throw ApiError.unprocessable(`Ranked is only for: ${getGame(game).rankedModes.join(', ')}`);
  }
  return ranked ?? eligible;
}

// Resolves teammate usernames to active users, excluding anyone already in the challenge.
async function resolveTeammates(usernames = [], teamSize, exclude = []) {
  const unique = [...new Set(usernames.map((u) => u.trim().toLowerCase()))];
  if (unique.length > teamSize - 1) throw ApiError.unprocessable(`At most ${teamSize - 1} teammate(s) for team size ${teamSize}`);
  const users = await Promise.all(unique.map((name) => User.findOne({ username: exactInsensitive(name) })));
  users.forEach((u, i) => {
    if (!u) throw ApiError.unprocessable(`Player "${unique[i]}" not found`);
    if (u.banned) throw ApiError.unprocessable(`Player "${u.username}" can't play right now`);
    if (exclude.some((id) => String(id) === String(u._id))) throw ApiError.unprocessable(`Player "${u.username}" is already in this challenge`);
  });
  return users.map((u) => u._id);
}

export async function listChallenges(req, res) {
  await expireStale();
  const { game, status, teamSize, ranked, page = 1 } = req.validQuery;
  const filter = {};
  if (ranked !== undefined) filter.ranked = ranked;
  if (game) filter.game = game;
  if (status) filter.status = status;
  if (teamSize) filter.teamSize = teamSize;

  const [items, total] = await Promise.all([
    Challenge.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .select('-room')
      .populate('teamA teamB creator', PUBLIC_USER_FIELDS)
      .lean(),
    Challenge.countDocuments(filter),
  ]);
  res.json({ items, total, page, pageSize: PAGE_SIZE });
}

export async function createChallenge(req, res) {
  const body = req.body;
  await checkGameRules(body);
  const teammates = await resolveTeammates(body.teammates, body.teamSize, [req.user._id]);

  const challenge = await Challenge.create({
    game: body.game,
    mode: body.mode,
    map: body.map || undefined,
    teamSize: body.teamSize,
    ranked: rankedFor(body),
    scheduledAt: body.scheduledAt,
    notes: body.notes,
    creator: req.user._id,
    teamA: [req.user._id, ...teammates],
  });
  if (teammates.length) {
    await notify(teammates, {
      type: 'challenge_team',
      text: `${req.user.username} added you to a ${getGame(body.game).name} challenge.`,
      link: `/challenges/${challenge._id}`,
    });
  }
  res.status(201).json(serialize(await loadChallenge(challenge._id), req.user));
}

export async function getChallenge(req, res) {
  const challenge = await loadChallenge(req.params.id);
  res.json(serialize(challenge, req.user));
}

export async function acceptChallenge(req, res) {
  const challenge = await Challenge.findById(req.params.id);
  if (!challenge) throw ApiError.notFound('Challenge not found');
  if (challenge.status !== 'open') throw ApiError.conflict('This challenge is no longer open');
  if (sideOf(challenge, req.user._id)) throw ApiError.conflict("You can't accept a challenge you're already in");

  const teammates = await resolveTeammates(req.body.teammates, challenge.teamSize, [req.user._id, ...challenge.teamA]);

  // Atomic guard so two players can't accept the same challenge at once.
  const updated = await Challenge.findOneAndUpdate(
    { _id: challenge._id, status: 'open' },
    { $set: { status: 'accepted', teamB: [req.user._id, ...teammates] } },
    { new: true },
  );
  if (!updated) throw ApiError.conflict('Someone accepted this challenge first');

  await notify([...participantIds(updated)].filter((id) => id !== String(req.user._id)), {
    type: 'challenge_accepted',
    text: `${req.user.username} accepted your challenge. Set up the room!`,
    link: `/challenges/${updated._id}`,
  });
  res.json(serialize(await loadChallenge(updated._id), req.user));
}

export async function setRoom(req, res) {
  const challenge = await Challenge.findById(req.params.id);
  if (!challenge) throw ApiError.notFound('Challenge not found');
  if (String(challenge.creator) !== String(req.user._id) && !isAdmin(req.user)) {
    throw ApiError.forbidden('Only the challenge creator can set the room');
  }
  if (!['accepted', 'room_ready'].includes(challenge.status)) {
    throw ApiError.conflict('Room can only be set after the challenge is accepted');
  }
  challenge.room = { roomId: req.body.roomId, password: req.body.password };
  challenge.status = 'room_ready';
  await challenge.save();

  await notify(participantIds(challenge).filter((id) => id !== String(req.user._id)), {
    type: 'room_ready',
    text: 'Room is ready. Check the room ID and password.',
    link: `/challenges/${challenge._id}`,
  });
  res.json(serialize(await loadChallenge(challenge._id), req.user));
}

export async function startChallenge(req, res) {
  const challenge = await Challenge.findById(req.params.id);
  if (!challenge) throw ApiError.notFound('Challenge not found');
  if (!sideOf(challenge, req.user._id) && !isAdmin(req.user)) throw ApiError.forbidden('Only participants can start');
  if (challenge.status !== 'room_ready') throw ApiError.conflict('Challenge must have a room before it starts');
  challenge.status = 'in_progress';
  await challenge.save();
  res.json(serialize(await loadChallenge(challenge._id), req.user));
}

export async function reportResult(req, res) {
  const challenge = await Challenge.findById(req.params.id);
  if (!challenge) throw ApiError.notFound('Challenge not found');
  const side = sideOf(challenge, req.user._id);
  if (!side) throw ApiError.forbidden('Only participants can report results');
  if (!['room_ready', 'in_progress', 'reported'].includes(challenge.status)) {
    throw ApiError.conflict(`Can't report a result while the challenge is ${challenge.status}`);
  }
  if (challenge.reports.some((r) => sideOf(challenge, r.by) === side)) {
    throw ApiError.conflict('Your team has already reported a result');
  }
  if (!req.file) throw ApiError.unprocessable('A result screenshot is required');

  // Each side reports kills/goals for its own players only.
  const ownSide = side === 'A' ? challenge.teamA : challenge.teamB;
  const scores = await resolveScores(req.body.scores, ownSide, { requireAll: true, max: maxScoreFor(challenge.game) });

  challenge.reports.push({
    by: req.user._id,
    winnerSide: req.body.winnerSide,
    screenshotUrl: fileUrl(req.file),
    scores: [...scores].map(([user, score]) => ({ user, score })),
  });
  const [first, second] = challenge.reports;

  if (!second) {
    challenge.status = 'reported';
    await challenge.save();
    const otherSide = participantIds(challenge).filter((id) => sideOf(challenge, id) !== side);
    await notify(otherSide, {
      type: 'result_reported',
      text: `${req.user.username} reported a result. Confirm yours.`,
      link: `/challenges/${challenge._id}`,
    });
  } else if (first.winnerSide === second.winnerSide) {
    await settleChallenge(challenge, first.winnerSide, { actor: req.user });
  } else {
    challenge.status = 'disputed';
    await challenge.save();
    await Dispute.create({
      challenge: challenge._id,
      raisedBy: req.user._id,
      reason: 'Both teams reported a different winner.',
      evidenceUrl: fileUrl(req.file),
    });
    await notify(participantIds(challenge), {
      type: 'challenge_disputed',
      text: 'Results did not match. An admin will review the screenshots.',
      link: `/challenges/${challenge._id}`,
    });
  }
  res.json(serialize(await loadChallenge(challenge._id), req.user));
}

export async function cancelChallenge(req, res) {
  const challenge = await Challenge.findById(req.params.id);
  if (!challenge) throw ApiError.notFound('Challenge not found');
  if (String(challenge.creator) !== String(req.user._id) && !isAdmin(req.user)) {
    throw ApiError.forbidden('Only the creator can cancel');
  }
  if (challenge.status !== 'open') throw ApiError.conflict('Only open challenges can be cancelled');
  challenge.status = 'cancelled';
  await challenge.save();
  res.json(serialize(await loadChallenge(challenge._id), req.user));
}
