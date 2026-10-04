import { lazy, Suspense, useEffect, useRef, useState, type RefObject } from 'react'
import { useTranslation } from 'react-i18next'

// GSAP + the diagram load on demand so the home's first paint stays light.
const IdentityFlows = lazy(() => import('./IdentityFlows'))

const skeleton = <div className="min-h-[640px] rounded-2xl border border-border bg-bg-card animate-pulse" aria-hidden="true" />

/** True once `ref` comes within 400px of the viewport (then stays true). */
function useNearViewport(ref: RefObject<HTMLElement | null>) {
  const [near, setNear] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (near || !el) return
    if (typeof IntersectionObserver === 'undefined') { setNear(true); return }
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) { setNear(true); io.disconnect() }
    }, { rootMargin: '400px' })
    io.observe(el)
    return () => io.disconnect()
  }, [near, ref])
  return near
}

/**
 * "See it live": two ways a workload reaches a service, step by step
 * (identity -> secret -> service, and identity straight to the service).
 */
export default function FlowSection() {
  const { t } = useTranslation()
  // The flow chunk (GSAP + FlowPlayer) is fetched and mounted only when the
  // section is about to scroll in; the same-size skeleton holds its place (no CLS).
  const slotRef = useRef<HTMLDivElement>(null)
  const near = useNearViewport(slotRef)
  return (
    <section id="flow-live" className="scroll-mt-14 px-6 lg:px-10 py-20 md:py-24 bg-bg-muted/40 border-b border-border">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-tone-live">{t('flowlive.kicker')}</p>
          <h2 className="mt-3 text-[clamp(26px,3.4vw,40px)] font-bold leading-tight tracking-[-0.02em] text-text">{t('flowlive.title')}</h2>
          <p className="mt-4 text-base leading-relaxed text-text-2">{t('flowlive.subtitle')}</p>
        </div>
        <div ref={slotRef} className="mt-8">
          {near ? <Suspense fallback={skeleton}><IdentityFlows /></Suspense> : skeleton}
        </div>
      </div>
    </section>
  )
}
