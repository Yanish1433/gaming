import { useEffect, useState } from 'react'
import { ExternalLink, ImageUp, Pencil, Plus, Trash2 } from 'lucide-react'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Input, { Select } from '../../components/ui/Input'
import Empty, { ErrorState, FormError } from '../../components/ui/Empty'
import { SkeletonList } from '../../components/ui/Skeleton'
import { useFetch } from '../../hooks/useFetch'
import { api, asList, uploadUrl } from '../../lib/api'
import { GAMES, getGame } from '../../lib/games'
import { fmtDay, num, toLocalInput } from '../../lib/format'
import { AdminHead, useAdminAct } from './kit'

const SLOTS = [
  { value: 'home_banner', label: 'Home banner' },
  { value: 'hub_banner', label: 'Game hub banner' },
  { value: 'tournament', label: 'Tournament cards' },
]
const BLANK = { name: '', website: '', slot: 'home_banner', game: '', active: true, startsAt: '', endsAt: '' }

function SponsorForm({ initial, onDone }) {
  const [f, setF] = useState({ ...BLANK, ...initial, game: initial.game ?? '', website: initial.website ?? '', startsAt: toLocalInput(initial.startsAt), endsAt: toLocalInput(initial.endsAt) })
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(initial.logoUrl ? uploadUrl(initial.logoUrl) : '')
  const [err, setErr] = useState(null)
  const act = useAdminAct()
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  useEffect(() => {
    if (!file) return
    const u = URL.createObjectURL(file)
    setPreview(u)
    return () => URL.revokeObjectURL(u)
  }, [file])

  const save = async (e) => {
    e.preventDefault()
    if (f.name.trim().length < 2) return setErr(new Error('Sponsor name is required.'))
    if (f.slot === 'hub_banner' && !f.game) return setErr(new Error('Hub banners need a game.'))
    if (file && file.size > 5 * 1024 * 1024) return setErr(new Error('Logo must be under 5 MB.'))
    // multipart so the logo can ride along (field name `logo`)
    const fd = new FormData()
    fd.append('name', f.name.trim())
    fd.append('slot', f.slot)
    fd.append('active', String(!!f.active))
    if (f.website.trim()) fd.append('website', f.website.trim())
    if (f.slot === 'hub_banner') fd.append('game', f.game)
    if (f.startsAt) fd.append('startsAt', new Date(f.startsAt).toISOString())
    if (f.endsAt) fd.append('endsAt', new Date(f.endsAt).toISOString())
    if (file) fd.append('logo', file)
    const ok = await act(() => (f._id ? api.patch(`/admin/sponsors/${f._id}`, fd) : api.post('/admin/sponsors', fd)), { success: f._id ? 'Sponsor saved' : 'Sponsor added' })
    if (ok) onDone()
  }

  return (
    <form onSubmit={save} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
        <div className="space-y-3">
          <Input tone="paper" label="Name" value={f.name} onChange={set('name')} placeholder="Himalayan Java" />
          <Input tone="paper" label="Website" value={f.website} onChange={set('website')} placeholder="https://…" />
        </div>
        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 border-2 border-dashed border-ink/40 bg-ink/5 text-center text-xs text-ink/60 hover:border-crimson">
          {preview ? <img src={preview} alt="" className="max-h-full max-w-full object-contain p-2" /> : (<><ImageUp className="size-6" /> Logo</>)}
          <input type="file" accept="image/*" hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} aria-label="Sponsor logo" />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select tone="paper" label="Slot" value={f.slot} onChange={set('slot')} options={SLOTS} />
        {f.slot === 'hub_banner' && <Select tone="paper" label="Game" value={f.game} onChange={set('game')} placeholder="—" options={GAMES.map((g) => ({ value: g.slug, label: g.name }))} />}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input tone="paper" type="datetime-local" label="Starts (optional)" value={f.startsAt} onChange={set('startsAt')} />
        <Input tone="paper" type="datetime-local" label="Ends (optional)" value={f.endsAt} onChange={set('endsAt')} />
      </div>
      <label className="flex items-center gap-2 font-medium"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} className="size-4 accent-crimson" /> Active</label>
      <FormError error={err} />
      <Button type="submit">{f._id ? 'Save' : 'Add sponsor'}</Button>
    </form>
  )
}

