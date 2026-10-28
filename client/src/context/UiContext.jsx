import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CircleAlert, CircleCheck, X } from 'lucide-react'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'

const UiContext = createContext(null)

/**
 * toast.success / toast.error for feedback, and confirm({...}) → Promise<boolean> for destructive actions.
 * confirm({ typed: 'YES' }) makes the user type the word before the button unlocks.
 */
export function UiProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [dialog, setDialog] = useState(null)
  const [typed, setTyped] = useState('')
  const seq = useRef(0)

  const push = useCallback((tone, text) => {
    const id = ++seq.current
    setToasts((t) => [...t.slice(-3), { id, tone, text }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === 'error' ? 6000 : 3500)
  }, [])

  const toast = useMemo(
    () => ({
      success: (text) => push('ok', text),
      error: (e) => push('error', e?.message ?? String(e)),
    }),
    [push],
  )

  const confirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
        setTyped('')
        setDialog({ ...opts, resolve })
      }),
    [],
  )

  const close = (answer) => {
    dialog?.resolve(answer)
    setDialog(null)
  }

  const locked = dialog?.typed && typed.trim() !== dialog.typed

  return (
    <UiContext.Provider value={{ toast, confirm }}>
      {children}
      <Modal open={!!dialog} onClose={() => close(false)} kicker={dialog?.kicker ?? 'Sure?'} title={dialog?.title ?? 'Confirm'}>
        {dialog && (
          <div className="space-y-4">
            {dialog.body && <p className="text-ink/75">{dialog.body}</p>}
            {dialog.typed && (
              <label className="block">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-ink/70">
                  Type <span className="text-crimson">{dialog.typed}</span> to continue
                </span>
                <input
                  autoFocus
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  className="mt-1.5 h-11 w-full border-2 border-ink bg-paper px-3 font-mono text-ink outline-none focus:border-crimson"
                  aria-label={`Type ${dialog.typed} to confirm`}
                />
              </label>
            )}
            <div className="flex flex-wrap gap-3">
              <Button variant={dialog.danger === false ? 'primary' : 'danger'} disabled={locked} onClick={() => close(true)} className={dialog.danger === false ? '' : '!bg-crimson !text-paper'}>
                {dialog.confirmText ?? 'Yes, do it'}
              </Button>
              <Button variant="paper" onClick={() => close(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
      <div aria-live="polite" className="pointer-events-none fixed bottom-20 right-3 z-[85] flex w-[min(22rem,calc(100vw-1.5rem))] flex-col gap-2 md:bottom-5 md:right-5">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 40, rotate: 2 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className={`pointer-events-auto flex items-start gap-3 border-2 border-ink px-4 py-3 shadow-hard ${t.tone === 'error' ? 'bg-crimson text-paper' : 'paper-card'}`}
              role={t.tone === 'error' ? 'alert' : 'status'}
            >
              {t.tone === 'error' ? <CircleAlert className="mt-0.5 size-4 shrink-0" /> : <CircleCheck className="mt-0.5 size-4 shrink-0 text-[#2BB673]" />}
              <p className="flex-1 text-sm font-semibold">{t.text}</p>
              <button onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))} aria-label="Dismiss">
                <X className="size-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </UiContext.Provider>
  )
}

export function useUi() {
  const ctx = useContext(UiContext)
  if (!ctx) throw new Error('useUi must sit inside <UiProvider>')
  return ctx
}
