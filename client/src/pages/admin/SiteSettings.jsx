import { useEffect, useState } from 'react'
import Button from '../../components/ui/Button'
import Input, { Textarea } from '../../components/ui/Input'
import { ErrorState } from '../../components/ui/Empty'
import Skeleton from '../../components/ui/Skeleton'
import GameIcon from '../../components/art/GameIcon'
import { useFetch } from '../../hooks/useFetch'
import { useSite } from '../../context/SiteContext'
import { useUi } from '../../context/UiContext'
import { api } from '../../lib/api'
import { GAMES } from '../../lib/games'
import { AdminHead } from './kit'

function Toggle({ checked, onChange, label, hint }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex w-full items-center gap-4 border-2 border-paper/15 p-4 text-left hover:border-paper/35">
      <span className={`relative h-7 w-12 shrink-0 border-2 border-ink ${checked ? 'bg-marigold' : 'bg-paper/20'}`}>
        <span className={`absolute top-0.5 size-5 bg-ink transition-all ${checked ? 'right-0.5' : 'left-0.5'}`} />
      </span>
      <span>
        <span className="block font-semibold">{label}</span>
        {hint && <span className="block text-sm text-paper/55">{hint}</span>}
      </span>
    </button>
  )
}

export default function SiteSettings() {
  const state = useFetch('/admin/settings')
  const { reload: reloadSite } = useSite()
  const { toast, confirm } = useUi()
  const [f, setF] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!state.data) return
    const s = state.data
    setF({
      siteName: s.siteName ?? 'Arena Nepal',
      tickerEnabled: s.tickerEnabled !== false,
      maintenanceMode: !!s.maintenanceMode,
      maintenanceMessage: s.maintenanceMessage ?? '',
      gamesEnabled: Object.fromEntries(GAMES.map((g) => [g.slug, s.gamesEnabled?.[g.slug] !== false])),
      // edited as comma lists; empty = use the default config maps
      maps: Object.fromEntries(GAMES.map((g) => [g.slug, (s.mapsByGame?.[g.slug] ?? []).join(', ')])),
    })
  }, [state.data])

  const save = async (e) => {
    e.preventDefault()
    if (f.maintenanceMode && !state.data?.maintenanceMode) {
      const ok = await confirm({ title: 'Turn on maintenance?', body: 'Players can browse but every action (posting, reporting, ordering) is blocked until you turn it off. Admins are unaffected.', confirmText: 'Go into maintenance' })
      if (!ok) return
    }
    // null clears a game's override so it falls back to the default config maps
    const mapsByGame = {}
    for (const g of GAMES.filter((x) => x.maps.length)) {
      const list = f.maps[g.slug].split(',').map((m) => m.trim()).filter(Boolean)
      mapsByGame[g.slug] = list.length ? list : null
    }
    setBusy(true)
    try {
      await api.patch('/admin/settings', {
        siteName: f.siteName.trim(),
        tickerEnabled: f.tickerEnabled,
        maintenanceMode: f.maintenanceMode,
        maintenanceMessage: f.maintenanceMessage.trim(),
        gamesEnabled: f.gamesEnabled,
        mapsByGame,
      })
      toast.success('Settings saved')
      state.reload()
      reloadSite()
    } catch (err) {
      toast.error(err)
    } finally {
      setBusy(false)
    }
  }

  if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />
  if (!f) return <Skeleton className="h-96" />

  return (
    <form onSubmit={save}>
      <AdminHead kicker="System" title="Site settings" actions={<Button type="submit" busy={busy}>Save settings</Button>} />
      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="display text-2xl">Site</h2>
          <Input label="Site name" value={f.siteName} onChange={(e) => setF({ ...f, siteName: e.target.value })} />
          <Toggle checked={f.tickerEnabled} onChange={(v) => setF({ ...f, tickerEnabled: v })} label="Announcement ticker" hint="The scrolling strip on Home and the game hubs." />
          <div className={`space-y-3 border-2 p-4 ${f.maintenanceMode ? 'border-crimson bg-crimson/10' : 'border-transparent'}`}>
            <Toggle checked={f.maintenanceMode} onChange={(v) => setF({ ...f, maintenanceMode: v })} label="Maintenance mode" hint="Shows a banner and blocks player actions (the API answers 503)." />
            <Textarea label="Maintenance message" value={f.maintenanceMessage} onChange={(e) => setF({ ...f, maintenanceMessage: e.target.value })} placeholder="Upgrading the servers, back by 9pm. Khel pachi!" />
          </div>
        </section>
        <section className="space-y-3">
          <h2 className="display text-2xl">Games</h2>
          {GAMES.map((g) => (
            <div key={g.slug} className="border-2 border-paper/15 p-4" style={{ borderLeft: `6px solid ${g.accent}` }}>
              <div className="flex items-center gap-3">
                <GameIcon game={g} size={36} />
                <span className="flex-1 font-semibold">{g.name}</span>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="size-4 accent-crimson" checked={f.gamesEnabled[g.slug]} onChange={(e) => setF({ ...f, gamesEnabled: { ...f.gamesEnabled, [g.slug]: e.target.checked } })} />
                  Enabled
                </label>
              </div>
              {g.maps.length > 0 && (
                <div className="mt-3">
                  <Input
                    label="Maps override (comma separated, blank = default)"
                    placeholder={g.maps.join(', ')}
                    value={f.maps[g.slug]}
                    onChange={(e) => setF({ ...f, maps: { ...f.maps, [g.slug]: e.target.value } })}
                  />
                </div>
              )}
            </div>
          ))}
        </section>
      </div>
    </form>
  )
}
