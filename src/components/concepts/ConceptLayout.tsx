import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { NAV } from '../../lib/nav'
import securityLayers from '../../assets/brand/security-layers-blue.png'

/**
 * Shell for the Concepts pages (DESIGN.md §7): compact always-dark hero band
 * with the IDIRA art, the page content, and previous / next links that follow
 * the order of the Concepts group in lib/nav.ts. A learning trail.
 */
export default function ConceptLayout({ title, subtitle, children }: {
  title: string; subtitle: string; children: ReactNode
}) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  // The trail follows the menu group that holds this page (Concepts, or e.g. Secure Workload Access),
  // skipping sibling services outside the SPA (href).
  const group = NAV.find(g => g.items.some(it => it.to === pathname)) ?? NAV.find(g => g.key === 'concepts')
  const items = (group?.items ?? []).filter(it => !it.href)
  const i = items.findIndex(it => it.to === pathname)
  const prev = i > 0 ? items[i - 1] : undefined
  const next = i >= 0 && i < items.length - 1 ? items[i + 1] : undefined
  const Icon = items[i]?.Icon

  return (
    <article>
      <header className="relative overflow-hidden bg-[#131b2b] bg-[linear-gradient(to_right,#131b2b_50%,#091d58)] text-white">
        <img src={securityLayers} alt="" aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 w-[95%] sm:w-[46%] max-w-[620px] h-auto opacity-40 sm:opacity-60 mix-blend-screen select-none" />
        <div className="hero-grid pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#131b2b] via-[#131b2b]/85 to-transparent" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto px-6 lg:px-10 pt-14 pb-14 md:pt-20 md:pb-16">
          <p className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-idira-cyan">
            {Icon && <Icon size={14} aria-hidden="true" />}
            {t(group?.labelKey ?? 'nav.group_concepts')}{i >= 0 && items.length > 1 && <span className="text-slate-400">· {i + 1}/{items.length}</span>}
          </p>
          <h1 className="mt-4 font-semibold tracking-[-0.03em] leading-[1.05] text-[clamp(32px,4.6vw,56px)] max-w-[20ch]">{title}</h1>
          <p className="mt-5 text-base md:text-lg leading-relaxed text-slate-300/90 max-w-[62ch]">{subtitle}</p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 lg:px-10 py-14 md:py-16 space-y-10">
        {children}
      </div>

      {(prev || next) && (
        <nav aria-label={t('concepts.trail')} className="max-w-6xl mx-auto px-6 lg:px-10 pb-20">
          <div className="grid gap-4 border-t border-border pt-8 sm:grid-cols-2">
            {prev ? (
              <Link to={prev.to} className="group flex min-h-16 flex-col justify-center rounded-xl border border-border bg-bg-card px-5 py-3 hover:bg-bg-muted transition-colors">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted">
                  <ArrowLeft size={13} aria-hidden="true" />{t('concepts.prev')}
                </span>
                <span className="mt-1 text-sm font-semibold text-text">{t(prev.labelKey)}</span>
              </Link>
            ) : <span />}
            {next && (
              <Link to={next.to} className="group flex min-h-16 flex-col items-end justify-center rounded-xl border border-border bg-bg-card px-5 py-3 text-right hover:bg-bg-muted transition-colors">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted">
                  {t('concepts.next')}<ArrowRight size={13} aria-hidden="true" />
                </span>
                <span className="mt-1 text-sm font-semibold text-text">{t(next.labelKey)}</span>
              </Link>
            )}
          </div>
        </nav>
      )}
    </article>
  )
}
