import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { FormError } from '../components/ui/Empty'
import { Scribble } from '../components/ui/Scribble'
import { useAuth } from '../context/AuthContext'

export function AuthShell({ title, side, children }) {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1fr_1.1fr] md:py-20">
      <div className="relative hidden md:block">
        <span aria-hidden className="halftone absolute inset-0 text-crimson/25 [mask-image:linear-gradient(160deg,#000,transparent_75%)]" />
        <div className="relative">{side}</div>
      </div>
      <div className="drop-hard">
        <div className="notch paper-card p-6 sm:p-9">
          <h1 className="display text-5xl">{title}</h1>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  )
}

export default function Login() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const requestedDestination = location.state?.from
  const from = requestedDestination && requestedDestination !== '/' ? requestedDestination : '/games'
  const [form, setForm] = useState({ emailOrUsername: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const dashboardDestination = user?.role === 'admin' || user?.role === 'organiser'
    ? (from.startsWith('/admin') ? from : '/admin')
    : from

  if (user) return <Navigate to={dashboardDestination} replace />

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const loggedInUser = await login(form.emailOrUsername.trim(), form.password)
      const destination = loggedInUser?.role === 'admin' || loggedInUser?.role === 'organiser'
        ? (from.startsWith('/admin') ? from : '/admin')
        : from
      navigate(destination, { replace: true })
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      side={
        <p className="display pt-10 text-7xl leading-[0.95]">
          Room ID is waiting.
          <br />
          <Scribble color="#F2A900">Log in</Scribble> and get in.
        </p>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Input
          tone="paper"
          label="Email or username"
          autoComplete="username"
          value={form.emailOrUsername}
          onChange={(e) => setForm({ ...form, emailOrUsername: e.target.value })}
          required
        />
        <Input
          tone="paper"
          type="password"
          label="Password"
          autoComplete="current-password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <FormError error={error} />
        <Button type="submit" busy={busy} className="w-full" size="lg">
          Log in
        </Button>
        <p className="text-center text-ink/70">
          New here?{' '}
          <Link to="/register" state={location.state} className="font-semibold text-crimson underline decoration-2 underline-offset-4">
            Make an account
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
