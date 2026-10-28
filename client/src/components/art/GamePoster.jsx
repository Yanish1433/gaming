import { useId } from 'react'
import { heroCandidates, useFirstImage } from './useAsset'

// Original zine-style poster art per game. Flat shapes, halftone, torn bottom edge.
// Every path here is hand-written; nothing is traced from official artwork.

const INK = '#121110'
const PAPER = '#EFE7DA'
const RED = '#DC143C'
const BLUE = '#003893'

const TORN = 'M0 270 L18 262 L34 272 L52 260 L71 268 L90 258 L112 270 L131 261 L150 271 L171 259 L192 268 L210 260 L232 272 L251 262 L270 270 L292 258 L311 268 L330 261 L352 271 L371 260 L388 268 L400 262 L400 300 L0 300 Z'

function Halftone({ id, color, size = 8, r = 1.6 }) {
  return (
    <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse" patternTransform="rotate(20)">
      <circle cx={size / 2} cy={size / 2} r={r} fill={color} />
    </pattern>
  )
}

function Pubg({ uid, accent }) {
  return (
    <>
      {/* sky + sun */}
      <rect width="400" height="300" fill={accent} />
      <rect width="400" height="300" fill={`url(#${uid}-dots)`} opacity=".35" />
      <circle cx="300" cy="78" r="46" fill={PAPER} />
      {/* Erangel silhouette: main island + Sosnovka military island + the bridges */}
      <path d="M38 196 C40 160 78 128 128 132 C170 120 214 138 232 162 C258 168 270 196 252 214 C226 236 170 232 140 240 C96 246 52 236 38 196 Z" fill={INK} />
      <path d="M96 252 C110 240 168 240 190 250 C200 262 168 274 132 272 C104 270 88 262 96 252 Z" fill={INK} />
      <path d="M128 238 L124 252 M176 236 L178 250" stroke={PAPER} strokeWidth="4" />
      {/* Miramar dune band in the distance */}
      <path d="M232 170 C262 150 300 160 330 150 C360 142 384 152 400 148 L400 200 C370 206 330 196 300 204 C276 210 252 200 232 170 Z" fill={RED} />
      {/* drop path dashes + parachute */}
      <path d="M20 40 C120 60 210 70 330 30" stroke={INK} strokeWidth="3" strokeDasharray="10 9" fill="none" />
      <g transform="translate(206 62) rotate(-8)">
        <path d="M-26 0 C-26 -22 26 -22 26 0 Z" fill={PAPER} stroke={INK} strokeWidth="3" />
        <path d="M-26 0 L-6 30 M26 0 L6 30 M0 -2 L0 30" stroke={INK} strokeWidth="2" />
        <rect x="-9" y="28" width="18" height="16" fill={RED} stroke={INK} strokeWidth="3" />
      </g>
      {/* pin markers */}
      <g fill={RED} stroke={INK} strokeWidth="3">
        <path d="M120 160 l-10 -18 a12 12 0 1 1 20 0 Z" />
        <path d="M196 190 l-10 -18 a12 12 0 1 1 20 0 Z" />
      </g>
      <text x="378" y="40" textAnchor="end" fontFamily="Anton, Impact, sans-serif" fontSize="22" fill={INK}>DROP ZONE</text>
    </>
  )
}

function FreeFire({ uid, accent }) {
  return (
    <>
      <rect width="400" height="300" fill={INK} />
      <rect width="400" height="300" fill={`url(#${uid}-dots)`} opacity=".5" />
      {/* Bermuda island */}
      <path d="M60 210 C40 170 80 120 150 116 C220 104 300 122 330 160 C352 190 330 230 270 238 C210 252 120 252 60 210 Z" fill={accent} />
      <path d="M150 150 C176 140 220 144 236 162 C222 182 176 186 150 172 Z" fill={INK} opacity=".35" />
      {/* clock tower */}
      <g transform="translate(232 70)">
        <rect x="0" y="20" width="26" height="78" fill={PAPER} stroke={INK} strokeWidth="3" />
        <path d="M-4 22 L13 0 L30 22 Z" fill={RED} stroke={INK} strokeWidth="3" />
        <circle cx="13" cy="40" r="8" fill={INK} />
        <path d="M13 40 L13 34 M13 40 L17 42" stroke={PAPER} strokeWidth="2" />
      </g>
      {/* gloo wall: stacked ice blocks, curved */}
      <g stroke={INK} strokeWidth="3" fill="#9ED6F2">
        <path d="M70 196 C80 160 112 140 150 138 L150 168 C124 170 104 184 98 204 Z" />
        <path d="M150 138 C188 138 214 154 226 180 L198 192 C190 176 172 168 150 168 Z" />
        <path d="M98 204 L150 168 M150 168 L198 192" stroke={INK} />
      </g>
      {/* flame licks */}
      <g fill={accent} stroke={INK} strokeWidth="3">
        <path d="M30 120 C40 96 30 84 46 66 C46 86 60 90 56 110 C66 104 66 92 66 92 C78 112 64 128 50 132 C40 132 32 128 30 120 Z" />
        <path d="M350 104 C356 84 348 74 360 60 C362 76 372 80 368 96 C376 92 378 82 378 82 C388 100 376 112 364 114 C356 114 350 110 350 104 Z" />
      </g>
      <text x="378" y="40" textAnchor="end" fontFamily="Anton, Impact, sans-serif" fontSize="22" fill={PAPER}>BOOYAH ZONE</text>
    </>
  )
}

