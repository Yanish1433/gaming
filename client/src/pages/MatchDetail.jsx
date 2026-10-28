import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { CalendarClock, Users } from 'lucide-react'
import Button from '../components/ui/Button'
import { StatusBadge } from '../components/ui/Badge'
import Input from '../components/ui/Input'
import Empty, { ErrorState, FormError } from '../components/ui/Empty'
import Skeleton from '../components/ui/Skeleton'
import { Avatar, SectionLabel } from '../components/ui/Bits'
import RoomReveal from '../components/feature/RoomReveal'
import { useAction, useFetch } from '../hooks/useFetch'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { getGame } from '../lib/games'
import { fmtDate, sameId, teamLabel, uname } from '../lib/format'

export default function MatchDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { data, error, loading, reload } = useFetch(`/matches/${id}`)
  const act = useAction()
  const [teamName, setTeamName] = useState('')

  if (loading)
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-12">
        <Skeleton className="h-24 w-2/3" />
        <Skeleton className="h-56" />
      </div>
    )
  if (error)
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        {error.status === 404 ? <Empty big="404" title="Room not found" body="This match may have been cancelled." action={<Button to="/games">Back to games</Button>} /> : <ErrorState error={error} onRetry={reload} />}
      </div>
    )

  const m = data?.match ?? data
  const game = getGame(m.game)
  const regs = m.registrations ?? []
  const mine = m.viewer?.isRegistered ?? (!!user && regs.some((r) => sameId(r.user, user)))
  const isHost = !!user && (sameId(m.host, user) || user.role === 'admin')
  const full = m.maxSlots && regs.length >= m.maxSlots
  const unlockAt = m.roomRevealAt ?? (m.startsAt ? new Date(new Date(m.startsAt).getTime() - 15 * 60 * 1000) : null)
  const results = [...(m.results ?? [])].sort((a, b) => (a.placement ?? 99) - (b.placement ?? 99))

  const register = (e) => {
    e.preventDefault()
    act
      .run(() => api.post(`/matches/${id}/register`, { teamName: teamName.trim() || undefined }))
      .then(reload)
      .catch(() => {})
  }

  return (
    <div style={{ '--accent': game?.accent ?? '#DC143C' }}>
      <section className="relative overflow-hidden border-b-2 border-paper/10">
        <span aria-hidden className="display pointer-events-none absolute -bottom-10 right-0 select-none text-[9rem] leading-none text-(--accent)/15 sm:text-[16rem]">
          {m.map}
        </span>
        <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <Link to={`/games/${m.game}?tab=matches`} className="font-mono text-xs uppercase tracking-widest text-(--accent) hover:underline">
            ← {game?.name ?? m.game} rooms
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <StatusBadge status={m.status} />
            <span className="font-mono text-xs uppercase text-paper/55">{m.mode} · {teamLabel(m.teamSize)}</span>
          </div>
          <h1 className="display mt-3 text-6xl sm:text-8xl">{m.map ?? m.title}</h1>
          <p className="mt-2 text-xl font-semibold text-paper/85">{m.title}</p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-paper/70">
            <span className="flex items-center gap-1.5"><CalendarClock className="size-4" /><span className="font-mono text-sm">{fmtDate(m.startsAt)}</span></span>
            <span className="flex items-center gap-1.5"><Users className="size-4" /><span className="font-mono text-sm">{regs.length}/{m.maxSlots ?? '—'} slots</span></span>
            {m.host && <span className="text-sm">Hosted by <span className="font-semibold">{uname(m.host)}</span></span>}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-10">
          {results.length > 0 && (
            <div>
              <SectionLabel num="RS">Results</SectionLabel>
              <div className="mt-4 overflow-hidden border-2 border-paper/15">
                <div className="grid grid-cols-[3rem_1fr_4rem_4rem] gap-2 bg-paper px-3 py-2 font-mono text-[11px] font-semibold uppercase text-ink">
                  <span>#</span><span>Player</span><span className="text-right">Kills</span><span className="text-right">Pts</span>
                </div>
                {results.map((r, i) => (
                  <div key={i} className="grid grid-cols-[3rem_1fr_4rem_4rem] items-center gap-2 border-t border-paper/10 px-3 py-2.5">
                    <span className="display text-2xl text-(--accent)">{r.placement ?? i + 1}</span>
                    <span className="truncate font-semibold">{uname(r.user)}</span>
                    <span className="text-right font-mono">{r.kills ?? 0}</span>
                    <span className="text-right font-mono">{r.points ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <SectionLabel num="RG">Registered</SectionLabel>
            {regs.length ? (
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {regs.map((r, i) => (
                  <li key={i} className="flex items-center gap-3 border-2 border-paper/10 px-3 py-2">
                    <span className="w-6 font-mono text-xs text-paper/40">{String(i + 1).padStart(2, '0')}</span>
                    <Avatar user={r.user} size={28} />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{r.teamName || uname(r.user)}</span>
                      {r.teamName && <span className="block truncate text-xs text-paper/50">{uname(r.user)}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty className="mt-4" big="0" title="No one yet" body="Grab slot 01 before your rivals do." />
            )}
          </div>
        </div>

        <aside className="space-y-6">
          {(mine || isHost) && m.status !== 'completed' && m.status !== 'cancelled' && <RoomReveal room={m.room} unlockAt={unlockAt} />}

          {m.status === 'upcoming' && !mine && (
            <div className="border-2 border-(--accent) p-5">
              <p className="display text-3xl">{full ? 'Room is full' : 'Grab a slot'}</p>
              {!user ? (
                <>
                  <p className="mt-1 text-paper/65">Log in to register. It's free.</p>
                  <Button to="/login" state={{ from: `/matches/${id}` }} className="mt-4">Log in</Button>
                </>
              ) : full ? (
                <p className="mt-1 text-paper/65">All {m.maxSlots} slots taken. Watch the hub for the next one.</p>
              ) : (
                <form onSubmit={register} className="mt-4 space-y-3">
                  {Number(m.teamSize) > 1 && <Input label="Team name" placeholder="e.g. Team Gorkhali" value={teamName} onChange={(e) => setTeamName(e.target.value)} />}
                  <FormError error={act.error} />
                  <Button type="submit" variant="accent" busy={act.busy} className="w-full">Register free</Button>
                </form>
              )}
            </div>
          )}

          {mine && m.status === 'upcoming' && (
            <div className="border-2 border-paper/15 p-5">
              <p className="display text-2xl">You're in</p>
              <p className="mt-1 text-paper/65">Room ID shows here 15 minutes before start. Can't make it? Free up the slot.</p>
              <FormError error={act.error} />
              <Button variant="danger" size="sm" className="mt-4" busy={act.busy} onClick={() => act.run(() => api.delete(`/matches/${id}/register`)).then(reload).catch(() => {})}>
                Leave match
              </Button>
            </div>
          )}

          {isHost && (
            <Button to="/admin/matches" variant="outline" className="w-full">Manage in admin</Button>
          )}
        </aside>
      </div>
    </div>
  )
}
