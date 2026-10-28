import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { History, Minus, Plus, Search } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import { useUi } from '../../context/UiContext'
import { AdminHead, ExportButton } from './kit'
import { REASON_LABEL } from './Reports'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Empty, { ErrorState } from '../../components/ui/Empty'
import { SkeletonList } from '../../components/ui/Skeleton'
import { Avatar } from '../../components/ui/Bits'
import { useFetch } from '../../hooks/useFetch'
import { api, asList } from '../../lib/api'
import { fmtDay, idOf, timeAgo, uname } from '../../lib/format'

// Strike history: reports filed against this user plus admin actions on them from the audit log.
function StrikeHistory({ user }) {
  const reports = useFetch('/admin/reports')
  const audit = useFetch('/admin/audit', { targetId: user._id, page: 1 })
  const mine = asList(reports.data).filter((r) => idOf(r.target) === user._id)
  const log = asList(audit.data).filter((a) => String(a.targetId) === user._id)
  return (
    <div className="space-y-5 text-ink">
      <p className="font-mono text-sm">Strikes now: <b>{user.strikes ?? 0}</b>{user.banned ? ' · banned' : ''}</p>
      <section>
        <p className="font-mono text-[11px] uppercase tracking-widest text-ink/60">Reports against them</p>
        {reports.loading ? <p className="text-sm text-ink/50">Loading…</p> : !mine.length ? <p className="text-sm text-ink/60">None.</p> : (
          <ul className="mt-1 divide-y divide-ink/10">
            {mine.map((r) => (
              <li key={r._id} className="py-2 text-sm">
                <b>{REASON_LABEL[r.reason] ?? r.reason}</b> by {uname(r.reporter)} · {r.status} · {timeAgo(r.createdAt)}
                {r.adminNote && <span className="block text-ink/60">Note: {r.adminNote}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <p className="font-mono text-[11px] uppercase tracking-widest text-ink/60">Admin actions on this account</p>
        {audit.loading ? <p className="text-sm text-ink/50">Loading…</p> : !log.length ? <p className="text-sm text-ink/60">None recorded.</p> : (
          <ul className="mt-1 divide-y divide-ink/10">
            {log.map((a) => (
              <li key={a._id} className="py-2 text-sm">{a.summary ?? a.action} <span className="text-ink/50">· {uname(a.actor)} · {timeAgo(a.at ?? a.createdAt)}</span></li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default function Users() {
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300)
    return () => clearTimeout(t)
  }, [q])
  const state = useFetch('/admin/users', { q: debounced || undefined })
  const [rowErr, setRowErr] = useState(null)
  const [history, setHistory] = useState(null)
  const { toast, confirm } = useUi()
  const users = asList(state.data)

  const patch = async (u, body) => {
    setRowErr(null)
    if (body.banned === true && !(await confirm({ title: `Ban ${u.username}?`, body: 'They lose access until you unban them.', confirmText: 'Ban' }))) return
    if (body.role === 'admin' && !(await confirm({ title: `Make ${u.username} an admin?`, body: 'Admins can see everything, including payments and rooms.', confirmText: 'Promote', danger: false }))) return
    try {
      const { data } = await api.patch(`/admin/users/${u._id}`, body)
      state.setData(
        Array.isArray(state.data)
          ? state.data.map((x) => (x._id === u._id ? { ...x, ...(data?.user ?? data ?? body) } : x))
          : { ...state.data, items: users.map((x) => (x._id === u._id ? { ...x, ...(data?.user ?? data ?? body) } : x)) },
      )
      toast.success(`${u.username} updated`)
    } catch (e) {
      setRowErr(e)
      toast.error(e)
    }
  }

  return (
    <div>
      <AdminHead kicker="People" title="Users" actions={<ExportButton what="users" />}>Roles, strikes and bans. Every change lands in the audit log.</AdminHead>
      <div className="mt-6 max-w-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-paper/40" />
          <Input aria-label="Search users" placeholder="Search username or email" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
      </div>
      {rowErr && <p className="mt-4 border-l-4 border-crimson bg-crimson/10 px-3 py-2 text-sm">{rowErr.message}</p>}
      <div className="mt-6">
        {state.loading ? (
          <SkeletonList count={1} className="h-72" />
        ) : state.error ? (
          <ErrorState error={state.error} onRetry={state.reload} />
        ) : !users.length ? (
          <Empty big="0" title="No users match" />
        ) : (
          <div className="overflow-x-auto border-2 border-paper/15">
            <table className="w-full min-w-[46rem] text-left text-sm">
              <thead className="bg-paper font-mono text-[11px] uppercase tracking-widest text-ink">
                <tr>
                  <th className="px-3 py-2">Player</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Strikes</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-t border-paper/10">
                    <td className="px-3 py-2">
                      <Link to={`/u/${u.username}`} className="flex items-center gap-2 font-semibold hover:text-marigold">
                        <Avatar user={u} size={28} />
                        <span>
                          {u.username}
                          {u.isDemo && <Badge tone="muted" className="ml-2">demo</Badge>}
                          <span className="block text-xs font-normal text-paper/45">{u.email}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <select value={u.role} onChange={(e) => patch(u, { role: e.target.value })} className="h-9 border-2 border-paper/25 bg-ink-2 px-2" aria-label={`Role for ${u.username}`}>
                        <option value="player">player</option>
                        <option value="organiser">organiser</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <button className="grid size-7 place-items-center border border-paper/25 hover:bg-paper/10" onClick={() => patch(u, { strikes: Math.max(0, (u.strikes ?? 0) - 1) })} aria-label="Remove strike">
                          <Minus className="size-3" />
                        </button>
                        <span className={`w-5 text-center font-mono font-bold ${(u.strikes ?? 0) >= 3 ? 'text-crimson' : ''}`}>{u.strikes ?? 0}</span>
                        <button className="grid size-7 place-items-center border border-paper/25 hover:bg-paper/10" onClick={() => patch(u, { strikes: (u.strikes ?? 0) + 1 })} aria-label="Add strike">
                          <Plus className="size-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => patch(u, { banned: !u.banned })}
                        className={`border-2 px-3 py-1 font-mono text-xs font-bold uppercase ${u.banned ? 'border-crimson bg-crimson text-paper' : 'border-paper/25 text-paper/70 hover:border-crimson hover:text-crimson'}`}
                      >
                        {u.banned ? 'Banned — undo' : 'Ban'}
                      </button>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-paper/55">
                      {fmtDay(u.createdAt)}
                      <button onClick={() => setHistory(u)} className="ml-3 inline-flex items-center gap-1 text-paper/60 hover:text-marigold" aria-label={`History for ${u.username}`}>
                        <History className="size-3.5" /> history
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal open={!!history} onClose={() => setHistory(null)} kicker="Strike history" title={history?.username ?? ''}>
        {history && <StrikeHistory user={history} />}
      </Modal>
    </div>
  )
}
