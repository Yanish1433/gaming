// Demo data generator for the sponsor pitch: ~60 players and ~200 settled ranked challenges over 8 weeks.
// Everything is deterministic (seeded PRNG) and every record is flagged isDemo.
import mongoose from 'mongoose';
import { GAMES, PROVINCES, RATING, XP, getGame } from '../config/games.js';
import { buildPlayerStats } from '../services/rating.js';

export function rng(seed = 20261028) {
  let a = seed;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.int = (min, max) => min + Math.floor(next() * (max - min + 1));
  next.pick = (arr) => arr[Math.floor(next() * arr.length)];
  next.shuffle = (arr) => {
    const a2 = [...arr];
    for (let i = a2.length - 1; i > 0; i -= 1) {
      const j = Math.floor(next() * (i + 1));
      [a2[i], a2[j]] = [a2[j], a2[i]];
    }
    return a2;
  };
  return next;
}

const PREFIXES = [
  'everest', 'annapurna', 'gorkha', 'khukuri', 'yeti', 'sherpa', 'danphe', 'bagh', 'chitwan', 'rara',
  'tilicho', 'bardiya', 'ilam', 'hetauda', 'nepalgunj', 'biratnagar', 'damak', 'tansen', 'bandipur', 'palpa',
  'gulmi', 'syangja', 'baglung', 'dolpa', 'humla', 'mahendra', 'kirtipur', 'thamel', 'baneshwor', 'chabahil',
];
const SUFFIXES = [
  'ace', 'sniper', 'rusher', 'hs', 'legend', 'wolf', 'storm', 'ninja', 'gunner', 'striker',
  'maestro', 'hawk', 'viper', 'titan', 'blaze', 'boss', 'kid', 'og', 'pro', 'xd',
];
const BIOS = [
  'Rush or nothing. Evening scrims only.',
  'IGL for a local squad. DM for customs.',
  'Clash Squad main. Headshots only.',
  'Sanhok enjoyer. Chill duo partner.',
  'Weekend warrior.',
  'Quiet in the lobby, loud on the scoreboard.',
  'Left back by day, striker by night.',
  'Ranked grind every evening after college.',
  'Counter-attack merchant.',
  'TDM is my therapy.',
  '',
];

// Extra demo players on top of the hand-written ones, spread over all 7 provinces.
export function makeDemoPlayers(count, taken, r) {
  const out = [];
  const used = new Set(taken);
  let i = 0;
  while (out.length < count) {
    const base = `${r.pick(PREFIXES)}_${r.pick(SUFFIXES)}`;
    const username = r() < 0.3 ? `${base}${r.int(1, 99)}` : base;
    if (used.has(username) || username.length > 20) continue;
    used.add(username);
    const games = r.shuffle(GAMES.map((g) => g.slug)).slice(0, r.int(1, 3));
    const gameIds = Object.fromEntries(
      games.map((g) => [g, g === 'pubg' ? String(r.int(5100000000, 5899999999)) : g === 'freefire' ? String(r.int(2200000000, 2299999999)) : username.replace('_', '')]),
    );
    out.push({ username, province: PROVINCES[i % PROVINCES.length], gameIds, bio: r.pick(BIOS) });
    i += 1;
  }
  return out;
}

// [teamSize, count] for ranked history (mostly 1v1).
const MIX = [[1, 140], [2, 30], [3, 15], [4, 15]];
const WEEKS = 8;

// Kills / goals per player for a mode; winners skew higher.
function scoreFor(game, mode, won, r) {
  if (getGame(game).statLabel === 'Goals') return won ? r.int(1, 7) : r.int(0, 4);
  if (mode === 'TDM') return won ? r.int(18, 40) : r.int(5, 30);
  return won ? r.int(3, 14) : r.int(0, 9);
}

/**
 * Simulates the ranked history chronologically, using the live Elo code.
 * players: saved User docs (with gameIds), each gets a hidden skill.
 * Demo players carry over a previous-season rating (skill-based) so tiers span Bronze to Legend.
 */
