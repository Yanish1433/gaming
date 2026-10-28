import { useState } from 'react'
import { Link } from 'react-router'
import { Ban, Check, TriangleAlert } from 'lucide-react'
import Button from '../../components/ui/Button'
import Badge, { StatusBadge } from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { Segmented, Textarea } from '../../components/ui/Input'
import Empty, { ErrorState } from '../../components/ui/Empty'
import { SkeletonList } from '../../components/ui/Skeleton'
import { useFetch } from '../../hooks/useFetch'
import { api, asList, uploadUrl } from '../../lib/api'
import { idOf, timeAgo, uname } from '../../lib/format'
import { AdminHead, useAdminAct } from './kit'

export const REASON_LABEL = { cheating: 'Cheating', abuse: 'Abuse', fake_result: 'Fake result', other: 'Other' }
const ACTIONS = {
  dismiss: { label: 'Dismiss', body: 'No action against the player.', icon: Check },
  strike: { label: 'Strike', body: 'Adds a strike. Three strikes bans the account automatically.', icon: TriangleAlert },
  ban: { label: 'Ban', body: 'Bans the account right away. They get notified.', icon: Ban },
}

export default function Reports() {
  const [status, setStatus] = useState('open')
  const state = useFetch('/admin/reports', { status: status || undefined })
  const [pending, setPending] = useState(null) // { report, action }
  const [note, setNote] = useState('')
  const act = useAdminAct()
  const items = asList(state.data)

  const submit = async (e) => {
    e.preventDefault()
    const { report, action } = pending
    const ok = await act(() => api.post(`/admin/reports/${report._id}/action`, { action, note: note.trim() || undefined }), {
      success: action === 'dismiss' ? 'Report dismissed' : `${uname(report.target)}: ${action} applied`,
    })
    if (ok) {
      setPending(null)
      state.reload()
    }
  }

  return (
    <div>
      <AdminHead kicker="People" title="Player reports">Reports filed from profiles and challenge pages. Check the evidence, then dismiss, strike or ban.</AdminHead>
      <div className="mb-5" style={{ '--accent': '#F2A900' }}>
        <Segmented value={status} onChange={setStatus} options={[{ value: 'open', label: 'Open' }, { value: 'actioned', label: 'Actioned' }, { value: 'dismissed', label: 'Dismissed' }, { value: '', label: 'All' }]} />
      </div>
      {state.loading ? (
        <SkeletonList count={2} className="h-28" />
      ) : state.error ? (
        <ErrorState error={state.error} onRetry={state.reload} />
      ) : !items.length ? (
        <Empty big="0" title="Clean sheet" body="No reports in this queue." />
      ) : (
        <ul className="space-y-3">
          {items.map((r) => (
            <li key={r._id} className="grid gap-3 border-2 border-paper/15 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={r.reason === 'cheating' || r.reason === 'fake_result' ? 'red' : 'marigold'}>{REASON_LABEL[r.reason] ?? r.reason}</Badge>
                  <StatusBadge status={r.status === 'open' ? 'pending' : r.status === 'actioned' ? 'resolved' : 'cancelled'} />
                  <span className="font-mono text-xs text-paper/45">{timeAgo(r.createdAt)}</span>
                </div>
                <p className="mt-2">
                  <Link to={`/u/${uname(r.target)}`} className="font-semibold text-marigold hover:underline">{uname(r.target)}</Link>
                  <span className="text-paper/55">{r.target?.strikes != null ? ` (${r.target.strikes} strikes${r.target.banned ? ', banned' : ''})` : ''} reported by </span>
                  <span className="font-semibold">{uname(r.reporter)}</span>
                </p>
                {r.details && <p className="mt-1 text-paper/75">{r.details}</p>}
                <div className="mt-1 flex flex-wrap gap-4 text-sm">
                  {r.challenge && <Link to={`/challenges/${idOf(r.challenge)}`} className="text-marigold underline">Challenge</Link>}
                  {r.evidenceUrl && <a href={uploadUrl(r.evidenceUrl)} target="_blank" rel="noreferrer" className="text-marigold underline">Evidence</a>}
                </div>
                {r.adminNote && <p className="mt-1 text-sm text-paper/50">Note: {r.adminNote}</p>}
              </div>
              {r.status === 'open' && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ACTIONS).map(([k, a]) => (
                    <Button key={k} size="sm" variant={k === 'ban' ? 'danger' : k === 'strike' ? 'marigold' : 'outline'} icon={a.icon} onClick={() => { setNote(''); setPending({ report: r, action: k }) }}>
                      {a.label}
                    </Button>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <Modal open={!!pending} onClose={() => setPending(null)} kicker={pending && uname(pending.report.target)} title={pending ? ACTIONS[pending.action].label : ''}>
        {pending && (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-ink/70">{ACTIONS[pending.action].body}</p>
            <Textarea tone="paper" label="Note (goes in the audit log)" value={note} onChange={(e) => setNote(e.target.value)} />
            <Button type="submit" className={pending.action === 'ban' ? '' : '!bg-ink'}>{ACTIONS[pending.action].label}</Button>
          </form>
        )}
      </Modal>
    </div>
  )
}
