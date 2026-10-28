import { useState } from 'react'
import Button from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/Badge'
import { Segmented } from '../../components/ui/Input'
import Empty, { ErrorState } from '../../components/ui/Empty'
import { SkeletonList } from '../../components/ui/Skeleton'
import { useFetch } from '../../hooks/useFetch'
import { api, asList } from '../../lib/api'
import { getGame } from '../../lib/games'
import { fmtDate, npr, uname } from '../../lib/format'

const NEXT = { pending: ['paid', 'failed'], paid: ['fulfilled', 'failed'], fulfilled: [], failed: ['pending'] }

function OrderRow({ order: o, onSaved }) {
  const [note, setNote] = useState(o.adminNote ?? '')
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState(null)
  const product = typeof o.product === 'object' ? o.product : null

  const set = async (status) => {
    setBusy(status)
    setErr(null)
    try {
      await api.patch(`/admin/orders/${o._id}`, { status, adminNote: note.trim() || undefined })
      onSaved()
    } catch (e) {
      setErr(e)
    } finally {
      setBusy('')
    }
  }

  return (
    <li className="grid gap-4 border-2 border-paper/15 p-4 lg:grid-cols-[1fr_16rem]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={o.status} />
          <span className="font-mono text-xs text-paper/50">{fmtDate(o.createdAt)} · {uname(o.user)}</span>
        </div>
        <p className="display mt-2 text-2xl">
          {product?.name ?? 'Product'} <span className="text-paper/45">· {getGame(product?.game)?.short ?? ''}</span> <span className="text-marigold">{npr(o.priceNpr)}</span>
        </p>
        <dl className="mt-2 grid gap-x-6 gap-y-1 font-mono text-sm sm:grid-cols-3">
          <div><dt className="text-[10px] uppercase text-paper/40">Game UID</dt><dd className="select-all">{o.gameUid}</dd></div>
          <div><dt className="text-[10px] uppercase text-paper/40">Method</dt><dd>{o.paymentMethod}</dd></div>
          <div><dt className="text-[10px] uppercase text-paper/40">Payment ref</dt><dd className="select-all break-all">{o.paymentRef}</dd></div>
        </dl>
        {err && <p className="mt-2 text-sm text-crimson">{err.message}</p>}
      </div>
      <div className="space-y-2">
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note to player (optional)" className="h-10 w-full border-2 border-paper/25 bg-ink-2 px-3 text-sm outline-none focus:border-marigold" aria-label="Admin note" />
        <div className="flex flex-wrap gap-2">
          {(NEXT[o.status] ?? []).map((s) => (
            <Button key={s} size="sm" variant={s === 'failed' ? 'danger' : s === 'fulfilled' ? 'marigold' : 'paper'} busy={busy === s} onClick={() => set(s)}>
              Mark {s}
            </Button>
          ))}
        </div>
      </div>
    </li>
  )
}

export default function Orders() {
  const [status, setStatus] = useState('pending')
  const state = useFetch('/admin/orders', { status: status || undefined })
  const items = asList(state.data)
  return (
    <div>
      <h1 className="display text-5xl">Orders</h1>
      <p className="mt-2 text-paper/60">Verify the payment ref in the eSewa/Khalti merchant app before marking paid.</p>
      <div className="mt-6" style={{ '--accent': '#F2A900' }}>
        <Segmented value={status} onChange={setStatus} options={[{ value: 'pending', label: 'Pending' }, { value: 'paid', label: 'Paid' }, { value: 'fulfilled', label: 'Delivered' }, { value: 'failed', label: 'Failed' }, { value: '', label: 'All' }]} />
      </div>
      <div className="mt-6">
        {state.loading ? (
          <SkeletonList count={2} className="h-28" />
        ) : state.error ? (
          <ErrorState error={state.error} onRetry={state.reload} />
        ) : !items.length ? (
          <Empty big="0" title="Queue is clear" />
        ) : (
          <ul className="space-y-3">
            {items.map((o) => (
              <OrderRow key={o._id} order={o} onSaved={state.reload} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
