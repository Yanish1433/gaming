import { Challenge, User } from '../models/index.js';
import { RATING } from '../config/games.js';
import { ApiError } from '../utils/ApiError.js';
import { awardChallenge } from './xp.js';
import { notify } from './notify.js';
import { applyRanked, buildPlayerStats } from './rating.js';
import { logAudit } from './audit.js';

const sameId = (a, b) => String(a?._id ?? a) === String(b?._id ?? b);

export const sideOf = (challenge, userId) => {
  if (challenge.teamA.some((u) => sameId(u, userId))) return 'A';
  if (challenge.teamB.some((u) => sameId(u, userId))) return 'B';
  return null;
};

export const participantIds = (challenge) => [...challenge.teamA, ...challenge.teamB].map((u) => String(u._id ?? u));

// Turns [{ username, score }] into Map<userId, score>, limited to `allowedIds`.
// requireAll: every allowed player must have a score (used for a side's own report).
export async function resolveScores(scores = [], allowedIds, { requireAll = false, max = 100 } = {}) {
  const users = await User.find({ _id: { $in: allowedIds } }).select('username').lean();
  const byName = new Map(users.map((u) => [u.username.toLowerCase(), String(u._id)]));
  const out = new Map();
  for (const { username, score } of scores) {
    const id = byName.get(username.toLowerCase());
    if (!id) throw ApiError.unprocessable(`scores: "${username}" is not a player you can report for`);
    if (out.has(id)) throw ApiError.unprocessable(`scores: "${username}" listed twice`);
    if (score > max) throw ApiError.unprocessable(`scores: ${score} is not a realistic score (max ${max})`);
    out.set(id, score);
  }
  if (requireAll) {
    const missing = users.filter((u) => !out.has(String(u._id))).map((u) => u.username);
    if (missing.length) throw ApiError.unprocessable(`scores: missing score for ${missing.join(', ')}`);
  }
  return out;
}

// Per-player scores from each side's own report; `overrides` (userId -> score, from an admin) win.
function scoreMap(challenge, overrides) {
  const scores = new Map();
  for (const report of challenge.reports) {
    for (const s of report.scores || []) scores.set(String(s.user), s.score);
  }
  for (const [user, score] of overrides || []) scores.set(String(user), score);
  return scores;
}

// Single place where a challenge becomes settled, used by agreeing reports and admin dispute resolution.
// opts: { text, scores: Map<userId, score>, actor }
export async function settleChallenge(challenge, winnerSide, opts = {}) {
  const ids = participantIds(challenge);
  const users = await User.find({ _id: { $in: ids } }).select('ratingByGame').lean();
  const ratings = new Map(users.map((u) => [String(u._id), u.ratingByGame?.[challenge.game] ?? RATING.start]));
  const scores = scoreMap(challenge, opts.scores);
  const playerStats = buildPlayerStats({
    teamA: challenge.teamA,
    teamB: challenge.teamB,
    winnerSide,
    ranked: challenge.ranked,
    scoreOf: (id) => scores.get(String(id)),
    ratingOf: (id) => ratings.get(String(id)) ?? RATING.start,
  });

  // Atomic claim: only one caller can flip to settled, so XP/rating are never applied twice.
  const claimed = await Challenge.findOneAndUpdate(
    { _id: challenge._id, status: { $ne: 'settled' } },
    { $set: { status: 'settled', winnerSide, reports: challenge.reports, playerStats, settledAt: new Date() } },
    { new: true },
  );
  if (!claimed) return challenge;
  challenge.status = 'settled';
  challenge.winnerSide = winnerSide;
  challenge.playerStats = playerStats;

  await awardChallenge(claimed);
  if (claimed.ranked) await applyRanked(claimed.game, playerStats);
  await logAudit({
    actor: opts.actor,
    action: 'challenge.settled',
    targetType: 'Challenge',
    targetId: claimed._id,
    summary: `${claimed.game} ${claimed.mode} ${claimed.teamSize}v${claimed.teamSize} settled: Team ${winnerSide} won${claimed.ranked ? ' (ranked)' : ''}`,
  });

  await notify(ids, {
    type: 'challenge_settled',
    text: opts.text || `Result settled: Team ${winnerSide} won. XP${claimed.ranked ? ' and rating' : ''} updated.`,
    link: `/challenges/${challenge._id}`,
  });
  return challenge;
}
