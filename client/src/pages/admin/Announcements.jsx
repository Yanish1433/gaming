import { useState } from 'react'
import { Pencil, Pin, Plus, Radio, Trash2 } from 'lucide-react'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Input, { Select, Textarea } from '../../components/ui/Input'
import Empty, { ErrorState, FormError } from '../../components/ui/Empty'
import { SkeletonList } from '../../components/ui/Skeleton'
import { useFetch } from '../../hooks/useFetch'
import { api, asList } from '../../lib/api'
import { GAMES, PROVINCES, getGame } from '../../lib/games'
import { timeAgo } from '../../lib/format'
import { AdminHead, useAdminAct } from './kit'
import { useUi } from '../../context/UiContext'

const BLANK = { title: '', body: '', link: '', audience: 'all', game: '', province: '', pinned: false, active: true }

function AnnouncementForm({ initial, onDone }) {
  const [f, setF] = useState({ ...BLANK, ...initial, game: initial.game ?? '', province: initial.province ?? '', link: initial.link ?? '' })
  const [err, setErr] = useState(null)
  const act = useAdminAct()
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = async (e) => {
    e.preventDefault()
    if (f.title.trim().length < 3) return setErr(new Error('Title needs a few words.'))
    if (f.audience === 'game' && !f.game) return setErr(new Error('Pick the game.'))
    if (f.audience === 'province' && !f.province) return setErr(new Error('Pick the province.'))
    const body = {
      title: f.title.trim(),
      body: f.body.trim(),
      link: f.link.trim() || undefined,
      audience: f.audience,
      // on edit, null clears a stale game/province when the audience changes (create doesn't accept null)
      game: f.audience === 'game' ? f.game : f._id ? null : undefined,
      province: f.audience === 'province' ? f.province : f._id ? null : undefined,
      pinned: !!f.pinned,
      active: !!f.active,
    }
    const ok = await act(() => (f._id ? api.patch(`/admin/announcements/${f._id}`, body) : api.post('/admin/announcements', body)), { success: f._id ? 'Announcement saved' : 'Announcement posted' })
    if (ok) onDone()
  }
  return (
    <form onSubmit={save} className="space-y-3">
      <Input tone="paper" label="Title" value={f.title} onChange={set('title')} placeholder="Dashain Cup registration is open" maxLength={120} />
      <Textarea tone="paper" label="Body" value={f.body} onChange={set('body')} rows={3} maxLength={500} />
      <Input tone="paper" label="Link (optional)" value={f.link} onChange={set('link')} placeholder="/tournaments/… or https://…" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Select tone="paper" label="Audience" value={f.audience} onChange={set('audience')} options={[{ value: 'all', label: 'Everyone' }, { value: 'game', label: 'One game' }, { value: 'province', label: 'One province' }]} />
        {f.audience === 'game' && <Select tone="paper" label="Game" value={f.game} onChange={set('game')} placeholder="—" options={GAMES.map((g) => ({ value: g.slug, label: g.name }))} />}
        {f.audience === 'province' && <Select tone="paper" label="Province" value={f.province} onChange={set('province')} placeholder="—" options={PROVINCES} />}
      </div>
      <div className="flex gap-6">
        <label className="flex items-center gap-2 font-medium"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} className="size-4 accent-crimson" /> Live on site</label>
        <label className="flex items-center gap-2 font-medium"><input type="checkbox" checked={f.pinned} onChange={(e) => setF({ ...f, pinned: e.target.checked })} className="size-4 accent-crimson" /> Pinned first</label>
      </div>
      <FormError error={err} />
      <Button type="submit">{f._id ? 'Save' : 'Post'}</Button>
    </form>
  )
}

export default function Announcements() {
  const state = useFetch('/admin/announcements')
  const [editing, setEditing] = useState(null)
  const act = useAdminAct()
  const { toast } = useUi()
  const items = asList(state.data)
  const done = () => {
    setEditing(null)
    state.reload()
  }

  const audienceText = (a) => (a.audience === 'game' ? getGame(a.game)?.name ?? a.game : a.audience === 'province' ? a.province : 'Everyone')

  return (
    <div>
      <AdminHead kicker="Growth" title="Announcements" actions={<Button icon={Plus} onClick={() => setEditing({ ...BLANK })}>New</Button>}>
        Live ones scroll in the ticker on Home and the game hubs. Broadcast also drops a notification into every matching player's inbox.
      </AdminHead>
      {state.loading ? (
        <SkeletonList count={2} className="h-24" />
      ) : state.error ? (
        <ErrorState error={state.error} onRetry={state.reload} />
      ) : !items.length ? (
        <Empty big="NEWS" title="Nothing announced" body="Post the first one: a new cup, a maintenance window, a Dashain special." />
      ) : (
        <ul className="space-y-3">
          {items.map((a) => (
            <li key={a._id} className="grid gap-3 border-2 border-paper/15 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {a.active ? <Badge tone="green">live</Badge> : <Badge tone="muted">hidden</Badge>}
                  {a.pinned && <Badge tone="marigold"><Pin className="size-3" /> pinned</Badge>}
                  <span className="font-mono text-xs text-paper/45">{audienceText(a)} · {timeAgo(a.createdAt)}</span>
                </div>
                <p className="display mt-1 text-2xl">{a.title}</p>
                {a.body && <p className="text-paper/70">{a.body}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="marigold"
                  icon={Radio}
                  onClick={async () => {
                    const r = await act(() => api.post(`/admin/announcements/${a._id}/broadcast`), {
                      confirm: { title: 'Broadcast to inboxes?', body: `Sends "${a.title}" as a notification to every player in: ${audienceText(a)}. It can't be unsent.`, confirmText: 'Broadcast', danger: false },
                    })
                    if (r) toast.success(`Broadcast sent to ${r.sent ?? r.count ?? r.notified ?? 'every matching'} player${(r.sent ?? r.count ?? r.notified) === 1 ? '' : 's'}`)
                  }}
                >
                  Broadcast
                </Button>
                <Button size="sm" variant="paper" icon={Pencil} onClick={() => setEditing(a)}>Edit</Button>
                <Button
                  size="sm"
                  variant="danger"
                  icon={Trash2}
                  onClick={async () => {
                    if (await act(() => api.delete(`/admin/announcements/${a._id}`), { success: 'Deleted', confirm: { title: 'Delete announcement?', confirmText: 'Delete' } })) state.reload()
                  }}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Modal wide open={!!editing} onClose={() => setEditing(null)} kicker="Announcement" title={editing?._id ? 'Edit' : 'New announcement'}>
        {editing && <AnnouncementForm initial={editing} onDone={done} />}
      </Modal>
    </div>
  )
}