export function simulateHistory(players, r, now = Date.now()) {
  const skill = new Map(players.map((p) => [String(p._id), r()]));
  const plays = (p, g) => Boolean(p.gameIds?.[g]);
  const rating = new Map(); // `${id}:${game}` -> rating
  const key = (id, g) => `${id}:${g}`;
  for (const p of players) {
    for (const { slug } of GAMES) {
      if (plays(p, slug)) rating.set(key(p._id, slug), Math.round(920 + skill.get(String(p._id)) * 800 + r.int(-40, 40)));
    }
  }
  const ratingOf = (g) => (id) => rating.get(key(id, g)) ?? RATING.start;

  const counters = new Map(); // id -> { xp, xpByGame, stats, rankedByGame }
  const bucket = (id) => {
    const k = String(id);
    if (!counters.has(k)) counters.set(k, { xp: 0, xpByGame: {}, stats: { played: 0, won: 0 }, rankedByGame: {} });
    return counters.get(k);
  };

  // Random times over the window, processed oldest first.
  const span = WEEKS * 7 * 24 * 3600e3;
  const slots = MIX.flatMap(([size, n]) => Array.from({ length: n }, () => size))
    .map((teamSize) => ({ teamSize, at: new Date(now - span + r() * (span - 2 * 3600e3)) }))
    .sort((a, b) => a.at - b.at);

  const challenges = [];
  const xpLogs = [];
  for (const { teamSize, at } of slots) {
    const options = GAMES.filter((g) => g.teamSizes.includes(teamSize));
    const game = r.pick(options);
    // Only players who had already signed up by then.
    const pool = r.shuffle(players.filter((p) => plays(p, game.slug) && (!p.createdAt || p.createdAt < at)));
    if (pool.length < teamSize * 2) continue;
    const teamA = pool.slice(0, teamSize).map((p) => p._id);
    const teamB = pool.slice(teamSize, teamSize * 2).map((p) => p._id);
    const mode = r.pick(game.rankedModes);
    const map = game.maps.length && mode !== 'Arena' ? r.pick(game.maps) : undefined;

    // Better average skill wins more often, with upsets.
    const sk = (team) => team.reduce((s, id) => s + skill.get(String(id)), 0) / team.length;
    const pA = 1 / (1 + Math.exp(-(sk(teamA) - sk(teamB)) * 5));
    const winnerSide = r() < pA ? 'A' : 'B';
    const scores = new Map(
      [...teamA, ...teamB].map((id) => {
        const won = (teamA.includes(id) ? 'A' : 'B') === winnerSide;
        return [String(id), scoreFor(game.slug, mode, won, r)];
      }),
    );
    const playerStats = buildPlayerStats({
      teamA, teamB, winnerSide, ranked: true,
      scoreOf: (id) => scores.get(String(id)),
      ratingOf: ratingOf(game.slug),
    });

    const _id = new mongoose.Types.ObjectId();
    const settledAt = new Date(at.getTime() + r.int(25, 70) * 60e3);
    for (const s of playerStats) {
      rating.set(key(s.user, game.slug), s.ratingAfter);
      const c = bucket(s.user);
      const amount = s.won ? XP.challengeWin : XP.challengeLoss;
      c.xp += amount;
      c.xpByGame[game.slug] = (c.xpByGame[game.slug] || 0) + amount;
      c.stats.played += 1;
      c.stats.won += s.won ? 1 : 0;
      const rk = (c.rankedByGame[game.slug] ??= { played: 0, won: 0, lost: 0, score: 0, streak: 0, bestStreak: 0 });
      rk.played += 1;
      rk.won += s.won ? 1 : 0;
      rk.lost += s.won ? 0 : 1;
      rk.score += s.score;
      rk.streak = s.won ? rk.streak + 1 : 0;
      rk.bestStreak = Math.max(rk.bestStreak, rk.streak);
      xpLogs.push({ user: s.user, game: game.slug, amount, source: 'challenge', ref: _id, createdAt: settledAt, updatedAt: settledAt });
    }

    const sideReport = (team, by) => ({
      by,
      winnerSide,
      at: settledAt,
      scores: team.map((id) => ({ user: id, score: scores.get(String(id)) })),
    });
    challenges.push({
      _id,
      game: game.slug, mode, map, teamSize, ranked: true, isDemo: true,
      creator: teamA[0], teamA, teamB,
      status: 'settled', winnerSide, playerStats, settledAt,
      scheduledAt: at,
      room: { roomId: String(r.int(1000000, 9999999)), password: `rm${r.int(100, 999)}` },
      reports: [sideReport(teamA, teamA[0]), sideReport(teamB, teamB[0])],
      createdAt: new Date(at.getTime() - r.int(1, 12) * 3600e3),
      updatedAt: settledAt,
    });
  }

  const ratingByGame = (id) =>
    Object.fromEntries(GAMES.map(({ slug }) => [slug, rating.get(key(id, slug)) ?? RATING.start]));
  return { challenges, xpLogs, counters, ratingByGame };
}
