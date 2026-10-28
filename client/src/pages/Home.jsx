import { motion, useReducedMotion } from 'motion/react'
import { ArrowRight, Camera, DoorOpen, Medal, Swords } from 'lucide-react'
import Button from '../components/ui/Button'
import Marquee from '../components/ui/Marquee'
import Sticker from '../components/ui/Sticker'
import { Scribble, Circled } from '../components/ui/Scribble'
import { CountUp, Reveal, RevealItem, SectionLabel, TornEdge } from '../components/ui/Bits'
import Empty from '../components/ui/Empty'
import { SkeletonList } from '../components/ui/Skeleton'
import GameCard from '../components/feature/GameCard'
import Stage3D from '../components/three/Stage3D'
import HomePoster from '../components/art/HomePoster'
import { AnnouncementTicker } from '../components/feature/Announcements'
import SponsorSlot from '../components/feature/SponsorSlot'
import MatchCard from '../components/feature/MatchCard'
import TournamentCard from '../components/feature/TournamentCard'
import LeaderboardTable from '../components/feature/LeaderboardTable'
import { useFetch } from '../hooks/useFetch'
import { useGames } from '../hooks/useGames'
import { countOf, useSummaries } from '../hooks/useSummaries'
import { asList } from '../lib/api'
import { getGame } from '../lib/games'
import { uname } from '../lib/format'
import { useAuth } from '../context/AuthContext'

const FALLBACK_TICKER = [
  'Khel suru garau',
  'Squad khojdai? Post a challenge',
  'Erangel custom room tonight',
  'Clash Squad 4v4 — who is up',
  'eFootball 1v1, final score or it didn’t happen',
  'No bets. No entry fees. Just rank points',
]

// uneven on purpose: FF and eFootball stack beside PUBG, FC Mobile runs full width under them
const GRID_SPANS = ['md:col-span-5', 'md:col-span-5 md:mt-6', 'md:col-span-10 md:col-start-3']

const STEPS = [
  { icon: Swords, title: 'Throw it down', body: 'Post a challenge: game, mode, map, team size, time. Or pick one up from the board.' },
  { icon: DoorOpen, title: 'Room opens', body: 'Creator drops the custom room ID + password. Only the two sides can see it.' },
  { icon: Camera, title: 'Screenshot it', body: 'Both sides upload the end card. Agree and it settles on its own.' },
  { icon: Medal, title: 'Climb the board', body: 'Win +30 rank points, show up +10. Bragging rights by province and by game.' },
]

