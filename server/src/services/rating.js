import { RATING } from '../config/games.js';
import { User } from '../models/index.js';

const avg = (xs) => xs.reduce((s, x) => s + x, 0) / (xs.length || 1);

// Team Elo: compares average team ratings; every player on a side gets the same delta.
// Returns the delta for side A (side B gets the negation).
export function eloDeltaA(ratingsA, ratingsB, winnerSide) {
  const expectedA = 1 / (1 + 10 ** ((avg(ratingsB) - avg(ratingsA)) / 400));
  return Math.round(RATING.k * ((winnerSide === 'A' ? 1 : 0) - expectedA));
}

// Builds the playerStats rows for a settle. `ratingOf(userId)` returns the current per-game rating.
export function buildPlayerStats({ teamA, teamB, winnerSide, ranked, scoreOf, ratingOf }) {
  const ids = (team) => team.map((u) => String(u._id ?? u));
  const [a, b] = [ids(teamA), ids(teamB)];
  const deltaA = ranked ? eloDeltaA(a.map(ratingOf), b.map(ratingOf), winnerSide) : 0;
  const row = (user, side) => {
    const before = ratingOf(user);
    const delta = side === 'A' ? deltaA : -deltaA;
    return {
      user,
      side,
      score: scoreOf(user) ?? 0,
      won: side === winnerSide,
      ratingBefore: before,
      ratingAfter: before + delta,
      ratingDelta: delta,
    };
  };
  return [...a.map((u) => row(u, 'A')), ...b.map((u) => row(u, 'B'))];
}

const val = (path, fallback = 0) => ({ $ifNull: [`$${path}`, fallback] });

// Applies one ranked result to a user atomically (pipeline update so the streak logic runs server-side).
export function rankedUpdate(game, stat) {
  const r = `rankedByGame.${game}`;
  const streak = stat.won ? { $add: [val(`${r}.streak`), 1] } : 0;
  return [
    {
      $set: {
        [`ratingByGame.${game}`]: { $add: [val(`ratingByGame.${game}`, RATING.start), stat.ratingDelta] },
        [`${r}.played`]: { $add: [val(`${r}.played`), 1] },
        [`${r}.won`]: { $add: [val(`${r}.won`), stat.won ? 1 : 0] },
        [`${r}.lost`]: { $add: [val(`${r}.lost`), stat.won ? 0 : 1] },
        [`${r}.score`]: { $add: [val(`${r}.score`), stat.score] },
        [`${r}.streak`]: streak,
        [`${r}.bestStreak`]: { $max: [val(`${r}.bestStreak`), streak] },
      },
    },
  ];
}

export async function applyRanked(game, playerStats) {
  await Promise.all(playerStats.map((s) => User.updateOne({ _id: s.user }, rankedUpdate(game, s))));
}
