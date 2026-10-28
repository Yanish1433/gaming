import { useState } from 'react'
import { Link } from 'react-router'
import { Medal, Pencil, Trash2, UserMinus } from 'lucide-react'
import Button from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Input, { Select, Textarea } from '../../components/ui/Input'
import Empty, { ErrorState, FormError } from '../../components/ui/Empty'
import { SkeletonList } from '../../components/ui/Skeleton'
import { useFetch } from '../../hooks/useFetch'
import { api, asList } from '../../lib/api'
import { getGame } from '../../lib/games'
import { fmtDate, idOf, toLocalInput, uname } from '../../lib/format'
import { AdminHead, useAdminAct } from './kit'

function EditForm({ t, onDone }) {
  const [f, setF] = useState({
    title: t.title ?? '',
    prize: t.prize ?? '',
    sponsor: t.sponsor ?? '',
    status: t.status ?? 'registration',
    description: t.description ?? '',
    startsAt: toLocalInput(t.startsAt),
    maxTeams: t.maxTeams ?? 16,
    bannerUrl: t.bannerUrl ?? '',
  })
  const act = useAdminAct()
  const save = async (e) => {
    e.preventDefault()
    const body = { ...f, maxTeams: Number(f.maxTeams), startsAt: f.startsAt ? new Date(f.startsAt).toISOString() : undefined }
    if (await act(() => api.patch(`/admin/tournaments/${t._id}`, body), { success: 'Tournament saved' })) onDone()
  }
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  return (
    <form onSubmit={save} className="space-y-3">
      <Input tone="paper" label="Title" value={f.title} onChange={set('title')} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input tone="paper" label="Prize (sponsor-funded)" value={f.prize} onChange={set('prize')} placeholder="Rs 10,000 + jerseys" />
        <Input tone="paper" label="Sponsor" value={f.sponsor} onChange={set('sponsor')} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Select tone="paper" label="Status" value={f.status} onChange={set('status')} options={['registration', 'ongoing', 'completed']} />
        <Input tone="paper" type="datetime-local" label="Starts" value={f.startsAt} onChange={set('startsAt')} />
        <Input tone="paper" type="number" min="2" label="Max teams" value={f.maxTeams} onChange={set('maxTeams')} />
      </div>
      <Input tone="paper" label="Banner URL" value={f.bannerUrl} onChange={set('bannerUrl')} placeholder="https://… or /uploads/…" />
      <Textarea tone="paper" label="Description" rows={3} value={f.description} onChange={set('description')} />
      <Button type="submit">Save</Button>
    </form>
  )
}

function WinnersForm({ t, onDone }) {
  const regs = t.registrations ?? []
  const [rows, setRows] = useState([1, 2, 3].map((place) => ({ place, key: '' })))
  const [err, setErr] = useState(null)
  const act = useAdminAct()
  const options = regs.map((r) => ({ value: `${uname(r.user)}|${r.teamName ?? ''}`, label: `${r.teamName ?? uname(r.user)} (${uname(r.user)})` }))
  const save = async (e) => {
    e.preventDefault()
    const winners = rows.filter((r) => r.key).map((r) => {
      const [username, teamName] = r.key.split('|')
      return { place: r.place, username, teamName }
    })
    if (!winners.length) return setErr(new Error('Pick at least the winner.'))
    if (new Set(winners.map((w) => w.username)).size !== winners.length) return setErr(new Error('Same team picked twice.'))
    if (await act(() => api.post(`/admin/tournaments/${t._id}/winners`, { winners }), { success: 'Winners recorded, rank points awarded' })) onDone()
  }
  if (!regs.length) return <p className="text-ink/70">No teams registered, so there's nobody to place.</p>
  return (
    <form onSubmit={save} className="space-y-3">
      {rows.map((r, i) => (
        <Select
          key={r.place}
          tone="paper"
          label={`${['1st', '2nd', '3rd'][i]} place · +${[100, 60, 40][i]} rank pts`}
          value={r.key}
          onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))}
          placeholder="—"
          options={options}
        />
      ))}
      <FormError error={err} />
      <Button type="submit">Complete tournament</Button>
      <p className="text-xs text-ink/55">Marks it completed. Prizes are paid by the sponsor, outside Arena.</p>
    </form>
  )
}

