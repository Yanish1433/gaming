import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, TOKEN_KEY } from '../lib/api'

const AuthContext = createContext(null)

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function writeToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(readToken)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(!!readToken())

  const logout = useCallback(() => {
    writeToken(null)
    setToken(null)
    setUser(null)
  }, [])

  const refresh = useCallback(async () => {
    if (!readToken()) return null
    try {
      const { data } = await api.get('/auth/me')
      const u = data?.user ?? data
      setUser(u)
      return u
    } catch (e) {
      if (e.status === 401) logout()
      return null
    } finally {
      setLoading(false)
    }
  }, [logout])

  useEffect(() => {
    if (token) refresh()
    else setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => {
    const onUnauth = () => {
      if (readToken()) logout()
    }
    window.addEventListener('arena:unauthorized', onUnauth)
    return () => window.removeEventListener('arena:unauthorized', onUnauth)
  }, [logout])

  const accept = (data) => {
    writeToken(data.token)
    setToken(data.token)
    setUser(data.user)
    return data.user
  }

  const login = useCallback(async (emailOrUsername, password) => {
    const { data } = await api.post('/auth/login', { emailOrUsername, password })
    return accept(data)
  }, [])

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register', payload)
    return accept(data)
  }, [])

  const value = useMemo(
    () => ({ token, user, loading, login, register, logout, refresh, setUser, isAdmin: user?.role === 'admin' }),
    [token, user, loading, login, register, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must sit inside <AuthProvider>')
  return ctx
}
