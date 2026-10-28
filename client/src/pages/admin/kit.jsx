import { useCallback } from 'react'
import { Download } from 'lucide-react'
import Button from '../../components/ui/Button'
import { useUi } from '../../context/UiContext'
import { api } from '../../lib/api'

// Shared bits for the admin control room.

export function AdminHead({ kicker, title, children, actions }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {kicker && <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-crimson">{kicker}</p>}
        <h1 className="display mt-1 text-5xl">{title}</h1>
        {children && <p className="mt-2 max-w-2xl text-paper/60">{children}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  )
}

/**
 * act(fn, { success, confirm }) runs a mutation with an optional confirm modal and a toast either way.
 * Resolves to the response data, or undefined if cancelled / failed.
 */
export function useAdminAct() {
  const { toast, confirm } = useUi()
  return useCallback(
    async (fn, { success, confirm: ask } = {}) => {
      if (ask && !(await confirm(ask))) return undefined
      try {
        const res = await fn()
        if (success) toast.success(success)
        return res?.data ?? true
      } catch (e) {
        toast.error(e)
        return undefined
      }
    },
    [toast, confirm],
  )
}

// CSV export needs the JWT, so it goes through axios as a blob rather than a plain link.
export function ExportButton({ what, label = 'Export CSV' }) {
  const { toast } = useUi()
  const run = async () => {
    try {
      const res = await api.get(`/admin/export/${what}`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `arena-${what}-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 2000)
      toast.success(`${what} exported`)
    } catch (e) {
      toast.error(e)
    }
  }
  return (
    <Button size="sm" variant="outline" icon={Download} onClick={run}>
      {label}
    </Button>
  )
}

export function Pager({ page, total, pageSize = 20, onPage }) {
  const pages = Math.max(1, Math.ceil((Number(total) || 0) / pageSize))
  if (pages <= 1) return null
  return (
    <div className="mt-4 flex items-center gap-3">
      <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>Prev</Button>
      <span className="font-mono text-sm text-paper/60">page {page} / {pages}</span>
      <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</Button>
    </div>
  )
}

export const ORDER_COLORS = { pending: '#F2A900', paid: '#3D7BFF', fulfilled: '#2BB673', failed: '#DC143C' }