export default function Sponsors() {
  const state = useFetch('/admin/sponsors')
  const [editing, setEditing] = useState(null)
  const act = useAdminAct()
  const items = asList(state.data)
  const done = () => {
    setEditing(null)
    state.reload()
  }

  return (
    <div>
      <AdminHead kicker="Growth" title="Sponsors" actions={<Button icon={Plus} onClick={() => setEditing({ ...BLANK })}>Add sponsor</Button>}>
        Banner slots on Home, the game hubs and tournament cards. Impressions count each time a slot renders; clicks count each visit through the banner.
      </AdminHead>
      {state.loading ? (
        <SkeletonList count={2} className="h-28" />
      ) : state.error ? (
        <ErrorState error={state.error} onRetry={state.reload} />
      ) : !items.length ? (
        <Empty big="Rs" title="No sponsors yet" body="Add one to fill the banner slots. Without sponsors the slots stay hidden." />
      ) : (
        <div className="overflow-x-auto border-2 border-paper/15">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead className="bg-paper font-mono text-[11px] uppercase tracking-widest text-ink">
              <tr>
                <th className="px-3 py-2">Sponsor</th>
                <th className="px-3 py-2">Slot</th>
                <th className="px-3 py-2 text-right">Impr.</th>
                <th className="px-3 py-2 text-right">Clicks</th>
                <th className="px-3 py-2 text-right">CTR</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((s) => {
                const imp = Number(s.impressions) || 0
                const clk = Number(s.clicks) || 0
                return (
                  <tr key={s._id} className="border-t border-paper/10">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 shrink-0 place-items-center overflow-hidden border-2 border-ink bg-paper">
                          {s.logoUrl ? <img src={uploadUrl(s.logoUrl)} alt="" className="max-h-full max-w-full object-contain" /> : <span className="display text-lg text-ink">{s.name?.[0]}</span>}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-semibold">{s.name}</span>
                          {s.website && <a href={s.website} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-xs text-paper/50 hover:text-marigold">{s.website.replace(/^https?:\/\//, '').slice(0, 30)} <ExternalLink className="size-3" /></a>}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      {SLOTS.find((x) => x.value === s.slot)?.label ?? s.slot}
                      {s.game && <span className="text-paper/50"> · {getGame(s.game)?.short}</span>}
                      <span className="block space-x-1">
                        {s.active ? <Badge tone="green">active</Badge> : <Badge tone="muted">off</Badge>}
                        {(s.startsAt || s.endsAt) && <span className="font-mono text-[10px] text-paper/45">{s.startsAt ? fmtDay(s.startsAt) : '…'} → {s.endsAt ? fmtDay(s.endsAt) : '…'}</span>}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">{num(imp)}</td>
                    <td className="px-3 py-2.5 text-right font-mono">{num(clk)}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold">{imp ? `${((clk / imp) * 100).toFixed(1)}%` : '—'}</td>
                    <td className="px-3 py-2.5 text-right">
                      <button onClick={() => setEditing(s)} className="p-2 hover:text-marigold" aria-label={`Edit ${s.name}`}><Pencil className="size-4" /></button>
                      <button
                        onClick={async () => {
                          if (await act(() => api.delete(`/admin/sponsors/${s._id}`), { success: 'Sponsor removed', confirm: { title: `Remove ${s.name}?`, body: 'Their banners disappear and the click stats go with them.', confirmText: 'Remove' } })) state.reload()
                        }}
                        className="p-2 hover:text-crimson"
                        aria-label={`Delete ${s.name}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <Modal wide open={!!editing} onClose={() => setEditing(null)} kicker="Sponsor" title={editing?._id ? 'Edit sponsor' : 'New sponsor'}>
        {editing && <SponsorForm initial={editing} onDone={done} />}
      </Modal>
    </div>
  )
}
