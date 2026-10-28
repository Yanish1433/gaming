// A slapped-on label: notched, slightly rotated, hard shadow from the wrapper.
const BG = {
  red: 'bg-crimson text-paper',
  marigold: 'bg-marigold text-ink',
  paper: 'bg-paper text-ink',
  blue: 'bg-flag text-paper',
  accent: 'bg-(--accent,#F2A900) text-ink',
}

export default function Sticker({ tone = 'marigold', rotate = -2, className = '', children }) {
  return (
    <span className={`drop-hard inline-block ${className}`} style={{ transform: `rotate(${rotate}deg)` }}>
      <span className={`notch-sm display inline-block px-3 py-1.5 text-base ${BG[tone] ?? BG.marigold}`}>{children}</span>
    </span>
  )
}
