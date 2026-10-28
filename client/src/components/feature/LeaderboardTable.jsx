import { Link } from 'react-router'
import { Avatar, Reveal, RevealItem } from '../ui/Bits'
import { num } from '../../lib/format'

const PODIUM = ['#F2A900', '#EFE7DA', '#FF5A1F']

export default function LeaderboardTable({ rows, compact = false }) {
  return (
    <div className="@container overflow-hidden border-2 border-paper/15">
      <div className="grid grid-cols-[3rem_1fr_5rem] gap-2 bg-paper px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-widest text-ink @md:grid-cols-[3rem_1fr_5rem_5rem] @2xl:grid-cols-[4rem_1fr_8rem_6rem_6rem]">
        <span>#</span>
        <span>Player</span>
        <span className="hidden @2xl:block">Province</span>
        <span className="text-right">Rank pts</span>
        <span className="hidden text-right @md:block">W / P</span>
      </div>
      <Reveal stagger={0.03}>
        {rows.map((r, i) => {
          const rank = r.rank ?? i + 1
          const top = rank <= 3
          return (
            <RevealItem
              key={r.username ?? i}
              className={`grid grid-cols-[3rem_1fr_5rem] items-center gap-2 border-t border-paper/10 px-3 ${compact ? 'py-2' : 'py-3'} @md:grid-cols-[3rem_1fr_5rem_5rem] @2xl:grid-cols-[4rem_1fr_8rem_6rem_6rem] ${top ? 'bg-paper/[0.04]' : ''}`}
            >
              <span className="display text-2xl" style={{ color: top ? PODIUM[rank - 1] : 'rgb(239 231 218 / .45)' }}>
                {String(rank).padStart(2, '0')}
              </span>
              <Link to={`/u/${r.username}`} className="flex min-w-0 items-center gap-3 hover:text-marigold">
                <Avatar user={r} size={compact ? 28 : 36} />
                <span className="truncate font-semibold">{r.username}</span>
              </Link>
              <span className="hidden truncate text-sm text-paper/60 @2xl:block">{r.province ?? '—'}</span>
              <span className="text-right font-mono font-semibold tabular-nums">{num(r.xp)}</span>
              <span className="hidden text-right font-mono text-sm text-paper/60 tabular-nums @md:block">
                {num(r.won)} / {num(r.played)}
              </span>
            </RevealItem>
          )
        })}
      </Reveal>
    </div>
  )
}
