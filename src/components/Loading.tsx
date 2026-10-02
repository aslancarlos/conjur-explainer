/** Suspense fallback shown while a lazily-loaded route chunk downloads. */
export default function Loading() {
  return (
    <div
      // full viewport height keeps the footer below the fold while the chunk loads (no CLS)
      className="min-h-[calc(100dvh-3.5rem)] flex items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="h-8 w-8 rounded-full border-2 border-idira-blue/30 border-t-idira-blue animate-spin" />
    </div>
  )
}
