import { STATUS_LABEL, STATUS_TONE } from '../../lib/format'

const TONES = {
  marigold: 'bg-marigold text-ink',
  red: 'bg-crimson text-paper',
  blue: 'bg-flag text-paper',
  green: 'bg-[#2BB673] text-ink',
  paper: 'bg-paper text-ink',
  muted: 'bg-ink-3 text-paper/70',
  ink: 'bg-ink text-paper',
  accent: 'bg-(--accent,#F2A900) text-ink',
}

export default function Badge({ tone = 'paper', className = '', children, ...rest }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider ${TONES[tone] ?? TONES.paper} ${className}`}
      {...rest}
    >
      {children}
    </span>
  )
}

export function StatusBadge({ status, className = '' }) {
  const tone = STATUS_TONE[status] ?? 'muted'
  return (
    <Badge tone={tone} className={className}>
      {(status === 'live' || status === 'in_progress') && <span className="live-dot size-1.5 rounded-full bg-paper" />}
      {STATUS_LABEL[status] ?? status ?? '—'}
    </Badge>
  )
}
