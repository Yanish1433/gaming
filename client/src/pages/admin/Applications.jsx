import { useState } from 'react'
import { Link } from 'react-router'
import { Check, ExternalLink, X } from 'lucide-react'
import Button from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { Segmented, Textarea } from '../../components/ui/Input'
import Empty, { ErrorState } from '../../components/ui/Empty'
import { SkeletonList } from '../../components/ui/Skeleton'
import { useFetch } from '../../hooks/useFetch'
import { api, asList } from '../../lib/api'
import { timeAgo, uname } from '../../lib/format'
import { AdminHead, useAdminAct } from './kit'

const TYPE_LABEL = { cafe: 'Gaming café', clan: 'Clan / team', creator: 'Creator', college: 'College club', other: 'Other' }

export default function Applications() {
  const [status, setStatus] = useState('pending')
  const state = useFetch('/admin/organiser-applications', { status: status || undefined })
  const [review, setReview] = useState(null) // { app, approve }
  const [note, setNote] = useState('')
  const act = useAdminAct()
  const items = asList(state.data)

  const submit = async (e) => {
    e.preventDefault()
    const { app, approve } = review
    const ok = await act(() => api.post(`/admin/organiser-applications/${app._id}/review`, { approve, note: note.trim() || undefined }), {
      success: approve ? `${uname(app.user)} is now an organiser` : 'Application rejected',
    })
    if (ok) {
      setReview(null)
      state.reload()
    }
  }

  return (
    <div>
      <AdminHead kicker="People" title="Organiser applications">Cafés, clans, creators and college clubs who want to host rooms. Approving gives them the Organiser desk.</AdminHead>
      <div className="mb-5" style={{ '--accent': '#F2A900' }}>
        <Segmented value={status} onChange={setStatus} options={[{ value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }, { value: '', label: 'All' }]} />
      </div>
      {state.loading ? (
        <SkeletonList count={2} className="h-32" />
      ) : state.error ? (
        <ErrorState error={state.error} onRetry={state.reload} />
      ) : !items.length ? (
        <Empty big="0" title={status === 'pending' ? 'Nobody waiting' : 'Nothing here'} body="New applications come from the form on player Settings pages." />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {items.map((a) => (
            <li key={a._id} className="relative border-2 border-paper/15 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-marigold">{TYPE_LABEL[a.type] ?? a.type}</p>
                  <p className="display text-3xl">{a.orgName}</p>
                  <p className="text-sm text-paper/60">
                    by <Link to={`/u/${uname(a.user)}`} className="font-semibold text-paper hover:text-marigold">{uname(a.user)}</Link> · {timeAgo(a.createdAt)}
                  </p>
                </div>
                <StatusBadge status={a.status === 'approved' ? 'resolved' : a.status === 'rejected' ? 'failed' : 'pending'} />
              </div>
              <dl className="mt-3 grid gap-1 text-sm">
                <div><dt className="inline font-mono text-[10px] uppercase text-paper/40">Contact </dt><dd className="inline select-all">{a.contact}</dd></div>
                {a.socialLink && (
                  <div>
                    <dt className="inline font-mono text-[10px] uppercase text-paper/40">Link </dt>
                    <dd className="inline"><a href={a.socialLink} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-marigold underline">{a.socialLink.replace(/^https?:\/\//, '').slice(0, 40)} <ExternalLink className="size-3" /></a></dd>
                  </div>
                )}
              </dl>
              {a.note && <p className="mt-2 border-l-4 border-paper/20 pl-3 text-paper/75">{a.note}</p>}
              {a.reviewNote && <p className="mt-2 text-sm text-paper/50">Review: {a.reviewNote}</p>}
              {a.status === 'pending' && (
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="marigold" icon={Check} onClick={() => { setNote(''); setReview({ app: a, approve: true }) }}>Approve</Button>
                  <Button size="sm" variant="outline" icon={X} onClick={() => { setNote(''); setReview({ app: a, approve: false }) }}>Reject</Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <Modal open={!!review} onClose={() => setReview(null)} kicker={review?.app?.orgName} title={review?.approve ? 'Approve organiser' : 'Reject application'}>
        {review && (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-ink/70">{review.approve ? `${uname(review.app.user)} becomes an organiser and gets a notification.` : 'They get a notification with your note.'}</p>
            <Textarea tone="paper" label="Note to applicant (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
            <Button type="submit" className={review.approve ? '' : '!bg-ink'}>{review.approve ? 'Approve' : 'Reject'}</Button>
          </form>
        )}
      </Modal>
    </div>
  )
}
