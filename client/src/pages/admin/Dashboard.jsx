import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Gavel, Megaphone, Package, RefreshCw, UserCheck } from 'lucide-react'
import { CountUp } from '../../components/ui/Bits'
import { ErrorState } from '../../components/ui/Empty'
import Skeleton, { SkeletonList } from '../../components/ui/Skeleton'
import { Segmented } from '../../components/ui/Input'
import { BarChart, BarList, Donut, LineChart } from '../../components/charts/Charts'
import { useFetch } from '../../hooks/useFetch'
import { asList } from '../../lib/api'
import { getGame } from '../../lib/games'
import { timeAgo, uname } from '../../lib/format'
import { AdminHead, ORDER_COLORS } from './kit'

const TILES = [
  { key: 'users', label: 'Players', to: '/admin/users' },
  { key: 'activePlayers7d', label: 'Active · 7 days', from: 'analytics' },
  { key: 'challenges', label: 'Challenges', to: '/admin/challenges' },
  { key: 'matches', label: 'Matches', to: '/admin/matches' },
  { key: 'ordersPending', label: 'Orders pending', to: '/admin/orders', hot: true },
  { key: 'disputesOpen', label: 'Disputes open', to: '/admin/disputes', hot: true },
  { key: 'revenueNpr', label: 'Store revenue (Rs)', to: '/admin/revenue' },
]

// some audit summaries carry raw request JSON; keep the feed readable
const clip = (t, n = 140) => (t && t.length > n ? `${t.slice(0, n)}…` : t)

function Panel({ title, kicker, children, className = '' }) {
  return (
    <section className={`border-2 border-paper/15 bg-ink-2 p-5 ${className}`}>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="display text-2xl">{title}</h2>
        {kicker && <span className="font-mono text-[10px] uppercase tracking-widest text-paper/40">{kicker}</span>}
      </div>
      {children}
    </section>
  )
}

