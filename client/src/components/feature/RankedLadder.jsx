import { Link } from 'react-router'
import { Flame } from 'lucide-react'
import { Avatar, Reveal, RevealItem } from '../ui/Bits'
import TierBadge from './TierBadge'
import { num } from '../../lib/format'

const COLS = 'grid-cols-[2.5rem_1fr_4.5rem] sm:grid-cols-[3.5rem_1fr_7rem_5.5rem_6rem_5rem_4rem]'

export default function RankedLadder({ rows, statLabel = 'Kills' }) {
  return (
    <div className="overflow-hidden border-2 border-paper/15">
      <div className={`grid ${COLS} gap-2 bg-paper px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-widest text-ink`}>
        <span>#</span>
        <span>Player</span>
        <span className="hidden sm:block">Tier</span>
        <span className="text-right">Rating</span>
        <span className="hidden text-right sm:block">W–L</span>
        <span className="hidden text-right sm:block" title={`Average ${statLabel.toLowerCase()} per game`}>Avg {statLabel.slice(0, 1)}</span>
        <span className="hidden text-right sm:block">Strk</span>
      </div>
      <Reveal stagger={0.03}>
        {rows.map((r, i) => {
          const rank = r.rank ?? i + 1
          return (
            <RevealItem key={r.username ?? i} className={`grid ${COLS} items-center gap-2 border-t border-paper/10 px-3 py-3 ${rank <= 3 ? 'bg-paper/[0.04]' : ''}`}>
              <span className={`display text-2xl ${rank === 1 ? 'text-marigold' : rank <= 3 ? 'text-paper' : 'text-paper/40'}`}>{String(rank).padStart(2, '0')}</span>
              <Link to={`/u/${r.username}`} className="flex min-w-0 items-center gap-3 hover:text-(--accent,#F2A900)">
                <Avatar user={r} size={34} />
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{r.username}</span>
                  <span className="block truncate text-xs text-paper/50">
                    {r.province ?? '—'}
                    <span className="sm:hidden"> · {r.tier} · {num(r.won)}–{num(r.lost)}</span>
                  </span>
                </span>
              </Link>
              <span className="hidden sm:block">
                <TierBadge tier={r.tier} rating={r.rating} size="sm" />
              </span>
              <span className="text-right font-mono text-lg font-semibold tabular-nums">{num(r.rating)}</span>
              <span className="hidden text-right font-mono text-sm tabular-nums text-paper/70 sm:block">
                {num(r.won)}–{num(r.lost)}
                <span className="block text-[10px] text-paper/40">{Math.round(Number(r.winRate) || 0)}%</span>
              </span>
              <span className="hidden text-right font-mono text-sm tabular-nums sm:block">{(Number(r.avgScore) || 0).toFixed(1)}</span>
              <span className="hidden items-center justify-end gap-1 font-mono text-sm tabular-nums sm:flex">
                {Number(r.streak) >= 3 && <Flame className="size-3.5 text-[#FF5A1F]" aria-label="On a streak" />}
                {Number(r.streak) > 0 ? `W${r.streak}` : Number(r.streak) < 0 ? `L${Math.abs(r.streak)}` : '—'}
              </span>
            </RevealItem>
          )
        })}
      </Reveal>
    </div>
  )
}
