import { RefreshCw, WifiOff } from 'lucide-react'
import Button from './Button'

export default function Empty({ title = 'Kei chaina yaha', body, action, big = 'KHALI', className = '' }) {
  return (
    <div className={`relative overflow-hidden border-2 border-dashed border-paper/25 px-5 py-10 sm:px-8 ${className}`}>
      <span aria-hidden className="display pointer-events-none absolute -right-3 -top-4 select-none text-[6.5rem] text-paper/[0.05] sm:text-[9rem]">
        {big}
      </span>
      <p className="display relative text-3xl text-paper">{title}</p>
      {body && <p className="relative mt-2 max-w-md text-paper/65">{body}</p>}
      {action && <div className="relative mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ error, onRetry, className = '' }) {
  const offline = error?.offline
  return (
    <div className={`relative border-2 border-crimson bg-crimson/10 px-5 py-6 ${className}`}>
      <div className="flex items-start gap-3">
        <WifiOff className="mt-1 size-5 shrink-0 text-crimson" aria-hidden />
        <div>
          <p className="display text-2xl">{offline ? 'Server is napping' : 'That did not load'}</p>
          <p className="mt-1 text-paper/70">{error?.message ?? 'Something went wrong.'}</p>
          {onRetry && (
            <Button variant="outline" size="sm" className="mt-4" icon={RefreshCw} onClick={onRetry}>
              Feri try garau
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// small inline error line for forms
export function FormError({ error }) {
  if (!error) return null
  return <p className="border-l-4 border-crimson bg-crimson/10 px-3 py-2 text-sm font-medium">{error.message ?? String(error)}</p>
}
