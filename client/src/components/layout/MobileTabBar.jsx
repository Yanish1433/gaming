import { NavLink } from 'react-router'
import { motion } from 'motion/react'
import { Crosshair, House, ShoppingBag, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function MobileTabBar() {
  const { user } = useAuth()
  const tabs = [
    { to: '/', label: 'Home', icon: House, end: true },
    { to: '/games', label: 'Play', icon: Crosshair },
    { to: '/store', label: 'Store', icon: ShoppingBag },
    { to: user ? `/u/${user.username}` : '/login', label: user ? 'Profile' : 'Log in', icon: User },
  ]
  return (
    <nav
      aria-label="Tabs"
      className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t-2 border-ink bg-paper text-ink pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {tabs.map((t) => (
        <NavLink key={t.label} to={t.to} end={t.end} className="relative flex flex-col items-center gap-0.5 py-2">
          {({ isActive }) => (
            <>
              {isActive && <motion.span layoutId="tab-bg" className="absolute inset-x-2 inset-y-1 bg-ink" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />}
              <t.icon className={`relative size-5 ${isActive ? 'text-marigold' : ''}`} aria-hidden />
              <span className={`relative text-[11px] font-bold uppercase tracking-wide ${isActive ? 'text-paper' : ''}`}>{t.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
