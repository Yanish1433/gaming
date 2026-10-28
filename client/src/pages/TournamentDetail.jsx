import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { Trophy } from 'lucide-react'
import Button from '../components/ui/Button'
import { StatusBadge } from '../components/ui/Badge'
import Input from '../components/ui/Input'
import Sticker from '../components/ui/Sticker'
import Empty, { ErrorState, FormError } from '../components/ui/Empty'
import Skeleton from '../components/ui/Skeleton'
import { SectionLabel } from '../components/ui/Bits'
import SponsorSlot from '../components/feature/SponsorSlot'
import { useAction, useFetch } from '../hooks/useFetch'
import { useAuth } from '../context/AuthContext'
import { api, uploadUrl } from '../lib/api'
import { getGame } from '../lib/games'
import { fmtDate, sameId, uname } from '../lib/format'

export default function TournamentDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { data, error, loading, reload } = useFetch(`/tournaments/${id}`)
  const act = useAction()
  const [teamName, setTeamName] = useState('')

  if (loading)
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-12">
        <Skeleton className="h-56" />
        <Skeleton className="h-24 w-2/3" />
      </div>
    )
  if (error)
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        {error.status === 404 ? <Empty big="404" title="Cup not found" action={<Button to="/games">Back to games</Button>} /> : <ErrorState error={error} onRetry={reload} />}
      </div>
    )

  const t = data?.tournament ?? data
  const game = getGame(t.game)
  const regs = t.registrations ?? []
  const mine = !!user && regs.some((r) => sameId(r.user, user))
  const full = t.maxTeams && regs.length >= t.maxTeams

  const register = (e) => {
    e.preventDefault()
    if (!teamName.trim()) return act.setError(new Error('Your team needs a name.'))
    act.run(() => api.post(`/tournaments/${id}/register`, { teamName: teamName.trim() })).then(reload).catch(() => {})
  }

  return (
    <div style={{ '--accent': game?.accent ?? '#DC143C' }}>
      <section className="relative min-h-72 overflow-hidden bg-ink-2">
        {t.bannerUrl ? (
          <img src={uploadUrl(t.bannerUrl)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        ) : (
          <span aria-hidden className="halftone absolute inset-0 text-(--accent)/40 [mask-image:linear-gradient(120deg,#000,transparent_80%)]" />
        )}
        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <Link to={`/games/${t.game}?tab=tournaments`} className="font-mono text-xs uppercase tracking-widest text-(--accent) hover:underline">
            ← {game?.name ?? t.game} cups
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <StatusBadge status={t.status} />
            <span className="font-mono text-xs uppercase text-paper/60">{t.format === 'points' ? 'Points table' : 'Knockout'}</span>
          </div>
          <h1 className="display mt-3 max-w-4xl text-6xl sm:text-8xl">{t.title}</h1>
          {t.prize && (
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Sticker tone="marigold" rotate={-2}>
                <span className="inline-flex items-center gap-2"><Trophy className="size-4" /> {t.prize}</span>
              </Sticker>
              <span className="font-mono text-xs text-paper/60">Sponsor-funded{t.sponsor ? ` by ${t.sponsor}` : ''} · free entry</span>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-10">
          <div>
            <SectionLabel num="01">About</SectionLabel>
            <p className="mt-4 whitespace-pre-line text-paper/80">{t.description || 'Organiser has not added details yet.'}</p>
            <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[
                ['Starts', fmtDate(t.startsAt)],
                ['Teams', `${regs.length}/${t.maxTeams ?? '—'}`],
                ['Organiser', uname(t.organiser)],
              ].map(([k, v]) => (
                <div key={k} className="border-l-4 border-(--accent) pl-3">
                  <dt className="font-mono text-[11px] uppercase tracking-widest text-paper/45">{k}</dt>
                  <dd className="mt-1 font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <SectionLabel num="02">Teams in</SectionLabel>
            {regs.length ? (
              <ol className="mt-4 grid gap-2 sm:grid-cols-2">
                {regs.map((r, i) => (
                  <li key={i} className="flex items-baseline gap-3 border-b border-paper/10 py-2">
                    <span className="font-mono text-xs text-paper/40">{String(i + 1).padStart(2, '0')}</span>
                    <span className="display text-xl">{r.teamName}</span>
                    <span className="ml-auto text-xs text-paper/50">{uname(r.user)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <Empty className="mt-4" big="0" title="No teams yet" body="Registration is free. Be the first name on the sheet." />
            )}
          </div>
        </div>
        <aside className="space-y-5">
          <SponsorSlot slot="tournament" game={t.game} variant="compact" />
          {t.status === 'registration' ? (
            mine ? (
              <div className="border-2 border-paper/15 p-5">
                <p className="display text-3xl">You're registered</p>
                <p className="mt-1 text-paper/65">Fixtures and rooms get posted here and in your notifications.</p>
              </div>
            ) : !user ? (
              <div className="border-2 border-(--accent) p-5">
                <p className="display text-3xl">Enter your team</p>
                <Button to="/login" state={{ from: `/tournaments/${id}` }} className="mt-4">Log in to register</Button>
              </div>
            ) : full ? (
              <div className="border-2 border-paper/15 p-5"><p className="display text-3xl">Bracket full</p></div>
            ) : (
              <form onSubmit={register} className="space-y-3 border-2 border-(--accent) p-5">
                <p className="display text-3xl">Enter your team</p>
                <Input label="Team name" placeholder="e.g. Pokhara Phantoms" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
                <FormError error={act.error} />
                <Button type="submit" variant="accent" busy={act.busy} className="w-full">Register — free</Button>
              </form>
            )
          ) : (
            <div className="border-2 border-paper/15 p-5">
              <p className="display text-2xl">Registration closed</p>
              <p className="mt-1 text-paper/65">This cup is {t.status}. Catch the next one.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
