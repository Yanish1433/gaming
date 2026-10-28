import { Link } from 'react-router'
import { Trophy } from 'lucide-react'
import Card from '../ui/Card'
import { StatusBadge } from '../ui/Badge'
import { getGame } from '../../lib/games'
import { fmtDay } from '../../lib/format'
import { uploadUrl } from '../../lib/api'

export default function TournamentCard({ tournament: t }) {
  const game = getGame(t.game)
  const teams = t.registrations?.length ?? 0
  return (
    <Card variant="notch" tilt className="h-full" inner="flex flex-col">
      <Link to={`/tournaments/${t._id}`} className="flex h-full flex-col" style={{ '--accent': game?.accent ?? '#DC143C' }}>
        <div className="relative h-32 overflow-hidden bg-ink">
          {t.bannerUrl ? (
            <img src={uploadUrl(t.bannerUrl)} alt="" className="h-full w-full object-cover opacity-80" />
          ) : (
            <span aria-hidden className="halftone absolute inset-0 text-(--accent)/60" />
          )}
          <span className="display absolute bottom-2 left-4 text-3xl text-paper drop-shadow-[2px_2px_0_#000]">{game?.name ?? t.game}</span>
          <span className="absolute right-3 top-3"><StatusBadge status={t.status} /></span>
        </div>
        <div className="flex flex-1 flex-col p-5">
          <p className="display text-3xl leading-none">{t.title}</p>
          <p className="mt-2 font-mono text-xs uppercase text-ink/60">
            {t.format === 'points' ? 'Points table' : 'Knockout'} · starts {fmtDay(t.startsAt)} · {teams}/{t.maxTeams ?? '—'} teams
          </p>
          {t.prize && (
            <div className="mt-auto pt-4">
              <span className="inline-flex -rotate-1 items-center gap-2 bg-ink px-3 py-1.5 text-paper">
                <Trophy className="size-4 text-marigold" aria-hidden />
                <span className="font-semibold">{t.prize}</span>
              </span>
              <p className="mt-1.5 font-mono text-[11px] text-ink/55">Sponsored{t.sponsor ? ` by ${t.sponsor}` : ''}. Free to enter.</p>
            </div>
          )}
        </div>
      </Link>
    </Card>
  )
}
