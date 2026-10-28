import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ListOrdered, Pencil, Plus } from 'lucide-react'
import Button from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Input, { Select } from '../../components/ui/Input'
import Empty, { ErrorState, FormError } from '../../components/ui/Empty'
import { SkeletonList } from '../../components/ui/Skeleton'
import { useAction, useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../context/AuthContext'
import { api, asList } from '../../lib/api'
import { GAMES, getGame, isSolo } from '../../lib/games'
import { fmtDate, idOf, sameId, toLocalInput, uname } from '../../lib/format'

function blank() {
  const g = GAMES[0]
  return { title: '', game: g.slug, mode: g.modes[0], map: g.maps[0], startsAt: '', maxSlots: 25, teamSize: 4, status: 'upcoming', roomId: '', password: '' }
}

function MatchForm({ initial, onDone }) {
  const [f, setF] = useState(initial)
  const act = useAction()
  const game = getGame(f.game)
  const solo = isSolo(game)

  const changeGame = (slug) => {
    const g = getGame(slug)
    setF({ ...f, game: slug, mode: g.modes[0], map: g.maps[0] ?? '', teamSize: isSolo(g) ? 1 : f.teamSize })
  }

  const save = async (e) => {
    e.preventDefault()
    if (!f.title.trim() || !f.startsAt) return act.setError(new Error('Title and start time are required.'))
    const body = {
      title: f.title.trim(),
      mode: f.mode,
      map: game.maps.length ? f.map : undefined,
      startsAt: new Date(f.startsAt).toISOString(),
      maxSlots: Number(f.maxSlots),
      teamSize: solo ? 1 : Number(f.teamSize),
    }
    // game is fixed once created; status only moves on edit (completed comes from publishing results)
    if (!f._id) body.game = f.game
    else body.status = f.status
    if (f.roomId.trim() || f.password.trim()) {
      if (!f.roomId.trim() || !f.password.trim()) return act.setError(new Error('Room needs both an ID and a password.'))
      body.room = { roomId: f.roomId.trim(), password: f.password.trim() }
    }
    try {
      await act.run(() => (f._id ? api.patch(`/matches/${f._id}`, body) : api.post('/matches', body)))
      onDone()
    } catch {
      // shown below
    }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <Input tone="paper" label="Title" placeholder="e.g. Friday Night Erangel Scrims" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Select tone="paper" label="Game" value={f.game} disabled={!!f._id} onChange={(e) => changeGame(e.target.value)} options={GAMES.map((g) => ({ value: g.slug, label: g.name }))} />
        <Select tone="paper" label="Mode" value={f.mode} onChange={(e) => setF({ ...f, mode: e.target.value })} options={game.modes} />
        {game.maps.length > 0 && <Select tone="paper" label="Map" value={f.map} onChange={(e) => setF({ ...f, map: e.target.value })} options={game.maps} />}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Input tone="paper" type="datetime-local" label="Starts" value={f.startsAt} onChange={(e) => setF({ ...f, startsAt: e.target.value })} />
        <Input tone="paper" type="number" min="2" label="Max slots" value={f.maxSlots} onChange={(e) => setF({ ...f, maxSlots: e.target.value })} />
        {!solo && <Select tone="paper" label="Team size" value={f.teamSize} onChange={(e) => setF({ ...f, teamSize: e.target.value })} options={game.teamSizes.map((n) => ({ value: n, label: `${n}` }))} />}
      </div>
      <div className="grid gap-3 border-t-2 border-ink/15 pt-4 sm:grid-cols-3">
        <Input tone="paper" label="Room ID" className="font-mono" value={f.roomId} onChange={(e) => setF({ ...f, roomId: e.target.value })} hint="Players see it 15 min before start" />
        <Input tone="paper" label="Room password" className="font-mono" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        <Select tone="paper" label="Status" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} options={['upcoming', 'live', 'cancelled']} disabled={!f._id} />
      </div>
      <FormError error={act.error} />
      <Button type="submit" busy={act.busy}>{f._id ? 'Save changes' : 'Create match'}</Button>
    </form>
  )
}

