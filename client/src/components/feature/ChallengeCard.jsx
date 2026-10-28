import { Link } from 'react-router'
import { motion, useReducedMotion } from 'motion/react'
import { CalendarClock, MapPin, Users } from 'lucide-react'
import { StatusBadge } from '../ui/Badge'
import { Avatar } from '../ui/Bits'
import { getGame } from '../../lib/games'
import GameIcon from '../art/GameIcon'
import { fmtDate, teamLabel, uname } from '../../lib/format'

// Ticket-stub card: accent strip on the left, perforation, details on the right.
export default function ChallengeCard({ challenge: c }) {
  const reduce = useReducedMotion()
  const game = getGame(c.game)
  const accent = game?.accent ?? '#DC143C'
  const size = Number(c.teamSize) || 1
  const filledB = (c.teamB?.length ?? 0) > 0
  return (
    <motion.div
      whileHover={reduce ? undefined : { x: -3, y: -3, rotate: -0.6 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      className="drop-hard h-full"
    >
      <Link to={`/challenges/${c._id}`} className="ticket paper-card flex h-full min-h-40">
        <div className="flex w-14 shrink-0 flex-col items-center justify-between py-3" style={{ background: accent }}>
          <span className="flex flex-col items-center gap-2">
            {game && <GameIcon game={game} size={34} />}
            <span className="display text-lg text-ink [writing-mode:vertical-rl] rotate-180">{game?.short ?? c.game}</span>
          </span>
          <span className="display text-2xl text-ink">{size}v{size}</span>
        </div>
        <div className="w-0 border-l-2 border-dashed border-ink/30" />
        <div className="flex min-w-0 flex-1 flex-col gap-2 p-4 pl-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="display truncate text-2xl">{c.mode ?? 'Challenge'}</p>
              <p className="font-mono text-xs uppercase text-ink/60">
                {c.ranked !== false && <span className="mr-1.5 bg-ink px-1 text-paper">Ranked</span>}
                {teamLabel(size)} · {game?.name ?? c.game}
              </p>
            </div>
            <StatusBadge status={c.status} className="shrink-0" />
          </div>
          <div className="mt-auto grid gap-1 text-sm text-ink/80">
            {c.map && (
              <span className="flex items-center gap-1.5"><MapPin className="size-3.5" aria-hidden /> {c.map}</span>
            )}
            <span className="flex items-center gap-1.5"><CalendarClock className="size-3.5" aria-hidden /> <span className="font-mono text-xs">{fmtDate(c.scheduledAt)}</span></span>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-ink/15 pt-2">
            <span className="flex min-w-0 items-center gap-2">
              <Avatar user={c.creator} size={24} />
              <span className="truncate text-sm font-semibold">{uname(c.creator)}</span>
            </span>
            <span className="flex items-center gap-1 font-mono text-xs text-ink/60">
              <Users className="size-3.5" aria-hidden />
              {filledB ? 'matched' : 'needs rivals'}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
