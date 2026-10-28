import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, kicker, children, wide = false }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/80 p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: 60, rotate: -1.5, opacity: 0 }}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className={`paper-card relative max-h-[92dvh] w-full overflow-y-auto border-2 border-ink p-5 shadow-[8px_8px_0_#DC143C] sm:p-7 ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}
          >
            <button
              onClick={onClose}
              className="absolute right-3 top-3 grid size-9 place-items-center border-2 border-ink bg-paper hover:bg-ink hover:text-paper"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
            {kicker && <p className="font-mono text-xs uppercase tracking-widest text-crimson">{kicker}</p>}
            {title && <h2 className="display mb-4 mt-1 pr-10 text-3xl sm:text-4xl">{title}</h2>}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
