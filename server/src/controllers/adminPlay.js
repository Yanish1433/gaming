import mongoose from 'mongoose';
import { Challenge, Dispute, Tournament, User } from '../models/index.js';
import { maxScoreFor } from '../config/games.js';
import { ApiError } from '../utils/ApiError.js';
import { PUBLIC_USER_FIELDS } from '../utils/sanitize.js';
import { escapeRegex, exactInsensitive } from '../utils/escapeRegex.js';
import { notify } from '../services/notify.js';
import { participantIds, resolveScores, settleChallenge } from '../services/challenges.js';
import { awardTournament, TOURNAMENT_XP } from '../services/xp.js';

const PAGE_SIZE = 25;

// ---------------- challenges

export async function listChallenges(req, res) {
  const { game, status, q, page } = req.validQuery;
  const filter = {};
  if (game) filter.game = game;
  if (status) filter.status = status;
  if (q) {
    if (mongoose.isValidObjectId(q)) {
      filter._id = q;
    } else {
      const users = await User.find({ username: new RegExp(escapeRegex(q), 'i') }).select('_id').limit(50).lean();
      const ids = users.map((u) => u._id);
      filter.$or = [{ teamA: { $in: ids } }, { teamB: { $in: ids } }];
    }
  }
  // Admin view: room credentials included.
  const [items, total] = await Promise.all([
    Challenge.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .populate('teamA teamB creator', PUBLIC_USER_FIELDS)
      .lean(),
    Challenge.countDocuments(filter),
  ]);
  res.json({ items, total, page, pageSize: PAGE_SIZE });
}

async function closeDisputes(challengeId, resolution, admin) {
  await Dispute.updateMany(
    { challenge: challengeId, status: 'open' },
    { $set: { status: 'resolved', resolution, resolvedBy: admin._id } },
  );
}

export async function cancelChallenge(req, res) {
  const challenge = await Challenge.findById(req.params.id);
  if (!challenge) throw ApiError.notFound('Challenge not found');
  if (['settled', 'cancelled'].includes(challenge.status)) {
    throw ApiError.conflict(`Challenge is already ${challenge.status}`);
  }
  const from = challenge.status;
  challenge.status = 'cancelled';
  await challenge.save();
  await closeDisputes(challenge._id, `Challenge cancelled by admin: ${req.body.reason}`, req.user);
  await notify(participantIds(challenge), {
    type: 'challenge_cancelled',
    text: `An admin cancelled this challenge: ${req.body.reason}`,
    link: `/challenges/${challenge._id}`,
  });
  res.locals.audit = { action: 'challenge.cancel', targetType: 'Challenge', targetId: challenge._id, summary: `${from} -> cancelled: ${req.body.reason}` };
  res.json(challenge);
}

// Force settle through the normal settle service, so XP, rating and counters all apply.
export async function settleChallengeAdmin(req, res) {
  const challenge = await Challenge.findById(req.params.id);
  if (!challenge) throw ApiError.notFound('Challenge not found');
  if (['settled', 'cancelled', 'expired'].includes(challenge.status)) {
    throw ApiError.conflict(`Can't settle a challenge that is ${challenge.status}`);
  }
  if (!challenge.teamB.length) throw ApiError.conflict('Nobody accepted this challenge yet');
  const scores = req.body.scores
    ? await resolveScores(req.body.scores, participantIds(challenge), { max: maxScoreFor(challenge.game) })
    : undefined;

  await closeDisputes(challenge._id, `Force-settled by admin: Team ${req.body.winnerSide}. ${req.body.reason}`, req.user);
  await settleChallenge(challenge, req.body.winnerSide, {
    scores,
    actor: req.user,
    text: `An admin settled this challenge: Team ${req.body.winnerSide} won. ${req.body.reason}`,
  });
  res.locals.audit = { action: 'challenge.force_settle', targetType: 'Challenge', targetId: challenge._id, summary: `Team ${req.body.winnerSide}: ${req.body.reason}` };
  res.json(await Challenge.findById(challenge._id).populate('teamA teamB playerStats.user', PUBLIC_USER_FIELDS).lean());
}

export async function deleteChallenge(req, res) {
  const challenge = await Challenge.findById(req.params.id);
  if (!challenge) throw ApiError.notFound('Challenge not found');
  if (!['cancelled', 'expired'].includes(challenge.status)) {
    throw ApiError.conflict('Only cancelled or expired challenges can be deleted');
  }
  await Dispute.deleteMany({ challenge: challenge._id });
  await challenge.deleteOne();
  res.locals.audit = { action: 'challenge.delete', targetType: 'Challenge', targetId: challenge._id, summary: `${challenge.game} ${challenge.mode} (${challenge.status})` };
  res.json({ ok: true });
}

