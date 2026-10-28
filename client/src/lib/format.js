const TZ = 'Asia/Kathmandu'

export function fmtDate(d, opts = {}) {
  if (!d) return '—'
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-GB', {
    timeZone: TZ,
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    ...opts,
  })
}

export function fmtDay(d) {
  if (!d) return '—'
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', { timeZone: TZ, day: '2-digit', month: 'short', year: 'numeric' })
}

export function timeAgo(d) {
  if (!d) return ''
  const diff = (Date.now() - new Date(d).getTime()) / 1000
  if (Number.isNaN(diff)) return ''
  const abs = Math.abs(diff)
  const units = [
    [60, 'sec', 1],
    [3600, 'min', 60],
    [86400, 'hr', 3600],
    [604800, 'day', 86400],
    [Infinity, 'wk', 604800],
  ]
  for (const [limit, label, div] of units) {
    if (abs < limit) {
      const n = Math.max(1, Math.floor(abs / div))
      const s = `${n} ${label}${n > 1 ? 's' : ''}`
      return diff >= 0 ? `${s} ago` : `in ${s}`
    }
  }
  return ''
}

export function npr(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return 'Rs —'
  return `Rs ${v.toLocaleString('en-IN')}`
}

export function num(n) {
  const v = Number(n)
  return Number.isFinite(v) ? v.toLocaleString('en-IN') : '0'
}

// refs may come populated ({ _id, username }) or as bare ids
export function idOf(x) {
  if (!x) return ''
  if (typeof x === 'string') return x
  return x._id ?? x.id ?? ''
}

export function uname(x) {
  if (!x) return 'unknown'
  if (typeof x === 'string') return /^[a-f0-9]{24}$/i.test(x) ? 'player' : x
  return x.username ?? 'player'
}

export function sameId(a, b) {
  const x = idOf(a)
  return !!x && x === idOf(b)
}

export const STATUS_LABEL = {
  open: 'Open',
  accepted: 'Accepted',
  room_ready: 'Room ready',
  in_progress: 'Playing',
  reported: 'Result in',
  disputed: 'Disputed',
  settled: 'Settled',
  cancelled: 'Cancelled',
  expired: 'Expired',
  upcoming: 'Upcoming',
  live: 'Live',
  completed: 'Completed',
  registration: 'Reg. open',
  ongoing: 'Ongoing',
  pending: 'Pending',
  paid: 'Paid',
  fulfilled: 'Delivered',
  failed: 'Failed',
  resolved: 'Resolved',
}

export const STATUS_TONE = {
  open: 'marigold',
  accepted: 'paper',
  room_ready: 'blue',
  in_progress: 'red',
  reported: 'paper',
  disputed: 'red',
  settled: 'green',
  cancelled: 'muted',
  expired: 'muted',
  upcoming: 'marigold',
  live: 'red',
  completed: 'muted',
  registration: 'marigold',
  ongoing: 'red',
  pending: 'marigold',
  paid: 'blue',
  fulfilled: 'green',
  failed: 'red',
  resolved: 'green',
}

export function teamLabel(size) {
  const n = Number(size) || 1
  if (n === 1) return '1v1'
  if (n === 2) return 'Duo'
  if (n === 3) return 'Trio'
  return 'Squad'
}

export function toLocalInput(d) {
  // value for <input type="datetime-local">
  if (!d) return ''
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