function ResultsForm({ match, onDone }) {
  const regs = match.registrations ?? []
  const [rows, setRows] = useState(() =>
    regs.map((r, i) => {
      const prev = (match.results ?? []).find((x) => sameId(x.user, r.user))
      return { user: idOf(r.user), label: r.teamName || uname(r.user), placement: prev?.placement ?? i + 1, kills: prev?.kills ?? 0, points: prev?.points ?? 0 }
    }),
  )
  const act = useAction()
  const upd = (i, k, v) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)))

  const save = async (e) => {
    e.preventDefault()
    const results = rows.map(({ user, placement, kills, points }) => ({ user, placement: Number(placement), kills: Number(kills), points: Number(points) }))
    try {
      await act.run(() => api.post(`/matches/${match._id}/results`, { results }))
      onDone()
    } catch {
      // shown below
    }
  }

  if (!regs.length) return <p className="text-ink/70">No one registered, so there's nothing to score.</p>
  return (
    <form onSubmit={save} className="space-y-4">
      <div className="max-h-[50dvh] overflow-y-auto border-2 border-ink">
        <div className="sticky top-0 grid grid-cols-[1fr_4.5rem_4.5rem_4.5rem] gap-2 bg-ink px-3 py-2 font-mono text-[10px] uppercase text-paper">
          <span>Player / team</span><span>Place</span><span>Kills</span><span>Points</span>
        </div>
        {rows.map((r, i) => (
          <div key={r.user || i} className="grid grid-cols-[1fr_4.5rem_4.5rem_4.5rem] items-center gap-2 border-t border-ink/15 px-3 py-1.5">
            <span className="truncate font-semibold">{r.label}</span>
            {['placement', 'kills', 'points'].map((k) => (
              <input key={k} type="number" min="0" value={r[k]} onChange={(e) => upd(i, k, e.target.value)} className="h-9 w-full border-2 border-ink/40 bg-paper px-2 font-mono focus:border-crimson focus:outline-none" aria-label={`${k} for ${r.label}`} />
            ))}
          </div>
        ))}
      </div>
      <FormError error={act.error} />
      <Button type="submit" busy={act.busy}>Publish results</Button>
      <p className="text-xs text-ink/55">Publishing completes the match and hands out rank points.</p>
    </form>
  )
}

export default function Matches() {
  const { user } = useAuth()
  const state = useFetch('/matches')
  const [editing, setEditing] = useState(null)
  const [scoring, setScoring] = useState(null)
  const all = asList(state.data)
  // organisers only manage their own rooms
  const items = useMemo(() => (user?.role === 'admin' ? all : all.filter((m) => sameId(m.host, user))), [all, user])

  const [loadErr, setLoadErr] = useState(null)
  // the list omits room + registrations, so edit/results work off the full record
  const openFull = async (m, then) => {
    setLoadErr(null)
    try {
      const { data } = await api.get(`/matches/${m._id}`)
      then(data)
    } catch (e) {
      setLoadErr(e)
    }
  }

  const done = () => {
    setEditing(null)
    setScoring(null)
    state.reload()
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="display text-5xl">Matches</h1>
        <Button icon={Plus} onClick={() => setEditing(blank())}>New room</Button>
      </div>
      <div className="mt-6">
        <FormError error={loadErr} />
        {state.loading ? (
          <SkeletonList count={2} className="h-24" />
        ) : state.error ? (
          <ErrorState error={state.error} onRetry={state.reload} />
        ) : !items.length ? (
          <Empty big="0" title="No matches yet" body="Create the first custom room. Players register for free." />
        ) : (
          <ul className="space-y-3">
            {items.map((m) => (
              <li key={m._id} className="grid gap-3 border-2 border-paper/15 p-4 sm:grid-cols-[1fr_auto] sm:items-center" style={{ borderLeftColor: getGame(m.game)?.accent, borderLeftWidth: 6 }}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={m.status} />
                    <span className="font-mono text-xs text-paper/55">{fmtDate(m.startsAt)} · {m.slotsTaken ?? (m.registrations ?? []).length}/{m.maxSlots}</span>
                  </div>
                  <Link to={`/matches/${m._id}`} className="display mt-1 block truncate text-2xl hover:text-marigold">
                    {m.title} <span className="text-paper/45">· {m.map ?? m.mode}</span>
                  </Link>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="paper"
                    icon={Pencil}
                    onClick={() => openFull(m, (full) => setEditing({ ...blank(), ...full, startsAt: toLocalInput(full.startsAt), roomId: full.room?.roomId ?? '', password: full.room?.password ?? '' }))}
                  >
                    Edit
                  </Button>
                  {m.status !== 'cancelled' && m.status !== 'completed' && (
                    <Button size="sm" variant="marigold" icon={ListOrdered} onClick={() => openFull(m, setScoring)}>Results</Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Modal wide open={!!editing} onClose={() => setEditing(null)} kicker="Custom room" title={editing?._id ? 'Edit match' : 'New match'}>
        {editing && <MatchForm initial={editing} onDone={done} />}
      </Modal>
      <Modal wide open={!!scoring} onClose={() => setScoring(null)} kicker={scoring?.title} title="Results">
        {scoring && <ResultsForm match={scoring} onDone={done} />}
      </Modal>
    </div>
  )
}
