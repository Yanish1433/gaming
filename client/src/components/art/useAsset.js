import { useEffect, useState } from 'react'

// Resolves the first candidate URL that actually loads as an image. Results are cached per URL list,
// so a dozen cards asking for the same icon only probe once.
const cache = new Map()

function probe(url) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img.naturalWidth > 0 ? url : null)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

async function firstLoadable(urls) {
  for (const u of urls) {
    // eslint-disable-next-line no-await-in-loop
    const ok = await probe(u)
    if (ok) return ok
  }
  return null
}

export function useFirstImage(urls) {
  const key = urls.filter(Boolean).join('|')
  const [src, setSrc] = useState(() => {
    const hit = cache.get(key)
    return hit && typeof hit === 'string' ? hit : null
  })
  useEffect(() => {
    if (!key) return
    let alive = true
    let p = cache.get(key)
    if (typeof p === 'string' || p === null) {
      setSrc(p)
      return
    }
    if (!p) {
      p = firstLoadable(key.split('|'))
      cache.set(key, p)
      p.then((v) => cache.set(key, v))
    }
    p.then((v) => alive && setSrc(v))
    return () => {
      alive = false
    }
  }, [key])
  return src
}

export const iconCandidates = (game) =>
  game?.icon ? [game.icon] : game ? ['png', 'webp', 'jpg'].map((ext) => `/games/${game.slug}/icon.${ext}`) : []

export const heroCandidates = (slug) => ['webp', 'jpg'].map((ext) => `/games/${slug}/hero.${ext}`)
