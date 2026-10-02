import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Heart } from 'lucide-react'

interface Visits { accesses: number; since: string; updated: string }

/**
 * Top-bar access counter. Reads /stats/visits.json, published hourly from the
 * AWS NLB CloudWatch metric (k8s/site-stats/). Counts accesses (connections),
 * not unique people. Renders nothing until valid data arrives, so a missing
 * file (local dev, SPA fallback HTML) simply hides it.
 */
export default function VisitCounter({ className = '' }: { className?: string }) {
  const { t, i18n } = useTranslation()
  const [data, setData] = useState<Visits | null>(null)

  useEffect(() => {
    let alive = true
    fetch('/stats/visits.json', { cache: 'no-cache' })
      .then(r => (r.ok && (r.headers.get('content-type') ?? '').includes('json') ? r.json() : null))
      .then((d: Visits | null) => { if (alive && d && Number.isFinite(d.accesses)) setData(d) })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  if (!data) return null
  const lang = i18n.resolvedLanguage ?? 'en'
  // Abbreviated and rounded down (17,666 -> 17K / 17 mil); the exact number is in the tooltip.
  const step = data.accesses >= 1_000_000 ? 100_000 : data.accesses >= 1_000 ? 1_000 : 1
  const count = new Intl.NumberFormat(lang, { notation: 'compact', maximumFractionDigits: 1 })
    .format(Math.floor(data.accesses / step) * step)
  const exact = new Intl.NumberFormat(lang).format(data.accesses)
  const since = new Intl.DateTimeFormat(lang, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${data.since}T00:00:00Z`))
  const title = t('shell.visits_title', { since, exact })

  return (
    <div className={`items-center gap-2 whitespace-nowrap rounded-full border border-border bg-bg-muted/60 px-3 py-1 text-xs ${className}`}
      title={title}>
      <Heart size={13} strokeWidth={2} className="shrink-0 fill-tone-danger text-tone-danger" aria-hidden="true" />
      <span className="text-text-muted">{t('shell.visits_label')}</span>
      <span className="font-semibold tabular-nums text-text">{count}</span>
      <span className="sr-only">. {title}</span>
    </div>
  )
}
