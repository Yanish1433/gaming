import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../context/AuthContext'
import Skeleton from '../components/ui/Skeleton'

function Waiting() {
  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-16">
      <Skeleton className="h-14 w-2/3" />
      <Skeleton className="h-40" />
    </div>
  )
}

export function RequireAuth({ children }) {
  const { user, loading, token } = useAuth()
  const location = useLocation()
  if (loading || (token && !user)) {
    // token present but /auth/me hasn't answered: wait unless the API is down
    if (loading) return <Waiting />
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  return children
}

export function RequireRole({ roles, children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Waiting />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!roles.includes(user.role)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24">
        <p className="font-mono text-xs uppercase tracking-widest text-crimson">403 / staff only</p>
        <h1 className="display mt-2 text-6xl">Yaha pass chaina</h1>
        <p className="mt-3 text-paper/70">This area is for admins and organisers. If you run tournaments and want access, ask in the community group.</p>
      </div>
    )
  }
  return children
}
