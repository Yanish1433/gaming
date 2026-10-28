import { TIERS, tierFor, tierStyle } from '../../lib/ranked'

const ROT = [-3, 2, -1.5, 2.5, -2, 1.5]

// Tier as a slapped-on sticker. Rotation is derived from the tier so a list doesn't wobble randomly between renders.
export default function TierBadge({ tier, rating, size = 'md', className = '' }) {
  const name = tier ?? tierFor(rating)
  const t = tierStyle(name)
  const rot = ROT[TIERS.indexOf(t)] ?? -2
  const pad = size === 'sm' ? 'px-2 py-0.5 text-sm' : size === 'lg' ? 'px-4 py-2 text-3xl' : 'px-2.5 py-1 text-base'
  return (
    <span className={`drop-hard inline-block ${className}`} style={{ transform: `rotate(${rot}deg)` }}>
      <span className={`notch-sm display inline-block ${pad}`} style={{ background: t.bg, color: t.fg }}>
        {name}
      </span>
    </span>
  )
}
