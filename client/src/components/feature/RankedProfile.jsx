import { useState } from 'react'
import { Link } from 'react-router'
import { motion, useReducedMotion } from 'motion/react'
import { Flame } from 'lucide-react'
import { CountUp, Reveal, RevealItem, SectionLabel } from '../ui/Bits'
import Empty, { ErrorState } from '../ui/Empty'
import Skeleton from '../ui/Skeleton'
import TierBadge from './TierBadge'
import RatingDelta from './RatingDelta'
import RatingChart from './RatingChart'
import { useFetch } from '../../hooks/useFetch'
import { asList } from '../../lib/api'
import { GAMES, getGame } from '../../lib/games'
import { nextTier, START_RATING } from '../../lib/ranked'
import { fmtDate } from '../../lib/format'

function streakText(s) {
  const n = Number(s) || 0
  if (n > 0) return `W${n}`
  if (n < 0) return `L${Math.abs(n)}`
  return '—'
}

function GameStatCard({ game, rating, tier, stats, active, onPick }) {
  const reduce = useReducedMotion()
  const played = stats?.played ?? 0
  const next = nextTier(rating)
  return (
    <motion.button
      type="button"
      onClick={onPick}
      aria-pressed={active}
      whileHover={reduce ? undefined : { y: -3 }}
      className={`relative w-full border-2 p-4 text-left transition-colors ${active ? 'border-ink bg-(--accent) text-ink shadow-hard' : 'border-paper/15 hover:border-paper/40'}`}
      style={{ '--accent': game.accent }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`font-mono text-[11px] uppercase tracking-widest ${active ? 'text-ink/70' : 'text-paper/50'}`}>{game.name}</span>
        {played > 0 && <TierBadge tier={tier} rating={rating} size="sm" />}
      </div>
      <p className="display mt-2 text-5xl">{played > 0 ? <CountUp value={rating ?? START_RATING} /> : '—'}</p>
      {played > 0 ? (
        <dl className={`mt-2 grid grid-cols-3 gap-1 font-mono text-xs ${active ? 'text-ink/80' : 'text-paper/65'}`}>
          <div><dt className="text-[10px] uppercase opacity-60">W–L</dt><dd className="font-semibold">{stats.won ?? 0}–{stats.lost ?? 0}</dd></div>
          <div><dt className="text-[10px] uppercase opacity-60">{game.statLabel}</dt><dd className="font-semibold">{stats.score ?? 0}</dd></div>
          <div>
            <dt className="text-[10px] uppercase opacity-60">Streak</dt>
            <dd className="flex items-center gap-1 font-semibold">
              {Number(stats.streak) >= 3 && <Flame className="size-3" aria-hidden />}
              {streakText(stats.streak)}
            </dd>
          </div>
        </dl>
      ) : (
        <p className={`mt-2 text-sm ${active ? 'text-ink/70' : 'text-paper/45'}`}>Unranked. First game sets it in motion.</p>
      )}
      {played > 0 && next && (
        <p className={`mt-2 font-mono text-[10px] uppercase ${active ? 'text-ink/60' : 'text-paper/40'}`}>
          {next.min - (rating ?? START_RATING)} to {next.name}
        </p>
      )}
    </motion.button>
  )
}

export default function RankedProfile({ profile: p }) {
  const ratingByGame = p.ratingByGame ?? {}
  const rankedByGame = p.rankedByGame ?? {}
  const tierByGame = p.tierByGame ?? {}
  const firstPlayed = GAMES.find((g) => (rankedByGame[g.slug]?.played ?? 0) > 0)?.slug ?? 'pubg'
  const [slug, setSlug] = useState(firstPlayed)
  const game = getGame(slug)
  const user = encodeURIComponent(p.username)
  const history = useFetch(`/users/${user}/rating-history`, { game: slug })
  const records = useFetch(`/users/${user}/records`, { game: slug })
  const recs = asList(records.data)
  const s = rankedByGame[slug]

  return (
    <section className="mt-12" style={{ '--accent': game.accent }}>
      <SectionLabel num="R">Ranked record</SectionLabel>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {GAMES.map((g) => (
          <GameStatCard
            key={g.slug}
            game={g}
            rating={ratingByGame[g.slug]}
            tier={tierByGame[g.slug]}
            stats={rankedByGame[g.slug]}
            active={g.slug === slug}
            onPick={() => setSlug(g.slug)}
          />
        ))}
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="display text-4xl">{game.short} rating</h2>
            {s?.bestStreak > 0 && <span className="font-mono text-xs text-paper/50">best streak W{s.bestStreak}</span>}
          </div>
          <div className="mt-4 border-2 border-paper/15 bg-ink-2 p-4">
            {history.loading ? (
              <Skeleton className="h-52" />
            ) : history.error ? (
              <ErrorState error={history.error} onRetry={history.reload} />
            ) : (
              <RatingChart key={slug} points={asList(history.data)} accent={game.accent} />
            )}
          </div>
        </div>

        <div>
          <h2 className="display text-4xl">Match records</h2>
          <div className="mt-4">
            {records.loading ? (
              <Skeleton className="h-52" />
            ) : records.error ? (
              <ErrorState error={records.error} onRetry={records.reload} />
            ) : !recs.length ? (
              <Empty big="0" title="No ranked games" body={`Nothing settled in ${game.name} yet.`} />
            ) : (
              <Reveal as="ol" className="divide-y divide-paper/10 border-y border-paper/10" stagger={0.04}>
                {recs.map((r, i) => (
                  <RevealItem as="li" key={r.challengeId ?? i}>
                    <Link to={`/challenges/${r.challengeId}`} className="grid grid-cols-[2.25rem_1fr_auto] items-center gap-3 py-3 hover:bg-paper/5">
                      <span className={`display grid size-9 place-items-center text-xl ${r.won ? 'bg-(--accent) text-ink' : 'bg-paper/10 text-paper/70'}`}>{r.won ? 'W' : 'L'}</span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">
                          vs {(r.opponents ?? []).join(', ') || 'unknown'}
                        </span>
                        <span className="block truncate font-mono text-[11px] text-paper/50">
                          {r.teamSize}v{r.teamSize} {r.mode} · {r.score ?? 0} {game.statLabel.toLowerCase()} · {fmtDate(r.at)}
                          {r.teammates?.length ? ` · with ${r.teammates.join(', ')}` : ''}
                        </span>
                      </span>
                      <span className="text-right">
                        <RatingDelta value={r.ratingDelta} className="block text-lg" />
                        <span className="block font-mono text-[10px] text-paper/40">{r.ratingAfter ?? ''}</span>
                      </span>
                    </Link>
                  </RevealItem>
                ))}
              </Reveal>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
