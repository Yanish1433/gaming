import { iconCandidates, useFirstImage } from './useAsset'

// Original fallback glyphs, one per game (no official marks).
function Glyph({ slug }) {
  switch (slug) {
    case 'pubg': // level-3 helmet
      return (
        <g>
          <path d="M14 34 C14 18 24 11 32 11 C40 11 50 18 50 34 L50 40 L14 40 Z" fill="#121110" />
          <rect x="18" y="27" width="28" height="8" fill="#EFE7DA" />
          <rect x="11" y="39" width="42" height="5" fill="#121110" />
        </g>
      )
    case 'freefire': // flame diamond
      return (
        <g>
          <path d="M32 9 C36 16 42 17 40 25 C45 22 46 18 46 18 C51 27 47 33 47 33 L32 55 L17 33 C17 33 14 26 20 20 C20 25 24 27 25 27 C23 18 28 14 32 9 Z" fill="#121110" />
          <path d="M32 31 L40 37 L32 49 L24 37 Z" fill="#EFE7DA" />
        </g>
      )
    case 'efootball': // ball
      return (
        <g>
          <circle cx="32" cy="32" r="20" fill="#EFE7DA" stroke="#121110" strokeWidth="4" />
          <path d="M32 22 L41 29 L38 40 L26 40 L23 29 Z" fill="#121110" />
          <path d="M32 22 L32 13 M41 29 L50 26 M38 40 L44 48 M26 40 L20 48 M23 29 L14 26" stroke="#121110" strokeWidth="3" />
        </g>
      )
    default: // trophy
      return (
        <g fill="#121110">
          <path d="M20 12 H44 V24 C44 33 39 38 32 38 C25 38 20 33 20 24 Z" />
          <path d="M20 16 H12 C12 26 17 29 21 29 M44 16 H52 C52 26 47 29 43 29" fill="none" stroke="#121110" strokeWidth="4" />
          <rect x="29" y="37" width="6" height="8" />
          <rect x="21" y="45" width="22" height="7" />
        </g>
      )
  }
}

export function GameEmblem({ game, size = 48, className = '' }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden>
      <circle cx="32" cy="32" r="31" fill={game?.accent ?? '#DC143C'} />
      <Glyph slug={game?.slug} />
    </svg>
  )
}

/**
 * Small circular game badge. Uses the captain-supplied icon when it loads, otherwise the SVG emblem.
 * `sticker` adds the hard shadow + rotation used on hero badges.
 */
export default function GameIcon({ game, size = 40, sticker = false, rotate = -4, className = '' }) {
  const src = useFirstImage(iconCandidates(game))
  const inner = src ? (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className="block rounded-full border-2 border-ink bg-ink object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <GameEmblem game={game} size={size} className="block rounded-full border-2 border-ink" />
  )
  if (!sticker) return <span className={`inline-block shrink-0 ${className}`}>{inner}</span>
  return (
    <span
      className={`inline-block shrink-0 rounded-full ${className}`}
      style={{ transform: `rotate(${rotate}deg)`, boxShadow: '5px 5px 0 #121110' }}
      title={game?.name}
    >
      <span className="block rounded-full bg-paper p-1">{inner}</span>
    </span>
  )
}
