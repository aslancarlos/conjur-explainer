import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import { demoGroups } from '../lib/nav'
import { useNavView } from '../lib/useNavView'
import NavViewToggle from './shell/NavViewToggle'

// The catalogue mirrors the sidebar (lib/nav.ts): same use-case / product
// grouping and shared toggle, same icon per concept (DESIGN.md §9).

export default function DemosShowcase() {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [view] = useNavView()
  const groupsList = demoGroups(view)
  const total = groupsList.reduce((n, g) => n + g.items.length, 0)

  let idx = 0
  return (
    <section id="demos" className="px-6 lg:px-10 py-20 md:py-24">
      <div className="max-w-7xl mx-auto" ref={ref}>
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-tone-live">{t('demos.kicker')}</p>
          <h2 className="mt-3 text-[clamp(26px,3.4vw,40px)] font-bold leading-tight tracking-[-0.02em] text-text">{t('demos.title')}</h2>
          <p className="mt-4 text-base leading-relaxed text-text-2">{t('demos.subtitle')}</p>
          <div className="mt-6 max-w-sm"><NavViewToggle size="md" /></div>
        </div>

        {groupsList.map(group => (
          <div key={group.key} className="mt-12">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border pb-3">
              <h3 className="text-lg font-semibold text-text">{t(group.labelKey!)}</h3>
              <span className="font-mono text-xs text-text-muted tabular-nums">{group.items.length}/{total}</span>
              {group.descKey && <p className="w-full sm:w-auto sm:ml-auto text-sm text-text-muted">{t(group.descKey)}</p>}
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {group.items.map(item => {
                const d = { key: item.to, to: item.to, ...item.demo! }
                const Icon = item.Icon
                const accent = item.color ?? 'text-text-2'
                const external = Boolean(item.href)
                const i = idx++
                const cardCls = 'group relative flex h-full flex-col rounded-2xl border border-border bg-bg-card p-5 ' +
                  'transition-colors duration-200 hover:border-text-muted/50 hover:bg-bg-muted/60'
                const inner = (
                  <>
                    <span className={`absolute left-0 top-6 h-9 w-1 rounded-r bg-current ${accent}`} aria-hidden="true" />
                    <div className="flex items-center gap-3">
                      <span className={`flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-bg-muted ${accent}`}>
                        <Icon size={18} strokeWidth={1.9} aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-text leading-tight">{d.name}</p>
                        <p className="font-mono text-xs text-text-muted">{d.secret}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-text-2 flex-1">{t(d.descKey)}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-text-2 group-hover:text-text transition-colors">
                      {t('demos.cta')}
                      <ArrowRight size={14} aria-hidden="true" className={`transition-transform group-hover:translate-x-0.5 ${accent}`} />
                    </span>
                  </>
                )
                return (
                  <motion.div key={d.key}
                    initial={reduce ? false : { opacity: 0, y: 18 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.45, delay: Math.min(i, 8) * 0.04, ease: [0.2, 0.7, 0.2, 1] }}>
                    {external
                      ? <a href={d.to} className={cardCls}>{inner}</a>
                      : <Link to={d.to} className={cardCls}>{inner}</Link>}
                  </motion.div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
