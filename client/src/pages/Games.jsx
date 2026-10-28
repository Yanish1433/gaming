import GameCard from '../components/feature/GameCard'
import { PageHead, Reveal, RevealItem } from '../components/ui/Bits'
import { useGames } from '../hooks/useGames'
import { countOf, useSummaries } from '../hooks/useSummaries'

export default function Games() {
  const { enabledGames: games } = useGames()
  const { summaries } = useSummaries()
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <PageHead kicker={{ num: '01', text: 'Play' }} title="Pick your game">
        Every game has its own board: challenges, hosted rooms, cups, its own leaderboard and its own top-up shelf.
      </PageHead>
      <Reveal className="grid gap-6 md:grid-cols-2">
        {games.map((g, i) => (
          <RevealItem key={g.slug} className={i % 2 ? 'md:mt-12' : ''}>
            <GameCard game={g} size="lg" index={i} count={summaries[g.slug] ? countOf(summaries[g.slug].openChallenges) : undefined} />
          </RevealItem>
        ))}
      </Reveal>
    </div>
  )
}
