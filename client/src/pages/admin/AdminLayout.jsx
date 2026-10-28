import { Suspense, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import {
  BarChart3, Bell, ClipboardList, Coins, Database, Flag, Gauge, Gavel, Handshake, LineChart, Megaphone, Menu, Package,
  ScrollText, Settings2, Store, Swords, Trophy, UserCheck, Users, X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Skeleton from '../../components/ui/Skeleton'

// Sidebar groups. `admin: true` items are hidden from organisers.
const GROUPS = [
  { label: 'Overview', items: [{ to: '/admin', label: 'Dashboard', icon: Gauge, end: true, admin: true }] },
  {
    label: 'Play',
    items: [
      { to: '/admin/challenges', label: 'Challenges', icon: Swords, admin: true },
      { to: '/admin/matches', label: 'Matches', icon: ClipboardList },
      { to: '/admin/tournaments', label: 'Tournaments', icon: Trophy, admin: true },
      { to: '/admin/disputes', label: 'Disputes', icon: Gavel, admin: true },
    ],
  },
  {
    label: 'People',
    items: [
      { to: '/admin/users', label: 'Users', icon: Users, admin: true },
      { to: '/admin/applications', label: 'Organiser apps', icon: UserCheck, admin: true },
      { to: '/admin/reports', label: 'Reports', icon: Flag, admin: true },
    ],
  },
  {
    label: 'Money',
    items: [
      { to: '/admin/orders', label: 'Orders', icon: Package, admin: true },
      { to: '/admin/products', label: 'Products', icon: Store, admin: true },
      { to: '/admin/revenue', label: 'Revenue', icon: Coins, admin: true },
    ],
  },
  {
    label: 'Growth',
    items: [
      { to: '/admin/announcements', label: 'Announcements', icon: Megaphone, admin: true },
      { to: '/admin/sponsors', label: 'Sponsors', icon: Handshake, admin: true },
      { to: '/admin/stats', label: 'Public stats', icon: BarChart3, admin: true },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/admin/settings', label: 'Site settings', icon: Settings2, admin: true },
      { to: '/admin/audit', label: 'Audit log', icon: ScrollText, admin: true },
      { to: '/admin/demo', label: 'Demo data', icon: Database, admin: true },
    ],
  },
]

function SideNav({ isAdmin, onNavigate }) {
  return (
    <nav aria-label="Admin" className="space-y-5">
      {GROUPS.map((g) => {
        const items = g.items.filter((i) => isAdmin || !i.admin)
        if (!items.length) return null
        return (
          <div key={g.label}>
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-paper/40">{g.label}</p>
            <ul className="space-y-0.5">
              {items.map((l) => (
                <li key={l.to}>
                  <NavLink
                    to={l.to}
                    end={l.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `flex items-center gap-2 border-2 px-3 py-1.5 text-[15px] font-semibold transition-colors ${
                        isActive ? 'border-ink bg-paper text-ink shadow-hard' : 'border-transparent text-paper/65 hover:text-paper'
                      }`
                    }
                  >
                    <l.icon className="size-4" /> {l.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}

export default function AdminLayout() {
  const { user } = useAuth()
  const location = useLocation()
  const isAdmin = user?.role === 'admin'
  const [drawer, setDrawer] = useState(false)
  useEffect(() => setDrawer(false), [location.pathname])

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 md:grid-cols-[13.5rem_1fr]">
      {/* desktop sidebar */}
      <aside className="hidden md:block">
        <p className="mb-5 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-crimson">
          <LineChart className="size-4" /> {isAdmin ? 'Control room' : 'Organiser desk'}
        </p>
        <div className="sticky top-20">
          <SideNav isAdmin={isAdmin} />
        </div>
      </aside>

      {/* mobile drawer trigger */}
      <div className="flex items-center justify-between md:hidden">
        <p className="font-mono text-xs uppercase tracking-widest text-crimson">{isAdmin ? 'Control room' : 'Organiser desk'}</p>
        <button onClick={() => setDrawer(true)} className="flex items-center gap-2 border-2 border-paper/30 px-3 py-2 font-semibold" aria-expanded={drawer}>
          <Menu className="size-4" /> Menu
        </button>
      </div>
      <AnimatePresence>
        {drawer && (
          <motion.div className="fixed inset-0 z-[65] bg-ink/70 md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)}>
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="h-full w-72 overflow-y-auto border-r-2 border-ink bg-ink-2 p-5 pb-24"
              aria-label="Admin menu"
            >
              <div className="mb-5 flex items-center justify-between">
                <p className="display text-2xl">Control room</p>
                <button onClick={() => setDrawer(false)} aria-label="Close menu" className="grid size-9 place-items-center border-2 border-paper/30">
                  <X className="size-4" />
                </button>
              </div>
              <SideNav isAdmin={isAdmin} onNavigate={() => setDrawer(false)} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="min-w-0">
        <Suspense fallback={<Skeleton className="h-64" />}>
          {isAdmin || location.pathname !== '/admin' ? <Outlet /> : <OrganiserHome />}
        </Suspense>
      </section>
    </div>
  )
}

function OrganiserHome() {
  return (
    <div>
      <h1 className="display text-5xl">Organiser desk</h1>
      <p className="mt-2 text-paper/65">Create and run custom rooms from Matches. Room IDs unlock for players 15 minutes before start.</p>
      <NavLink to="/admin/matches" className="mt-6 inline-flex h-11 items-center gap-2 border-2 border-ink bg-crimson px-5 font-semibold shadow-hard">
        <Bell className="size-4" /> Go to matches
      </NavLink>
    </div>
  )
}
