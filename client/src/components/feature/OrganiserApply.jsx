import { useState } from 'react'
import { Link } from 'react-router'
import { Handshake } from 'lucide-react'
import Button from '../ui/Button'
import Input, { Select, Textarea } from '../ui/Input'
import { FormError } from '../ui/Empty'
import Skeleton from '../ui/Skeleton'
import Sticker from '../ui/Sticker'
import { useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../context/AuthContext'
import { useUi } from '../../context/UiContext'
import { api, asList } from '../../lib/api'
import { timeAgo } from '../../lib/format'

const TYPES = [
  { value: 'cafe', label: 'Gaming café' },
  { value: 'clan', label: 'Clan / esports team' },
  { value: 'creator', label: 'Streamer / creator' },
  { value: 'college', label: 'College club' },
  { value: 'other', label: 'Other' },
]

// Shows the latest organiser application status, or the application form.
export default function OrganiserApply() {
  const { user } = useAuth()
  const { toast } = useUi()
  const mine = useFetch(user && user.role === 'player' ? '/organiser-applications/mine' : null)
  const [f, setF] = useState({ orgName: '', type: 'cafe', contact: '', socialLink: '', note: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  if (!user) return null
  if (user.role !== 'player') {
    return (
      <section className="border-2 border-paper/15 p-5">
        <p className="display text-3xl">You host rooms</p>
        <p className="mt-1 text-paper/65">You're an {user.role}. Run your matches from the <Link to="/admin/matches" className="text-marigold underline">organiser desk</Link>.</p>
      </section>
    )
  }

  const data = mine.data
  const latest = Array.isArray(data) ? data[0] : asList(data)[0] ?? (data && data._id ? data : null)
  const canApply = !latest || latest.status === 'rejected'

  const submit = async (e) => {
    e.preventDefault()
    if (f.orgName.trim().length < 2) return setError(new Error('Name of your café / clan / channel?'))
    if (f.contact.trim().length < 5) return setError(new Error('Add a phone number or email we can reach you on.'))
    setBusy(true)
    setError(null)
    try {
      await api.post('/organiser-applications', {
        orgName: f.orgName.trim(),
        type: f.type,
        contact: f.contact.trim(),
        socialLink: f.socialLink.trim() || undefined,
        note: f.note.trim() || undefined,
      })
      toast.success('Application sent. We usually reply within two days.')
      mine.reload()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="relative border-2 border-paper/15 p-5 sm:p-6">
      <span className="absolute -top-4 right-4"><Sticker tone="marigold" rotate={3}>Host rooms</Sticker></span>
      <p className="flex items-center gap-2 display text-3xl"><Handshake className="size-6" /> Become an organiser</p>
      <p className="mt-1 max-w-xl text-paper/65">Run a café, a clan or a college club? Organisers post custom rooms and run sponsored cups for their crowd. Free, like everything here.</p>
      {mine.loading ? (
        <Skeleton className="mt-4 h-24" />
      ) : latest && !canApply ? (
        <div className={`mt-4 border-l-4 p-4 ${latest.status === 'approved' ? 'border-[#2BB673] bg-[#2BB673]/10' : 'border-marigold bg-marigold/10'}`}>
          <p className="font-semibold">
            {latest.orgName}: {latest.status === 'pending' ? 'under review' : 'approved'}
          </p>
          <p className="text-sm text-paper/60">Sent {timeAgo(latest.createdAt)}.{latest.status === 'approved' ? ' Log out and back in if the organiser desk isn’t showing yet.' : ' You’ll get a notification when an admin decides.'}</p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-5 space-y-3">
          {latest?.status === 'rejected' && (
            <p className="border-l-4 border-crimson bg-crimson/10 px-3 py-2 text-sm">Last application wasn't approved{latest.reviewNote ? `: ${latest.reviewNote}` : '.'} You can apply again.</p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Organisation name" value={f.orgName} onChange={(e) => setF({ ...f, orgName: e.target.value })} placeholder="e.g. Putalisadak Game Zone" />
            <Select label="Type" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} options={TYPES} />
            <Input label="Contact (phone or email)" value={f.contact} onChange={(e) => setF({ ...f, contact: e.target.value })} />
            <Input label="Facebook / TikTok / YouTube link" value={f.socialLink} onChange={(e) => setF({ ...f, socialLink: e.target.value })} placeholder="https://…" />
          </div>
          <Textarea label="Tell us a bit" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="How many players, what you'd host, how often." maxLength={500} />
          <FormError error={error} />
          <Button type="submit" busy={busy}>Send application</Button>
        </form>
      )}
    </section>
  )
}
