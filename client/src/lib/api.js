import axios from 'axios'

export const TOKEN_KEY = 'arena_token'

export const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) config.headers.Authorization = `Bearer ${token}`
  } catch {
    // storage blocked: carry on unauthenticated
  }
  return config
})

// Every failure comes out as an Error with a readable message plus .status,
// so pages never have to dig through axios internals.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status ?? 0
    const body = err.response?.data
    let message = body && typeof body === 'object' ? body.error : undefined
    // the Vite proxy answers 502/504 with a plain body when the backend is down
    const offline = !err.response || ((status === 502 || status === 503 || status === 504) && !message)
    if (!message) {
      if (offline) message = 'Server sanga connect bhayena. The API looks offline, try again in a bit.'
      else if (status === 404) message = 'Not found.'
      else if (status >= 500) message = 'Server had a bad moment. Try again.'
      else message = err.message || 'Something went wrong.'
    }
    const e = new Error(message)
    e.status = status
    e.offline = offline
    e.data = body
    if (status === 401) window.dispatchEvent(new CustomEvent('arena:unauthorized'))
    return Promise.reject(e)
  },
)

// lists come back as { items, total, page } but tolerate plain arrays too
export function asList(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  return []
}

export function uploadUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//.test(path) || path.startsWith('/')) return path
  return `/uploads/${path}`
}
