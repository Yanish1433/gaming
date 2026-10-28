import { useEffect, useState } from 'react'
import Input from '../../components/ui/Input'
import Empty, { ErrorState } from '../../components/ui/Empty'
import { SkeletonList } from '../../components/ui/Skeleton'
import { useFetch } from '../../hooks/useFetch'
import { asList } from '../../lib/api'
import { fmtDate, uname } from '../../lib/format'
import { AdminHead, Pager } from './kit'

export default function Audit() {
  const [actor, setActor] = useState('')
  const [action, setAction] = useState('')
  const [q, setQ] = useState({ actor: '', action: '' })
  const [page, setPage] = useState(1)
  useEffect(() => {
    const t = setTimeout(() => {
      setQ({ actor: actor.trim(), action: action.trim() })
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [actor, action])
  const state = useFetch('/admin/audit', { actor: q.actor || undefined, action: q.action || undefined, page })
  const items = asList(state.data)

  return (
    <div>
      <AdminHead kicker="System" title="Audit log">Every admin change and the key public events (sign-ups, settled challenges, orders). Read-only.</AdminHead>
      <div className="mb-5 grid max-w-xl gap-3 sm:grid-cols-2">
        <Input label="Actor" placeholder="username" value={actor} onChange={(e) => setActor(e.target.value)} />
        <Input label="Action" placeholder="e.g. user.ban, order.update" value={action} onChange={(e) => setAction(e.target.value)} />
      </div>
      {state.loading ? (
        <SkeletonList count={1} className="h-72" />
      ) : state.error ? (
        <ErrorState error={state.error} onRetry={state.reload} />
      ) : !items.length ? (
        <Empty big="LOG" title="Nothing logged" body={q.actor || q.action ? 'No entries match these filters.' : 'Entries appear as soon as anyone does something.'} />
      ) : (
        <div className="overflow-x-auto border-2 border-paper/15">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="bg-paper font-mono text-[11px] uppercase tracking-widest text-ink">
              <tr>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Actor</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Summary</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a, i) => (
                <tr key={a._id ?? i} className="border-t border-paper/10">
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-paper/55">{fmtDate(a.at ?? a.createdAt)}</td>
                  <td className="px-3 py-2 font-semibold">{a.actor ? uname(a.actor) : 'system'}</td>
                  <td className="px-3 py-2 font-mono text-xs text-marigold">{a.action}</td>
                  <td className="px-3 py-2 text-paper/80">
                    <span className="[overflow-wrap:anywhere]" title={a.summary}>{a.summary?.length > 180 ? `${a.summary.slice(0, 180)}…` : a.summary}</span>
                    {a.targetType && <span className="ml-2 font-mono text-[10px] text-paper/35">{a.targetType}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager page={page} total={state.data?.total} pageSize={state.data?.pageSize ?? 50} onPage={setPage} />
    </div>
  )
}
