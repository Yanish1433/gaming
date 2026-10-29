import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import Layout from './components/layout/Layout'
import { RequireAuth, RequireRole } from './routes/guards'
import Skeleton from './components/ui/Skeleton'
import Home from './pages/Home'
import { useAuth } from './context/AuthContext'

const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Games = lazy(() => import('./pages/Games'))
const GameHub = lazy(() => import('./pages/GameHub'))
const ChallengeNew = lazy(() => import('./pages/ChallengeNew'))
const ChallengeDetail = lazy(() => import('./pages/ChallengeDetail'))
const MatchDetail = lazy(() => import('./pages/MatchDetail'))
const TournamentDetail = lazy(() => import('./pages/TournamentDetail'))
const Leaderboard = lazy(() => import('./pages/Leaderboard'))
const Profile = lazy(() => import('./pages/Profile'))
const Settings = lazy(() => import('./pages/Settings'))
const BecomeOrganiser = lazy(() => import('./pages/BecomeOrganiser'))
const Store = lazy(() => import('./pages/Store'))
const Orders = lazy(() => import('./pages/Orders'))
const Notifications = lazy(() => import('./pages/Notifications'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Stats = lazy(() => import('./pages/Stats'))

const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminUsers = lazy(() => import('./pages/admin/Users'))
const AdminDisputes = lazy(() => import('./pages/admin/Disputes'))
const AdminOrders = lazy(() => import('./pages/admin/Orders'))
const AdminProducts = lazy(() => import('./pages/admin/Products'))
const AdminMatches = lazy(() => import('./pages/admin/Matches'))
const AdminChallenges = lazy(() => import('./pages/admin/Challenges'))
const AdminTournaments = lazy(() => import('./pages/admin/Tournaments'))
const AdminApplications = lazy(() => import('./pages/admin/Applications'))
const AdminReports = lazy(() => import('./pages/admin/Reports'))
const AdminRevenue = lazy(() => import('./pages/admin/Revenue'))
const AdminAnnouncements = lazy(() => import('./pages/admin/Announcements'))
const AdminSponsors = lazy(() => import('./pages/admin/Sponsors'))
const AdminStats = lazy(() => import('./pages/admin/StatsPreview'))
const AdminSettings = lazy(() => import('./pages/admin/SiteSettings'))
const AdminAudit = lazy(() => import('./pages/admin/Audit'))
const AdminDemo = lazy(() => import('./pages/admin/Demo'))

function PageFallback() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-14">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-16 w-3/4" />
      <Skeleton className="h-48" />
    </div>
  )
}

const authed = (el) => <RequireAuth>{el}</RequireAuth>
const admin = (el) => <RequireRole roles={['admin']}>{el}</RequireRole>

function RoleAwareHome() {
  const { user, loading } = useAuth()
  if (loading) return <PageFallback />
  if (user?.role === 'admin' || user?.role === 'organiser') {
    return <Navigate to="/admin" replace />
  }
  if (user) return <Navigate to="/games" replace />
  return <Home />
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<RoleAwareHome />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="games" element={<Games />} />
          <Route path="games/:slug" element={<GameHub />} />
          <Route path="challenges/new" element={authed(<ChallengeNew />)} />
          <Route path="challenges/:id" element={<ChallengeDetail />} />
          <Route path="matches/:id" element={<MatchDetail />} />
          <Route path="tournaments/:id" element={<TournamentDetail />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="stats" element={<Stats />} />
          <Route path="u/:username" element={<Profile />} />
          <Route path="settings" element={authed(<Settings />)} />
          <Route path="become-organiser" element={authed(<BecomeOrganiser />)} />
          <Route path="store" element={<Store />} />
          <Route path="orders" element={authed(<Orders />)} />
          <Route path="notifications" element={authed(<Notifications />)} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route
          path="admin"
          element={
            <RequireRole roles={['admin', 'organiser']}>
              <AdminLayout />
            </RequireRole>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={admin(<AdminUsers />)} />
          <Route path="disputes" element={admin(<AdminDisputes />)} />
          <Route path="orders" element={admin(<AdminOrders />)} />
          <Route path="products" element={admin(<AdminProducts />)} />
          <Route path="matches" element={<AdminMatches />} />
          <Route path="challenges" element={admin(<AdminChallenges />)} />
          <Route path="tournaments" element={admin(<AdminTournaments />)} />
          <Route path="applications" element={admin(<AdminApplications />)} />
          <Route path="reports" element={admin(<AdminReports />)} />
          <Route path="revenue" element={admin(<AdminRevenue />)} />
          <Route path="announcements" element={admin(<AdminAnnouncements />)} />
          <Route path="sponsors" element={admin(<AdminSponsors />)} />
          <Route path="stats" element={admin(<AdminStats />)} />
          <Route path="settings" element={admin(<AdminSettings />)} />
          <Route path="audit" element={admin(<AdminAudit />)} />
          <Route path="demo" element={admin(<AdminDemo />)} />
        </Route>
      </Routes>
    </Suspense>
  )
}
