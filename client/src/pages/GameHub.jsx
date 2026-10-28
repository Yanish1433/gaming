import { useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { Plus } from 'lucide-react'
import Tabs from '../components/ui/Tabs'
import Button from '../components/ui/Button'
import Sticker from '../components/ui/Sticker'
import Empty, { ErrorState } from '../components/ui/Empty'
import { SkeletonList } from '../components/ui/Skeleton'
import { Segmented, Select } from '../components/ui/Input'
import { CountUp, Reveal, RevealItem, TornEdge } from '../components/ui/Bits'
import ChallengeCard from '../components/feature/ChallengeCard'
import MatchCard from '../components/feature/MatchCard'
import TournamentCard from '../components/feature/TournamentCard'
import LeaderboardTable from '../components/feature/LeaderboardTable'
import ProductCard from '../components/feature/ProductCard'
import CheckoutModal from '../components/feature/CheckoutModal'
import RankedLadder from '../components/feature/RankedLadder'
import TierBadge from '../components/feature/TierBadge'
import { TIERS } from '../lib/ranked'
import Stage3D from '../components/three/Stage3D'
import GamePoster from '../components/art/GamePoster'
import GameIcon from '../components/art/GameIcon'
import MapArt from '../components/art/MapArt'
import { AnnouncementTicker } from '../components/feature/Announcements'
import SponsorSlot from '../components/feature/SponsorSlot'
import { useSite } from '../context/SiteContext'

const OBJECT_LABEL = {
  pubg: 'Level 3 helmet and a pan',
  freefire: 'Flaming diamond',
  efootball: 'Football spinning over a patch of pitch',
  fcmobile: 'Trophy and match ball',
}

// Poster print with the game's 3D object standing in front of it, plus the round game badge.
function HubArt({ game }) {
  return (
    <div className="relative">
      <div className="drop-hard">
        <div className="notch relative h-64 overflow-hidden sm:h-80 lg:h-[22rem]">
          <GamePoster game={game} className="absolute inset-0" />
          <div className="absolute inset-0">
            <Stage3D scene={game.slug} className="h-full w-full" label={OBJECT_LABEL[game.slug]} />
          </div>
        </div>
      </div>
      <span className="absolute -left-3 -top-6 z-10 sm:-left-6">
        <GameIcon game={game} size={88} sticker rotate={-8} />
      </span>
    </div>
  )
}
import NotFound from './NotFound'
import { useFetch } from '../hooks/useFetch'
import { useGames } from '../hooks/useGames'
import { countOf } from '../hooks/useSummaries'
import { asList } from '../lib/api'
import { isSolo, PROVINCES } from '../lib/games'

const TABS = [
  { key: 'challenges', label: 'Challenges', num: '01' },
  { key: 'ranked', label: 'Ranked', num: '02' },
  { key: 'matches', label: 'Matches', num: '03' },
  { key: 'tournaments', label: 'Tournaments', num: '04' },
  { key: 'leaderboard', label: 'Leaderboard', num: '05' },
  { key: 'topup', label: 'Top-up', num: '06' },
]

function RankedTab({ game }) {
  const solo = isSolo(game)
  const [teamSize, setTeamSize] = useState(1)
  const [province, setProvince] = useState('')
  const [page, setPage] = useState(1)
  const state = useFetch('/ranked/ladder', { game: game.slug, teamSize: solo ? 1 : teamSize, province: province || undefined, page })
  const rows = asList(state.data)
  const total = Number(state.data?.total) || rows.length
  // page size isn't in the contract, so learn it from the first full page
  const perPage = useRef(0)
  if (page === 1 && rows.length) perPage.current = rows.length
  const pages = perPage.current ? Math.max(1, Math.ceil(total / perPage.current)) : 1
  return (
    <div>
      <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="display flex items-center gap-3 text-4xl">
            <GameIcon game={game} size={44} sticker rotate={-6} />
            <span>{solo ? '1v1' : `${teamSize}v${teamSize}`} ladder</span> <span className="text-paper/40">· {game.rankedModes?.join(' / ')}</span>
          </p>
          <p className="mt-1 max-w-xl text-paper/60">
            Everyone starts at 1000. Beat someone rated higher and you climb faster. {game.statLabel} are tracked on every ranked game. Just numbers, nothing to buy.
          </p>
        </div>
        <Button to={`/challenges/new?game=${game.slug}&ranked=1`} variant="accent" icon={Plus} magnetic>Ranked challenge</Button>
      </div>
      <div className="mb-6 flex flex-wrap items-end gap-4">
        {!solo && (
          <Segmented
            label="Team size"
            value={teamSize}
            onChange={(v) => {
              setTeamSize(Number(v))
              setPage(1)
            }}
            options={game.teamSizes.map((n) => ({ value: n, label: `${n}v${n}` }))}
          />
        )}
        <div className="w-48">
          <Select label="Province" value={province} onChange={(e) => { setProvince(e.target.value); setPage(1) }} placeholder="All Nepal" options={PROVINCES} />
        </div>
        <div className="flex flex-wrap items-center gap-2 pb-1">
          {TIERS.map((t, i) => (
            <span key={t.name} title={`${t.name}: ${t.min || 'below 1100'}+`} className="hidden md:inline-block">
              <TierBadge tier={t.name} size="sm" />
              {i < TIERS.length - 1 && <span className="mx-1 text-paper/30">›</span>}
            </span>
          ))}
        </div>
      </div>
      {state.loading ? (
        <SkeletonList count={1} className="h-96" />
      ) : state.error ? (
        <ErrorState error={state.error} onRetry={state.reload} />
      ) : rows.length ? (
        <>
          <RankedLadder rows={rows} statLabel={game.statLabel} />
          {pages > 1 && (
            <div className="mt-4 flex items-center gap-3">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</Button>
              <span className="font-mono text-sm text-paper/60">page {page} / {pages}</span>
              <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          )}
        </>
      ) : (
        <Empty
          big="1000"
          title="Ladder is wide open"
          body={`No ranked ${game.name} games${province ? ` in ${province}` : ''} at this size yet. Play one and you're on it.`}
          action={<Button to={`/challenges/new?game=${game.slug}&ranked=1`} variant="accent" icon={Plus}>Start ranked</Button>}
        />
      )}
    </div>
  )
}

function Listing({ state, empty, render, grid = 'sm:grid-cols-2 lg:grid-cols-3', skeleton = 'h-44' }) {
  if (state.loading) return <SkeletonList count={3} className={skeleton} />
  if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />
  const items = asList(state.data)
  if (!items.length) return empty
  return (
    <Reveal className={`grid gap-5 ${grid}`}>
      {items.map((x, i) => (
        <RevealItem key={x._id ?? i}>{render(x, i)}</RevealItem>
      ))}
    </Reveal>
  )
}

function ChallengesTab({ game }) {
  const [status, setStatus] = useState('open')
  const [teamSize, setTeamSize] = useState('')
  const solo = isSolo(game)
  const state = useFetch('/challenges', { game: game.slug, status: status || undefined, teamSize: (!solo && teamSize) || undefined })
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-44">
            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: 'open', label: 'Open' },
                { value: 'accepted', label: 'Accepted' },
                { value: 'in_progress', label: 'Playing' },
                { value: 'settled', label: 'Settled' },
                { value: '', label: 'Everything' },
              ]}
            />
          </div>
          {!solo && (
            <Segmented
              label="Team size"
              value={teamSize}
              onChange={setTeamSize}
              options={[{ value: '', label: 'Any' }, ...game.teamSizes.map((n) => ({ value: n, label: `${n}v${n}` }))]}
            />
          )}
        </div>
        <Button to={`/challenges/new?game=${game.slug}`} variant="accent" icon={Plus} magnetic>
          New challenge
        </Button>
      </div>
      <Listing
        state={state}
        render={(c) => <ChallengeCard challenge={c} />}
        empty={
          <Empty
            big="1v1"
            title={status === 'open' ? 'No open challenges' : 'Nothing here'}
            body={`Be the first one on the ${game.name} board tonight. Post it and let someone take the bait.`}
            action={<Button to={`/challenges/new?game=${game.slug}`} variant="accent" icon={Plus}>Post a challenge</Button>}
          />
        }
      />
    </div>
  )
}