export default function Tournaments() {
  const state = useFetch('/admin/tournaments')
  const [modal, setModal] = useState(null)
  const act = useAdminAct()
  const items = asList(state.data)
  const done = () => {
    setModal(null)
    state.reload()
  }

  return (
    <div>
      <AdminHead kicker="Play" title="Tournaments">Edit sponsored cups, remove teams, and record winners to close them out.</AdminHead>
      {state.loading ? (
        <SkeletonList count={2} className="h-32" />
      ) : state.error ? (
        <ErrorState error={state.error} onRetry={state.reload} />
      ) : !items.length ? (
        <Empty big="CUP" title="No tournaments" body="Organisers and admins create cups through the API; they show up here to manage." />
      ) : (
        <ul className="space-y-4">
          {items.map((t) => {
            const g = getGame(t.game)
            return (
              <li key={t._id} className="border-2 border-paper/15 p-4" style={{ borderLeft: `6px solid ${g?.accent ?? '#DC143C'}` }}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={t.status} />
                      <span className="font-mono text-xs text-paper/50">{g?.name} · {fmtDate(t.startsAt)} · {(t.registrations ?? []).length}/{t.maxTeams}</span>
                    </div>
                    <Link to={`/tournaments/${t._id}`} className="display mt-1 block text-3xl hover:text-marigold">{t.title}</Link>
                    {t.prize && <p className="text-sm text-paper/70">{t.prize}{t.sponsor ? ` · by ${t.sponsor}` : ''}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="paper" icon={Pencil} onClick={() => setModal({ kind: 'edit', t })}>Edit</Button>
                    {t.status !== 'completed' && <Button size="sm" variant="marigold" icon={Medal} onClick={() => setModal({ kind: 'winners', t })}>Winners</Button>}
                    <Button
                      size="sm"
                      variant="danger"
                      icon={Trash2}
                      onClick={async () => {
                        if (await act(() => api.delete(`/admin/tournaments/${t._id}`), { success: 'Tournament deleted', confirm: { title: `Delete ${t.title}?`, body: 'Registered teams lose their spot. This cannot be undone.', confirmText: 'Delete', typed: 'YES' } })) state.reload()
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                {(t.registrations ?? []).length > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer font-mono text-xs uppercase text-paper/55">Teams ({t.registrations.length})</summary>
                    <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                      {t.registrations.map((r) => (
                        <li key={idOf(r.user)} className="flex items-center justify-between gap-2 border-b border-paper/10 py-1 text-sm">
                          <span><span className="font-semibold">{r.teamName}</span> <span className="text-paper/50">· {uname(r.user)}</span></span>
                          <button
                            className="p-1 text-paper/50 hover:text-crimson"
                            aria-label={`Remove ${r.teamName}`}
                            onClick={async () => {
                              if (await act(() => api.delete(`/admin/tournaments/${t._id}/registrations/${idOf(r.user)}`), { success: 'Team removed', confirm: { title: `Remove ${r.teamName}?`, confirmText: 'Remove' } })) state.reload()
                            }}
                          >
                            <UserMinus className="size-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </li>
            )
          })}
        </ul>
      )}
      <Modal wide open={modal?.kind === 'edit'} onClose={() => setModal(null)} kicker="Tournament" title="Edit">
        {modal?.kind === 'edit' && <EditForm t={modal.t} onDone={done} />}
      </Modal>
      <Modal open={modal?.kind === 'winners'} onClose={() => setModal(null)} kicker={modal?.t?.title} title="Podium">
        {modal?.kind === 'winners' && <WinnersForm t={modal.t} onDone={done} />}
      </Modal>
    </div>
  )
}
