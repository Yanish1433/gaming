import { motion, useReducedMotion } from 'motion/react'

// Hand-drawn underline that draws itself in once it scrolls into view.
export function Scribble({ children, color = '#DC143C', className = '', delay = 0.35 }) {
  const reduce = useReducedMotion()
  return (
    <span className={`relative inline-block ${className}`}>
      <span className="relative z-10">{children}</span>
      <svg
        aria-hidden
        viewBox="0 0 300 24"
        preserveAspectRatio="none"
        className="pointer-events-none absolute -bottom-[0.18em] left-[-4%] h-[0.32em] w-[108%] overflow-visible"
      >
        <motion.path
          d="M3 15 C 40 6, 80 19, 122 11 S 196 4, 232 13 S 282 16, 297 7"
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          initial={{ pathLength: reduce ? 1 : 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay, ease: [0.65, 0, 0.35, 1] }}
        />
        <motion.path
          d="M18 21 C 70 15, 150 22, 210 17"
          fill="none"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          initial={{ pathLength: reduce ? 1 : 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: delay + 0.75, ease: 'easeOut' }}
        />
      </svg>
    </span>
  )
}

// A rough hand-drawn circle around a word
export function Circled({ children, color = '#F2A900', className = '' }) {
  const reduce = useReducedMotion()
  return (
    <span className={`relative inline-block px-1 ${className}`}>
      <span className="relative z-10">{children}</span>
      <svg aria-hidden viewBox="0 0 200 80" preserveAspectRatio="none" className="pointer-events-none absolute -inset-x-3 -inset-y-2 h-[calc(100%+1rem)] w-[calc(100%+1.5rem)] overflow-visible">
        <motion.path
          d="M150 8 C 90 -2, 12 10, 8 40 C 4 70, 120 78, 180 62 C 206 52, 198 18, 120 12"
          fill="none"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          initial={{ pathLength: reduce ? 1 : 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, delay: 0.5, ease: 'easeInOut' }}
        />
      </svg>
    </span>
  )
}
