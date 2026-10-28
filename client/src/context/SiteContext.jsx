import { createContext, useContext, useMemo } from 'react'
import { useFetch } from '../hooks/useFetch'

const DEFAULTS = {
  siteName: 'Arena Nepal',
  tickerEnabled: true,
  maintenanceMode: false,
  maintenanceMessage: '',
  gamesEnabled: { pubg: true, freefire: true, efootball: true, fcmobile: true },
  mapsByGame: {},
}

const SiteContext = createContext({ settings: DEFAULTS, reload: () => {} })

// Public site settings (GET /settings/public). Falls back to defaults when the API is down or older.
export function SiteProvider({ children }) {
  const { data, reload } = useFetch('/settings/public')
  const settings = useMemo(() => {
    const s = data && typeof data === 'object' ? data : {}
    return { ...DEFAULTS, ...s, gamesEnabled: { ...DEFAULTS.gamesEnabled, ...(s.gamesEnabled ?? {}) }, mapsByGame: s.mapsByGame ?? {} }
  }, [data])
  return <SiteContext.Provider value={{ settings, reload }}>{children}</SiteContext.Provider>
}

export function useSite() {
  return useContext(SiteContext)
}
