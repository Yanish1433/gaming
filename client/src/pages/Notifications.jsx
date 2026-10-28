import { Link } from 'react-router'
import { CheckCheck } from 'lucide-react'
import { PageHead, Reveal, RevealItem } from '../components/ui/Bits'
import Button from '../components/ui/Button'
import Empty, { ErrorState } from '../components/ui/Empty'
import { SkeletonList } from '../components/ui/Skeleton'
import { useFetch } from '../hooks/useFetch'
import { api, asList } from '../lib/api'
import { timeAgo } from '../lib/format'

export default function Notifications() {
  const state = useFetch('/notifications')
  const items = asList(state.data)
  const unread = items.filter((n) => !n.read).length

  const markAll = async () => {
    try {
      await api.post('/notifications/read-all')
      state.reload()
    } catch {
      // leave as is
    }
  }
  const markOne = (n) => {
    if (!n.read) api.post(`/notifications/${n._id}/read`).catch(() => {})
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <PageHead kicker={{ num: 'IN', text: 'Inbox' }} title="Khabar">
        {unread ? `${unread} new` : 'All caught up.'}
      </PageHead>
      {unread > 0 && (
        <Button variant="outline" size="sm" icon={CheckCheck} onClick={markAll} className="mb-6">
          Mark all read
        </Button>
      )}
      {state.loading ? (
        <SkeletonList count={3} className="h-16" />
      ) : state.error ? (
        <ErrorState error={state.error} onRetry={state.reload} />
      ) : !items.length ? (
        <Empty big="SHH" title="Quiet for now" body="Room IDs, accepted challenges and order updates land here." />
      ) : (
        <Reveal as="ul" className="divide-y divide-paper/10 border-y border-paper/10">
          {items.map((n) => {
            const body = (
              <div className="flex gap-4 py-4">
                <span className={`mt-2 size-2.5 shrink-0 ${n.read ? 'bg-paper/15' : 'bg-crimson'}`} />
                <div className="min-w-0">
                  <p className={n.read ? 'text-paper/60' : 'font-semibold'}>{n.text}</p>
                  <p className="font-mono text-xs text-paper/40">{n.type?.replaceAll('_', ' ')} · {timeAgo(n.createdAt)}</p>
                </div>
              </div>
            )
            return (
              <RevealItem as="li" key={n._id}>
                {n.link ? (
                  <Link to={n.link} onClick={() => markOne(n)} className="block hover:bg-paper/5">{body}</Link>
                ) : (
                  <button onClick={() => markOne(n)} className="block w-full text-left">{body}</button>
                )}
              </RevealItem>
            )
          })}
        </Reveal>
      )}
    </div>
  )
}
