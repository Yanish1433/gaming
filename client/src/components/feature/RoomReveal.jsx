import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Check, Copy, Lock } from 'lucide-react'
import { useCountdown } from '../../hooks/useCountdown'

function CopyField({ label, value }) {
  const [done, setDone] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setDone(true)
      setTimeout(() => setDone(false), 1400)
    } catch {
      // clipboard blocked; the value is on screen anyway
    }
  }
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-widest text-ink/60">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <span className="font-mono text-2xl font-semibold tracking-wider sm:text-3xl">{value}</span>
        <button onClick={copy} className="grid size-9 place-items-center border-2 border-ink hover:bg-ink hover:text-paper" aria-label={`Copy ${label}`}>
          {done ? <Check className="size-4" /> : <Copy className="size-4" />}
        </button>
      </div>
    </div>
  )
}

function Digits({ n, label }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-mono text-3xl font-semibold tabular-nums sm:text-4xl">{String(n).padStart(2, '0')}</span>
      <span className="font-mono text-[10px] uppercase tracking-widest text-paper/50">{label}</span>
    </div>
  )
}

/**
 * Locked: dark card with countdown to unlockAt (if known).
 * Unlocked (room present): the card flips over to the paper side with ID + password.
 */
export default function RoomReveal({ room, unlockAt, lockedText = 'Room details unlock 15 minutes before start, only for registered players.' }) {
  const reduce = useReducedMotion()
  const cd = useCountdown(unlockAt)
  const open = !!room?.roomId

  return (
    <div className="[perspective:1200px]">
      <motion.div
        initial={false}
        animate={{ rotateY: open ? 0 : 180 }}
        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 70, damping: 14 }}
        className="relative grid min-h-52 [transform-style:preserve-3d]"
      >
        {/* front = unlocked */}
        <div className="paper-card [grid-area:1/1] border-2 border-ink p-5 shadow-[6px_6px_0_#DC143C] [backface-visibility:hidden]">
          <div className="flex items-center justify-between">
            <p className="display text-2xl">Room khulyo</p>
            <span className="bg-crimson px-2 py-0.5 font-mono text-[11px] font-bold uppercase text-paper">Don't share</span>
          </div>
          {open && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <CopyField label="Room ID" value={room.roomId} />
              <CopyField label="Password" value={room.password || '—'} />
            </div>
          )}
          <p className="mt-4 text-sm text-ink/65">Join with the exact in-game name on your profile so the host can verify you.</p>
        </div>
        {/* back = locked */}
        <div className="flex flex-col justify-between gap-4 [grid-area:1/1] border-2 border-dashed border-paper/30 bg-ink-2 p-5 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center bg-paper/10"><Lock className="size-5 text-marigold" /></span>
            <p className="display text-2xl">Room locked</p>
          </div>
          {cd.valid && !cd.done ? (
            <div className="flex gap-5">
              {cd.d > 0 && <Digits n={cd.d} label="days" />}
              <Digits n={cd.h} label="hrs" />
              <Digits n={cd.m} label="min" />
              <Digits n={cd.s} label="sec" />
            </div>
          ) : (
            <p className="font-mono text-sm text-paper/60">{cd.valid ? 'Unlock time reached. Refresh if you are registered.' : 'Waiting on the host.'}</p>
          )}
          <p className="text-sm text-paper/55">{lockedText}</p>
        </div>
      </motion.div>
    </div>
  )
}