export default function Home() {
  const reduce = useReducedMotion()
  const { user } = useAuth()
  const { games } = useGames()
  const { summaries, any } = useSummaries()
  const challenges = useFetch('/challenges', { status: 'open' })
  const matches = useFetch('/matches', { status: 'upcoming' })
  const tournaments = useFetch('/tournaments')
  const board = useFetch('/leaderboard', { period: 'week' })

  const open = asList(challenges.data)
  const ticker = open.length
    ? open.slice(0, 10).map((c) => {
        const g = getGame(c.game)
        const n = Number(c.teamSize) || 1
        return `${uname(c.creator)} wants ${n}v${n} ${c.mode ?? ''}${c.map ? ` on ${c.map}` : ''} · ${g?.short ?? c.game}`
      })
    : FALLBACK_TICKER

  const totals = {
    challenges: any ? Object.values(summaries).reduce((s, x) => s + countOf(x?.openChallenges), 0) : open.length,
    matches: any ? Object.values(summaries).reduce((s, x) => s + countOf(x?.upcomingMatches), 0) : asList(matches.data).length,
    tournaments: any ? Object.values(summaries).reduce((s, x) => s + countOf(x?.tournaments), 0) : asList(tournaments.data).length,
  }

  const [pubg, ...rest] = games

  return (
    <>
      <AnnouncementTicker />
      {/* HERO — deliberately lopsided */}
      <section className="relative overflow-hidden">
        <span aria-hidden className="halftone pointer-events-none absolute -left-10 top-10 h-72 w-72 text-crimson/30 [mask-image:radial-gradient(circle,#000_30%,transparent_70%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-14 pt-10 sm:px-6 md:grid-cols-12 md:pt-16">
          <div className="md:col-span-8">
            <SectionLabel num="00">Aaja ko match · Nepal</SectionLabel>
            <motion.h1
              initial={reduce ? false : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="display mt-5 text-[3.4rem] sm:text-[5.5rem] lg:text-[7.2rem]"
            >
              Find a squad.
              <br />
              <span className="text-paper/45">Drop in.</span>
              <br />
              <Scribble>Settle it</Scribble> in the <span className="text-crimson">room.</span>
            </motion.h1>
            <p className="mt-6 max-w-lg text-lg text-paper/75">
              Community challenges, custom rooms and sponsored tournaments for PUBG Mobile, Free Fire, eFootball and FC Mobile. Free to play, always.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button to="/games" size="lg" icon={ArrowRight} magnetic>
                Khel suru garau
              </Button>
              <Button to={user ? '/challenges/new' : '/register'} variant="outline" size="lg">
                {user ? 'Post a challenge' : 'Make an account'}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-8 md:col-span-4 md:-ml-6">
          {/* 3D airdrop: tilts toward the cursor / phone tilt; poster print when 3D is off */}
          <Stage3D
            scene="home"
            label="Airdrop crate on a parachute with the four game tokens around it"
            className="-mx-4 h-72 sm:mx-0 sm:h-80 md:h-[21rem]"
            fallback={<HomePoster className="h-full w-full" />}
          />
          {/* tilted flyer with live numbers */}
          <motion.aside
            initial={reduce ? false : { opacity: 0, rotate: 8, y: 40 }}
            animate={{ opacity: 1, rotate: 2.5, y: 0 }}
            transition={{ type: 'spring', stiffness: 90, damping: 14, delay: 0.25 }}
            className="relative md:mb-4"
          >
            <span aria-hidden className="tape absolute -top-3 left-8 z-10 h-6 w-24 -rotate-6 opacity-90" />
            <div className="paper-card border-2 border-ink p-6 shadow-[8px_8px_0_#DC143C]">
              <p className="font-mono text-xs uppercase tracking-widest text-ink/60">Right now on the board</p>
              <dl className="mt-4 divide-y-2 divide-ink/10">
                {[
                  ['Open challenges', totals.challenges],
                  ['Rooms scheduled', totals.matches],
                  ['Sponsored cups', totals.tournaments],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between py-3">
                    <dt className="font-semibold">{k}</dt>
                    <dd className="display text-5xl">
                      <CountUp value={v} />
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-2 text-sm text-ink/60">Counts refresh when you reload. Kina dherai socheko, just play.</p>
            </div>
            <div className="absolute -bottom-5 -left-4 sm:-left-8">
              <Sticker tone="marigold" rotate={-7}>No entry fee</Sticker>
            </div>
          </motion.aside>
          </div>
        </div>
        <Marquee items={ticker} />
      </section>

      {/* 01 / PLAY */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionLabel num="01">Play</SectionLabel>
            <h2 className="display mt-3 text-5xl sm:text-6xl">
              Char ota game. <span className="text-paper/40">Each with its own board.</span>
            </h2>
          </div>
          <Button to="/games" variant="ghost" icon={ArrowRight}>All games</Button>
        </div>
        <Reveal className="mt-10 grid gap-6 md:grid-cols-12">
          <RevealItem className="md:col-span-7 md:row-span-2">
            <GameCard game={pubg} size="lg" count={summaries.pubg ? countOf(summaries.pubg.openChallenges) : undefined} />
          </RevealItem>
          {rest.map((g, i) => (
            <RevealItem key={g.slug} className={GRID_SPANS[i]}>
              <GameCard game={g} index={i + 1} count={summaries[g.slug] ? countOf(summaries[g.slug].openChallenges) : undefined} />
            </RevealItem>
          ))}
        </Reveal>
      </section>

      {/* 02 / HOW */}
      <section className="mt-24">
        <TornEdge />
        <div className="paper-card relative overflow-hidden py-16">
          <span aria-hidden className="display pointer-events-none absolute -right-6 top-4 select-none text-[10rem] leading-none text-ink/[0.05] sm:text-[16rem]">
            Rules
          </span>
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
            <p className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-ink/60">
              <span className="text-crimson">02</span>
              <span className="h-px w-8 bg-ink/30" /> How it works
            </p>
            <h2 className="display mt-3 max-w-3xl text-5xl sm:text-6xl">
              Four steps. <Circled color="#DC143C">Zero</Circled> money on the table.
            </h2>
            <Reveal className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s, i) => (
                <RevealItem key={s.title} className={i % 2 ? 'lg:mt-10' : ''}>
                  <span className="display text-7xl text-crimson">{String(i + 1).padStart(2, '0')}</span>
                  <div className="mt-2 flex items-center gap-2">
                    <s.icon className="size-5" aria-hidden />
                    <h3 className="display text-2xl">{s.title}</h3>
                  </div>
                  <p className="mt-2 text-ink/75">{s.body}</p>
                </RevealItem>
              ))}
            </Reveal>
          </div>
        </div>
        <TornEdge flip />
      </section>

      {/* 03 / TONIGHT */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
        <SectionLabel num="03">Aaja ko match</SectionLabel>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h2 className="display text-5xl sm:text-6xl">Rooms going up</h2>
          <p className="max-w-sm text-paper/60">Hosted custom rooms. Register, and the ID shows up 15 minutes before drop.</p>
        </div>
        <div className="mt-8">
          {matches.loading ? (
            <SkeletonList count={3} className="h-52" />
          ) : asList(matches.data).length ? (
            <Reveal className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {asList(matches.data).slice(0, 6).map((m) => (
                <RevealItem key={m._id}>
                  <MatchCard match={m} />
                </RevealItem>
              ))}
            </Reveal>
          ) : (
            <Empty
              big="ROOM"
              title="No rooms posted yet"
              body={matches.error?.offline ? 'Server is offline right now, so the schedule is hidden. Check back in a bit.' : 'Organisers usually post the evening rooms by 5pm. Meanwhile, start your own challenge.'}
              action={<Button to="/games" variant="outline">Browse challenges</Button>}
            />
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
        <SponsorSlot slot="home_banner" />
      </div>

      {/* 04 / CUPS + BOARD, uneven split */}
      <section className="mx-auto grid max-w-7xl gap-12 px-4 pt-24 sm:px-6 lg:grid-cols-[1.35fr_1fr]">
        <div>
          <SectionLabel num="04">Sponsored cups</SectionLabel>
          <h2 className="display mt-3 text-5xl">Prize pools paid by sponsors, not players</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {tournaments.loading ? (
              <SkeletonList count={2} className="h-64" />
            ) : asList(tournaments.data).length ? (
              asList(tournaments.data)
                .slice(0, 2)
                .map((t) => <TournamentCard key={t._id} tournament={t} />)
            ) : (
              <Empty className="sm:col-span-2" big="CUP" title="No cups this week" body="When a sponsor backs a cup it shows up here. Entry is always free." />
            )}
          </div>
        </div>
        <div className="lg:pt-16">
          <SectionLabel num="05">This week</SectionLabel>
          <h2 className="display mt-3 text-4xl">Top of the board</h2>
          <div className="mt-6">
            {board.loading ? (
              <SkeletonList count={1} className="h-72" />
            ) : asList(board.data).length ? (
              <LeaderboardTable rows={asList(board.data).slice(0, 6)} compact />
            ) : (
              <Empty big="01" title="Board is empty" body="First settled challenge of the week puts you at the top. Easy, haina?" />
            )}
            <Button to="/leaderboard" variant="ghost" className="mt-3" icon={ArrowRight}>
              Full leaderboard
            </Button>
          </div>
        </div>
      </section>

      {/* store strip */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <div className="drop-hard-red">
          <div className="notch flex flex-col items-start justify-between gap-6 bg-marigold p-8 text-ink md:flex-row md:items-center">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest">Top-up store</p>
              <p className="display mt-2 text-4xl sm:text-5xl">UC, diamonds, coins. Pay with eSewa or Khalti.</p>
              <p className="mt-2 max-w-xl text-ink/75">Verified by a real person, delivered to your UID. Kept fully separate from challenges.</p>
            </div>
            <Button to="/store" variant="paper" size="lg" icon={ArrowRight}>
              Open store
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
