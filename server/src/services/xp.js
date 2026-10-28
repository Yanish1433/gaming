import { User, XpLog } from '../models/index.js';
import { XP } from '../config/games.js';

async function grant(userId, game, amount, { won, source, ref }) {
  await User.updateOne(
    { _id: userId },
    { $inc: { xp: amount, [`xpByGame.${game}`]: amount, 'stats.played': 1, 'stats.won': won ? 1 : 0 } },
  );
  await XpLog.create({ user: userId, game, amount, source, ref });
}

// Challenge settled: winners +30, losers +10, stats updated.
export async function awardChallenge(challenge) {
  const winners = challenge.winnerSide === 'A' ? challenge.teamA : challenge.teamB;
  const losers = challenge.winnerSide === 'A' ? challenge.teamB : challenge.teamA;
  const meta = { source: 'challenge', ref: challenge._id };
  await Promise.all([
    ...winners.map((u) => grant(u._id ?? u, challenge.game, XP.challengeWin, { ...meta, won: true })),
    ...losers.map((u) => grant(u._id ?? u, challenge.game, XP.challengeLoss, { ...meta, won: false })),
  ]);
}

// Match completed: participation + kills, bonus for 1st place.
export async function awardMatch(match) {
  await Promise.all(
    match.results.map((r) => {
      const won = r.placement === 1;
      const amount = XP.matchParticipation + (r.kills || 0) * XP.matchPerKill + (won ? XP.matchWin : 0);
      return grant(r.user, match.game, amount, { won, source: 'match', ref: match._id });
    }),
  );
}

// Tournament podium: 1st +100, 2nd +60, 3rd +40 (rank points only).
export const TOURNAMENT_XP = { 1: 100, 2: 60, 3: 40 };

export async function awardTournament(tournament) {
  await Promise.all(
    tournament.winners.map(async (w) => {
      const amount = TOURNAMENT_XP[w.place];
      await User.updateOne({ _id: w.user }, { $inc: { xp: amount, [`xpByGame.${tournament.game}`]: amount } });
      await XpLog.create({ user: w.user, game: tournament.game, amount, source: 'tournament', ref: tournament._id });
    }),
  );
}
