import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import { NAV, type NavItem } from '../lib/nav'

interface Demo { key: string; to: string; name: string; secret: string }

// The pattern catalogue, grouped exactly like the sidebar so the mental model
// matches: running examples first, then platform integrations. Icon and accent
// come from lib/nav (one icon per concept across the site — DESIGN.md §8).
const GROUPS: Array<{ key: 'examples' | 'integrations'; titleKey: string; descKey: string; demos: Demo[] }> = [
  {
    key: 'examples', titleKey: 'nav.examples', descKey: 'demos.group_examples', demos: [
      { key: 'spring',  to: '/spring-boot',    name: 'Spring Boot',    secret: 'direct JWT' },
      { key: 'dotnet',  to: '/dotnet',         name: '.NET',           secret: 'sidecar' },
      { key: 'gha',     to: '/github-actions', name: 'GitHub Actions', secret: 'OIDC' },
      { key: 'eso',     to: '/eso-shop',       name: 'ESO Shop',       secret: 'ESO' },
      { key: 'swa',     to: '/swa-s3',         name: 'SWA → AWS S3',   secret: 'SPIFFE/SVID → STS' },
    ],
  },
  {
    key: 'integrations', titleKey: 'nav.integrations', descKey: 'demos.group_integrations', demos: [
      { key: 'dual',       to: '/dualaccounts', name: 'Dual Accounts',  secret: 'rotation' },
      { key: 'jwt',        to: '/jwt',          name: 'authn-jwt',      secret: 'identity handshake' },
      { key: 'policy',     to: '/policy',       name: 'Policy as Code', secret: 'YAML + git' },
      { key: 'secretshub', to: '/secretshub',   name: 'Secrets Hub',    secret: 'PAM → cloud sync' },
      { key: 'jenkins',    to: '/jenkins',      name: 'Jenkins',        secret: 'plugin JWT' },
      { key: 'ansible',    to: '/ansible',      name: 'Ansible',        secret: 'lookup' },
      { key: 'csi',        to: '/csi',          name: 'CSI Driver',     secret: 'tmpfs volume' },
    ],
  },
]

const NAV_BY_ROUTE = new Map<string, NavItem>(NAV.flatMap(g => g.items).map(i => [i.to, i]))

export default function DemosShowcase() {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const total = GROUPS.reduce((n, g) => n + g.demos.length, 0)

  let idx = 0
  return (
    <section id="demos" className="px-6 lg:px-10 py-20 md:py-24">
      <div className="max-w-7xl mx-auto" ref={ref}>
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-tone-live">{t('demos.kicker')}</p>
          <h2 className="mt-3 text-[clamp(26px,3.4vw,40px)] font-bold leading-tight tracking-[-0.02em] text-text">{t('demos.title')}</h2>
          <p className="mt-4 text-base leading-relaxed text-text-2">{t('demos.subtitle')}</p>
        </div>

        {GROUPS.map(group => (
          <div key={group.key} className="mt-12">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border pb-3">
              <h3 className="text-lg font-semibold text-text">{t(group.titleKey)}</h3>
              <span className="font-mono text-xs text-text-muted tabular-nums">{group.demos.length}/{total}</span>
              <p className="w-full sm:w-auto sm:ml-auto text-sm text-text-muted">{t(group.descKey)}</p>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {group.demos.map(d => {
                const nav = NAV_BY_ROUTE.get(d.to)
                const Icon = nav?.Icon
                const accent = nav?.color ?? 'text-text-2'
                const external = Boolean(nav?.href)
                const i = idx++
                const cardCls = 'group relative flex h-full flex-col rounded-2xl border border-border bg-bg-card p-5 ' +
                  'transition-colors duration-200 hover:border-text-muted/50 hover:bg-bg-muted/60'
                const inner = (
                  <>
                    <span className={`absolute left-0 top-6 h-9 w-1 rounded-r bg-current ${accent}`} aria-hidden="true" />
                    <div className="flex items-center gap-3">
                      <span className={`flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-bg-muted ${accent}`}>
                        {Icon && <Icon size={18} strokeWidth={1.9} aria-hidden="true" />}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-text leading-tight">{d.name}</p>
                        <p className="font-mono text-xs text-text-muted">{d.secret}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-text-2 flex-1">{t(`demos.${d.key}`)}</p>
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
