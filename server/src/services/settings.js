import { GAMES } from '../config/games.js';
import { Setting } from '../models/index.js';

const CACHE_MS = 5000;
let cached = null;
let cachedAt = 0;

// The single settings document, created with defaults on first use. Cached briefly (read on every mutation).
export async function getSettings({ fresh = false } = {}) {
  if (!fresh && cached && Date.now() - cachedAt < CACHE_MS) return cached;
  cached = await Setting.findOneAndUpdate({ key: 'site' }, { $setOnInsert: { key: 'site' } }, { upsert: true, new: true }).lean();
  cachedAt = Date.now();
  return cached;
}

export const invalidateSettings = () => {
  cached = null;
};

// Game config with admin overrides applied: `enabled` flag + map list from settings.
export async function gameConfigs() {
  const s = await getSettings();
  return GAMES.map((g) => ({
    ...g,
    enabled: s.gamesEnabled?.[g.slug] !== false,
    maps: Array.isArray(s.mapsByGame?.[g.slug]) ? s.mapsByGame[g.slug] : g.maps,
  }));
}

export async function gameConfig(slug) {
  return (await gameConfigs()).find((g) => g.slug === slug);
}

export function publicSettings(s) {
  return {
    siteName: s.siteName,
    tickerEnabled: s.tickerEnabled,
    maintenanceMode: s.maintenanceMode,
    maintenanceMessage: s.maintenanceMessage,
    gamesEnabled: Object.fromEntries(GAMES.map((g) => [g.slug, s.gamesEnabled?.[g.slug] !== false])),
    mapsByGame: Object.fromEntries(
      GAMES.map((g) => [g.slug, Array.isArray(s.mapsByGame?.[g.slug]) ? s.mapsByGame[g.slug] : g.maps]),
    ),
  };
}
