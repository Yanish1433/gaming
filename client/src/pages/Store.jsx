import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { PageHead, Reveal, RevealItem } from '../components/ui/Bits'
import { Segmented } from '../components/ui/Input'
import Empty, { ErrorState } from '../components/ui/Empty'
import { SkeletonList } from '../components/ui/Skeleton'
import ProductCard from '../components/feature/ProductCard'
import CheckoutModal from '../components/feature/CheckoutModal'
import { useFetch } from '../hooks/useFetch'
import { asList } from '../lib/api'
import { GAMES, accentOf, getGame } from '../lib/games'

export default function Store() {
  const [params, setParams] = useSearchParams()
  const game = getGame(params.get('game')) ? params.get('game') : ''
  const state = useFetch('/store/products', { game: game || undefined })
  const [buying, setBuying] = useState(null)
  const items = asList(state.data).filter((p) => p.active !== false)

  // group by game when showing everything
  const groups = game ? [[game, items]] : GAMES.map((g) => [g.slug, items.filter((p) => p.game === g.slug)]).filter(([, l]) => l.length)

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6" style={{ '--accent': game ? accentOf(game) : '#F2A900' }}>
      <PageHead kicker={{ num: 'TU', text: 'Top-up' }} title="Reload your game">
        UC, diamonds, coins and FC points at local prices. Pay with eSewa, Khalti or bank, paste the reference, a real person delivers it to your UID.
      </PageHead>
      <div className="mb-10">
        <Segmented value={game} onChange={(v) => setParams(v ? { game: v } : {})} options={[{ value: '', label: 'All games' }, ...GAMES.map((g) => ({ value: g.slug, label: g.name }))]} />
      </div>
      {state.loading ? (
        <SkeletonList count={4} className="h-44" />
      ) : state.error ? (
        <ErrorState error={state.error} onRetry={state.reload} />
      ) : !items.length ? (
        <Empty big="SOLD" title="Shelf is empty" body="No packs listed right now. Admins restock most mornings." />
      ) : (
        <div className="space-y-14">
          {groups.map(([slug, list]) => (
            <section key={slug} style={{ '--accent': accentOf(slug) }}>
              {!game && <h2 className="display mb-6 border-b-2 border-(--accent) pb-2 text-4xl">{getGame(slug)?.name}</h2>}
              <Reveal className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4">
                {list.map((p, i) => (
                  <RevealItem key={p._id}>
                    <ProductCard product={p} index={i} onBuy={setBuying} />
                  </RevealItem>
                ))}
              </Reveal>
            </section>
          ))}
        </div>
      )}
      <p className="mt-14 max-w-2xl font-mono text-xs leading-relaxed text-paper/45">
        Top-ups are a plain shop: you pay for game currency, we deliver it. Nothing here touches challenges, matches or rank points, and there is no wallet or balance on Arena Nepal.
      </p>
      <CheckoutModal product={buying} onClose={() => setBuying(null)} />
    </div>
  )
}
