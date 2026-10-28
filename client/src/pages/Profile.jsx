import { useParams } from 'react-router'
import { MapPin, Settings as Cog } from 'lucide-react'
import Button from '../components/ui/Button'
import Sticker from '../components/ui/Sticker'
import Empty, { ErrorState } from '../components/ui/Empty'
import Skeleton from '../components/ui/Skeleton'
import { Avatar, CountUp, Reveal, RevealItem, SectionLabel } from '../components/ui/Bits'
import ChallengeCard from '../components/feature/ChallengeCard'
import RankedProfile from '../components/feature/RankedProfile'
import ReportPlayer from '../components/feature/ReportPlayer'
import { useFetch } from '../hooks/useFetch'
import { useAuth } from '../context/AuthContext'
import { GAMES } from '../lib/games'
import { fmtDay } from '../lib/format'

export default function Profile() {
  const { username } = useParams()
  const { user } = useAuth()
  const { data, error, loading, reload } = useFetch(`/users/${encodeURIComponent(username)}`)

  if (loading)
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-12">
        <Skeleton className="h-32" />
        <Skeleton className="h-48" />
      </div>
    )
  if (error)
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        {error.status === 404 ? <Empty big="404" title={`No player called ${username}`} body="Check the spelling, handles are case-sensitive." /> : <ErrorState error={error} onRetry={reload} />}
      </div>
    )

  const p = data?.user ?? data
  const recent = data?.recentChallenges ?? data?.challenges ?? p?.recentChallenges ?? []
  const me = user?.username === p.username
  const played = p.stats?.played ?? 0
  const won = p.stats?.won ?? 0
  const rate = played ? Math.round((won / played) * 100) : 0

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <section className="grid gap-8 md:grid-cols-[auto_1fr_auto] md:items-end">
        <div className="relative w-fit">
          <Avatar user={p} size={132} className="shadow-[6px_6px_0_#DC143C]" />
          {p.role && p.role !== 'player' && (
            <span className="absolute -bottom-3 -right-6">
              <Sticker tone="marigold" rotate={-5}>{p.role}</Sticker>
            </span>
          )}
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-paper/50">Player file</p>
          <h1 className="display mt-1 break-all text-6xl sm:text-8xl">{p.username}</h1>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-paper/65">
            {p.province && <span className="flex items-center gap-1"><MapPin className="size-4" /> {p.province}</span>}
            {p.createdAt && <span className="font-mono text-sm">since {fmtDay(p.createdAt)}</span>}
          </div>
          {p.bio && <p className="mt-3 max-w-xl text-paper/80">{p.bio}</p>}
        </div>
        {me ? (
          <Button to="/settings" variant="outline" icon={Cog}>Edit profile</Button>
        ) : (
          <ReportPlayer players={p} />
        )}
      </section>

      <dl className="mt-10 grid grid-cols-2 border-2 border-paper/15 sm:grid-cols-4">
        {[
          ['Rank points', p.xp ?? 0],
          ['Played', played],
          ['Won', won],
          ['Win %', rate],
        ].map(([k, v], i) => (
          <div key={k} className={`p-5 ${i % 2 ? 'border-l-2 border-paper/15' : ''} ${i >= 2 ? 'border-t-2 border-paper/15 sm:border-t-0' : ''} ${i === 2 ? 'sm:border-l-2' : ''}`}>
            <dt className="font-mono text-[11px] uppercase tracking-widest text-paper/45">{k}</dt>
            <dd className="display mt-1 text-5xl">
              <CountUp value={v} />
            </dd>
          </div>
        ))}
      </dl>

      {p.gameIds && Object.values(p.gameIds).some(Boolean) && (
        <section className="mt-12">
          <SectionLabel num="01">In-game IDs</SectionLabel>
          <div className="mt-4 flex flex-wrap gap-3">
            {GAMES.filter((g) => p.gameIds?.[g.slug]).map((g) => (
              <span key={g.slug} className="flex items-center gap-2 border-2 border-paper/15 px-3 py-2">
                <span className="size-3" style={{ background: g.accent }} />
                <span className="font-semibold">{g.short}</span>
                <span className="font-mono text-sm text-paper/70">{p.gameIds[g.slug]}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      <RankedProfile profile={p} />

      <section className="mt-12">
        <SectionLabel num="02">Recent challenges</SectionLabel>
        {recent.length ? (
          <Reveal className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((c) => (
              <RevealItem key={c._id}>
                <ChallengeCard challenge={c} />
              </RevealItem>
            ))}
          </Reveal>
        ) : (
          <Empty className="mt-4" big="GG" title="No games yet" body={me ? 'Post your first challenge and get on the board.' : `${p.username} hasn't played on Arena yet.`} action={me ? <Button to="/games">Find a game</Button> : null} />
        )}
      </section>
    </div>
  )
}
