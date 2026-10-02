import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'

// GSAP + the diagram load on demand so the home's first paint stays light.
const IdentityFlows = lazy(() => import('./IdentityFlows'))

/**
 * "See it live": two ways a workload reaches a service, step by step
 * (identity -> secret -> service, and identity straight to the service).
 */
export default function FlowSection() {
  const { t } = useTranslation()
  return (
    <section id="flow-live" className="scroll-mt-14 px-6 lg:px-10 py-20 md:py-24 bg-bg-muted/40 border-b border-border">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-tone-live">{t('flowlive.kicker')}</p>
          <h2 className="mt-3 text-[clamp(26px,3.4vw,40px)] font-bold leading-tight tracking-[-0.02em] text-text">{t('flowlive.title')}</h2>
          <p className="mt-4 text-base leading-relaxed text-text-2">{t('flowlive.subtitle')}</p>
        </div>
        <div className="mt-8">
          <Suspense fallback={<div className="min-h-[640px] rounded-2xl border border-border bg-bg-card animate-pulse" aria-hidden="true" />}>
            <IdentityFlows />
          </Suspense>
        </div>
      </div>
    </section>
  )
}
