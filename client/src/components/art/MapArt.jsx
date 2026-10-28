// Tiny hand-drawn map vignettes for the map cards (original drawings, 80x56).
const INK = '#121110'
const PAPER = '#EFE7DA'
const SEA = '#003893'

const MAPS = {
  // PUBG
  Erangel: (
    <>
      <rect width="80" height="56" fill={SEA} />
      <path d="M8 36 C10 20 26 12 44 14 C60 14 70 24 66 34 C60 44 40 42 30 46 C18 48 8 44 8 36 Z" fill={PAPER} />
      <path d="M22 50 C30 46 46 46 50 50 C46 54 28 55 22 50 Z" fill={PAPER} />
      <path d="M30 44 L28 50 M44 42 L46 49" stroke={INK} strokeWidth="2" />
    </>
  ),
  Miramar: (
    <>
      <rect width="80" height="56" fill="#E8B862" />
      <path d="M0 36 C14 26 28 34 40 28 C54 22 66 30 80 24 L80 56 L0 56 Z" fill="#C98A3A" />
      <path d="M0 46 C20 40 40 48 80 38 L80 56 L0 56 Z" fill={INK} opacity=".25" />
      <circle cx="62" cy="14" r="7" fill={PAPER} />
    </>
  ),
  Sanhok: (
    <>
      <rect width="80" height="56" fill="#2BB673" />
      <path d="M0 44 C20 38 50 50 80 42 L80 56 L0 56 Z" fill={SEA} />
      {[14, 34, 56].map((x) => (
        <g key={x} stroke={INK} strokeWidth="2" fill="none">
          <path d={`M${x} 42 C${x + 1} 32 ${x - 1} 24 ${x + 2} 16`} />
          <path d={`M${x + 2} 16 C${x - 6} 14 ${x - 10} 18 ${x - 12} 22 M${x + 2} 16 C${x + 8} 12 ${x + 12} 16 ${x + 14} 20`} />
        </g>
      ))}
    </>
  ),
  Vikendi: (
    <>
      <rect width="80" height="56" fill="#9ED6F2" />
      <path d="M0 48 L18 22 L30 36 L46 12 L66 40 L80 28 L80 56 L0 56 Z" fill={PAPER} stroke={INK} strokeWidth="2" />
      <path d="M46 12 L40 22 L46 20 L52 24 Z" fill={INK} opacity=".3" />
    </>
  ),
  Livik: (
    <>
      <rect width="80" height="56" fill={SEA} />
      <path d="M16 40 C14 24 30 14 46 16 C62 18 66 32 58 42 C48 50 22 52 16 40 Z" fill="#2BB673" />
      <path d="M40 18 L40 40" stroke={PAPER} strokeWidth="4" />
      <path d="M36 42 C40 46 44 46 48 42" stroke={PAPER} strokeWidth="2" fill="none" />
    </>
  ),
  // Free Fire
  Bermuda: (
    <>
      <rect width="80" height="56" fill={SEA} />
      <path d="M10 38 C8 24 26 14 44 16 C62 16 72 28 66 38 C58 48 22 50 10 38 Z" fill="#FF5A1F" />
      <rect x="46" y="10" width="7" height="20" fill={PAPER} stroke={INK} strokeWidth="1.5" />
      <path d="M45 11 L49.5 4 L54 11 Z" fill="#DC143C" />
    </>
  ),
  Purgatory: (
    <>
      <rect width="80" height="56" fill={SEA} />
      <path d="M6 34 C6 22 22 16 32 22 C40 28 34 42 22 44 C12 46 6 42 6 34 Z" fill="#8A8378" />
      <path d="M46 30 C46 18 64 14 72 22 C80 32 70 44 58 44 C50 44 46 38 46 30 Z" fill="#8A8378" />
      <path d="M32 32 L48 30" stroke={PAPER} strokeWidth="3" strokeDasharray="3 2" />
    </>
  ),
  Kalahari: (
    <>
      <rect width="80" height="56" fill="#E8B862" />
      <path d="M0 42 C24 34 52 46 80 36 L80 56 L0 56 Z" fill="#C98A3A" />
      <path d="M18 40 L18 24 L26 24 L26 40 M34 40 L34 18 L44 18 L44 40" fill="none" stroke={INK} strokeWidth="2.5" />
      <path d="M16 24 L28 24 M32 18 L46 18" stroke={INK} strokeWidth="3" />
    </>
  ),
  Alpine: (
    <>
      <rect width="80" height="56" fill="#9ED6F2" />
      <path d="M0 40 L20 14 L34 30 L50 10 L80 40 Z" fill={PAPER} stroke={INK} strokeWidth="2" />
      <ellipse cx="40" cy="48" rx="22" ry="5" fill={SEA} />
    </>
  ),
  NeXTerra: (
    <>
      <rect width="80" height="56" fill={INK} />
      <path d="M0 46 L80 46" stroke="#FF5A1F" strokeWidth="2" />
      <g fill="none" stroke={PAPER} strokeWidth="2">
        <rect x="14" y="20" width="10" height="26" />
        <rect x="30" y="10" width="12" height="36" />
        <path d="M48 46 L48 24 L58 16 L68 24 L68 46" />
      </g>
      <circle cx="36" cy="16" r="2" fill="#FF5A1F" />
    </>
  ),
}

export default function MapArt({ name, className = '' }) {
  const art = MAPS[name]
  if (!art) return null
  return (
    <svg viewBox="0 0 80 56" className={className} aria-hidden>
      {art}
    </svg>
  )
}
