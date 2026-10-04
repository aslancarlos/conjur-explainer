import { useTranslation } from 'react-i18next'

/** Suspense fallback shown while a lazily-loaded route chunk (or lazy copy) downloads. */
export default function Loading() {
  const { t } = useTranslation()
  return (
    <div
      // full viewport height keeps the footer below the fold while the chunk loads (no CLS)
      className="min-h-[calc(100dvh-3.5rem)] flex items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <div className="h-8 w-8 rounded-full border-2 border-idira-blue/30 border-t-idira-blue animate-spin" aria-hidden="true" />
      <span className="sr-only">{t('shell.loading')}</span>
    </div>
  )
}
