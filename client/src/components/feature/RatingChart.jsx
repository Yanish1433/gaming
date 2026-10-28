import { useMemo } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { TIERS } from '../../lib/ranked'
import { fmtDay } from '../../lib/format'

const W = 640
const H = 240
const PAD = { l: 44, r: 16, t: 18, b: 30 }

// tiny deterministic wobble so the line looks drawn with a marker, not plotted
function jitter(i, amt) {
  const x = Math.sin(i * 12.9898) * 43758.5453
  return (x - Math.floor(x) - 0.5) * amt
}

// Hand-drawn style rating chart: marker line, scribbled tier bands, dots like pen taps.
export default function RatingChart({ points, accent = '#F2A900' }) {
  const reduce = useReducedMotion()
  const data = useMemo(
    () => (points ?? []).map((p) => ({ at: new Date(p.at).getTime(), rating: Number(p.rating) })).filter((p) => Number.isFinite(p.at) && Number.isFinite(p.rating)).sort((a, b) => a.at - b.at),
    [points],
  )

  if (data.length < 2) {
    return (
      <div className="grid h-48 place-items-center border-2 border-dashed border-paper/20 text-center text-paper/55">
        <p>
          <span className="display block text-2xl text-paper/80">Graph needs two games</span>
          Play a couple of ranked challenges and your line starts here.
        </p>
      </div>
    )
  }

  const lo = Math.min(...data.map((d) => d.rating))
  const hi = Math.max(...data.map((d) => d.rating))
  const min = Math.floor((lo - 40) / 50) * 50
  const max = Math.ceil((hi + 40) / 50) * 50
  const t0 = data[0].at
  const t1 = data[data.length - 1].at || t0 + 1
  const x = (t) => PAD.l + ((t - t0) / (t1 - t0 || 1)) * (W - PAD.l - PAD.r)
  const y = (r) => PAD.t + (1 - (r - min) / (max - min || 1)) * (H - PAD.t - PAD.b)

  const pts = data.map((d, i) => [x(d.at) + jitter(i, 1.5), y(d.rating) + jitter(i + 7, 2.5)])
  // smooth-ish path through points (Catmull-Rom → Bezier)
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }

  const bands = TIERS.filter((t) => t.min > min && t.min < max)
  const last = data[data.length - 1]
  const draw = reduce ? {} : { initial: { pathLength: 0 }, whileInView: { pathLength: 1 }, viewport: { once: true } }

  return (
    <figure className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible" role="img" aria-label={`Rating from ${data[0].rating} to ${last.rating} over ${data.length} games`}>
        {/* tier thresholds, drawn as wobbly dashed pencil lines */}
        {bands.map((t, i) => {
          const yy = y(t.min)
          return (
            <g key={t.name}>
              <path d={`M${PAD.l} ${yy + jitter(i, 2)} Q ${W / 2} ${yy + jitter(i + 3, 5)} ${W - PAD.r} ${yy + jitter(i + 5, 2)}`} stroke={t.bg} strokeOpacity=".55" strokeWidth="1.5" strokeDasharray="6 7" fill="none" />
              <text x={PAD.l + 6} y={yy - 5} className="fill-paper/60 font-mono" fontSize="10">
                {t.name.toUpperCase()} {t.min}
              </text>
            </g>
          )
        })}
        {/* y labels */}
        {[min, Math.round((min + max) / 2), max].map((v) => (
          <text key={v} x={PAD.l - 8} y={y(v) + 3} textAnchor="end" className="fill-paper/40 font-mono" fontSize="10">
            {v}
          </text>
        ))}
        {/* hand-drawn axes */}
        <path d={`M${PAD.l} ${PAD.t - 6} L${PAD.l + 1} ${H - PAD.b} L${W - PAD.r + 4} ${H - PAD.b - 1}`} stroke="#EFE7DA" strokeOpacity=".5" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* shadow line + main marker line */}
        <motion.path d={d} transform="translate(3 3)" stroke="#000" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" {...draw} transition={{ duration: 1.4, ease: 'easeInOut' }} />
        <motion.path d={d} stroke={accent} strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round" {...draw} transition={{ duration: 1.4, ease: 'easeInOut' }} />
        {pts.map(([px, py], i) => (
          <motion.circle
            key={i}
            cx={px}
            cy={py}
            r={i === pts.length - 1 ? 6 : 3}
            fill={i === pts.length - 1 ? '#DC143C' : '#EFE7DA'}
            stroke="#121110"
            strokeWidth="2"
            initial={reduce ? false : { scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 + (i / pts.length) * 1.2 }}
          />
        ))}
        {/* hand-written callout on the latest point */}
        <text x={pts[pts.length - 1][0] - 8} y={pts[pts.length - 1][1] - 14} textAnchor="end" className="fill-paper font-display" fontSize="20">
          {last.rating}
        </text>
        <text x={PAD.l} y={H - 8} className="fill-paper/40 font-mono" fontSize="10">{fmtDay(data[0].at)}</text>
        <text x={W - PAD.r} y={H - 8} textAnchor="end" className="fill-paper/40 font-mono" fontSize="10">{fmtDay(last.at)}</text>
      </svg>
    </figure>
  )
}
