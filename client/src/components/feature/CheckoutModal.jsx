import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { CircleCheck } from 'lucide-react'
import Modal from '../ui/Modal'
import Input, { Segmented } from '../ui/Input'
import Button from '../ui/Button'
import { FormError } from '../ui/Empty'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { getGame } from '../../lib/games'
import { npr } from '../../lib/format'

const METHODS = [
  { value: 'esewa', label: 'eSewa' },
  { value: 'khalti', label: 'Khalti' },
  { value: 'bank', label: 'Bank transfer' },
]

export default function CheckoutModal({ product, onClose }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const game = getGame(product?.game)
  const [gameUid, setGameUid] = useState('')
  const [method, setMethod] = useState('esewa')
  const [ref, setRef] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [order, setOrder] = useState(null)

  useEffect(() => {
    if (!product) return
    setGameUid(user?.gameIds?.[product.game] ?? '')
    setRef('')
    setError(null)
    setOrder(null)
  }, [product, user])

  const submit = async (e) => {
    e.preventDefault()
    if (!gameUid.trim()) return setError(new Error('We need your in-game UID to send it.'))
    if (!ref.trim()) return setError(new Error('Paste the transaction code from your payment.'))
    setBusy(true)
    setError(null)
    try {
      const { data } = await api.post('/store/orders', {
        productId: product._id,
        gameUid: gameUid.trim(),
        paymentMethod: method,
        paymentRef: ref.trim(),
      })
      setOrder(data)
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={!!product} onClose={onClose} kicker={game?.name ? `${game.name} top-up` : 'Top-up'} title={product ? product.name : ''}>
      {product && !user && (
        <div className="space-y-4">
          <p className="text-ink/75">Log in first so we can track your order and ping you when it lands.</p>
          <Button onClick={() => navigate('/login', { state: { from: '/store' } })}>Log in</Button>
        </div>
      )}
      {product && user && order && (
        <div className="space-y-4">
          <CircleCheck className="size-10 text-[#2BB673]" />
          <p className="display text-3xl">Order received</p>
          <p className="text-ink/75">
            An admin checks your payment reference and sends {product.name} to UID <span className="font-mono font-semibold">{gameUid}</span>. Usually under 30 minutes, 9am–11pm.
          </p>
          <div className="flex gap-3">
            <Button to="/orders" onClick={onClose}>Track order</Button>
            <Button variant="paper" onClick={onClose}>Done</Button>
          </div>
        </div>
      )}
      {product && user && !order && (
        <form onSubmit={submit} className="space-y-4">
          <div className="flex items-baseline justify-between border-y-2 border-ink py-3">
            <span className="font-mono text-sm uppercase text-ink/60">Total</span>
            <span className="display text-4xl">{npr(product.priceNpr)}</span>
          </div>
          <Input
            tone="paper"
            label={`${game?.short ?? ''} player UID`}
            placeholder="e.g. 5123456789"
            value={gameUid}
            onChange={(e) => setGameUid(e.target.value)}
            hint="Double check it. Currency sent to a wrong UID can't be pulled back."
            inputMode="numeric"
          />
          <div style={{ '--accent': '#F2A900' }}>
            <Segmented tone="paper" label="Paid with" options={METHODS} value={method} onChange={setMethod} />
          </div>
          <Input
            tone="paper"
            label="Payment reference"
            placeholder={method === 'bank' ? 'Bank voucher / txn no.' : 'Transaction code from the app'}
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            className="font-mono"
          />
          <p className="bg-ink/5 p-3 text-sm text-ink/70">
            Pay through your {METHODS.find((m) => m.value === method)?.label} app first, then paste the code here. No card details, no wallet on our side, an admin verifies every order by hand.
          </p>
          <FormError error={error} />
          <Button type="submit" busy={busy} className="w-full">
            Place order
          </Button>
          <p className="text-center text-xs text-ink/50">
            Top-ups are separate from challenges and matches. See <Link to="/orders" className="underline">your orders</Link>.
          </p>
        </form>
      )}
    </Modal>
  )
}
