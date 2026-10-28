export default function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-paper/10 ${className}`} aria-hidden />
}

export function SkeletonList({ count = 3, className = 'h-32' }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className={className} />
      ))}
    </div>
  )
}
