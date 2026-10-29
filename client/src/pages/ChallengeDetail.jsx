import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { CalendarClock, Flag, MapPin, ShieldAlert, Trophy } from 'lucide-react'
import Button from '../components/ui/Button'
import { StatusBadge } from '../components/ui/Badge'
import Input, { Textarea } from '../components/ui/Input'
import Empty, { ErrorState, FormError } from '../components/ui/Empty'
import Skeleton from '../components/ui/Skeleton'
import { Avatar, SectionLabel } from '../components/ui/Bits'
import Badge from '../components/ui/Badge'
import Sticker from '../components/ui/Sticker'
import RatingDelta from '../components/feature/RatingDelta'
import RoomReveal from '../components/feature/RoomReveal'
import ReportPlayer from '../components/feature/ReportPlayer'
import ResultUpload from '../components/feature/ResultUpload'
import { useFetch, useAction } from '../hooks/useFetch'
import { useAuth } from '../context/AuthContext'
import { api, uploadUrl } from '../lib/api'
import { getGame } from '../lib/games'
import { fmtDate, idOf, sameId, teamLabel, timeAgo, uname } from '../lib/format'

const STEPS = ['open', 'accepted', 'room_ready', 'in_progress', 'reported', 'settled']

function Progress({ status }) {
  const idx = STEPS.indexOf(status === 'disputed' ? 'reported' : status)
  return (
    <ol className="grid grid-cols-6 gap-1" aria-label="Challenge progress">
      {STEPS.map((s, i) => (
        <li key={s} className="flex flex-col gap-1.5">
          <span className={`h-2 ${i <= idx ? 'bg-(--accent)' : 'bg-paper/10'}`} />
          <span className={`hidden font-mono text-[10px] uppercase tracking-wider sm:block ${i <= idx ? 'text-paper/80' : 'text-paper/35'}`}>
            {s.replace('_', ' ')}
          </span>
        </li>
      ))}
    </ol>
  )
}

function TeamColumn({ label, side, members, size, winner }) {
  const slots = Array.from({ length: size }, (_, i) => members?.[i])
  return (
    <div className={`relative border-2 p-4 ${winner ? 'border-(--accent) bg-(--accent)/10' : 'border-paper/15'}`}>
      {winner && (
        <span className="absolute -top-3 right-3 inline-flex rotate-2 items-center gap-1 bg-(--accent) px-2 py-0.5 font-mono text-[11px] font-bold uppercase text-ink">
          <Trophy className="size-3" /> Winner
        </span>
      )}
      <p className="font-mono text-[11px] uppercase tracking-widest text-paper/50">Side {side}</p>
      <p className="display text-3xl">{label}</p>
      <ul className="mt-3 space-y-2">
        {slots.map((m, i) =>
          m ? (
            <li key={idOf(m) || i}>
              <Link to={`/u/${uname(m)}`} className="flex items-center gap-2 font-semibold hover:text-(--accent)">
                <Avatar user={m} size={28} /> {uname(m)}
              </Link>
            </li>
          ) : (
            <li key={i} className="flex items-center gap-2 text-paper/35">
              <span className="size-7 border-2 border-dashed border-paper/25" /> open slot
            </li>
          ),
        )}
      </ul>
    </div>
  )
}

