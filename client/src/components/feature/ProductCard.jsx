import { motion, useReducedMotion } from 'motion/react'
import { getGame } from '../../lib/games'
import { npr } from '../../lib/format'
import Sticker from '../ui/Sticker'

// Price-tag look: punched hole, string, rotated a touch.
export default function ProductCard({ product: p, onBuy, index = 0 }) {
  const reduce = useReducedMotion()
  const game = getGame(p.game)
  const rot = [-1.5, 1, -0.5, 1.8][index % 4]
  return (
    <motion.button
      type="button"
      onClick={() => onBuy(p)}
      initial={false}
      style={{ rotate: reduce ? 0 : rot, '--accent': game?.accent ?? '#F2A900' }}
      whileHover={reduce ? undefined : { rotate: 0, y: -6 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 18 }}
      className="drop-hard group relative w-full text-left"
    >
      {p.popular && (
        <span className="absolute -right-2 -top-3 z-10">
          <Sticker tone="red" rotate={6}>Popular</Sticker>
        </span>
      )}
      <div className="notch paper-card relative flex flex-col p-5 pt-8">
        <span aria-hidden className="absolute left-5 top-3 size-3 rounded-full border-2 border-ink bg-ink" />
        <span className="font-mono text-[11px] uppercase tracking-widest text-ink/60">{game?.name ?? p.game}</span>
        <span className="display mt-1 text-4xl leading-none">{p.name}</span>
        <span className="mt-1 h-1.5 w-12 bg-(--accent)" />
        <div className="mt-6 flex items-end justify-between">
          <span className="display text-3xl">{npr(p.priceNpr)}</span>
          <span className="bg-ink px-3 py-1.5 text-sm font-semibold text-paper transition-colors group-hover:bg-crimson">Kinnus</span>
        </div>
      </div>
    </motion.button>
  )
}
