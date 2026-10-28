import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { GAMES } from '../lib/games'

export const countOf = (x) => (Array.isArray(x) ? x.length : Number(x) || 0)

// GET /games/:slug/summary for every game; missing ones just stay null
export function useSummaries() {
  const [map, setMap] = useState({})
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    let alive = true
    Promise.allSettled(GAMES.map((g) => api.get(`/games/${g.slug}/summary`))).then((res) => {
      if (!alive) return
      const next = {}
      res.forEach((r, i) => {
        if (r.status === 'fulfilled') next[GAMES[i].slug] = r.value.data
      })
      setMap(next)
      setLoaded(true)
    })
    return () => {
      alive = false
    }
  }, [])
  return { summaries: map, loaded, any: Object.keys(map).length > 0 }
}
