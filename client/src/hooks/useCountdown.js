import { useEffect, useState } from 'react'

export function useCountdown(target) {
  const t = target ? new Date(target).getTime() : NaN
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (Number.isNaN(t)) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [t])

  if (Number.isNaN(t)) return { valid: false, done: false, ms: 0, d: 0, h: 0, m: 0, s: 0 }
  const ms = Math.max(0, t - now)
  return {
    valid: true,
    done: ms === 0,
    ms,
    d: Math.floor(ms / 86400000),
    h: Math.floor((ms / 3600000) % 24),
    m: Math.floor((ms / 60000) % 60),
    s: Math.floor((ms / 1000) % 60),
  }
}
