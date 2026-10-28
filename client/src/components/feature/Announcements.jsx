import { useState } from 'react'
import { Link } from 'react-router'
import { Megaphone, Pin, Wrench, X } from 'lucide-react'
import { useFetch } from '../../hooks/useFetch'
import { useSite } from '../../context/SiteContext'
import { asList } from '../../lib/api'

const isExternal = (href) => /^https?:\/\//.test(href ?? '')

function ItemLink({ a, children }) {
  if (!a.link) return children
  if (isExternal(a.link))
    return (
      <a href={a.link} target="_blank" rel="noreferrer noopener" className="hover:underline">
        {children}
      </a>
    )
  return (
    <Link to={a.link} className="hover:underline">
      {children}
    </Link>
  )
}

/**
 * Announcement ticker (GET /announcements?game=). Pinned items come first from the API.
 * One announcement sits still; several scroll. Hidden when the ticker is switched off or nothing is live.
 */
export function AnnouncementTicker({ game }) {
  const { settings } = useSite()
  const { data } = useFetch(settings.tickerEnabled ? '/announcements' : null, game ? { game } : undefined)
  const items = asList(data)
  if (!settings.tickerEnabled || !items.length) return null

  const row = (hidden) => (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((a) => (
        <span key={`${a._id}${hidden ? '-dup' : ''}`} className="flex items-center gap-2 whitespace-nowrap px-6">
          {a.pinned && <Pin className="size-3.5" aria-label="pinned" />}
          <ItemLink a={a}>
            <span className="font-bold">{a.title}</span>
            {a.body && <span className="ml-2 opacity-75">{a.body}</span>}
          </ItemLink>
          <span className="ml-6 size-1.5 rotate-45 bg-ink" />
        </span>
      ))}
    </div>
  )

  return (
    <div className="relative flex items-stretch border-y-2 border-ink bg-marigold text-ink" role="region" aria-label="Announcements">
      <span className="display z-10 flex shrink-0 items-center gap-2 bg-ink px-3 text-lg text-marigold">
        <Megaphone className="size-4" /> Khabar
      </span>
      <div className="marquee-wrap min-w-0 flex-1 overflow-hidden py-2 text-sm">
        {items.length === 1 ? (
          <div className="truncate px-4">{row(false)}</div>
        ) : (
          <div className="marquee-track flex w-max" style={{ '--marquee-speed': `${18 + items.length * 8}s` }}>
            {row(false)}
            {row(true)}
          </div>
        )}
      </div>
    </div>
  )
}

export function MaintenanceBanner() {
  const { settings } = useSite()
  const [hidden, setHidden] = useState(false)
  if (!settings.maintenanceMode || hidden) return null
  return (
    <div className="tape relative border-b-2 border-ink" role="status">
      <div className="mx-auto flex max-w-7xl items-center gap-3 bg-ink px-4 py-2.5 sm:px-6">
        <Wrench className="size-4 shrink-0 text-marigold" />
        <p className="flex-1 text-sm">
          <span className="display mr-2 text-lg text-marigold">Maintenance</span>
          {settings.maintenanceMessage || 'We are tuning things up. You can browse, but posting and orders are paused for a bit.'}
        </p>
        <button onClick={() => setHidden(true)} aria-label="Hide maintenance notice" className="p-1 text-paper/60 hover:text-paper">
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