// Live feed: re-polls every 30s while the tab is visible.
function ActivityFeed() {
  const feed = useFetch('/admin/activity', { limit: 30 })
  useEffect(() => {
    const id = setInterval(() => document.visibilityState === 'visible' && feed.reload(), 30000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const items = asList(feed.data)
  return (
    <Panel title="Activity" kicker={<span className="flex items-center gap-1.5"><span className="live-dot size-1.5 rounded-full bg-crimson" /> live</span>}>
      {feed.loading && !feed.data ? (
        <SkeletonList count={1} className="h-48" />
      ) : feed.error ? (
        <ErrorState error={feed.error} onRetry={feed.reload} />
      ) : !items.length ? (
        <p className="text-sm text-paper/50">Nothing logged yet. Admin actions, sign-ups, settled challenges and orders show up here.</p>
      ) : (
        <ol className="max-h-[26rem] space-y-0 overflow-y-auto pr-1">
          {items.map((a, i) => (
            <li key={a._id ?? i} className="grid grid-cols-[0.6rem_1fr] gap-3 border-l-2 border-paper/10 py-2 pl-3">
              <span className={`-ml-[1.15rem] mt-1.5 size-2.5 rotate-45 ${/ban|strike|cancel|delete|clear/.test(a.action) ? 'bg-crimson' : /settle|approve|fulfil|register/.test(a.action) ? 'bg-[#2BB673]' : 'bg-marigold'}`} />
              <div className="min-w-0">
                <p className="text-sm">
                  <span className="font-semibold">{a.actor ? uname(a.actor) : 'system'}</span> <span className="text-paper/75 [overflow-wrap:anywhere]" title={a.summary}>{clip(a.summary ?? a.action)}</span>
                </p>
                <p className="font-mono text-[10px] uppercase text-paper/40">{a.action} · {timeAgo(a.at ?? a.createdAt)}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
      <button onClick={feed.reload} className="mt-3 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase text-paper/50 hover:text-paper">
        <RefreshCw className="size-3" /> refresh
      </button>
    </Panel>
  )
}

export default function Dashboard() {
  const [range, setRange] = useState('30d')
  const stats = useFetch('/admin/stats')
  const an = useFetch('/admin/analytics', { range })
  const a = an.data ?? {}

  const val = (t) => (t.from === 'analytics' ? a[t.key] : stats.data?.[t.key])

  return (
    <div>
      <AdminHead kicker="Overview" title="Control room" actions={<Segmented value={range} onChange={setRange} options={[{ value: '7d', label: '7d' }, { value: '30d', label: '30d' }, { value: '90d', label: '90d' }]} />}>
        Everything happening on Arena Nepal. Revenue is top-up sales only; nothing on the play side handles money.
      </AdminHead>

      {stats.error && <ErrorState error={stats.error} onRetry={stats.reload} className="mb-6" />}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {TILES.map((t, i) => {
          const v = Number(val(t)) || 0
          const alert = t.hot && v > 0
          const body = (
            <div
              className={`h-full border-2 p-4 transition-transform hover:-translate-y-0.5 ${alert ? 'border-ink bg-crimson shadow-hard' : i === 0 ? 'paper-card border-ink shadow-hard' : 'border-paper/15'}`}
              style={{ transform: i === 0 ? 'rotate(-0.6deg)' : undefined }}
            >
              <p className={`font-mono text-[10px] uppercase tracking-widest ${i === 0 && !alert ? 'text-ink/60' : 'text-paper/60'}`}>{t.label}</p>
              <p className="display mt-1 text-4xl sm:text-5xl">{stats.loading && !t.from ? '–' : <CountUp value={v} />}</p>
            </div>
          )
          return t.to ? <Link key={t.key} to={t.to}>{body}</Link> : <div key={t.key}>{body}</div>
        })}
        <div className="border-2 border-dashed border-paper/20 p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-paper/60">Retention d1 / d7</p>
          <p className="display mt-1 whitespace-nowrap text-3xl sm:text-4xl">
            <CountUp value={Math.round(a.retention?.d1 ?? 0)} />% <span className="text-paper/40">/</span> <CountUp value={Math.round(a.retention?.d7 ?? 0)} />%
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {[
          { to: '/admin/disputes', label: 'Resolve disputes', icon: Gavel },
          { to: '/admin/orders', label: 'Fulfil orders', icon: Package },
          { to: '/admin/applications', label: 'Review organisers', icon: UserCheck },
          { to: '/admin/announcements', label: 'Post announcement', icon: Megaphone },
        ].map((q) => (
          <Link key={q.to} to={q.to} className="inline-flex items-center gap-2 border-2 border-paper/25 px-3 py-1.5 text-sm font-semibold hover:border-marigold hover:text-marigold">
            <q.icon className="size-4" /> {q.label}
          </Link>
        ))}
      </div>

      {an.error ? (
        <ErrorState error={an.error} onRetry={an.reload} className="mt-6" />
      ) : an.loading && !an.data ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="grid gap-4">
            <Panel title="Sign-ups" kicker={range}>
              <LineChart label="Sign-ups per day" color="#F2A900" data={asList(a.signupsByDay).map((d) => ({ date: d.date, value: d.count }))} />
            </Panel>
            <div className="grid gap-4 md:grid-cols-2">
              <Panel title="Settled by game">
                <BarChart
                  label="Settled challenges by game"
                  h={190}
                  data={asList(a.settledByGame).map((d) => ({ label: getGame(d.game)?.short ?? d.game, value: d.count, color: getGame(d.game)?.accent }))}
                />
              </Panel>
              <Panel title="Orders">
                <Donut label="Orders by status" size={150} data={asList(a.ordersByStatus).map((d) => ({ label: d.status, value: d.count, color: ORDER_COLORS[d.status] ?? '#8A8378' }))} />
              </Panel>
            </div>
            <Panel title="Revenue" kicker="top-ups, NPR">
              <LineChart area label="Revenue per day" color="#2BB673" format={(v) => `Rs ${Number(v).toLocaleString('en-IN')}`} data={asList(a.revenueByDay).map((d) => ({ date: d.date, value: d.npr }))} />
            </Panel>
            <Panel title="Challenges posted" kicker={range}>
              <LineChart label="Challenges per day" color="#DC143C" data={asList(a.challengesByDay).map((d) => ({ date: d.date, value: d.count }))} />
            </Panel>
          </div>
          <div className="grid content-start gap-4">
            <ActivityFeed />
            <Panel title="Players by province">
              <BarList label="Players by province" data={asList(a.usersByProvince).sort((x, y) => y.count - x.count).map((d) => ({ label: d.province ?? '—', value: d.count }))} />
            </Panel>
            <Panel title="Top organisers">
              <BarList
                label="Top organisers by registrations"
                color="#3D7BFF"
                data={asList(a.topOrganisers).map((o) => ({ label: o.username, value: o.registrations }))}
                format={(v) => `${v} reg`}
              />
            </Panel>
          </div>
        </div>
      )}
    </div>
  )
}
