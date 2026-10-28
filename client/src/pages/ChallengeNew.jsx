import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { motion } from 'motion/react'
import Input, { Segmented, Select, Textarea } from '../components/ui/Input'
import Button from '../components/ui/Button'
import { FormError } from '../components/ui/Empty'
import { PageHead } from '../components/ui/Bits'
import { useGames } from '../hooks/useGames'
import { api } from '../lib/api'
import { isSolo } from '../lib/games'
import { toLocalInput } from '../lib/format'

function defaultTime() {
  const d = new Date(Date.now() + 60 * 60 * 1000)
  d.setMinutes(d.getMinutes() < 30 ? 30 : 60, 0, 0)
  return toLocalInput(d)
}

export default function ChallengeNew() {
  const { games } = useGames()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [slug, setSlug] = useState(games.some((g) => g.slug === params.get('game')) ? params.get('game') : 'pubg')
  const game = useMemo(() => games.find((g) => g.slug === slug) ?? games[0], [games, slug])
  const solo = isSolo(game)

  const [form, setForm] = useState({ mode: '', map: '', teamSize: 1, scheduledAt: defaultTime(), notes: '' })
  const [ranked, setRanked] = useState(params.get('ranked') !== '0')
  // ranked only runs on the modes where kills/goals are comparable
  const modes = ranked && game.rankedModes?.length ? game.rankedModes : game.modes
  const [mates, setMates] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  // reset game-specific fields when the game changes
  useEffect(() => {
    setForm((f) => ({
      ...f,
      mode: modes.includes(f.mode) ? f.mode : (modes[0] ?? ''),
      map: game.maps[0] ?? '',
      teamSize: game.teamSizes.includes(Number(f.teamSize)) ? Number(f.teamSize) : game.teamSizes[0],
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, ranked])

  const size = solo ? 1 : Number(form.teamSize)
  useEffect(() => {
    setMates((m) => Array.from({ length: Math.max(0, size - 1) }, (_, i) => m[i] ?? ''))
  }, [size])

  const submit = async (e) => {
    e.preventDefault()
    const when = new Date(form.scheduledAt)
    if (Number.isNaN(when.getTime()) || when.getTime() < Date.now() - 60000) return setError(new Error('Pick a time in the future.'))
    const teammates = mates.map((m) => m.trim()).filter(Boolean)
    if (teammates.length !== size - 1) return setError(new Error(`Add ${size - 1} teammate username${size - 1 > 1 ? 's' : ''}, or drop the team size.`))
    setBusy(true)
    setError(null)
    try {
      const { data } = await api.post('/challenges', {
        game: game.slug,
        mode: form.mode,
        map: game.maps.length ? form.map : undefined,
        teamSize: size,
        ranked,
        scheduledAt: when.toISOString(),
        notes: form.notes.trim() || undefined,
        teammates,
      })
      navigate(`/challenges/${data?._id ?? data?.challenge?._id ?? ''}`, { replace: true })
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6" style={{ '--accent': game.accent }}>
      <PageHead kicker={{ num: 'NEW', text: 'Challenge' }} title="Throw it down">
        Set the terms. Someone accepts, you drop the room ID, both sides screenshot the end card.
      </PageHead>
      <form onSubmit={submit} className="grid gap-8 md:grid-cols-[1fr_16rem]">
        <div className="space-y-6">
          <Segmented label="Game" value={slug} onChange={setSlug} options={games.map((g) => ({ value: g.slug, label: g.short }))} />
          <button
            type="button"
            role="switch"
            aria-checked={ranked}
            onClick={() => setRanked(!ranked)}
            className={`flex w-full items-center gap-4 border-2 p-4 text-left transition-colors ${ranked ? 'border-(--accent) bg-(--accent)/10' : 'border-paper/20'}`}
          >
            <span className={`relative h-7 w-12 shrink-0 border-2 border-ink ${ranked ? 'bg-(--accent)' : 'bg-paper/20'}`}>
              <motion.span layout transition={{ type: 'spring', stiffness: 500, damping: 30 }} className={`absolute top-0.5 size-5 bg-ink ${ranked ? 'right-0.5' : 'left-0.5'}`} />
            </span>
            <span>
              <span className="display block text-2xl">{ranked ? 'Ranked' : 'Casual'}</span>
              <span className="block text-sm text-paper/60">
                {ranked
                  ? `Rating moves and your ${game.statLabel?.toLowerCase() ?? 'score'} go on your record. ${game.rankedModes?.join(' / ')} only.`
                  : 'Just for fun. Rank points still count, rating stays put.'}
              </span>
            </span>
          </button>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Mode" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} options={modes} />
            {game.maps.length > 0 && <Select label="Map" value={form.map} onChange={(e) => setForm({ ...form, map: e.target.value })} options={game.maps} />}
          </div>
          {!solo && (
            <Segmented
              label="Team size"
              value={form.teamSize}
              onChange={(v) => setForm({ ...form, teamSize: Number(v) })}
              options={game.teamSizes.map((n) => ({ value: n, label: `${n}v${n}` }))}
            />
          )}
          {mates.length > 0 && (
            <div className="space-y-3">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-paper/60">Your teammates (Arena usernames)</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {mates.map((m, i) => (
                  <Input
                    key={i}
                    placeholder={`teammate ${i + 1}`}
                    value={m}
                    onChange={(e) => setMates(mates.map((x, j) => (j === i ? e.target.value : x)))}
                    aria-label={`Teammate ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
          <Input type="datetime-local" label="When (Nepal time)" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
          <Textarea
            label="Notes"
            placeholder="e.g. TPP only, no emulators, M416 + AKM loadout"
            value={form.notes}
            maxLength={280}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <FormError error={error} />
          <Button type="submit" variant="accent" size="lg" busy={busy}>
            Post challenge
          </Button>
        </div>
        <aside className="h-fit border-2 border-paper/15 p-5">
          <p className="display text-2xl">House rules</p>
          <ul className="mt-3 space-y-2 text-sm text-paper/70">
            <li>— Just for rank points. No money, no bets, no side deals.</li>
            <li>— Use the in-game name on your profile.</li>
            <li>— No-shows and fake screenshots get strikes. Three strikes, out.</li>
            <li>— Winners +30, losers +10 rank points.</li>
          </ul>
        </aside>
      </form>
    </div>
  )
}
