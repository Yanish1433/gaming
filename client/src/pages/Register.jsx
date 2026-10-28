import { useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import Input, { Select } from '../components/ui/Input'
import Button from '../components/ui/Button'
import { FormError } from '../components/ui/Empty'
import Sticker from '../components/ui/Sticker'
import { AuthShell } from './Login'
import { useAuth } from '../context/AuthContext'
import { PROVINCES } from '../lib/games'

function ageOf(dob) {
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return 0
  const now = new Date()
  let a = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--
  return a
}

export default function Register() {
  const { register, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ username: '', email: '', password: '', dob: '', province: 'Bagmati' })
  const [errs, setErrs] = useState({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  // set right before register() resolves, so the "already logged in" redirect doesn't beat the welcome redirect
  const justJoined = useRef(false)

  if (user && !justJoined.current) return <Navigate to={location.state?.from ?? '/games'} replace />

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const validate = () => {
    const e = {}
    if (!/^[a-zA-Z0-9_.]{3,20}$/.test(form.username)) e.username = '3–20 characters: letters, numbers, _ or .'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'That email looks off.'
    if (form.password.length < 8) e.password = 'At least 8 characters.'
    if (!form.dob) e.dob = 'Needed for the age check.'
    else if (ageOf(form.dob) < 16) e.dob = 'Arena Nepal is 16+ only. Come back in a bit!'
    setErrs(e)
    return Object.keys(e).length === 0
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setBusy(true)
    setError(null)
    try {
      justJoined.current = true
      await register({ ...form, username: form.username.trim(), email: form.email.trim() })
      navigate('/settings', { replace: true, state: { welcome: true } })
    } catch (err) {
      justJoined.current = false
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Join the arena"
      side={
        <div className="pt-10">
          <p className="display text-7xl leading-[0.95]">
            One handle.
            <br />
            Four games.
            <br />
            <span className="text-crimson">Zero</span> fees.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Sticker tone="marigold" rotate={-3}>16+ only</Sticker>
            <Sticker tone="paper" rotate={2}>No betting</Sticker>
            <Sticker tone="red" rotate={-1}>Free forever</Sticker>
          </div>
        </div>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input tone="paper" label="Username" placeholder="e.g. thamel_sniper" value={form.username} onChange={set('username')} error={errs.username} autoComplete="username" />
        <Input tone="paper" type="email" label="Email" value={form.email} onChange={set('email')} error={errs.email} autoComplete="email" />
        <Input tone="paper" type="password" label="Password" value={form.password} onChange={set('password')} error={errs.password} autoComplete="new-password" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input tone="paper" type="date" label="Date of birth" value={form.dob} onChange={set('dob')} error={errs.dob} max={new Date().toISOString().slice(0, 10)} />
          <Select tone="paper" label="Province" value={form.province} onChange={set('province')} options={PROVINCES} />
        </div>
        <FormError error={error} />
        <Button type="submit" busy={busy} className="w-full" size="lg">
          Create account
        </Button>
        <p className="text-center text-ink/70">
          Already in?{' '}
          <Link to="/login" className="font-semibold text-crimson underline decoration-2 underline-offset-4">
            Log in
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
