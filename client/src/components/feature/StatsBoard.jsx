import { CountUp, Reveal, RevealItem } from '../ui/Bits'
import { ErrorState } from '../ui/Empty'
import Skeleton from '../ui/Skeleton'
import GameIcon from '../art/GameIcon'
import { useFetch } from '../../hooks/useFetch'
import { GAMES, getGame } from '../../lib/games'

// GET /stats/public as huge count-up numbers. Used by /stats and the admin preview.
export default function StatsBoard({ compact = false }) {
  const { data, error, loading, reload } = useFetch('/stats/public')
  if (loading) return <Skeleton className="h-72" />
  if (error) return <ErrorState error={error} onRetry={reload} />
  const s = data ?? {}
  const topKey = s.topGame?.slug ?? s.topGame
  const top = getGame(topKey) ?? GAMES.find((g) => g.name === (s.topGame?.name ?? s.topGame))
  const tiles = [
    { label: 'Players', value: s.players, tone: 'paper', rot: -1.2 },
    { label: 'Matches played', value: s.matchesPlayed, tone: 'red', rot: 0.8 },
    { label: 'Challenges this week', value: s.challengesThisWeek, tone: 'ink', rot: -0.4 },
    { label: 'Provinces', value: Array.isArray(s.provinces) ? s.provinces.length : s.provinces, suffix: '/ 7', tone: 'blue', rot: 1.4 },
  ]
  const big = compact ? 'text-6xl' : 'text-7xl sm:text-8xl lg:text-9xl'
  return (
    <Reveal className="grid gap-5 sm:grid-cols-2" stagger={0.1}>
      {tiles.map((t) => (
        <RevealItem key={t.label}>
          <div
            className={`border-2 border-ink p-6 shadow-hard ${t.tone === 'paper' ? 'paper-card' : t.tone === 'red' ? 'bg-crimson' : t.tone === 'blue' ? 'bg-flag' : 'bg-ink-2 border-paper/20'}`}
            style={{ transform: `rotate(${t.rot}deg)` }}
          >
            <p className={`font-mono text-xs uppercase tracking-[0.25em] ${t.tone === 'paper' ? 'text-ink/60' : 'text-paper/70'}`}>{t.label}</p>
            <p className={`display mt-2 leading-none ${big}`}>
              <CountUp value={Number(t.value) || 0} duration={2} />
              {t.suffix && <span className="ml-2 text-[0.4em] opacity-60">{t.suffix}</span>}
            </p>
          </div>
        </RevealItem>
      ))}
      {top && (
        <RevealItem className="sm:col-span-2">
          <div className="flex flex-wrap items-center gap-5 border-2 border-ink p-6 text-ink shadow-hard" style={{ background: top.accent }}>
            <GameIcon game={top} size={compact ? 64 : 92} sticker rotate={-6} />
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.25em]">Most played right now</p>
              <p className={`display leading-none ${compact ? 'text-5xl' : 'text-6xl sm:text-8xl'}`}>{top.name}</p>
            </div>
          </div>
        </RevealItem>
      )}
    </Reveal>
  )
}
