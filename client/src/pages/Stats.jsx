import { ArrowRight } from 'lucide-react'
import Button from '../components/ui/Button'
import { SectionLabel, TornEdge } from '../components/ui/Bits'
import { Scribble } from '../components/ui/Scribble'
import StatsBoard from '../components/feature/StatsBoard'

// Public pitch page: the numbers, big.
export default function Stats() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-12 sm:px-6">
        <SectionLabel num="##">Arena in numbers</SectionLabel>
        <h1 className="display mt-4 text-6xl sm:text-8xl">
          Nepal is <Scribble>playing.</Scribble>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-paper/70">
          A free, no-betting home for PUBG Mobile, Free Fire, eFootball and FC Mobile players in all seven provinces. Prizes come from sponsors, never from players.
        </p>
        <div className="mt-12">
          <StatsBoard />
        </div>
      </section>
      <TornEdge />
      <section className="paper-card">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-ink/60">Sponsor a cup</p>
            <p className="display mt-2 text-4xl sm:text-5xl">Put your brand in front of the room.</p>
            <p className="mt-2 max-w-xl text-ink/70">Banner slots on Home, game hubs and tournament pages, plus named cups with your prize pool. Talk to the Arena team.</p>
          </div>
          <Button to="/games" size="lg" icon={ArrowRight} magnetic>See the arena</Button>
        </div>
      </section>
      <TornEdge flip />
    </div>
  )
}
