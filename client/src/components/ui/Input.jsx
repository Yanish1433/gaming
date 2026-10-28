import { useId } from 'react'

// `tone="paper"` for fields sitting on cream cards, default for dark pages
const FIELD = {
  ink: 'bg-ink-2 text-paper border-2 border-paper/25 placeholder:text-paper/35 focus:border-marigold',
  paper: 'bg-paper text-ink border-2 border-ink placeholder:text-ink/40 focus:border-crimson',
}

export function Field({ label, hint, error, id, tone = 'ink', children }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className={`font-mono text-[11px] font-semibold uppercase tracking-widest ${tone === 'paper' ? 'text-ink/70' : 'text-paper/60'}`}>
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-sm font-medium text-crimson">{error}</p>
      ) : hint ? (
        <p className={`text-xs ${tone === 'paper' ? 'text-ink/60' : 'text-paper/45'}`}>{hint}</p>
      ) : null}
    </div>
  )
}

export default function Input({ label, hint, error, tone = 'ink', className = '', ...rest }) {
  const id = useId()
  return (
    <Field label={label} hint={hint} error={error} id={id} tone={tone}>
      <input id={id} className={`h-11 w-full px-3 outline-none transition-colors ${FIELD[tone]} ${className}`} {...rest} />
    </Field>
  )
}

export function Textarea({ label, hint, error, tone = 'ink', className = '', rows = 3, ...rest }) {
  const id = useId()
  return (
    <Field label={label} hint={hint} error={error} id={id} tone={tone}>
      <textarea id={id} rows={rows} className={`w-full resize-y px-3 py-2 outline-none transition-colors ${FIELD[tone]} ${className}`} {...rest} />
    </Field>
  )
}

export function Select({ label, hint, error, tone = 'ink', options = [], placeholder, className = '', ...rest }) {
  const id = useId()
  return (
    <Field label={label} hint={hint} error={error} id={id} tone={tone}>
      <select id={id} className={`h-11 w-full cursor-pointer px-3 outline-none transition-colors ${FIELD[tone]} ${className}`} {...rest}>
        {placeholder != null && <option value="">{placeholder}</option>}
        {options.map((o) => {
          const v = typeof o === 'object' ? o.value : o
          const l = typeof o === 'object' ? o.label : o
          return (
            <option key={v} value={v} className="bg-ink text-paper">
              {l}
            </option>
          )
        })}
      </select>
    </Field>
  )
}

// segmented pill row, used for team size, payment method, etc.
export function Segmented({ label, options, value, onChange, tone = 'ink' }) {
  return (
    <Field label={label} tone={tone}>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const v = typeof o === 'object' ? o.value : o
          const l = typeof o === 'object' ? o.label : o
          const on = String(v) === String(value)
          return (
            <button
              type="button"
              key={v}
              onClick={() => onChange(v)}
              aria-pressed={on}
              className={`h-10 border-2 px-4 font-semibold transition-all ${
                on
                  ? 'border-ink bg-(--accent,#DC143C) text-ink shadow-hard -translate-x-0.5 -translate-y-0.5'
                  : tone === 'paper'
                    ? 'border-ink/40 text-ink/70 hover:border-ink'
                    : 'border-paper/25 text-paper/70 hover:border-paper/60'
              }`}
            >
              {l}
            </button>
          )
        })}
      </div>
    </Field>
  )
}
