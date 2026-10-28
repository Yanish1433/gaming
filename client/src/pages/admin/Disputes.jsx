import { useState } from 'react'
import { Link } from 'react-router'
import Button from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { Segmented, Textarea } from '../../components/ui/Input'
import Empty, { ErrorState, FormError } from '../../components/ui/Empty'
import { SkeletonList } from '../../components/ui/Skeleton'
import { useAction, useFetch } from '../../hooks/useFetch'
import { api, asList, uploadUrl } from '../../lib/api'
import { idOf, timeAgo, uname } from '../../lib/format'

export default function Disputes() {
  const state = useFetch('/admin/disputes')
  const [open, setOpen] = useState(null)
  const [form, setForm] = useState({ winnerSide: '', resolution: '' })
  const act = useAction()
  const items = asList(state.data)

  const resolve = async (e) => {
    e.preventDefault()
    if (!form.winnerSide) return act.setError(new Error('Pick the winning side.'))
    if (!form.resolution.trim()) return act.setError(new Error('Write a short reason, both sides see it.'))
    try {
      await act.run(() => api.post(`/admin/disputes/${open._id}/resolve`, { winnerSide: form.winnerSide, resolution: form.resolution.trim() }))
      setOpen(null)
      state.reload()
    } catch {
      // shown in form
    }
  }

  return (
    <div>
      <h1 className="display text-5xl">Disputes</h1>
      <p className="mt-2 text-paper/60">Check both screenshots, pick a winner, explain in one line.</p>
      <div className="mt-6">
        {state.loading ? (
          <SkeletonList count={2} className="h-28" />
        ) : state.error ? (
          <ErrorState error={state.error} onRetry={state.reload} />
        ) : !items.length ? (
          <Empty big="0" title="No disputes" body="Sabai khushi. Nobody is arguing right now." />
        ) : (
          <ul className="space-y-3">
            {items.map((d) => {
              const ch = typeof d.challenge === 'object' ? d.challenge : null
              return (
                <li key={d._id} className="grid gap-3 border-2 border-paper/15 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={d.status} />
                      <span className="font-mono text-xs text-paper/50">{timeAgo(d.createdAt)} · by {uname(d.raisedBy)}</span>
                    </div>
                    <p className="mt-2">{d.reason}</p>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm">
                      <Link to={`/challenges/${idOf(d.challenge)}`} className="text-marigold underline">
                        Open challenge{ch ? ` (${ch.game} ${ch.mode ?? ''})` : ''}
                      </Link>
                      {d.evidenceUrl && (
                        <a href={uploadUrl(d.evidenceUrl)} target="_blank" rel="noreferrer" className="text-marigold underline">Evidence</a>
                      )}
                    </div>
                    {d.resolution && <p className="mt-2 text-sm text-paper/60">Resolved: {d.resolution}</p>}
                  </div>
                  {d.status !== 'resolved' && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setForm({ winnerSide: '', resolution: '' })
                        act.setError(null)
                        setOpen(d)
                      }}
                    >
                      Resolve
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
      <Modal open={!!open} onClose={() => setOpen(null)} kicker="Dispute" title="Make the call">
        <form onSubmit={resolve} className="space-y-4">
          <div style={{ '--accent': '#F2A900' }}>
            <Segmented tone="paper" label="Winner" value={form.winnerSide} onChange={(v) => setForm({ ...form, winnerSide: v })} options={[{ value: 'A', label: 'Side A' }, { value: 'B', label: 'Side B' }]} />
          </div>
          <Textarea tone="paper" label="Resolution" value={form.resolution} onChange={(e) => setForm({ ...form, resolution: e.target.value })} placeholder="e.g. Side B screenshot shows a different room ID." />
          <FormError error={act.error} />
          <Button type="submit" busy={act.busy}>Settle it</Button>
        </form>
      </Modal>
    </div>
  )
}
