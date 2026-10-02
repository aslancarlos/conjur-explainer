import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ThumbsUp } from 'lucide-react'

const LIKED_KEY = 'idira-liked'

/**
 * Top-bar "Like" button with the total count (site-likes service, /api/likes).
 * One like per browser (remembered locally; the service also limits per IP).
 * Renders nothing if the service is unreachable.
 */
export default function LikeButton({ className = '' }: { className?: string }) {
  const { t, i18n } = useTranslation()
  const [likes, setLikes] = useState<number | null>(null)
  const [liked, setLiked] = useState(() => { try { return localStorage.getItem(LIKED_KEY) === '1' } catch { return false } })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    fetch('/api/likes', { cache: 'no-store' })
      .then(r => (r.ok && (r.headers.get('content-type') ?? '').includes('json') ? r.json() : null))
      .then((d: { likes?: number } | null) => { if (alive && d && Number.isFinite(d.likes)) setLikes(d.likes!) })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  if (likes === null) return null

  const like = async () => {
    if (liked || busy) return
    setBusy(true)
    setLiked(true)
    setLikes(n => (n ?? 0) + 1)                 // optimistic
    try { localStorage.setItem(LIKED_KEY, '1') } catch { /* private mode */ }
    try {
      const r = await fetch('/api/likes', { method: 'POST' })
      const d = await r.json()
      if (Number.isFinite(d.likes)) setLikes(d.likes)
    } catch { /* keep the optimistic value */ }
    setBusy(false)
  }

  const count = new Intl.NumberFormat(i18n.resolvedLanguage ?? 'en', { notation: 'compact', maximumFractionDigits: 1 }).format(likes)
  const label = liked ? t('shell.liked') : t('shell.like')

  return (
    <button type="button" onClick={like} aria-pressed={liked} disabled={busy}
      title={liked ? t('shell.liked_title') : t('shell.like_title')}
      className={`items-center gap-2 rounded-full border px-3 min-h-8 text-xs transition-colors duration-200
        ${liked ? 'border-idira-blue/50 bg-idira-blue/10 text-text cursor-default' : 'border-border bg-bg-muted/60 text-text-2 hover:border-idira-blue hover:text-text'} ${className}`}>
      <ThumbsUp size={13} strokeWidth={2} aria-hidden="true"
        className={`shrink-0 transition-transform duration-200 ${liked ? 'fill-idira-blue text-idira-blue scale-110' : 'text-text-2'}`} />
      <span>{label}</span>
      <span className="font-semibold tabular-nums text-text" aria-label={t('shell.likes_count', { count: likes })}>{count}</span>
    </button>
  )
}
