import { Link } from 'react-router'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import GameIcon from '../art/GameIcon'

// Big poster tile for a game. `size` lets the home grid mix tall and wide pieces.
export default function GameCard({ game, count, size = 'md', index = 0 }) {
  const reduce = useReducedMotion()
  const tall = size === 'lg'
  return (
    <motion.div
      whileHover={reduce ? undefined : { rotate: index % 2 ? 0.8 : -0.8, x: -4, y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="drop-hard h-full"
      style={{ '--accent': game.accent }}
    >
      <Link
        to={`/games/${game.slug}`}
        className={`notch group relative flex h-full flex-col justify-between overflow-hidden bg-(--accent) p-5 text-ink sm:p-6 ${tall ? 'min-h-80 sm:min-h-[26rem]' : 'min-h-56'}`}
      >
        <span aria-hidden className="halftone-fade pointer-events-none absolute inset-0 text-ink/25" />
        <span aria-hidden className="display pointer-events-none absolute -bottom-6 -right-2 select-none text-[8rem] leading-none text-ink/10 sm:text-[11rem]">
          {game.short}
        </span>
        <div className="relative flex items-start justify-between gap-3">
          <span className="flex items-center gap-3">
            <GameIcon game={game} size={tall ? 64 : 48} sticker rotate={index % 2 ? 5 : -6} />
            <span className="font-mono text-xs font-semibold uppercase tracking-widest">
              {game.teamSizes.length === 1 ? '1v1 only' : `Solo → Squad`}
            </span>
          </span>
          <ArrowUpRight className="size-7 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" aria-hidden />
        </div>
        <div className="relative">
          <h3 className={`display ${tall ? 'text-6xl sm:text-8xl' : 'text-5xl sm:text-6xl'}`}>{game.name}</h3>
          <p className="mt-2 max-w-xs font-medium text-ink/80">{game.tagline}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {count != null && (
              <span className="bg-ink px-2 py-1 font-mono text-xs text-paper">
                {count} open challenge{count === 1 ? '' : 's'}
              </span>
            )}
            {game.maps.slice(0, tall ? 5 : 3).map((m) => (
              <span key={m} className="border border-ink/50 px-2 py-0.5 font-mono text-[11px] uppercase">
                {m}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
