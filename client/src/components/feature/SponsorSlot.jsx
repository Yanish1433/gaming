import { ArrowUpRight } from 'lucide-react'
import { useFetch } from '../../hooks/useFetch'
import { api, asList, uploadUrl } from '../../lib/api'

/**
 * Sponsor banner for a slot (home_banner | hub_banner | tournament). Renders nothing when no sponsor is active,
 * so empty slots never look broken. The GET counts an impression server-side; a click is posted before leaving.
 */
export default function SponsorSlot({ slot, game, variant = 'wide', className = '' }) {
  const { data } = useFetch('/sponsors/active', { slot, game: game || undefined })
  const list = asList(data)
  if (!list.length) return null
  // rotate between active sponsors by the minute so each gets airtime without jumping mid-view
  const s = list[Math.floor(Date.now() / 60000) % list.length]

  const open = (e) => {
    api.post(`/sponsors/${s._id}/click`).catch(() => {})
    if (!s.website) e.preventDefault()
  }

  const logo = s.logoUrl ? (
    <img src={uploadUrl(s.logoUrl)} alt={`${s.name} logo`} className="h-full w-full object-contain" loading="lazy" />
  ) : (
    <span className="display text-3xl text-ink">{s.name?.slice(0, 2)}</span>
  )

  if (variant === 'compact') {
    return (
      <a
        href={s.website || '#'}
        target="_blank"
        rel="noreferrer noopener sponsored"
        onClick={open}
        className={`group flex items-center gap-3 border-2 border-dashed border-paper/25 px-3 py-2 hover:border-marigold ${className}`}
      >
        <span className="grid size-10 shrink-0 place-items-center overflow-hidden bg-paper p-1">{logo}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-mono text-[10px] uppercase tracking-widest text-paper/45">Supported by</span>
          <span className="block truncate font-semibold group-hover:text-marigold">{s.name}</span>
        </span>
        <ArrowUpRight className="size-4 text-paper/50" />
      </a>
    )
  }

  return (
    <a
      href={s.website || '#'}
      target="_blank"
      rel="noreferrer noopener sponsored"
      onClick={open}
      className={`group block drop-hard ${className}`}
      aria-label={`Sponsor: ${s.name}`}
    >
      <div className="notch paper-card flex items-center gap-5 p-4 sm:p-5">
        <span className="grid h-16 w-24 shrink-0 place-items-center overflow-hidden sm:h-20 sm:w-32">{logo}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-mono text-[10px] uppercase tracking-[0.25em] text-ink/55">Supported by</span>
          <span className="display block truncate text-3xl sm:text-4xl">{s.name}</span>
          <span className="block text-sm text-ink/60">Sponsors fund prizes on Arena. Players never pay to play.</span>
        </span>
        <span className="hidden items-center gap-1 border-2 border-ink px-3 py-2 text-sm font-semibold transition-colors group-hover:bg-ink group-hover:text-paper sm:inline-flex">
          Visit <ArrowUpRight className="size-4" />
        </span>
      </div>
    </a>
  )
}
