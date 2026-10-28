import Button from '../components/ui/Button'
import { Scribble } from '../components/ui/Scribble'

export default function NotFound() {
  return (
    <div className="relative mx-auto max-w-5xl overflow-hidden px-4 py-24 sm:px-6">
      <span aria-hidden className="display pointer-events-none absolute -right-4 top-6 select-none text-[12rem] leading-none text-paper/[0.05] sm:text-[20rem]">
        404
      </span>
      <p className="font-mono text-xs uppercase tracking-widest text-crimson">404 / out of zone</p>
      <h1 className="display relative mt-3 text-6xl sm:text-8xl">
        You got <Scribble>caught</Scribble>
        <br />
        in the blue zone.
      </h1>
      <p className="relative mt-5 max-w-md text-paper/70">This page doesn't exist, or it moved. Run back to safety.</p>
      <div className="relative mt-8 flex flex-wrap gap-4">
        <Button to="/">Ghar farka</Button>
        <Button to="/games" variant="outline">Browse games</Button>
      </div>
    </div>
  )
}
