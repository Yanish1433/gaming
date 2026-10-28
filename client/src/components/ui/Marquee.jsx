import { Asterisk } from 'lucide-react'

// CSS-driven ticker (pauses on hover, stops for reduced motion). Items are duplicated for a seamless loop.
export default function Marquee({ items, speed = 38, className = '', tone = 'red' }) {
  if (!items?.length) return null
  const bg = tone === 'red' ? 'bg-crimson text-paper' : tone === 'marigold' ? 'bg-marigold text-ink' : 'bg-paper text-ink'
  const row = (hidden) => (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((it, i) => (
        <span key={i} className="flex items-center whitespace-nowrap px-5">
          <span className="display text-xl sm:text-2xl">{it}</span>
          <Asterisk className="ml-10 size-5 shrink-0" aria-hidden />
        </span>
      ))}
    </div>
  )
  return (
    <div className={`marquee-wrap relative overflow-hidden border-y-2 border-ink py-2.5 ${bg} ${className}`}>
      <div className="marquee-track flex w-max" style={{ '--marquee-speed': `${speed}s` }}>
        {row(false)}
        {row(true)}
      </div>
    </div>
  )
}
