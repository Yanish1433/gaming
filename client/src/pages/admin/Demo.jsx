import { Eraser, RotateCcw } from 'lucide-react'
import Button from '../../components/ui/Button'
import { CountUp } from '../../components/ui/Bits'
import { ErrorState } from '../../components/ui/Empty'
import Skeleton from '../../components/ui/Skeleton'
import { useFetch } from '../../hooks/useFetch'
import { api } from '../../lib/api'
import { AdminHead, useAdminAct } from './kit'

export default function Demo() {
  const state = useFetch('/admin/demo')
  const act = useAdminAct()
  const d = state.data ?? {}

  const run = async (kind) => {
    const clear = kind === 'clear'
    const ok = await act(() => api.post(`/admin/demo/${kind}`, { confirm: 'YES' }), {
      success: clear ? 'Demo data removed' : 'Demo data reseeded',
      confirm: {
        kicker: 'Demo data',
        title: clear ? 'Remove all demo data?' : 'Reseed demo data?',
        body: clear
          ? 'Deletes every isDemo player and their challenges, matches and records. Real accounts are kept. Ladders and stats will drop to real activity only.'
          : 'Wipes the current demo players and creates a fresh set (about 60 players, 200 ranked challenges). Real accounts are kept.',
        confirmText: clear ? 'Remove demo data' : 'Reseed',
        typed: 'YES',
      },
    })
    if (ok) state.reload()
  }

  return (
    <div>
      <AdminHead kicker="System" title="Demo data">
        Seeded sample players make ladders and charts look alive for the sponsor pitch. They're flagged <code className="font-mono">isDemo</code> and only admins can see that flag, so be upfront that it's sample data when showing numbers.
      </AdminHead>
      {state.error ? (
        <ErrorState error={state.error} onRetry={state.reload} />
      ) : state.loading ? (
        <Skeleton className="h-40" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="border-2 border-paper/15 p-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-paper/55">Demo players</p>
            <p className="display text-6xl"><CountUp value={d.demoUsers ?? 0} /></p>
          </div>
          <div className="border-2 border-paper/15 p-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-paper/55">Demo challenges</p>
            <p className="display text-6xl"><CountUp value={d.demoChallenges ?? 0} /></p>
          </div>
        </div>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="danger" icon={Eraser} onClick={() => run('clear')}>Clear demo data</Button>
        <Button variant="outline" icon={RotateCcw} onClick={() => run('reseed')}>Reseed demo data</Button>
      </div>
      <p className="mt-3 text-sm text-paper/45">Both ask you to type YES first. Reseeding can take a few seconds.</p>
    </div>
  )
}
