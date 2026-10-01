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

  // Compact on purpose: the home teaches; this is the jump-off into the demos.
  return (
    <section id="demos" className="px-6 lg:px-10 py-20 md:py-24 border-t border-border">
      <div className="max-w-7xl mx-auto" ref={ref}>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-tone-live">{t('demos.kicker')}</p>
            <h2 className="mt-3 text-[clamp(26px,3.4vw,40px)] font-bold leading-tight tracking-[-0.02em] text-text">{t('demos.title')}</h2>
            <p className="mt-4 text-base leading-relaxed text-text-2">{t('demos.subtitle')}</p>
          </div>
          <div className="w-full max-w-sm"><NavViewToggle size="md" /></div>
        </div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
          className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {groupsList.map(group => (
            <div key={group.key}>
              <h3 className="border-b border-border pb-2 text-sm font-semibold text-text">{t(group.labelKey!)}</h3>
              <ul className="mt-2 space-y-0.5">
                {group.items.map(item => {
                  const cls = 'group flex min-h-11 items-center gap-3 rounded-lg px-2 -mx-2 transition-colors hover:bg-bg-muted'
                  const inner = (
                    <>
                      <item.Icon size={17} strokeWidth={1.9} aria-hidden="true" className={`shrink-0 ${item.color ?? 'text-text-2'}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-text leading-tight">{item.demo!.name}</span>
                        <span className="block font-mono text-xs text-text-muted">{item.demo!.secret}</span>
                      </span>
                      <ArrowRight size={14} aria-hidden="true" className="shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5" />
                    </>
                  )
                  return (
                    <li key={item.to}>
                      {item.href
                        ? <a href={item.to} className={cls}>{inner}</a>
                        : <Link to={item.to} className={cls}>{inner}</Link>}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
