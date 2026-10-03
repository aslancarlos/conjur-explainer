import { useTranslation } from 'react-i18next'
import { RELEASE, BUILD_DATE } from '../../lib/release'

/**
 * Sidebar footer: site version and the date of the last update, so visitors
 * know the content is current. Collapsed sidebar shows only the version.
 */
export default function ReleaseInfo({ collapsed = false }: { collapsed?: boolean }) {
  const { t, i18n } = useTranslation()
  const date = new Date(BUILD_DATE)
  const day = date.toLocaleDateString(i18n.resolvedLanguage ?? 'en', { day: 'numeric', month: 'short', year: 'numeric' })
  const full = `${t('shell.release_version', { v: RELEASE })} · ${t('shell.release_updated', { date: day })}`

  if (collapsed) {
    return (
      <div className="border-t border-border py-3 text-center" title={full}>
        <span className="font-mono text-xs text-text-muted">{RELEASE}</span>
        <span className="sr-only">{full}</span>
      </div>
    )
  }
  return (
    <div className="border-t border-border px-4 py-3" aria-label={t('shell.release_label')} role="note">
      <p className="flex items-center gap-2 text-xs text-text-2">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-tone-success" aria-hidden="true" />
        <span className="font-medium text-text">{t('shell.release_current')}</span>
        <span className="ml-auto rounded-full border border-border bg-bg-muted px-2 py-0.5 font-mono text-xs text-text-2">{RELEASE}</span>
      </p>
      <p className="mt-1 pl-3.5 text-xs text-text-muted">
        {t('shell.release_updated', { date: '' }).trim()} <time dateTime={BUILD_DATE}>{day}</time>
      </p>
    </div>
  )
}