function EFootball({ uid, accent }) {
  return (
    <>
      <rect width="400" height="300" fill={accent} />
      {/* mown stripes */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect key={i} x={i * 60} y="0" width="30" height="300" fill={INK} opacity=".08" />
      ))}
      <rect width="400" height="300" fill={`url(#${uid}-dots)`} opacity=".25" />
      {/* pitch lines in perspective */}
      <g stroke={PAPER} strokeWidth="4" fill="none">
        <path d="M40 250 L120 90 L280 90 L360 250 Z" />
        <path d="M80 170 L320 170" />
        <ellipse cx="200" cy="170" rx="44" ry="16" />
        <path d="M160 90 L170 112 L230 112 L240 90" />
      </g>
      {/* striker silhouette mid-kick */}
      <g fill={INK}>
        <circle cx="140" cy="104" r="14" />
        <path d="M128 120 L156 118 L166 168 L150 170 Z" />
        <path d="M152 168 L130 212 L118 206 L138 164 Z" />
        <path d="M160 164 L204 182 L198 194 L154 176 Z" />
        <path d="M132 124 L104 150 L96 142 L126 116 Z" />
        <path d="M156 122 L188 136 L184 146 L152 132 Z" />
      </g>
      <circle cx="228" cy="196" r="16" fill={PAPER} stroke={INK} strokeWidth="4" />
      <path d="M228 186 L236 192 L233 202 L223 202 L220 192 Z" fill={INK} />
      <path d="M246 196 L290 192 M246 204 L282 206" stroke={INK} strokeWidth="3" strokeDasharray="6 6" />
      <text x="378" y="40" textAnchor="end" fontFamily="Anton, Impact, sans-serif" fontSize="22" fill={INK}>1V1 · FULL TIME</text>
    </>
  )
}

function FcMobile({ uid, accent }) {
  return (
    <>
      <rect width="400" height="300" fill={BLUE} />
      <rect width="400" height="300" fill={`url(#${uid}-dots)`} opacity=".35" />
      {/* stadium bowl + floodlights */}
      <path d="M0 210 C60 150 340 150 400 210 L400 300 L0 300 Z" fill={INK} />
      <path d="M30 214 C90 170 310 170 370 214" stroke={accent} strokeWidth="6" fill="none" />
      {[60, 340].map((x) => (
        <g key={x}>
          <rect x={x - 3} y="60" width="6" height="120" fill={INK} />
          <rect x={x - 18} y="46" width="36" height="20" fill={PAPER} stroke={INK} strokeWidth="3" />
          <path d={`M${x - 18} 66 L${x - 60} 200 L${x + 60} 200 L${x + 18} 66 Z`} fill={PAPER} opacity=".08" />
        </g>
      ))}
      {/* trophy */}
      <g transform="translate(200 160)" stroke={INK} strokeWidth="4">
        <path d="M-34 -96 H34 V-70 C34 -44 18 -30 0 -30 C-18 -30 -34 -44 -34 -70 Z" fill="#F2A900" />
        <path d="M-34 -86 H-54 C-54 -60 -42 -54 -32 -54 M34 -86 H54 C54 -60 42 -54 32 -54" fill="none" />
        <rect x="-8" y="-32" width="16" height="22" fill="#F2A900" />
        <rect x="-28" y="-12" width="56" height="16" fill={accent} />
      </g>
      <circle cx="292" cy="236" r="18" fill={PAPER} stroke={INK} strokeWidth="4" />
      <path d="M292 225 L301 231 L298 242 L286 242 L283 231 Z" fill={INK} />
      <text x="378" y="40" textAnchor="end" fontFamily="Anton, Impact, sans-serif" fontSize="22" fill={PAPER}>MATCHDAY</text>
    </>
  )
}

const ART = { pubg: Pubg, freefire: FreeFire, efootball: EFootball, fcmobile: FcMobile }

/**
 * Poster for a game. If `client/public/games/<slug>/hero.(webp|jpg)` exists it's laid underneath in duotone,
 * with the SVG art multiplied on top.
 */
export default function GamePoster({ game, className = '', torn = true }) {
  const uid = useId().replace(/:/g, '')
  const Art = ART[game?.slug] ?? FcMobile
  const hero = useFirstImage(game ? heroCandidates(game.slug) : [])
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: game?.accent }}>
      {hero && (
        <>
          <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover grayscale contrast-125" />
          <span className="absolute inset-0 mix-blend-multiply" style={{ background: game?.accent }} />
        </>
      )}
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className={`relative block h-full w-full ${hero ? 'opacity-70 mix-blend-multiply' : ''}`} role="img" aria-label={`${game?.name ?? 'Game'} poster illustration`}>
        <defs>
          <Halftone id={`${uid}-dots`} color={game?.slug === 'freefire' || game?.slug === 'fcmobile' ? '#ffffff22' : INK} />
        </defs>
        <Art uid={uid} accent={game?.accent ?? RED} />
        {torn && <path d={TORN} fill={INK} />}
      </svg>
    </div>
  )
}
