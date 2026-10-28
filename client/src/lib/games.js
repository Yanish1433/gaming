// Fallback copy of GET /api/games, plus the bits only the UI cares about (accent, copy).
export const GAMES = [
  {
    slug: 'pubg',
    // captain-supplied icon; null = probe /games/pubg/icon.* and fall back to the SVG emblem
    icon: '/games/pubg/icon.png',
    statLabel: 'Kills',
    rankedModes: ['TDM', 'Arena'],
    name: 'PUBG Mobile',
    short: 'PUBG',
    teamSizes: [1, 2, 3, 4],
    modes: ['Classic', 'TDM', 'Arena'],
    maps: ['Erangel', 'Miramar', 'Sanhok', 'Vikendi', 'Livik'],
    accent: '#F2A900',
    currency: 'UC',
    tagline: 'Pochinki ma bhet aau. Last circle decides it.',
    blurb: 'Custom rooms on Erangel and Livik most nights. Squad up, call your drop, screenshot the end card.',
  },
  {
    slug: 'freefire',
    // captain-supplied icon; null = probe /games/freefire/icon.* and fall back to the SVG emblem
    icon: '/games/freefire/icon.jpg',
    statLabel: 'Kills',
    rankedModes: ['Clash Squad', 'Lone Wolf'],
    name: 'Free Fire',
    short: 'FF',
    teamSizes: [1, 2, 3, 4],
    modes: ['Battle Royale', 'Clash Squad', 'Lone Wolf'],
    maps: ['Bermuda', 'Purgatory', 'Kalahari', 'Alpine', 'NeXTerra'],
    accent: '#FF5A1F',
    currency: 'Diamonds',
    tagline: 'Clash Squad 4v4. Fast rounds, no excuses.',
    blurb: 'Bermuda rooms, CS ladders and Lone Wolf duels. Ten-minute games that settle arguments.',
  },
  {
    slug: 'efootball',
    // captain-supplied icon; null = probe /games/efootball/icon.* and fall back to the SVG emblem
    icon: '/games/efootball/icon.webp',
    statLabel: 'Goals',
    rankedModes: ['Friendly Match'],
    name: 'eFootball',
    short: 'eFB',
    teamSizes: [1],
    modes: ['Friendly Match', 'Event Match'],
    maps: [],
    accent: '#2BB673',
    currency: 'Coins',
    tagline: 'Ek-ek jana. Your XI against theirs.',
    blurb: 'One on one, friend match code in the room. Final score screenshot and you are done.',
  },
  {
    slug: 'fcmobile',
    // captain-supplied icon; null = probe /games/fcmobile/icon.* and fall back to the SVG emblem
    icon: null,
    statLabel: 'Goals',
    rankedModes: ['Head to Head'],
    name: 'EA FC Mobile',
    short: 'FC',
    teamSizes: [1],
    modes: ['Head to Head', 'VS Attack'],
    maps: [],
    accent: '#3D7BFF',
    currency: 'FC Points',
    tagline: 'H2H or VS Attack. Pick a side, settle it.',
    blurb: 'Head to Head for the purists, VS Attack for the impatient. Always 1v1.',
  },
]

export const PROVINCES = ['Koshi', 'Madhesh', 'Bagmati', 'Gandaki', 'Lumbini', 'Karnali', 'Sudurpashchim']

export function getGame(slug) {
  return GAMES.find((g) => g.slug === slug)
}

// merge whatever the server sends with our UI-only fields
export function mergeGames(serverGames) {
  if (!Array.isArray(serverGames) || serverGames.length === 0) return GAMES
  return GAMES.map((g) => {
    const s = serverGames.find((x) => x.slug === g.slug)
    if (!s) return g
    return {
      ...g,
      ...s,
      teamSizes: Array.isArray(s.teamSizes) && s.teamSizes.length ? s.teamSizes : g.teamSizes,
      modes: Array.isArray(s.modes) && s.modes.length ? s.modes : g.modes,
      maps: Array.isArray(s.maps) ? s.maps : g.maps,
      accent: g.accent,
      tagline: g.tagline,
      blurb: g.blurb,
      short: g.short,
      icon: g.icon,
    }
  })
}

export function isSolo(game) {
  const g = typeof game === 'string' ? getGame(game) : game
  return !!g && g.teamSizes.length === 1 && g.teamSizes[0] === 1
}

export function accentOf(slug) {
  return getGame(slug)?.accent ?? '#DC143C'
}
