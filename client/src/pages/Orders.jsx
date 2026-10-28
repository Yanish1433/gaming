import { PageHead, Reveal, RevealItem } from '../components/ui/Bits'
import { StatusBadge } from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Empty, { ErrorState } from '../components/ui/Empty'
import { SkeletonList } from '../components/ui/Skeleton'
import { useFetch } from '../hooks/useFetch'
import { asList } from '../lib/api'
import { getGame } from '../lib/games'
import { fmtDate, npr } from '../lib/format'

const METHOD = { esewa: 'eSewa', khalti: 'Khalti', bank: 'Bank' }

export default function Orders() {
  const state = useFetch('/store/orders/mine')
  const orders = asList(state.data)
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <PageHead kicker={{ num: 'TU', text: 'Orders' }} title="Your top-ups" />
      {state.loading ? (
        <SkeletonList count={2} className="h-24" />
      ) : state.error ? (
        <ErrorState error={state.error} onRetry={state.reload} />
      ) : !orders.length ? (
        <Empty big="0" title="No orders yet" body="Your top-up history shows up here." action={<Button to="/store">Open store</Button>} />
      ) : (
        <Reveal className="space-y-3">
          {orders.map((o) => {
            const product = typeof o.product === 'object' ? o.product : null
            const game = getGame(product?.game)
            return (
              <RevealItem key={o._id} className="ticket paper-card grid gap-3 p-4 pl-6 pr-6 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-ink/55">{game?.name ?? 'Top-up'} · {fmtDate(o.createdAt)}</p>
                  <p className="display text-2xl">{product?.name ?? 'Product'}</p>
                  <p className="font-mono text-xs text-ink/60">UID {o.gameUid} · {METHOD[o.paymentMethod] ?? o.paymentMethod} ref {o.paymentRef}</p>
                  {o.adminNote && <p className="mt-1 text-sm text-ink/75">Admin: {o.adminNote}</p>}
                </div>
                <span className="display text-2xl">{npr(o.priceNpr)}</span>
                <StatusBadge status={o.status} />
              </RevealItem>
            )
          })}
        </Reveal>
      )}
    </div>
  )
}
