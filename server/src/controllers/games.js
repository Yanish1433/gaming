import { getGame } from '../config/games.js';
import { gameConfigs } from '../services/settings.js';
import { Challenge, Match, Tournament, User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { PUBLIC_USER_FIELDS } from '../utils/sanitize.js';

// Config with admin overrides (enabled flag, map lists) applied.
export async function listGames(req, res) {
  res.json(await gameConfigs());
}

// Counts for the hub header plus short lists for previews.
export async function gameSummary(req, res) {
  const game = getGame(req.params.slug);
  if (!game) throw ApiError.notFound('Unknown game');
  const slug = game.slug;

  const [openChallenges, upcomingMatches, tournaments, topPlayers, latestChallenges, nextMatches] = await Promise.all([
    Challenge.countDocuments({ game: slug, status: 'open' }),
    Match.countDocuments({ game: slug, status: 'upcoming' }),
    Tournament.countDocuments({ game: slug, status: { $ne: 'completed' } }),
    User.find({ banned: false, [`xpByGame.${slug}`]: { $gt: 0 } })
      .sort({ [`xpByGame.${slug}`]: -1 })
      .limit(5)
      .select('username avatarUrl province xpByGame')
      .lean(),
    Challenge.find({ game: slug, status: 'open' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('-room -reports')
      .populate('creator', PUBLIC_USER_FIELDS)
      .lean(),
    Match.find({ game: slug, status: 'upcoming' }).sort({ startsAt: 1 }).limit(5).select('-room -results').lean(),
  ]);

  res.json({
    game,
    openChallenges,
    upcomingMatches,
    tournaments,
    topPlayers: topPlayers.map((u, i) => ({
      rank: i + 1,
      username: u.username,
      avatarUrl: u.avatarUrl,
      province: u.province,
      xp: u.xpByGame?.[slug] || 0,
    })),
    latestChallenges,
    nextMatches: nextMatches.map((m) => ({ ...m, slotsTaken: m.registrations.length, registrations: undefined })),
  });
}
