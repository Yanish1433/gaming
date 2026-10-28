import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Input, { Select } from '../../components/ui/Input'
import Empty, { ErrorState, FormError } from '../../components/ui/Empty'
import { SkeletonList } from '../../components/ui/Skeleton'
import { useAction, useFetch } from '../../hooks/useFetch'
import { api, asList } from '../../lib/api'
import { GAMES, getGame } from '../../lib/games'
import { npr } from '../../lib/format'

const BLANK = { game: 'pubg', name: '', amount: '', priceNpr: '', active: true, popular: false }

export default function Products() {
  const state = useFetch('/admin/products')
  const [editing, setEditing] = useState(null)
  const act = useAction()
  const items = asList(state.data)

  const save = async (e) => {
    e.preventDefault()
    // only the editable fields: the API rejects unknown keys like createdAt/__v
    const body = {
      game: editing.game,
      name: editing.name.trim(),
      amount: Number(editing.amount),
      priceNpr: Number(editing.priceNpr),
      active: editing.active !== false,
      popular: !!editing.popular,
    }
    if (!body.name || !(body.priceNpr > 0) || !(body.amount > 0)) return act.setError(new Error('Name, amount and a price above 0 are required.'))
    try {
      await act.run(() => (editing._id ? api.patch(`/admin/products/${editing._id}`, body) : api.post('/admin/products', body)))
      setEditing(null)
      state.reload()
    } catch {
      // shown in form
    }
  }

  const remove = async (p) => {
    if (!window.confirm(`Delete ${p.name}? Existing orders keep their record.`)) return
    try {
      await api.delete(`/admin/products/${p._id}`)
      state.reload()
    } catch (e) {
      window.alert(e.message)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="display text-5xl">Products</h1>
        <Button icon={Plus} onClick={() => { act.setError(null); setEditing({ ...BLANK }) }}>New product</Button>
      </div>
      <div className="mt-6">
        {state.loading ? (
          <SkeletonList count={1} className="h-64" />
        ) : state.error ? (
          <ErrorState error={state.error} onRetry={state.reload} />
        ) : !items.length ? (
          <Empty big="0" title="No products" body="Add the first top-up pack." />
        ) : (
          <div className="overflow-x-auto border-2 border-paper/15">
            <table className="w-full min-w-[38rem] text-left text-sm">
              <thead className="bg-paper font-mono text-[11px] uppercase tracking-widest text-ink">
                <tr>
                  <th className="px-3 py-2">Game</th>
                  <th className="px-3 py-2">Pack</th>
                  <th className="px-3 py-2 text-right">Price</th>
                  <th className="px-3 py-2">Flags</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p._id} className="border-t border-paper/10">
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-2"><span className="size-2.5" style={{ background: getGame(p.game)?.accent }} />{getGame(p.game)?.short ?? p.game}</span>
                    </td>
                    <td className="px-3 py-2 font-semibold">{p.name}</td>
                    <td className="px-3 py-2 text-right font-mono">{npr(p.priceNpr)}</td>
                    <td className="space-x-1 px-3 py-2">
                      {p.active === false ? <Badge tone="muted">hidden</Badge> : <Badge tone="green">live</Badge>}
                      {p.popular && <Badge tone="red">popular</Badge>}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => { act.setError(null); setEditing({ ...BLANK, ...p }) }} className="p-2 hover:text-marigold" aria-label={`Edit ${p.name}`}><Pencil className="size-4" /></button>
                      <button onClick={() => remove(p)} className="p-2 hover:text-crimson" aria-label={`Delete ${p.name}`}><Trash2 className="size-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal open={!!editing} onClose={() => setEditing(null)} kicker="Store" title={editing?._id ? 'Edit pack' : 'New pack'}>
        {editing && (
          <form onSubmit={save} className="space-y-4">
            <Select tone="paper" label="Game" value={editing.game} onChange={(e) => setEditing({ ...editing, game: e.target.value })} options={GAMES.map((g) => ({ value: g.slug, label: g.name }))} />
            <Input tone="paper" label="Name" placeholder="e.g. 660 UC" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input tone="paper" type="number" min="0" label="Amount" value={editing.amount} onChange={(e) => setEditing({ ...editing, amount: e.target.value })} />
              <Input tone="paper" type="number" min="1" label="Price (NPR)" value={editing.priceNpr} onChange={(e) => setEditing({ ...editing, priceNpr: e.target.value })} />
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 font-medium"><input type="checkbox" checked={editing.active !== false} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} className="size-4 accent-crimson" /> Live</label>
              <label className="flex items-center gap-2 font-medium"><input type="checkbox" checked={!!editing.popular} onChange={(e) => setEditing({ ...editing, popular: e.target.checked })} className="size-4 accent-crimson" /> Popular</label>
            </div>
            <FormError error={act.error} />
            <Button type="submit" busy={act.busy}>Save</Button>
          </form>
        )}
      </Modal>
    </div>
  )
}
