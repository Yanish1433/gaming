// Tier colours for the UI. The API sends `tier` itself; tierFor is only a fallback for old payloads.
export const TIERS = [
  { name: 'Bronze', min: 0, bg: '#B0703C', fg: '#121110' },
  { name: 'Silver', min: 1100, bg: '#C9C3B8', fg: '#121110' },
  { name: 'Gold', min: 1250, bg: '#F2A900', fg: '#121110' },
  { name: 'Platinum', min: 1400, bg: '#7FD1C7', fg: '#121110' },
  { name: 'Diamond', min: 1550, bg: '#3D7BFF', fg: '#EFE7DA' },
  { name: 'Legend', min: 1700, bg: '#DC143C', fg: '#EFE7DA' },
]

export function tierFor(rating) {
  const r = Number(rating) || 1000
  return [...TIERS].reverse().find((t) => r >= t.min)?.name ?? 'Bronze'
}

export function tierStyle(name) {
  return TIERS.find((t) => t.name.toLowerCase() === String(name ?? '').toLowerCase()) ?? TIERS[0]
}

// next tier threshold, for "x pts to Gold"
export function nextTier(rating) {
  const r = Number(rating) || 1000
  return TIERS.find((t) => t.min > r) ?? null
}

export const START_RATING = 1000
