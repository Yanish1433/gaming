import { useState } from 'react'
import { useLocation } from 'react-router'
import Input, { Select, Textarea } from '../components/ui/Input'
import Button from '../components/ui/Button'
import { FormError } from '../components/ui/Empty'
import { PageHead } from '../components/ui/Bits'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { GAMES, PROVINCES } from '../lib/games'

export default function Settings() {
  const { user, setUser } = useAuth()
  const location = useLocation()
  const [form, setForm] = useState(() => ({
    bio: user?.bio ?? '',
    province: user?.province ?? 'Bagmati',
    avatarUrl: user?.avatarUrl ?? '',
    gameIds: { pubg: '', freefire: '', efootball: '', fcmobile: '', ...(user?.gameIds ?? {}) },
  }))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setSaved(false)
    try {
      // strict schema on the API: strings only, known game keys only
      const body = {
        bio: form.bio ?? '',
        province: form.province,
        avatarUrl: (form.avatarUrl ?? '').trim(),
        gameIds: Object.fromEntries(GAMES.map((g) => [g.slug, String(form.gameIds[g.slug] ?? '').trim()])),
      }
      const { data } = await api.patch('/users/me', body)
      setUser(data?.user ?? data)
      setSaved(true)
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <PageHead kicker={{ num: 'ME', text: 'Settings' }} title={location.state?.welcome ? 'Swagat cha!' : 'Your file'}>
        {location.state?.welcome
          ? 'Account ready. Add your in-game IDs so hosts can let you into rooms and top-ups land in the right place.'
          : 'In-game IDs, bio and province. Your email and date of birth never show publicly.'}
      </PageHead>
      <form onSubmit={submit} className="space-y-10">
        <section>
          <p className="display text-3xl">In-game IDs</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {GAMES.map((g) => (
              <div key={g.slug} className="border-l-4 pl-3" style={{ borderColor: g.accent }}>
                <Input
                  label={`${g.name} ID`}
                  className="font-mono"
                  value={form.gameIds[g.slug] ?? ''}
                  onChange={(e) => setForm({ ...form, gameIds: { ...form.gameIds, [g.slug]: e.target.value } })}
                />
              </div>
            ))}
          </div>
        </section>
        <section className="grid gap-4 sm:grid-cols-2">
          <Select label="Province" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} options={PROVINCES} />
          <Input label="Avatar image URL" placeholder="https://…" value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} />
          <div className="sm:col-span-2">
            <Textarea label="Bio" rows={3} maxLength={280} placeholder="e.g. IGL for Team Sagarmatha. Erangel main. Chiya > coffee." value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} hint={`${form.bio.length}/280`} />
          </div>
        </section>
        <FormError error={error} />
        <div className="flex items-center gap-4">
          <Button type="submit" busy={busy} size="lg">Save</Button>
          {saved && <span className="font-mono text-sm text-[#2BB673]">Saved ✓</span>}
        </div>
      </form>
    </div>
  )
}
