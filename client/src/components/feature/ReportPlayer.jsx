import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Flag } from 'lucide-react'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import Input, { Select, Textarea } from '../ui/Input'
import { FormError } from '../ui/Empty'
import { useAuth } from '../../context/AuthContext'
import { useUi } from '../../context/UiContext'
import { api } from '../../lib/api'
import { idOf, uname } from '../../lib/format'

const REASONS = [
  { value: 'cheating', label: 'Cheating (hacks, emulator in mobile lobby)' },
  { value: 'fake_result', label: 'Fake result / edited screenshot' },
  { value: 'abuse', label: 'Abuse or harassment' },
  { value: 'other', label: 'Something else' },
]

/**
 * "Report player" button + modal. `players` is one user or a list (challenge page: pick who).
 * POST /reports multipart: target, targetUsername, reason, details, challengeId?, evidence?
 */
export default function ReportPlayer({ players, challengeId, size = 'sm', className = '' }) {
  const { user } = useAuth()
  const { toast } = useUi()
  const navigate = useNavigate()
  const list = (Array.isArray(players) ? players : [players]).filter((p) => p && idOf(p) !== idOf(user))
  const [open, setOpen] = useState(false)
  const [target, setTarget] = useState('')
  const [reason, setReason] = useState('cheating')
  const [details, setDetails] = useState('')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  if (!list.length) return null

  const start = () => {
    if (!user) return navigate('/login', { state: { from: window.location.pathname } })
    setTarget(uname(list[0]))
    setReason('cheating')
    setDetails('')
    setFile(null)
    setError(null)
    setOpen(true)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (details.trim().length < 10) return setError(new Error('Tell the admins what happened (a sentence or two).'))
    if (file && file.size > 5 * 1024 * 1024) return setError(new Error('Evidence image must be under 5 MB.'))
    const picked = list.find((p) => uname(p) === target) ?? list[0]
    const fd = new FormData()
    if (idOf(picked) && typeof picked === 'object') fd.append('target', idOf(picked))
    fd.append('targetUsername', uname(picked))
    fd.append('reason', reason)
    fd.append('details', details.trim())
    if (challengeId) fd.append('challengeId', challengeId)
    if (file) fd.append('evidence', file)
    setBusy(true)
    setError(null)
    try {
      await api.post('/reports', fd)
      setOpen(false)
      toast.success('Report sent. An admin will review it.')
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button size={size} variant="outline" icon={Flag} onClick={start} className={`!border-paper/30 !text-paper/70 hover:!border-crimson hover:!bg-transparent hover:!text-crimson ${className}`}>
        Report player
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} kicker="Report" title="Report a player">
        <form onSubmit={submit} className="space-y-4">
          {list.length > 1 ? (
            <Select tone="paper" label="Who" value={target} onChange={(e) => setTarget(e.target.value)} options={list.map((p) => uname(p))} />
          ) : (
            <p className="font-semibold">Reporting <span className="text-crimson">{uname(list[0])}</span></p>
          )}
          <Select tone="paper" label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} options={REASONS} />
          <Textarea tone="paper" label="What happened" rows={4} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Times, room ID, what you saw. Specifics help the admin decide fast." maxLength={1000} />
          <Input tone="paper" type="file" accept="image/*" label="Evidence screenshot (optional)" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="pt-2 file:mr-3 file:border-0 file:bg-ink file:px-3 file:py-1 file:text-paper" />
          <FormError error={error} />
          <Button type="submit" busy={busy}>Send report</Button>
          <p className="text-xs text-ink/55">False reports count against you. Reports are private; the player isn't told who filed it.</p>
        </form>
      </Modal>
    </>
  )
}
