import { motion, useReducedMotion } from 'motion/react'

// Cards come in a few cuts on purpose so the grid doesn't look stamped out.
//  paper  - cream stock, hard black shadow
//  ink    - dark with a paper hairline
//  notch  - cream with clipped corners (shadow comes from a drop-shadow filter)
export default function Card({ variant = 'paper', tilt = false, className = '', inner = '', children, ...rest }) {
  const reduce = useReducedMotion()
  const hover = tilt && !reduce ? { rotate: -0.8, x: -3, y: -3 } : undefined

  if (variant === 'notch') {
    return (
      <motion.div whileHover={hover} transition={{ type: 'spring', stiffness: 320, damping: 22 }} className={`drop-hard ${className}`} {...rest}>
        <div className={`notch paper-card h-full ${inner}`}>{children}</div>
      </motion.div>
    )
  }

  const base =
    variant === 'ink'
      ? 'bg-ink-2 text-paper border border-paper/15'
      : 'paper-card border-2 border-ink'

  return (
    <motion.div
      whileHover={tilt && !reduce ? { ...hover, boxShadow: '8px 8px 0 #000' } : undefined}
      initial={false}
      style={variant === 'paper' ? { boxShadow: '4px 4px 0 #000' } : undefined}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      className={`${base} ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