export default function ChallengeDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { data, error, loading, reload, setData } = useFetch(`/challenges/${id}`)
  const act = useAction()
  const [mates, setMates] = useState([])
  const [room, setRoom] = useState({ roomId: '', password: '' })
  const [dispute, setDispute] = useState({ reason: '', file: null })
  const [disputeSent, setDisputeSent] = useState(false)

  useEffect(() => {
    if (!id) return undefined

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') reload()
    }
    const interval = window.setInterval(refreshWhenVisible, 3000)
    window.addEventListener('focus', refreshWhenVisible)
    document.addEventListener('visibilitychange', refreshWhenVisible)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', refreshWhenVisible)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [id, reload])

  if (loading)
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-12">
        <Skeleton className="h-16 w-2/3" />
        <Skeleton className="h-48" />
      </div>
    )
  if (error)
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        {error.status === 404 ? (
          <Empty big="404" title="Challenge not found" body="It may have been cancelled or expired." action={<Button to="/games">Back to games</Button>} />
        ) : (
          <ErrorState error={error} onRetry={reload} />
        )}
      </div>
    )

  const c = data?.challenge ?? data
  const game = getGame(c.game)
  const size = Number(c.teamSize) || 1
  const inA = !!user && (c.teamA ?? []).some((m) => sameId(m, user))
  const inB = !!user && (c.teamB ?? []).some((m) => sameId(m, user))
  const participant = inA || inB
  const isCreator = !!user && sameId(c.creator, user)
  const isAdmin = user?.role === 'admin'
  const mySide = inA ? 'A' : inB ? 'B' : null
  const sideOfId = (ref) => ((c.teamA ?? []).some((m) => sameId(m, ref)) ? 'A' : (c.teamB ?? []).some((m) => sameId(m, ref)) ? 'B' : null)
  // one report per side: a teammate's report counts as ours
  const myReport = (c.reports ?? []).find((r) => mySide && sideOfId(r.by) === mySide)
  // reports carry bare user ids; resolve names from the populated rosters
  const nameOf = (ref) => uname([...(c.teamA ?? []), ...(c.teamB ?? [])].find((m) => sameId(m, ref)) ?? ref)

  const call = (fn) =>
    act
      .run(fn)
      .then(({ data: d }) => {
        if (d && typeof d === 'object' && (d._id || d.challenge)) setData(d)
        else reload()
      })
      .catch(() => {})

  const accept = (e) => {
    e.preventDefault()
    const teammates = mates.map((m) => m.trim()).filter(Boolean)
    if (teammates.length !== size - 1) return act.setError(new Error(`Add ${size - 1} teammate username${size > 2 ? 's' : ''}.`))
    call(() => api.post(`/challenges/${id}/accept`, { teammates }))
  }

  const sendDispute = async (e) => {
    e.preventDefault()
    if (dispute.reason.trim().length < 10) return act.setError(new Error('Explain what happened (at least a sentence).'))
    const fd = new FormData()
    fd.append('challengeId', id)
    fd.append('reason', dispute.reason.trim())
    if (dispute.file) fd.append('evidence', dispute.file)
    try {
      await act.run(() => api.post('/disputes', fd))
      setDisputeSent(true)
      reload()
    } catch {
      // shown via act.error
    }
  }

  const sideLabel = (side) => {
    const team = side === 'A' ? c.teamA : c.teamB
    return size === 1 ? uname(team?.[0]) : `${uname(team?.[0])}'s squad`
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6" style={{ '--accent': game?.accent ?? '#DC143C' }}>
      <Link to={`/games/${c.game}`} className="font-mono text-xs uppercase tracking-widest text-(--accent) hover:underline">
        ← {game?.name ?? c.game} board
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="display text-5xl sm:text-7xl">
            {size}v{size} {c.mode}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-paper/70">
            {c.map && (
              <span className="flex items-center gap-1.5"><MapPin className="size-4" /> {c.map}</span>
            )}
            <span className="flex items-center gap-1.5"><CalendarClock className="size-4" /> <span className="font-mono text-sm">{fmtDate(c.scheduledAt)}</span></span>
            <span className="font-mono text-sm">{teamLabel(size)} · posted {timeAgo(c.createdAt)}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <StatusBadge status={c.status} className="text-sm" />
          {c.ranked !== false ? <Sticker tone="accent" rotate={3}>Ranked</Sticker> : <Badge tone="muted">Casual · no rating</Badge>}
        </div>
      </div>
      <div className="mt-8">
        <Progress status={c.status} />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <TeamColumn label={sideLabel('A')} side="A" members={c.teamA} size={size} winner={c.winnerSide === 'A'} />
            <span className="display text-center text-4xl text-paper/40">vs</span>
            <TeamColumn label={c.teamB?.length ? sideLabel('B') : 'Waiting…'} side="B" members={c.teamB} size={size} winner={c.winnerSide === 'B'} />
          </div>
          {user && (c.teamB?.length ?? 0) > 0 && (
            <ReportPlayer players={[...(c.teamA ?? []), ...(c.teamB ?? [])]} challengeId={c._id} />
          )}
          {c.notes && (
            <blockquote className="border-l-4 border-(--accent) bg-paper/5 px-4 py-3 text-paper/80">
              <span className="font-mono text-[11px] uppercase tracking-widest text-paper/45">Creator notes</span>
              <p className="mt-1">{c.notes}</p>
            </blockquote>
          )}
          {(c.playerStats?.length ?? 0) > 0 && (
            <div>
              <SectionLabel num="PS">Box score</SectionLabel>
              <div className="mt-3 overflow-hidden border-2 border-paper/15">
                <div className="grid grid-cols-[1fr_3rem_4rem_4.5rem] gap-2 bg-paper px-3 py-2 font-mono text-[11px] font-semibold uppercase text-ink sm:grid-cols-[1fr_3rem_4rem_5rem_4.5rem]">
                  <span>Player</span>
                  <span>Side</span>
                  <span className="text-right">{game?.statLabel ?? 'Score'}</span>
                  <span className="hidden text-right sm:block">Rating</span>
                  <span className="text-right">Δ</span>
                </div>
                {[...c.playerStats]
                  .sort((a, b) => (a.side === b.side ? (b.score ?? 0) - (a.score ?? 0) : a.side < b.side ? -1 : 1))
                  .map((s, i) => (
                    <div key={idOf(s.user) || i} className="grid grid-cols-[1fr_3rem_4rem_4.5rem] items-center gap-2 border-t border-paper/10 px-3 py-2.5 sm:grid-cols-[1fr_3rem_4rem_5rem_4.5rem]">
                      <Link to={`/u/${uname(s.user)}`} className="flex min-w-0 items-center gap-2 font-semibold hover:text-(--accent)">
                        <Avatar user={s.user} size={24} />
                        <span className="truncate">{uname(s.user)}</span>
                        {s.won && <Trophy className="size-3.5 shrink-0 text-(--accent)" aria-label="won" />}
                      </Link>
                      <span className="font-mono text-sm text-paper/60">{s.side}</span>
                      <span className="text-right font-mono text-lg font-semibold">{s.score ?? 0}</span>
                      <span className="hidden text-right font-mono text-sm text-paper/60 sm:block">{s.ratingAfter ?? '—'}</span>
                      <RatingDelta value={s.ratingDelta} className="text-right" />
                    </div>
                  ))}
              </div>
            </div>
          )}
          {(c.reports?.length ?? 0) > 0 && (
            <div>
              <SectionLabel num="RS">Reported results</SectionLabel>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {c.reports.map((r, i) => (
                  <li key={i} className="border-2 border-paper/15 p-3">
                    <p className="text-sm">
                      <span className="font-semibold">{nameOf(r.by)}</span> says side <span className="font-mono font-bold">{r.winnerSide}</span> won
                    </p>
                    <p className="font-mono text-xs text-paper/45">{timeAgo(r.at)}</p>
                    {r.screenshotUrl && (
                      <a href={uploadUrl(r.screenshotUrl)} target="_blank" rel="noreferrer" className="mt-2 block">
                        <img src={uploadUrl(r.screenshotUrl)} alt={`Screenshot from ${nameOf(r.by)}`} className="max-h-40 w-full object-cover" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* action rail: whatever the current user can do next */}
        <aside className="space-y-6">
          {!user && c.status === 'open' && (
            <div className="border-2 border-paper/15 p-5">
              <p className="display text-2xl">Want this one?</p>
              <p className="mt-1 text-paper/65">Log in to accept the challenge.</p>
              <Button to="/login" state={{ from: `/challenges/${id}` }} className="mt-4">Log in</Button>
            </div>
          )}

          {user && c.status === 'open' && !participant && (
            <form onSubmit={accept} className="space-y-4 border-2 border-(--accent) p-5">
              <p className="display text-3xl">Accept the challenge</p>
              {size > 1 && (
                <div className="grid gap-3">
                  {Array.from({ length: size - 1 }, (_, i) => (
                    <Input key={i} placeholder={`teammate ${i + 1} username`} value={mates[i] ?? ''} onChange={(e) => setMates(Object.assign([...mates], { [i]: e.target.value }))} aria-label={`Teammate ${i + 1}`} />
                  ))}
                </div>
              )}
              <FormError error={act.error} />
              <Button type="submit" variant="accent" busy={act.busy} className="w-full">Ma ready chu — accept</Button>
            </form>
          )}

          {isCreator && c.status === 'open' && (
            <div className="border-2 border-paper/15 p-5">
              <p className="display text-2xl">Waiting for a rival</p>
              <p className="mt-1 text-paper/65">Share the link in your group. You can pull it while nobody has accepted.</p>
              <FormError error={act.error} />
              <Button variant="danger" size="sm" className="mt-4" busy={act.busy} onClick={() => call(() => api.post(`/challenges/${id}/cancel`))}>
                Cancel challenge
              </Button>
            </div>
          )}

          {(isCreator || isAdmin) && c.status === 'accepted' && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!room.roomId.trim()) return act.setError(new Error('Room ID is required.'))
                call(() => api.post(`/challenges/${id}/room`, { roomId: room.roomId.trim(), password: room.password.trim() }))
              }}
              className="space-y-4 border-2 border-(--accent) p-5"
            >
              <p className="display text-3xl">Drop the room</p>
              <p className="text-sm text-paper/65">Create the custom room in-game and paste it here. Only both sides will see it.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Room ID" className="font-mono" value={room.roomId} onChange={(e) => setRoom({ ...room, roomId: e.target.value })} />
                <Input label="Password" className="font-mono" value={room.password} onChange={(e) => setRoom({ ...room, password: e.target.value })} />
              </div>
              <FormError error={act.error} />
              <Button type="submit" variant="accent" busy={act.busy}>Share room</Button>
            </form>
          )}

          {participant && !isCreator && c.status === 'accepted' && (
            <RoomReveal room={null} lockedText="The creator is setting up the room. You'll get a notification the moment it's ready." />
          )}

          {(participant || isAdmin) && ['room_ready', 'in_progress', 'reported'].includes(c.status) && (
            <RoomReveal room={c.room} lockedText="Room is only visible to the two sides." />
          )}

          {participant && c.status === 'room_ready' && (
            <div className="space-y-3">
              <FormError error={act.error} />
              <Button variant="accent" size="lg" className="w-full" busy={act.busy} onClick={() => call(() => api.post(`/challenges/${id}/start`))}>
                Everyone's in — start
              </Button>
            </div>
          )}

          {participant && ['in_progress', 'reported'].includes(c.status) && !myReport && (
            <div className="border-2 border-paper/15 p-5">
              <p className="display mb-4 text-3xl">Report the result</p>
              <ResultUpload
                busy={act.busy}
                error={act.error}
                sideALabel={`A · ${sideLabel('A')}`}
                sideBLabel={`B · ${sideLabel('B')}`}
                players={(inA ? c.teamA : c.teamB ?? []).map(uname)}
                statLabel={game?.statLabel ?? 'Kills'}
                onSubmit={(fd) => call(() => api.post(`/challenges/${id}/report`, fd))}
              />
            </div>
          )}

          {participant && myReport && c.status === 'reported' && (
            <div className="border-2 border-paper/15 p-5">
              <p className="display text-2xl">Result sent</p>
              <p className="mt-1 text-paper/65">Waiting for the other side to confirm. If they disagree, an admin reviews both screenshots.</p>
            </div>
          )}

          {c.status === 'settled' && (
            <div className="paper-card border-2 border-ink p-5 shadow-hard">
              <p className="font-mono text-xs uppercase tracking-widest text-ink/60">Final</p>
              <p className="display mt-1 text-4xl">Side {c.winnerSide} takes it</p>
              <p className="mt-2 text-ink/70">
                +30 rank points to the winners, +10 for turning up{c.ranked !== false ? ', and ratings moved (see the box score)' : ''}. GG.
              </p>
            </div>
          )}

          {c.status === 'disputed' && (
            <div className="border-2 border-crimson bg-crimson/10 p-5">
              <p className="flex items-center gap-2 display text-2xl"><ShieldAlert className="size-5" /> Under review</p>
              <p className="mt-1 text-paper/70">The two reports don't match. An admin is checking the screenshots, usually within a day.</p>
            </div>
          )}

          {participant && ['in_progress', 'reported', 'disputed'].includes(c.status) && (
            <details className="group border-2 border-paper/15 p-5" open={disputeSent || undefined}>
              <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold">
                <Flag className="size-4 text-crimson" /> {disputeSent ? 'Dispute filed' : 'Something off? Raise a dispute'}
              </summary>
              {disputeSent ? (
                <p className="mt-3 text-paper/65">Got it. An admin will look at it and you'll get a notification with the decision.</p>
              ) : (
                <form onSubmit={sendDispute} className="mt-4 space-y-3">
                  <Textarea label="What happened" value={dispute.reason} onChange={(e) => setDispute({ ...dispute, reason: e.target.value })} placeholder="e.g. They used an emulator, the screenshot is from another match" />
                  <Input type="file" accept="image/*" label="Evidence (optional)" onChange={(e) => setDispute({ ...dispute, file: e.target.files?.[0] ?? null })} className="pt-2 file:mr-3 file:border-0 file:bg-paper file:px-3 file:py-1 file:text-ink" />
                  <FormError error={act.error} />
                  <Button type="submit" variant="danger" busy={act.busy}>Send to admin</Button>
                </form>
              )}
            </details>
          )}
        </aside>
      </div>
    </div>
  )
}