function MatchesTab({ game }) {
  const [status, setStatus] = useState('upcoming')
  const state = useFetch('/matches', { game: game.slug, status: status || undefined })
  return (
    <div>
      <div className="mb-6">
        <Segmented
          label="Show"
          value={status}
          onChange={setStatus}
          options={[
            { value: 'upcoming', label: 'Upcoming' },
            { value: 'live', label: 'Live' },
            { value: 'completed', label: 'Done' },
          ]}
        />
      </div>
      <Listing
        state={state}
        skeleton="h-56"
        render={(m) => <MatchCard match={m} />}
        empty={<Empty big="ROOM" title="No rooms here" body={`Hosted ${game.name} rooms show up here once an organiser posts them.`} />}
      />
    </div>
  )
}

function TournamentsTab({ game }) {
  const state = useFetch('/tournaments', { game: game.slug })
  return (
    <>
    <SponsorSlot slot="tournament" game={game.slug} variant="compact" className="mb-6 max-w-md" />
    <Listing
      state={state}
      skeleton="h-72"
      render={(t) => <TournamentCard tournament={t} />}
      empty={<Empty big="CUP" title="No cups yet" body="Sponsors are lining up. Free entry when they land, sponsor-funded prizes only." />}
    />
    </>
  )
}

function LeaderboardTab({ game }) {
  const [period, setPeriod] = useState('week')
  const [province, setProvince] = useState('')
  const state = useFetch('/leaderboard', { game: game.slug, period, province: province || undefined })
  const rows = asList(state.data)
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <Segmented
          label="Period"
          value={period}
          onChange={setPeriod}
          options={[
            { value: 'week', label: 'This week' },
            { value: 'season', label: 'Season' },
            { value: 'all', label: 'All time' },
          ]}
        />
        <div className="w-48">
          <Select label="Province" value={province} onChange={(e) => setProvince(e.target.value)} placeholder="All Nepal" options={PROVINCES} />
        </div>
      </div>
      {state.loading ? (
        <SkeletonList count={1} className="h-80" />
      ) : state.error ? (
        <ErrorState error={state.error} onRetry={state.reload} />
      ) : rows.length ? (
        <LeaderboardTable rows={rows} />
      ) : (
        <Empty big="01" title="Board is empty" body={`Nobody has settled a ${game.name} challenge${province ? ` in ${province}` : ''} this period. Free spot at the top.`} />
      )}
      <p className="mt-3 font-mono text-xs text-paper/45">Rank points are earned by playing. They can't be bought or sold.</p>
    </div>
  )
}