// ---------------- tournaments

export async function listTournaments(req, res) {
  const filter = {};
  if (req.validQuery.status) filter.status = req.validQuery.status;
  if (req.validQuery.game) filter.game = req.validQuery.game;
  const items = await Tournament.find(filter)
    .sort({ startsAt: -1 })
    .populate('organiser', PUBLIC_USER_FIELDS)
    .populate('registrations.user winners.user', 'username avatarUrl province')
    .lean();
  res.json({ items: items.map((t) => ({ ...t, teamsRegistered: t.registrations.length })), total: items.length, page: 1 });
}

async function findTournament(id) {
  const t = await Tournament.findById(id);
  if (!t) throw ApiError.notFound('Tournament not found');
  return t;
}

export async function updateTournament(req, res) {
  const t = await findTournament(req.params.id);
  if (req.body.maxTeams !== undefined && req.body.maxTeams < t.registrations.length) {
    throw ApiError.unprocessable('maxTeams is below the number of registered teams');
  }
  if (req.body.status === 'completed' && !t.winners.length) {
    throw ApiError.unprocessable('Use POST /admin/tournaments/:id/winners to complete a tournament');
  }
  t.set(req.body);
  await t.save();
  res.locals.audit = { action: 'tournament.update', targetType: 'Tournament', targetId: t._id, summary: `${t.title}: ${Object.keys(req.body).join(', ')}` };
  res.json(t);
}

export async function deleteTournament(req, res) {
  const t = await findTournament(req.params.id);
  await t.deleteOne();
  res.locals.audit = { action: 'tournament.delete', targetType: 'Tournament', targetId: t._id, summary: t.title };
  res.json({ ok: true });
}

export async function removeRegistration(req, res) {
  const t = await findTournament(req.params.id);
  const before = t.registrations.length;
  t.registrations = t.registrations.filter((r) => String(r.user) !== req.params.userId);
  if (t.registrations.length === before) throw ApiError.notFound('That player is not registered');
  await t.save();
  await notify(req.params.userId, {
    type: 'tournament_removed',
    text: `You were removed from "${t.title}" by an admin.`,
    link: `/tournaments/${t._id}`,
  });
  res.locals.audit = { action: 'tournament.remove_registration', targetType: 'Tournament', targetId: t._id, summary: `removed user ${req.params.userId} from ${t.title}` };
  res.json(t);
}

export async function setWinners(req, res) {
  const t = await findTournament(req.params.id);
  if (t.status === 'completed') throw ApiError.conflict('Winners already announced');

  const winners = [];
  for (const w of req.body.winners) {
    const user = await User.findOne({ username: exactInsensitive(w.username) }).select('username').lean();
    if (!user) throw ApiError.unprocessable(`Player "${w.username}" not found`);
    const reg = t.registrations.find((r) => String(r.user) === String(user._id));
    if (!reg) throw ApiError.unprocessable(`${user.username} is not registered in this tournament`);
    if (winners.some((x) => String(x.user) === String(user._id))) throw ApiError.unprocessable(`${user.username} listed twice`);
    winners.push({ place: w.place, user: user._id, teamName: w.teamName || reg.teamName, username: user.username });
  }

  // Atomic flip so XP is awarded once even under double clicks.
  const updated = await Tournament.findOneAndUpdate(
    { _id: t._id, status: { $ne: 'completed' } },
    { $set: { status: 'completed', winners: winners.map(({ username, ...w }) => w) } },
    { new: true },
  );
  if (!updated) throw ApiError.conflict('Winners already announced');
  await awardTournament(updated);
  await Promise.all(
    winners.map((w) =>
      notify(w.user, {
        type: 'tournament_winner',
        text: `${['', '1st', '2nd', '3rd'][w.place]} place in "${t.title}"! +${TOURNAMENT_XP[w.place]} XP.`,
        link: `/tournaments/${t._id}`,
      }),
    ),
  );
  res.locals.audit = {
    action: 'tournament.winners',
    targetType: 'Tournament',
    targetId: t._id,
    summary: `${t.title}: ${winners.map((w) => `${w.place}. ${w.username}`).join(', ')}`,
  };
  res.json(await Tournament.findById(t._id).populate('winners.user', 'username avatarUrl province').lean());
}
