import { useMemo } from 'react'
import { useFetch } from './useFetch'
import { mergeGames } from '../lib/games'
import { useSite } from '../context/SiteContext'

// server config when it answers, hard-coded fallback when it doesn't; admin map overrides on top.
// `enabledGames` drops games an admin switched off (hub URLs still resolve and show a "paused" note).
export function useGames() {
  const { data, loading } = useFetch('/games')
  const { settings } = useSite()
  const games = useMemo(() => {
    const merged = mergeGames(Array.isArray(data) ? data : data?.items)
    return merged.map((g) => {
      const maps = settings.mapsByGame?.[g.slug]
      return { ...g, enabled: settings.gamesEnabled?.[g.slug] !== false, ...(Array.isArray(maps) && maps.length ? { maps } : {}) }
    })
  }, [data, settings])
  const enabledGames = useMemo(() => games.filter((g) => g.enabled), [games])
  return { games, enabledGames, loading }
}