function TopupTab({ game }) {
  const state = useFetch('/store/products', { game: game.slug })
  const [buying, setBuying] = useState(null)
  return (
    <>
      <Listing
        state={state}
        grid="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        skeleton="h-44"
        render={(p, i) => <ProductCard product={p} index={i} onBuy={setBuying} />}
        empty={<Empty big={game.currency?.toUpperCase?.() ?? 'TOP'} title="Shelf is empty" body={`No ${game.currency ?? 'top-up'} packs listed right now.`} />}
      />
      <CheckoutModal product={buying} onClose={() => setBuying(null)} />
    </>
  )
}

export default function GameHub() {
  const { slug } = useParams()
  const reduce = useReducedMotion()
  const { games } = useGames()
  const game = games.find((g) => g.slug === slug)
  const [params, setParams] = useSearchParams()
  const tab = TABS.some((t) => t.key === params.get('tab')) ? params.get('tab') : 'challenges'
  const summary = useFetch(game ? `/games/${slug}/summary` : null)
  // scroll-linked parallax: title drifts down, art drifts up as the hero scrolls away
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const titleY = useTransform(scrollYProgress, [0, 1], [0, 90])
  const artY = useTransform(scrollYProgress, [0, 1], [0, -70])

  const { settings } = useSite()

  if (!game) return <NotFound />
  const paused = settings.gamesEnabled?.[game.slug] === false

  const s = summary.data
  const stats = [
    ['Open', countOf(s?.openChallenges)],
    ['Rooms', countOf(s?.upcomingMatches)],
    ['Cups', countOf(s?.tournaments)],
  ]

  return (
    <div style={{ '--accent': game.accent }}>
      {/* hero in the game's colour */}
      <section ref={heroRef} className="relative overflow-hidden bg-(--accent) text-ink">
        <span aria-hidden className="halftone-fade pointer-events-none absolute inset-0 text-ink/30" />
        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6 sm:pt-14">
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs font-semibold uppercase tracking-[0.25em]">
            <span>Game hub</span>
            <span className="h-px w-8 bg-ink/50" />
            <span>{game.teamSizes.length === 1 ? '1v1 only' : `Solo · Duo · Squad`}</span>
          </div>
          <div className="mt-4 grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:items-center">
            <motion.div style={reduce ? undefined : { y: titleY }}>
              <motion.h1
                initial={reduce ? false : { x: -40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                className="display text-[4.2rem] leading-[0.85] sm:text-[7.5rem] lg:text-[8.5rem]"
              >
                {game.name}
              </motion.h1>
              <p className="mt-6 max-w-lg text-lg font-medium text-ink/85">{game.blurb}</p>
            </motion.div>
            <motion.div style={reduce ? undefined : { y: artY }}>
              <HubArt game={game} />
            </motion.div>
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-end">
            <div>
              {game.maps.length > 0 ? (
                <>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-ink/60">Maps in rotation</p>
                  <Reveal className="mt-3 grid grid-cols-3 gap-3 lg:grid-cols-5" stagger={0.05}>
                    {game.maps.map((m, i) => (
                      <RevealItem key={m}>
                        <div className="drop-hard" style={{ transform: `rotate(${[-2, 1.5, -1, 2.5, -1.5][i % 5]}deg)` }}>
                          <div className="notch-sm bg-ink p-1.5">
                            <MapArt name={m} className="block aspect-[80/56] w-full" />
                            <p className="display truncate px-1 pb-0.5 pt-1.5 text-sm text-(--accent) sm:text-lg">{m}</p>
                          </div>
                        </div>
                      </RevealItem>
                    ))}
                  </Reveal>
                </>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {game.modes.map((m, i) => (
                    <Sticker key={m} tone="paper" rotate={i % 2 ? 2 : -2}>{m}</Sticker>
                  ))}
                </div>
              )}
            </div>
            <dl className="grid grid-cols-3 border-2 border-ink bg-paper shadow-hard">
              {stats.map(([k, v], i) => (
                <div key={k} className={`p-4 ${i ? 'border-l-2 border-ink' : ''}`}>
                  <dt className="font-mono text-[11px] uppercase tracking-widest text-ink/60">{k}</dt>
                  <dd className="display mt-1 text-5xl">{summary.loading ? '–' : <CountUp value={v} />}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
      <TornEdge color={game.accent} flip className="-mt-px" />
      <AnnouncementTicker game={game.slug} />
      {paused && (
        <div className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
          <p className="border-2 border-marigold bg-marigold/10 px-4 py-3">
            <span className="display mr-2 text-xl text-marigold">Paused</span>
            {game.name} is switched off for now. You can look around, but new challenges and rooms are on hold.
          </p>
        </div>
      )}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <SponsorSlot slot="hub_banner" game={game.slug} />
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <div className="border-b-2 border-paper/10">
          <Tabs
            id={`hub-${slug}`}
            tabs={TABS}
            active={tab}
            onChange={(k) => setParams(k === 'challenges' ? {} : { tab: k }, { replace: true })}
          />
        </div>
        <motion.div key={tab} initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="pt-8">
          {tab === 'challenges' && <ChallengesTab game={game} />}
          {tab === 'ranked' && <RankedTab game={game} />}
          {tab === 'matches' && <MatchesTab game={game} />}
          {tab === 'tournaments' && <TournamentsTab game={game} />}
          {tab === 'leaderboard' && <LeaderboardTab game={game} />}
          {tab === 'topup' && <TopupTab game={game} />}
        </motion.div>
      </div>
    </div>
  )
}
