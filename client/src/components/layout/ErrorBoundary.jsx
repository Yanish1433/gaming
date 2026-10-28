import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Page crashed:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <p className="font-mono text-xs uppercase tracking-widest text-crimson">Error / page</p>
        <h1 className="display mt-2 text-6xl">Yo page bigriyo</h1>
        <p className="mt-3 text-paper/70">Something on this page broke. Reload, and if it keeps happening tell us in the group.</p>
        <pre className="mt-6 overflow-x-auto border-2 border-paper/20 p-4 font-mono text-xs text-paper/60">{String(this.state.error?.message ?? this.state.error)}</pre>
        <button onClick={() => location.reload()} className="mt-6 border-2 border-ink bg-crimson px-5 py-2.5 font-semibold shadow-hard">
          Reload
        </button>
      </div>
    )
  }
}
