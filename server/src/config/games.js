export const GAMES = [
  {
    slug: 'pubg',
    name: 'PUBG Mobile',
    teamSizes: [1, 2, 3, 4],
    modes: ['Classic', 'TDM', 'Arena'],
    maps: ['Erangel', 'Miramar', 'Sanhok', 'Vikendi', 'Livik'],
    statLabel: 'Kills',
    rankedModes: ['TDM', 'Arena'],
  },
  {
    slug: 'freefire',
    name: 'Free Fire',
    teamSizes: [1, 2, 3, 4],
    modes: ['Battle Royale', 'Clash Squad', 'Lone Wolf'],
    maps: ['Bermuda', 'Purgatory', 'Kalahari', 'Alpine', 'NeXTerra'],
    statLabel: 'Kills',
    rankedModes: ['Clash Squad', 'Lone Wolf'],
  },
  {
    slug: 'efootball',
    name: 'eFootball',
    teamSizes: [1],
    modes: ['Friendly Match', 'Event Match'],
    maps: [],
    statLabel: 'Goals',
    rankedModes: ['Friendly Match'],
  },
  {
    slug: 'fcmobile',
    name: 'EA FC Mobile',
    teamSizes: [1],
    modes: ['Head to Head', 'VS Attack'],
    maps: [],
    statLabel: 'Goals',
    rankedModes: ['Head to Head'],
  },
];

export const GAME_SLUGS = GAMES.map((g) => g.slug);

export const PROVINCES = ['Koshi', 'Madhesh', 'Bagmati', 'Gandaki', 'Lumbini', 'Karnali', 'Sudurpashchim'];

export const getGame = (slug) => GAMES.find((g) => g.slug === slug);

// XP is cosmetic only: it can't be bought, sold or converted to anything.
export const XP = {
  challengeWin: 30,
  challengeLoss: 10,
  matchParticipation: 10,
  matchWin: 30,
  matchPerKill: 2,
};

// Ranked rating: per-game Elo, pure ranking number (never bought, sold or cashed out).
export const RATING = { start: 1000, k: 32 };

export const TIERS = [
  ['Legend', 1700],
  ['Diamond', 1550],
  ['Platinum', 1400],
  ['Gold', 1250],
  ['Silver', 1100],
  ['Bronze', -Infinity],
];

export const tierFor = (rating = RATING.start) => TIERS.find(([, min]) => rating >= min)[0];

// Max per-player score (kills or goals) accepted on a report.
export const maxScoreFor = (slug) => (getGame(slug)?.statLabel === 'Goals' ? 30 : 100);
