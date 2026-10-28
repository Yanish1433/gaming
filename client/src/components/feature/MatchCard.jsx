import { Link } from 'react-router'
import { motion, useReducedMotion } from 'motion/react'
import { StatusBadge } from '../ui/Badge'
import { getGame } from '../../lib/games'
import GameIcon from '../art/GameIcon'
import { fmtDate, teamLabel } from '../../lib/format'

// Map name set huge, like a gig poster for one room.
export default function MatchCard({ match: m }) {
  const reduce = useReducedMotion()
  const game = getGame(m.game)
  const taken = m.slotsTaken ?? m.registrations?.length ?? 0
  const max = m.maxSlots || 0
  const pct = max ? Math.min(100, Math.round((taken / max) * 100)) : 0
  return (
    <motion.div
      whileHover={reduce ? undefined : { x: -3, y: -3 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      className="h-full"
      style={{ '--accent': game?.accent ?? '#DC143C' }}
    >
      <Link
        to={`/matches/${m._id}`}
        className="group relative flex h-full flex-col overflow-hidden border-2 border-paper/20 bg-ink-2 p-5 transition-colors hover:border-(--accent)"
      >
        <span aria-hidden className="display pointer-events-none absolute -right-2 top-6 select-none text-7xl text-paper/[0.06] transition-colors group-hover:text-(--accent)/20 sm:text-8xl">
          {m.map ?? game?.short}
        </span>
        <div className="relative flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2">
            {game && <GameIcon game={game} size={30} />}
            <span className="truncate font-mono text-[11px] uppercase tracking-widest text-(--accent)">{game?.name ?? m.game} · {m.mode}</span>
          </span>
          <StatusBadge status={m.status} />
        </div>
        <p className="display relative mt-6 text-4xl">{m.map ?? m.mode}</p>
        <p className="relative mt-1 font-semibold text-paper/85">{m.title}</p>
        <div className="relative mt-auto pt-6">
          <div className="flex justify-between font-mono text-xs text-paper/60">
            <span>{fmtDate(m.startsAt)}</span>
            <span>{teamLabel(m.teamSize)} · {taken}/{max || '—'}</span>
          </div>
          <div className="mt-2 h-2 bg-paper/10">
            <div className="h-full bg-(--accent)" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
