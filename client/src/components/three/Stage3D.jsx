import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'

// The three.js chunk is only fetched once a stage scrolls near the viewport.
const Scenes = lazy(() => import('./Scenes'))

let webglOk
function hasWebGL() {
  if (webglOk !== undefined) return webglOk
  try {
    const c = document.createElement('canvas')
    webglOk = !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    webglOk = false
  }
  return webglOk
}

// No 3D for reduced motion, low-memory phones, or no WebGL. The poster art carries the page instead.
export function can3D(reduce) {
  if (reduce || typeof window === 'undefined') return false
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false
  const mem = navigator.deviceMemory
  if (typeof mem === 'number' && mem <= 2) return false
  return hasWebGL()
}

class Guard extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(e) {
    console.warn('3D stage disabled:', e?.message)
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

export default function Stage3D({ scene, fallback = null, className = '', label }) {
  const reduce = useReducedMotion()
  const ref = useRef(null)
  const [enabled] = useState(() => can3D(reduce))
  const [seen, setSeen] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return
    const io = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting)
        if (entry.isIntersecting) setSeen(true)
      },
      { rootMargin: '200px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [enabled])

  const on = enabled && !reduce
  return (
    <div ref={ref} className={`relative ${className}`} role={label ? 'img' : undefined} aria-label={label}>
      {on && seen ? (
        <Guard fallback={fallback}>
          <Suspense fallback={fallback}>
            <Scenes scene={scene} active={visible} />
          </Suspense>
        </Guard>
      ) : (
        fallback
      )}
    </div>
  )
}
