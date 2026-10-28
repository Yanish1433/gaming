import { motion } from 'motion/react'

export default function Tabs({ tabs, active, onChange, id = 'tabs', className = '' }) {
  return (
    <div role="tablist" className={`scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0 ${className}`}>
      {tabs.map((t) => {
        const on = t.key === active
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.key)}
            className={`relative shrink-0 px-3 pb-3 pt-2 text-left transition-colors ${on ? 'text-paper' : 'text-paper/55 hover:text-paper/85'}`}
          >
            <span className="font-mono text-[10px] text-paper/40">{t.num}</span>
            <span className="display ml-1.5 text-xl sm:text-2xl">{t.label}</span>
            {t.count != null && <span className="ml-1.5 font-mono text-xs text-paper/50">{t.count}</span>}
            {on && (
              <motion.span
                layoutId={`${id}-bar`}
                className="absolute inset-x-2 bottom-0 h-1.5 bg-(--accent,#DC143C)"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
