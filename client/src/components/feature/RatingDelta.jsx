import { useEffect, useRef, useState } from 'react'
import { animate, useInView, useReducedMotion } from 'motion/react'

// "+18" / "-14" that counts up from 0 once it scrolls in
export default function RatingDelta({ value, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const reduce = useReducedMotion()
  const target = Number(value) || 0
  const [shown, setShown] = useState(reduce ? target : 0)

  useEffect(() => {
    if (!inView) return
    if (reduce) return setShown(target)
    const c = animate(0, target, { duration: 0.9, ease: 'easeOut', onUpdate: (v) => setShown(Math.round(v)) })
    return () => c.stop()
  }, [inView, target, reduce])

  const up = target > 0
  const flat = target === 0
  return (
    <span ref={ref} className={`font-mono font-bold tabular-nums ${flat ? 'text-paper/50' : up ? 'text-[#2BB673]' : 'text-crimson'} ${className}`}>
      {up ? '+' : flat ? '±' : '−'}
      {Math.abs(shown)}
    </span>
  )
}
