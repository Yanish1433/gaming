import { Link } from 'react-router'
import { GAMES } from '../../lib/games'
import { TornEdge } from '../ui/Bits'
import { Logo } from './Navbar'

export default function Footer() {
  return (
    <footer className="mt-24">
      <TornEdge color="#1c1a18" />
      <div className="bg-ink-2 pb-28 pt-10 md:pb-12">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-paper/60">
              Made in Kathmandu for everyone from Biratnagar to Dhangadhi who has ever typed “1v1 aaija” in a group chat.
            </p>
            <p className="mt-6 inline-block border-2 border-marigold px-3 py-2 font-mono text-xs leading-relaxed text-marigold">
              Arena Nepal is a free community platform. No betting. Prizes are sponsor-funded.
            </p>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-paper/40">Games</p>
            <ul className="mt-3 space-y-2">
              {GAMES.map((g) => (
                <li key={g.slug}>
                  <Link to={`/games/${g.slug}`} className="group inline-flex items-center gap-2 text-paper/75 hover:text-paper">
                    <span className="size-2.5 transition-transform group-hover:rotate-45" style={{ background: g.accent }} />
                    {g.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-paper/40">Arena</p>
            <ul className="mt-3 space-y-2 text-paper/75">
              <li><Link className="hover:text-paper" to="/leaderboard">Leaderboard</Link></li>
              <li><Link className="hover:text-paper" to="/stats">Arena in numbers</Link></li>
              <li><Link className="hover:text-paper" to="/store">Top-up store</Link></li>
              <li><Link className="hover:text-paper" to="/challenges/new">Post a challenge</Link></li>
              <li><Link className="hover:text-paper" to="/register">Join free</Link></li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-10 flex max-w-7xl flex-wrap justify-between gap-2 px-4 font-mono text-[11px] text-paper/35 sm:px-6">
          <span>© {new Date().getFullYear()} Arena Nepal · 16+ only</span>
          <span>Rank points are bragging rights. They can't be bought, sold or cashed.</span>
        </div>
      </div>
    </footer>
  )
}
