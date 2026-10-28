import { Link } from 'react-router'
import { LoaderCircle } from 'lucide-react'
import Magnetic from './Magnetic'

const VARIANTS = {
  primary:
    'bg-crimson text-paper border-2 border-ink shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg active:translate-x-1 active:translate-y-1 active:shadow-none',
  paper:
    'bg-paper text-ink border-2 border-ink shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg active:translate-x-1 active:translate-y-1 active:shadow-none',
  marigold:
    'bg-marigold text-ink border-2 border-ink shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg active:translate-x-1 active:translate-y-1 active:shadow-none',
  accent:
    'bg-(--accent,#DC143C) text-ink border-2 border-ink shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg active:translate-x-1 active:translate-y-1 active:shadow-none',
  outline: 'border-2 border-paper/70 text-paper hover:bg-paper hover:text-ink',
  ghost: 'text-paper/80 hover:text-paper hover:bg-paper/10',
  danger: 'bg-ink text-crimson border-2 border-crimson hover:bg-crimson hover:text-paper',
}

const SIZES = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-14 px-7 text-lg',
}

export default function Button({
  as,
  to,
  href,
  variant = 'primary',
  size = 'md',
  className = '',
  busy = false,
  disabled,
  children,
  icon: Icon,
  magnetic = false,
  ...rest
}) {
  const el = renderButton({ as, to, href, variant, size, className, busy, disabled, children, Icon, rest })
  return magnetic ? <Magnetic>{el}</Magnetic> : el
}

function renderButton({ as, to, href, variant, size, className, busy, disabled, children, Icon, rest }) {
  const cls = `inline-flex select-none items-center justify-center gap-2 font-semibold tracking-tight transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`
  const inner = (
    <>
      {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : Icon ? <Icon className="size-4" aria-hidden /> : null}
      {children}
    </>
  )
  if (to) {
    return (
      <Link to={to} className={cls} {...rest}>
        {inner}
      </Link>
    )
  }
  if (href) {
    return (
      <a href={href} className={cls} {...rest}>
        {inner}
      </a>
    )
  }
  const Comp = as ?? 'button'
  return (
    <Comp className={cls} disabled={disabled || busy} {...rest}>
      {inner}
    </Comp>
  )
}
