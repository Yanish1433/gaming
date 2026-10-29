import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Bell, ChevronDown, Handshake, LogOut, Package, Settings, Shield, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { api, asList } from '../../lib/api'
import { Avatar } from '../ui/Bits'
import GameIcon from '../art/GameIcon'
import { GAMES } from '../../lib/games'

export function Logo({ className = '' }) {
  return (
    <Link to="/" className={`group flex items-center gap-2 ${className}`} aria-label="Arena Nepal home">
      <svg viewBox="0 0 32 32" className="size-8 transition-transform group-hover:-rotate-6" aria-hidden>
        <rect width="32" height="32" fill="#DC143C" />
        <path d="M6 27 L16 5 L26 27 L20 27 L16 17 L12 27 Z" fill="#121110" />
        <rect x="11" y="21" width="10" height="3" fill="#EFE7DA" />
      </svg>
      <span className="display text-2xl leading-none">
        Arena<span className="text-crimson">/</span>Nepal
      </span>
    </Link>
  )
}

const LINKS = [
  { to: '/games', label: 'Games' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/store', label: 'Top-up' },
]

function useUnread(user) {
  const [count, setCount] = useState(0)
  const { pathname } = useLocation()
  useEffect(() => {
    if (!user) return setCount(0)
    let alive = true
    api
      .get('/notifications')
      .then(({ data }) => alive && setCount(asList(data).filter((n) => !n.read).length))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [user, pathname])
  return count
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const unread = useUnread(user)
  const [menu, setMenu] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => setMenu(false), [pathname])
  useEffect(() => {
    if (!menu) return
    const close = (e) => !ref.current?.contains(e.target) && setMenu(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menu])

  return (
    <header className="sticky top-0 z-50 border-b-2 border-paper/10 bg-ink/95 backdrop-blur-[2px]">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Logo />
        <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Main">
          <GamesMenu />
          {user?.role === 'player' && (
            <NavLink
              to="/become-organiser"
              className={({ isActive }) =>
                `relative flex items-center gap-1.5 px-3 py-2 font-semibold transition-colors ${isActive ? 'text-paper' : 'text-paper/60 hover:text-paper'}`
              }
            >
              {({ isActive }) => (
                <>
                  <Handshake className="size-4" />
                  Become organiser
                  {isActive && <motion.span layoutId="nav-underline" className="absolute inset-x-3 -bottom-[13px] h-1 bg-crimson" />}
                </>
              )}
            </NavLink>
          )}
          {LINKS.filter((l) => l.to !== '/games').map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `relative px-3 py-2 font-semibold transition-colors ${isActive ? 'text-paper' : 'text-paper/60 hover:text-paper'}`
              }
            >
              {({ isActive }) => (
                <>
                  {l.label}
                  {isActive && <motion.span layoutId="nav-underline" className="absolute inset-x-3 -bottom-[13px] h-1 bg-crimson" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Link
                to="/notifications"
                className="relative grid size-10 place-items-center text-paper/80 hover:bg-paper/10 hover:text-paper"
                aria-label={unread ? `${unread} unread notifications` : 'Notifications'}
              >
                <Bell className="size-5" />
                {unread > 0 && (
                  <span className="absolute right-1 top-1 grid min-w-4 place-items-center bg-crimson px-1 font-mono text-[10px] font-bold leading-4 text-paper">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>
              <div ref={ref} className="relative hidden md:block">
                <button
                  onClick={() => setMenu((m) => !m)}
                  className="flex items-center gap-2 py-1 pl-1 pr-2 hover:bg-paper/10"
                  aria-expanded={menu}
                >
                  <Avatar user={user} size={32} />
                  <span className="max-w-32 truncate font-semibold">{user.username}</span>
                  <ChevronDown className={`size-4 transition-transform ${menu ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {menu && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, rotate: -1 }}
                      animate={{ opacity: 1, y: 0, rotate: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="paper-card absolute right-0 mt-2 w-52 border-2 border-ink py-1 shadow-hard"
                    >
                      <MenuItem to={`/u/${user.username}`} icon={User}>Profile</MenuItem>
                      <MenuItem to="/orders" icon={Package}>My orders</MenuItem>
                      <MenuItem to="/settings" icon={Settings}>Settings</MenuItem>
                      {(user.role === 'admin' || user.role === 'organiser') && (
                        <MenuItem to="/admin" icon={Shield}>{user.role === 'admin' ? 'Admin' : 'Organiser'}</MenuItem>
                      )}
                      <button
                        onClick={() => {
                          logout()
                          navigate('/')
                        }}
                        className="flex w-full items-center gap-2 border-t border-ink/15 px-3 py-2 text-left font-medium text-crimson hover:bg-ink/5"
                      >
                        <LogOut className="size-4" /> Log out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="px-3 py-2 font-semibold text-paper/75 hover:text-paper">
                Log in
              </Link>
              <Link
                to="/register"
                className="hidden h-10 items-center border-2 border-ink bg-crimson px-4 font-semibold shadow-hard transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 sm:inline-flex"
              >
                Join free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

// "Games" with a hover/click switcher listing each hub with its badge
function GamesMenu() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const ref = useRef(null)
  const active = pathname.startsWith('/games')
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    if (!open) return
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`relative flex items-center gap-1 px-3 py-2 font-semibold transition-colors ${active ? 'text-paper' : 'text-paper/60 hover:text-paper'}`}
      >
        Games <ChevronDown className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        {active && <motion.span layoutId="nav-underline" className="absolute inset-x-3 -bottom-[13px] h-1 bg-crimson" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, rotate: -1 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="paper-card absolute left-0 top-full z-50 mt-2 w-72 border-2 border-ink p-2 shadow-hard"
          >
            {GAMES.map((g) => (
              <Link
                key={g.slug}
                to={`/games/${g.slug}`}
                className={`flex items-center gap-3 px-2 py-2 font-semibold hover:bg-ink hover:text-paper ${pathname.startsWith(`/games/${g.slug}`) ? 'bg-ink/10' : ''}`}
              >
                <GameIcon game={g} size={36} />
                <span className="flex-1">{g.name}</span>
                <span className="size-3" style={{ background: g.accent }} />
              </Link>
            ))}
            <Link to="/games" className="mt-1 block border-t-2 border-ink/15 px-2 pt-2 font-mono text-xs uppercase tracking-widest text-ink/60 hover:text-crimson">
              All games →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MenuItem({ to, icon: Icon, children }) {
  return (
    <Link to={to} className="flex items-center gap-2 px-3 py-2 font-medium hover:bg-ink hover:text-paper">
      <Icon className="size-4" /> {children}
    </Link>
  )
}
