import { useState } from 'react'
import { Segmented } from '../../components/ui/Input'
import { ErrorState } from '../../components/ui/Empty'
import Skeleton from '../../components/ui/Skeleton'
import { CountUp } from '../../components/ui/Bits'
import { Donut, LineChart } from '../../components/charts/Charts'
import { useFetch } from '../../hooks/useFetch'
import { asList } from '../../lib/api'
import { AdminHead, ExportButton, ORDER_COLORS } from './kit'

export default function Revenue() {
  const [range, setRange] = useState('30d')
  const an = useFetch('/admin/analytics', { range })
  const rows = asList(an.data?.revenueByDay)
  const total = rows.reduce((s, r) => s + (Number(r.npr) || 0), 0)
  const days = rows.filter((r) => Number(r.npr) > 0).length
  const best = rows.reduce((m, r) => (Number(r.npr) > Number(m?.npr ?? -1) ? r : m), null)
  const orders = asList(an.data?.ordersByStatus)

  return (
    <div>
      <AdminHead
        kicker="Money"
        title="Revenue"
        actions={
          <>
            <Segmented value={range} onChange={setRange} options={[{ value: '7d', label: '7d' }, { value: '30d', label: '30d' }, { value: '90d', label: '90d' }]} />
            <ExportButton what="orders" label="Orders CSV" />
          </>
        }
      >
        Top-up sales only (paid + delivered). Challenges, matches and rank points never touch money.
      </AdminHead>
      {an.error ? (
        <ErrorState error={an.error} onRetry={an.reload} />
      ) : an.loading && !an.data ? (
        <Skeleton className="h-80" />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="paper-card -rotate-[0.6deg] border-2 border-ink p-4 shadow-hard">
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink/60">Total · {range}</p>
              <p className="display mt-1 text-5xl">Rs <CountUp value={total} /></p>
            </div>
            <div className="border-2 border-paper/15 p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-paper/60">Days with sales</p>
              <p className="display mt-1 text-5xl"><CountUp value={days} /></p>
            </div>
            <div className="border-2 border-paper/15 p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-paper/60">Best day</p>
              <p className="display mt-1 text-5xl">{best && Number(best.npr) > 0 ? <>Rs <CountUp value={best.npr} /></> : '—'}</p>
            </div>
          </div>
          <section className="mt-4 border-2 border-paper/15 bg-ink-2 p-5">
            <h2 className="display mb-4 text-2xl">Per day</h2>
            <LineChart area h={220} label="Revenue per day" color="#2BB673" format={(v) => `Rs ${Number(v).toLocaleString('en-IN')}`} data={rows.map((d) => ({ date: d.date, value: d.npr }))} />
          </section>
          <section className="mt-4 border-2 border-paper/15 bg-ink-2 p-5">
            <h2 className="display mb-4 text-2xl">Orders by status</h2>
            <Donut label="Orders by status" data={orders.map((d) => ({ label: d.status, value: d.count, color: ORDER_COLORS[d.status] ?? '#8A8378' }))} />
          </section>
        </>
      )}
    </div>
  )
}
