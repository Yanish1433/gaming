import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'

// GET a path (null = skip). Re-runs when path or params change.
export function useFetch(path, params) {
  const key = path ? `${path}?${JSON.stringify(params ?? {})}` : null
  const [state, setState] = useState({ data: null, error: null, loading: !!path })
  const seq = useRef(0)

  const load = useCallback(async () => {
    if (!key) {
      setState({ data: null, error: null, loading: false })
      return
    }
    const my = ++seq.current
    setState((s) => ({ ...s, loading: s.data == null, error: null }))
    try {
      const { data } = await api.get(path, { params })
      if (my === seq.current) setState({ data, error: null, loading: false })
    } catch (error) {
      if (my === seq.current) {
        setState((s) => s.data == null
          ? { data: null, error, loading: false }
          : { ...s, loading: false })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  useEffect(() => {
    load()
  }, [load])

  return { ...state, reload: load, setData: (data) => setState((s) => ({ ...s, data })) }
}

// wraps a mutating call with busy/error state
export function useAction() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const run = useCallback(async (fn) => {
    setBusy(true)
    setError(null)
    try {
      return await fn()
    } catch (e) {
      setError(e)
      throw e
    } finally {
      setBusy(false)
    }
  }, [])
  return { busy, error, run, setError }
}
