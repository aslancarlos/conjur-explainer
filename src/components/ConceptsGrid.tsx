import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import { NAV } from '../lib/nav'
import NavGlyph from './shell/NavGlyph'

/** Home: entry cards into the Concepts learning trail (one per page). */
export default function ConceptsGrid() {
  const { t } = useTranslation()
  const items = NAV.find(g => g.key === 'concepts')?.items ?? []
  return (
    <section id="concepts" className="px-6 lg:px-10 py-20 md:py-24">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-tone-live">{t('concepts.home_kicker')}</p>
          <h2 className="mt-3 text-[clamp(26px,3.4vw,40px)] font-bold leading-tight tracking-[-0.02em] text-text">{t('concepts.home_title')}</h2>
          <p className="mt-4 text-base leading-relaxed text-text-2">{t('concepts.home_subtitle')}</p>
        </div>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {items.map((it, i) => (
            <li key={it.to}>
              <Link to={it.to}
                className="group flex h-full flex-col rounded-2xl border border-border bg-bg-card p-5 transition-colors hover:border-text-muted/50 hover:bg-bg-muted/60">
                <div className="flex items-center justify-between">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-idira-blue/10 ${it.color ?? 'text-tone-accent'}`} aria-hidden="true">
                    <NavGlyph logo={it.logo} Icon={it.Icon} size={28} iconSize={19} />
                  </span>
                  <span className="font-mono text-xs text-text-muted tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <p className="mt-4 text-base font-semibold text-text leading-snug">{t(it.labelKey)}</p>
                {it.subKey && <p className="mt-1.5 flex-1 text-sm leading-relaxed text-text-2">{t(it.subKey)}</p>}
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-tone-accent">
                  {t('concepts.open')}<ArrowRight size={14} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
