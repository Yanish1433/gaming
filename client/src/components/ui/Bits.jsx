import { useEffect, useRef, useState } from 'react'
import { animate, motion, useInView, useReducedMotion } from 'motion/react'

// "01 / PLAY" style section label
export function SectionLabel({ num, children, className = '' }) {
  return (
    <p className={`flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-paper/60 ${className}`}>
      <span className="text-crimson">{num}</span>
      <span className="h-px w-8 bg-paper/30" />
      <span>{children}</span>
    </p>
  )
}

// counts up from 0 once visible
export function CountUp({ value, className = '', duration = 1.4 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const reduce = useReducedMotion()
  const target = Number(value) || 0
  const [shown, setShown] = useState(reduce ? target : 0)

  useEffect(() => {
    if (!inView) return
    if (reduce) {
      setShown(target)
      return
    }
    const controls = animate(0, target, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setShown(Math.round(v)),
    })
    return () => controls.stop()
  }, [inView, target, reduce, duration])

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {shown.toLocaleString('en-IN')}
    </span>
  )
}

// torn paper edge; put it at the top or bottom of a paper section
export function TornEdge({ flip = false, color = '#EFE7DA', className = '' }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1200 28"
      preserveAspectRatio="none"
      className={`block h-5 w-full sm:h-7 ${flip ? 'rotate-180' : ''} ${className}`}
    >
      <path
        fill={color}
        d="M0 28 L0 14 L22 9 L38 16 L61 6 L83 13 L97 4 L121 15 L140 8 L166 17 L188 7 L203 12 L229 3 L251 14 L268 9 L294 18 L316 6 L333 13 L358 5 L380 16 L398 10 L421 19 L444 7 L462 12 L488 4 L509 15 L527 8 L553 17 L575 6 L592 13 L617 3 L639 14 L657 9 L683 18 L705 7 L722 12 L748 5 L770 16 L787 9 L813 19 L835 6 L852 14 L878 4 L900 15 L917 8 L943 17 L965 5 L982 13 L1008 7 L1030 18 L1047 9 L1073 14 L1095 4 L1117 16 L1134 8 L1160 15 L1182 6 L1200 12 L1200 28 Z"
      />
    </svg>
  )
}

// staggered scroll reveal: wrap a list in <Reveal> and children in <RevealItem>
export function Reveal({ children, className = '', stagger = 0.07, as = 'div' }) {
  const Comp = motion[as] ?? motion.div
  return (
    <Comp
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </Comp>
  )
}

export function RevealItem({ children, className = '', as = 'div', ...rest }) {
  const Comp = motion[as] ?? motion.div
  return (
    <Comp
      className={className}
      variants={{
        hidden: { opacity: 0, y: 28, rotate: 0.6 },
        show: { opacity: 1, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 220, damping: 24 } },
      }}
      {...rest}
    >
      {children}
    </Comp>
  )
}

export function Avatar({ user, size = 40, className = '' }) {
  const name = typeof user === 'string' ? user : user?.username ?? '?'
  const src = typeof user === 'object' ? user?.avatarUrl : null
  const [broken, setBroken] = useState(false)
  // deterministic colour per handle so people are recognisable at a glance
  const palette = ['#DC143C', '#003893', '#F2A900', '#2BB673', '#FF5A1F', '#3D7BFF']
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const bg = palette[h % palette.length]
  if (src && !broken) {
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        onError={() => setBroken(true)}
        className={`shrink-0 border-2 border-ink object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <span
      aria-hidden
      className={`display grid shrink-0 place-items-center border-2 border-ink text-ink ${className}`}
      style={{ width: size, height: size, background: bg, fontSize: size * 0.48 }}
    >
      {name.slice(0, 1)}
    </span>
  )
}

export function PageHead({ kicker, title, children, className = '' }) {
  return (
    <header className={`mb-8 ${className}`}>
      {kicker && <SectionLabel num={kicker.num}>{kicker.text}</SectionLabel>}
      <h1 className="display mt-3 text-5xl sm:text-7xl">{title}</h1>
      {children && <div className="mt-3 max-w-2xl text-paper/70">{children}</div>}
    </header>
  )
}
