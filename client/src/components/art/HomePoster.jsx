import { GAMES } from '../../lib/games'
import { GameEmblem } from './GameIcon'

// Static stand-in for the 3D airdrop: same composition, flat print.
export default function HomePoster({ className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 320 300" className="h-full w-full" role="img" aria-label="Airdrop crate on a parachute">
        <g transform="translate(160 40) rotate(-6)">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path
              key={i}
              d={`M${-110 + i * 36.6} 50 Q${-92 + i * 36.6} ${i === 0 || i === 5 ? 6 : -8} ${-73.4 + i * 36.6} 50`}
              fill={i % 2 ? '#003893' : '#EFE7DA'}
              stroke="#121110"
              strokeWidth="4"
              strokeLinejoin="round"
            />
          ))}
          <path d="M-110 50 L-34 150 M110 50 L34 150 M-37 50 L-12 150 M37 50 L12 150" stroke="#121110" strokeWidth="2.5" />
          <g transform="translate(0 182)">
            <rect x="-46" y="-36" width="92" height="74" fill="#DC143C" stroke="#121110" strokeWidth="5" />
            <rect x="-48" y="-6" width="96" height="11" fill="#F2A900" stroke="#121110" strokeWidth="3" />
            <rect x="-6" y="-36" width="12" height="74" fill="#F2A900" stroke="#121110" strokeWidth="3" />
            <rect x="14" y="-28" width="22" height="16" fill="#EFE7DA" />
          </g>
        </g>
      </svg>
      {GAMES.map((g, i) => (
        <span
          key={g.slug}
          className="absolute"
          style={{ left: `${[4, 78, 6, 80][i]}%`, top: `${[18, 26, 66, 70][i]}%`, transform: `rotate(${[-8, 6, 5, -6][i]}deg)` }}
        >
          <GameEmblem game={g} size={44} className="rounded-full border-2 border-ink" />
        </span>
      ))}
    </div>
  )
}
