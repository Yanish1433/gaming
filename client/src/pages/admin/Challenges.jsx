import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Ban, Gavel, Search, Trash2 } from 'lucide-react'
import Button from '../../components/ui/Button'
import Badge, { StatusBadge } from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Input, { Segmented, Select, Textarea } from '../../components/ui/Input'
import Empty, { ErrorState, FormError } from '../../components/ui/Empty'
import { SkeletonList } from '../../components/ui/Skeleton'
import { useFetch } from '../../hooks/useFetch'
import { api, asList } from '../../lib/api'
import { GAMES, getGame } from '../../lib/games'
import { fmtDate, uname } from '../../lib/format'
import { AdminHead, ExportButton, Pager, useAdminAct } from './kit'

const STATUSES = ['open', 'accepted', 'room_ready', 'in_progress', 'reported', 'disputed', 'settled', 'cancelled', 'expired']

function SettleForm({ c, onDone }) {
  const game = getGame(c.game)
  const players = [...(c.teamA ?? []).map((u) => ['A', u]), ...(c.teamB ?? []).map((u) => ['B', u])]
  const [side, setSide] = useState('')
  const [reason, setReason] = useState('')
  const [scores, setScores] = useState({})
  const [err, setErr] = useState(null)
  const act = useAdminAct()
  const submit = async (e) => {
    e.preventDefault()
    if (!side) return setErr(new Error('Pick the winning side.'))
    if (reason.trim().length < 3) return setErr(new Error('Give a short reason; it goes in the audit log.'))
    const list = Object.entries(scores).filter(([, v]) => v !== '').map(([username, score]) => ({ username, score: Number(score) }))
    const body = { winnerSide: side, reason: reason.trim(), ...(list.length ? { scores: list } : {}) }
    const ok = await act(() => api.post(`/admin/challenges/${c._id}/settle`, body), { success: 'Challenge settled, ratings updated' })
    if (ok) onDone()
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <div style={{ '--accent': '#F2A900' }}>
        <Segmented tone="paper" label="Winner" value={side} onChange={setSide} options={[{ value: 'A', label: 'Side A' }, { value: 'B', label: 'Side B' }]} />
      </div>
      {players.length > 0 && (
        <fieldset>
          <legend className="font-mono text-[11px] font-semibold uppercase tracking-widest text-ink/70">{game?.statLabel ?? 'Score'} (optional override)</legend>
          <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
            {players.map(([s, u]) => (
              <label key={uname(u)} className="flex items-center gap-2 border-2 border-ink/20 px-2 py-1.5">
                <span className="font-mono text-xs text-ink/50">{s}</span>
                <span className="min-w-0 flex-1 truncate font-semibold">{uname(u)}</span>
                <input type="number" min="0" value={scores[uname(u)] ?? ''} onChange={(e) => setScores({ ...scores, [uname(u)]: e.target.value })} className="h-8 w-14 border-2 border-ink/40 bg-paper text-center font-mono" aria-label={`Score for ${uname(u)}`} />
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <Textarea tone="paper" label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Both screenshots show side A winning 31–24." />
      <FormError error={err} />
      <Button type="submit">Force settle</Button>
    </form>
  )
}

function CancelForm({ c, onDone }) {
  const [reason, setReason] = useState('')
  const act = useAdminAct()
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        if (await act(() => api.post(`/admin/challenges/${c._id}/cancel`, { reason: reason.trim() || 'Cancelled by admin' }), { success: 'Challenge cancelled' })) onDone()
      }}
      className="space-y-4"
    >
      <p className="text-ink/70">Players get notified. Ratings don't change.</p>
      <Textarea tone="paper" label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Duplicate challenge / player banned" />
      <Button type="submit" variant="danger" className="!bg-crimson !text-paper">Cancel challenge</Button>
    </form>
  )
}

export default function Challenges() {
  const [game, setGame] = useState('')
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [dq, setDq] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(null) // { kind, c }
  const act = useAdminAct()
  useEffect(() => {
    const t = setTimeout(() => setDq(q.trim()), 300)
    return () => clearTimeout(t)
  }, [q])
  const state = useFetch('/admin/challenges', { game: game || undefined, status: status || undefined, q: dq || undefined, page })
  const items = asList(state.data)
  const done = () => {
    setModal(null)
    state.reload()
  }

  return (
    <div>
      <AdminHead kicker="Play" title="Challenges" actions={<ExportButton what="challenges" />}>
        Every challenge with its room. Cancel anything not settled, force-settle stuck ones, delete dead ones.
      </AdminHead>
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div className="w-40"><Select label="Game" value={game} onChange={(e) => { setGame(e.target.value); setPage(1) }} placeholder="All games" options={GAMES.map((g) => ({ value: g.slug, label: g.name }))} /></div>
        <div className="w-40"><Select label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} placeholder="Any status" options={STATUSES} /></div>
        <div className="relative w-56">
          <Search className="pointer-events-none absolute bottom-3.5 left-3 size-4 text-paper/40" />
          <Input label="Player" placeholder="username" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} className="pl-9" />
        </div>
      </div>
      {state.loading ? (
        <SkeletonList count={1} className="h-72" />
      ) : state.error ? (
        <ErrorState error={state.error} onRetry={state.reload} />
      ) : !items.length ? (
        <Empty big="0" title="No challenges match" />
      ) : (
        <div className="overflow-x-auto border-2 border-paper/15">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead className="bg-paper font-mono text-[11px] uppercase tracking-widest text-ink">
              <tr>
                <th className="px-3 py-2">Challenge</th>
                <th className="px-3 py-2">Sides</th>
                <th className="px-3 py-2">Room</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => {
                const g = getGame(c.game)
                const dead = ['cancelled', 'expired'].includes(c.status)
                return (
                  <tr key={c._id} className="border-t border-paper/10 align-top">
                    <td className="px-3 py-2.5">
                      <Link to={`/challenges/${c._id}`} className="flex items-center gap-2 font-semibold hover:text-marigold">
                        <span className="size-2.5 shrink-0" style={{ background: g?.accent }} />
                        {c.teamSize}v{c.teamSize} {c.mode}
                      </Link>
                      <span className="font-mono text-[11px] text-paper/45">{g?.short} · {fmtDate(c.scheduledAt ?? c.createdAt)}</span>
                      {c.ranked !== false && <Badge tone="muted" className="ml-1">ranked</Badge>}
                    </td>
                    <td className="px-3 py-2.5 text-paper/80">
                      <span className="block">A: {(c.teamA ?? []).map(uname).join(', ') || '—'}</span>
                      <span className="block">B: {(c.teamB ?? []).map(uname).join(', ') || '—'}</span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs">{c.room?.roomId ? `${c.room.roomId} / ${c.room.password}` : <span className="text-paper/35">—</span>}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={c.status} />{c.winnerSide && <span className="ml-2 font-mono text-xs">won: {c.winnerSide}</span>}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-end gap-1.5">
                        {c.status !== 'settled' && !dead && (
                          <>
                            {(c.teamB?.length ?? 0) > 0 && <Button size="sm" variant="marigold" icon={Gavel} onClick={() => setModal({ kind: 'settle', c })}>Settle</Button>}
                            <Button size="sm" variant="outline" icon={Ban} onClick={() => setModal({ kind: 'cancel', c })}>Cancel</Button>
                          </>
                        )}
                        {dead && (
                          <Button
                            size="sm"
                            variant="danger"
                            icon={Trash2}
                            onClick={async () => {
                              if (await act(() => api.delete(`/admin/challenges/${c._id}`), { success: 'Deleted', confirm: { title: 'Delete challenge?', body: 'Removes it for good. Only cancelled or expired challenges can be deleted.', confirmText: 'Delete' } })) state.reload()
                            }}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <Pager page={page} total={state.data?.total} pageSize={state.data?.pageSize ?? 20} onPage={setPage} />
      <Modal open={modal?.kind === 'settle'} onClose={() => setModal(null)} kicker="Force settle" title="Make the call" wide>
        {modal?.kind === 'settle' && <SettleForm c={modal.c} onDone={done} />}
      </Modal>
      <Modal open={modal?.kind === 'cancel'} onClose={() => setModal(null)} kicker="Cancel" title="Cancel challenge">
        {modal?.kind === 'cancel' && <CancelForm c={modal.c} onDone={done} />}
      </Modal>
    </div>
  )
}
