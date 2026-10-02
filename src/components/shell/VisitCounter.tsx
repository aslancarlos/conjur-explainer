import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HeartHandshake } from 'lucide-react'

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
  const count = new Intl.NumberFormat(lang).format(data.accesses)
  const since = new Intl.DateTimeFormat(lang, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${data.since}T00:00:00Z`))
  const title = t('shell.visits_title', { since })

  return (
    <div className={`items-center gap-2 rounded-full border border-border bg-bg-muted/60 px-3 py-1 text-xs ${className}`}
      title={title}>
      <HeartHandshake size={14} strokeWidth={2} className="text-domain-idira shrink-0" aria-hidden="true" />
      <span className="text-text-muted">{t('shell.visits_label')}</span>
      <span className="font-semibold tabular-nums text-text">{count}</span>
      <span className="sr-only">. {title}</span>
    </div>
  )
}
