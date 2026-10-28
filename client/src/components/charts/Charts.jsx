import { useId, useMemo } from 'react'
import { motion, useReducedMotion } from 'motion/react'

// Hand-made SVG charts in the zine style: marker lines with a hard black offset, hatched fills,
// a slight wobble on axes. No chart library. Every chart renders a quiet empty state on no data.

const INK = '#121110'
const PAPER = '#EFE7DA'

function jitter(i, amt) {
  const x = Math.sin(i * 12.9898 + 4.1) * 43758.5453
  return (x - Math.floor(x) - 0.5) * amt
}

function NoData({ h = 160, text = 'No data for this range yet.' }) {
  return (
    <div className="grid place-items-center border-2 border-dashed border-paper/15 text-sm text-paper/45" style={{ height: h }}>
      {text}
    </div>
  )
}

const shortDate = (d) => {
  const t = new Date(d)
  return Number.isNaN(t.getTime()) ? String(d) : t.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function smooth(pts, lo = -Infinity, hi = Infinity) {
  // Catmull-Rom -> Bezier; control points are clamped to the plot so spikes can't dip below the baseline
  const cy = (v) => Math.min(hi, Math.max(lo, v))
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${cy(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${cy(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return d
}

/** Line (or area with `area`) over [{date, value}] */
export function LineChart({ data = [], color = '#DC143C', area = false, h = 180, format = (v) => v, label }) {
  const reduce = useReducedMotion()
  const uid = useId().replace(/:/g, '')
  const rows = useMemo(() => data.filter((d) => Number.isFinite(Number(d.value))), [data])
  if (rows.length < 2 || rows.every((r) => !Number(r.value))) return <NoData h={h} />
  const W = 600
  const H = h
  const P = { l: 40, r: 12, t: 14, b: 24 }
  const max = Math.max(...rows.map((r) => Number(r.value)), 1)
  const x = (i) => P.l + (i / (rows.length - 1)) * (W - P.l - P.r)
  const y = (v) => P.t + (1 - v / max) * (H - P.t - P.b)
  const pts = rows.map((r, i) => [x(i) + jitter(i, 1), y(Number(r.value)) + jitter(i + 3, 1.5)])
  const line = smooth(pts, P.t, H - P.b)
  const draw = reduce ? {} : { initial: { pathLength: 0 }, whileInView: { pathLength: 1 }, viewport: { once: true }, transition: { duration: 1.2, ease: 'easeInOut' } }
  const peak = rows.reduce((m, r, i) => (Number(r.value) > Number(rows[m].value) ? i : m), 0)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible" role="img" aria-label={label}>
      <defs>
        <pattern id={`${uid}-hatch`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="7" stroke={color} strokeWidth="2.5" />
        </pattern>
      </defs>
      {[0, 0.5, 1].map((f) => (
        <g key={f}>
          <path d={`M${P.l} ${y(max * f) + jitter(f * 9, 2)} L${W - P.r} ${y(max * f) + jitter(f * 7, 2)}`} stroke={PAPER} strokeOpacity=".12" strokeDasharray="4 6" />
          <text x={P.l - 6} y={y(max * f) + 3} textAnchor="end" fontSize="10" className="fill-paper/40 font-mono">
            {format(Math.round(max * f))}
          </text>
        </g>
      ))}
      {area && <path d={`${line} L${pts[pts.length - 1][0]} ${H - P.b} L${pts[0][0]} ${H - P.b} Z`} fill={`url(#${uid}-hatch)`} opacity=".55" />}
      <motion.path d={line} transform="translate(2.5 2.5)" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" {...draw} />
      <motion.path d={line} stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" {...draw} />
      <circle cx={pts[peak][0]} cy={pts[peak][1]} r="5" fill={PAPER} stroke={INK} strokeWidth="2" />
      <text x={pts[peak][0]} y={pts[peak][1] - 10} textAnchor="middle" fontSize="15" className="fill-paper font-display">
        {format(rows[peak].value)}
      </text>
      <path d={`M${P.l} ${H - P.b} L${W - P.r + 4} ${H - P.b - 1}`} stroke={PAPER} strokeOpacity=".45" strokeWidth="2" strokeLinecap="round" />
      <text x={P.l} y={H - 6} fontSize="10" className="fill-paper/40 font-mono">{shortDate(rows[0].date)}</text>
      <text x={W - P.r} y={H - 6} textAnchor="end" fontSize="10" className="fill-paper/40 font-mono">{shortDate(rows[rows.length - 1].date)}</text>
    </svg>
  )
}

/** Vertical bars [{label, value, color}] — chunky, hatched tops, slight tilt per bar */
export function BarChart({ data = [], h = 200, label }) {
  const reduce = useReducedMotion()
  if (!data.length || data.every((d) => !Number(d.value))) return <NoData h={h} />
  const max = Math.max(...data.map((d) => Number(d.value)), 1)
  return (
    <div className="flex items-end gap-3 sm:gap-5" style={{ height: h }} role="img" aria-label={label}>
      {data.map((d, i) => {
        const pct = (Number(d.value) / max) * 100
        return (
          <div key={d.label} className="flex h-full flex-1 flex-col justify-end">
            <span className="display mb-1 text-center text-2xl">{Number(d.value).toLocaleString('en-IN')}</span>
            <motion.div
              initial={reduce ? false : { scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 90, damping: 16, delay: i * 0.08 }}
              className="relative origin-bottom border-2 border-ink shadow-hard"
              style={{ background: d.color ?? '#DC143C', rotate: jitter(i, 2), height: `${Math.max(pct, 2)}%` }}
            >
              <span aria-hidden className="absolute inset-x-0 top-0 h-3 bg-[repeating-linear-gradient(-45deg,#121110_0_3px,transparent_3px_7px)] opacity-40" />
            </motion.div>
            <span className="mt-2 truncate text-center font-mono text-[11px] uppercase text-paper/60">{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}

/** Horizontal bar list [{label, value}] — used for provinces, top organisers */
export function BarList({ data = [], color = '#F2A900', format = (v) => Number(v).toLocaleString('en-IN'), label }) {
  const reduce = useReducedMotion()
  if (!data.length) return <NoData h={120} />
  const max = Math.max(...data.map((d) => Number(d.value)), 1)
  return (
    <ul className="space-y-2" aria-label={label}>
      {data.map((d, i) => (
        <li key={d.label} className="grid grid-cols-[7.5rem_1fr_3.5rem] items-center gap-3">
          <span className="truncate text-sm font-semibold">{d.label}</span>
          <span className="relative h-5 bg-paper/5">
            <motion.span
              initial={reduce ? false : { scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-y-0 left-0 origin-left border-r-4 border-ink"
              style={{ background: color, width: `${Math.max((Number(d.value) / max) * 100, 1)}%` }}
            />
          </span>
          <span className="text-right font-mono text-sm tabular-nums">{format(d.value)}</span>
        </li>
      ))}
    </ul>
  )
}

/** Donut [{label, value, color}] with a big centre number */
export function Donut({ data = [], size = 180, center, label }) {
  const reduce = useReducedMotion()
  const total = data.reduce((s, d) => s + (Number(d.value) || 0), 0)
  if (!total) return <NoData h={size} />
  const R = 70
  const C = 2 * Math.PI * R
  let acc = 0
  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label={label} className="shrink-0">
        <circle cx="103" cy="103" r={R} fill="none" stroke={INK} strokeWidth="34" />
        <g transform="rotate(-90 100 100)">
          {data.map((d, i) => {
            const frac = (Number(d.value) || 0) / total
            const seg = (
              <motion.circle
                key={d.label}
                cx="100"
                cy="100"
                r={R}
                fill="none"
                stroke={d.color}
                strokeWidth="30"
                strokeDasharray={`${frac * C} ${C}`}
                strokeDashoffset={-acc * C}
                initial={reduce ? false : { opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
              />
            )
            acc += frac
            return seg
          })}
        </g>
        <circle cx="100" cy="100" r={R - 15} fill="none" stroke={INK} strokeWidth="2" />
        <circle cx="100" cy="100" r={R + 15} fill="none" stroke={INK} strokeWidth="2" />
        <text x="100" y="108" textAnchor="middle" fontSize="34" className="fill-paper font-display">
          {center ?? total}
        </text>
      </svg>
      <ul className="space-y-1.5">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2 text-sm">
            <span className="size-3 border border-ink" style={{ background: d.color }} />
            <span className="w-20 capitalize">{d.label}</span>
            <span className="font-mono tabular-nums text-paper/70">{Number(d.value).toLocaleString('en-IN')}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
