import { motion, useReducedMotion } from 'motion/react'

// Pages slide up while a crimson sheet wipes off the top — like a poster being pasted over the last one.
export default function PageTransition({ children }) {
  const reduce = useReducedMotion()
  if (reduce) return <div>{children}</div>
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.35, delay: 0.12, ease: [0.22, 1, 0.36, 1] } }}
      exit={{ opacity: 0, y: -10, transition: { duration: 0.16 } }}
      className="relative"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[60] bg-crimson"
        initial={{ clipPath: 'inset(0 0 0 0)' }}
        animate={{ clipPath: 'inset(0 0 100% 0)', transition: { duration: 0.45, ease: [0.76, 0, 0.24, 1] } }}
        exit={{ clipPath: 'inset(100% 0 0 0)' }}
      />
      {children}
    </motion.div>
  )
}
