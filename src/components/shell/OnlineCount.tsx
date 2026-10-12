import { useTranslation } from 'react-i18next'
import { usePresence } from '../../lib/presence'

/**
 * Top-bar "N online": browser tabs with the site open in the last minute
 * (each tab counts once, see lib/presence). Hidden while the number is
 * unknown or the backend is unreachable, never shown as 0 by mistake.
 */
export default function OnlineCount({ className = '' }: { className?: string }) {
  const { t, i18n } = useTranslation()
  const { online } = usePresence()
  const n = online ?? 0
  const count = new Intl.NumberFormat(i18n.resolvedLanguage ?? 'en').format(n)
  return (
    <div aria-live="polite" aria-atomic="true" className={online === null || online < 1 ? 'hidden' : className}>
      <div className="flex items-center gap-2 whitespace-nowrap rounded-full border border-border bg-bg-muted/60 px-3 py-1 text-xs"
        title={t('shell.online_title')}>
        <span className="h-2 w-2 shrink-0 rounded-full bg-tone-success" aria-hidden="true" />
        <span className="font-semibold tabular-nums text-text">{count}</span>
        <span className="text-text-muted">{t('shell.online')}</span>
        <span className="sr-only">. {t('shell.online_title')}</span>
      </div>
    </div>
  )
}
