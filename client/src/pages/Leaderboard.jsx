import { useState } from 'react'
import { PageHead } from '../components/ui/Bits'
import { Segmented, Select } from '../components/ui/Input'
import Empty, { ErrorState } from '../components/ui/Empty'
import { SkeletonList } from '../components/ui/Skeleton'
import LeaderboardTable from '../components/feature/LeaderboardTable'
import { useFetch } from '../hooks/useFetch'
import { asList } from '../lib/api'
import { GAMES, PROVINCES, accentOf } from '../lib/games'

export default function Leaderboard() {
  const [game, setGame] = useState('')
  const [province, setProvince] = useState('')
  const [period, setPeriod] = useState('week')
  const state = useFetch('/leaderboard', { game: game || undefined, province: province || undefined, period })
  const rows = asList(state.data)

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6" style={{ '--accent': game ? accentOf(game) : '#DC143C' }}>
      <PageHead kicker={{ num: '04', text: 'Leaderboard' }} title="Who runs the board">
        Rank points from settled challenges and hosted rooms. Filter by game, province, and how far back.
      </PageHead>
      <div className="mb-8 flex flex-wrap items-end gap-5">
        <Segmented label="Game" value={game} onChange={setGame} options={[{ value: '', label: 'All' }, ...GAMES.map((g) => ({ value: g.slug, label: g.short }))]} />
        <Segmented
          label="Period"
          value={period}
          onChange={setPeriod}
          options={[
            { value: 'week', label: 'Week' },
            { value: 'season', label: 'Season' },
            { value: 'all', label: 'All time' },
          ]}
        />
        <div className="w-52">
          <Select label="Province" value={province} onChange={(e) => setProvince(e.target.value)} placeholder="All Nepal" options={PROVINCES} />
        </div>
      </div>
      {state.loading ? (
        <SkeletonList count={1} className="h-96" />
      ) : state.error ? (
        <ErrorState error={state.error} onRetry={state.reload} />
      ) : rows.length ? (
        <LeaderboardTable rows={rows} />
      ) : (
        <Empty big="01" title="Nobody here yet" body={`No rank points${province ? ` in ${province}` : ''} for this period. One settled challenge and you're on it.`} />
      )}
    </div>
  )
}
