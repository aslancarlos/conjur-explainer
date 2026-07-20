import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Leaf, Hexagon, Github, ShoppingBag, Wrench, Boxes, HardDrive, RefreshCw, Database, KeyRound, Combine, ScrollText } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Demo {
  key: string
  to: string
  href?: string          // set for external services that bypass React Router
  name: string
  secret: string
  color: string
  Icon: LucideIcon
}

// The full pattern catalogue — every integration IDIRA showcases, with a real explanation.
const DEMOS: Demo[] = [
  { key: 'spring',     to: '/spring-boot',    name: 'Spring Boot',    secret: 'direct JWT',    color: '#4ad1f0', Icon: Leaf },
  { key: 'dotnet',     to: '/dotnet',         name: '.NET',           secret: 'sidecar',       color: '#7c8cff', Icon: Hexagon },
  { key: 'gha',        to: '/github-actions', name: 'GitHub Actions', secret: 'OIDC',          color: '#007bff', Icon: Github },
  { key: 'eso',        to: '/eso-shop',       name: 'ESO Shop',       secret: 'ESO',           color: '#3d9bff', Icon: ShoppingBag },
  { key: 'swa',        to: '/swa-s3', href: '/swa-s3', name: 'SWA → AWS S3', secret: 'SPIFFE/SVID → STS', color: '#2dd4bf', Icon: Database },
  { key: 'jenkins',    to: '/jenkins',        name: 'Jenkins',        secret: 'plugin JWT',    color: '#00c0e8', Icon: Wrench },
  { key: 'ansible',    to: '/ansible',        name: 'Ansible',        secret: 'lookup',        color: '#fa582d', Icon: Boxes },
  { key: 'csi',        to: '/csi',            name: 'CSI Driver',     secret: 'tmpfs volume',  color: '#265bff', Icon: HardDrive },
  { key: 'dual',       to: '/dualaccounts',   name: 'Dual Accounts',  secret: 'rotation',      color: '#a9b6ff', Icon: RefreshCw },
  { key: 'jwt',        to: '/jwt',            name: 'authn-jwt',      secret: 'identity handshake', color: '#22d3ee', Icon: KeyRound },
  { key: 'secretshub', to: '/secretshub',     name: 'Secrets Hub',    secret: 'PAM → cloud sync', color: '#a78bfa', Icon: Combine },
  { key: 'policy',     to: '/policy',         name: 'Policy as Code', secret: 'YAML + git',    color: '#f5b301', Icon: ScrollText },
]

export default function DemosShowcase() {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="demos" className="px-6 lg:px-10 py-20 md:py-24">
      <div className="max-w-7xl mx-auto" ref={ref}>
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-idira-cyan">{t('demos.kicker')}</p>
          <h2 className="mt-3 text-[clamp(26px,3.4vw,40px)] font-bold tracking-[-0.02em] text-text">{t('demos.title')}</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-text-2">{t('demos.subtitle')}</p>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEMOS.map((d, i) => {
            const cardCls = "group relative flex h-full flex-col rounded-2xl border border-border bg-bg-card p-5 transition-colors hover:bg-white/[0.03]"
            const cardStyle = { boxShadow: `inset 0 1px 0 0 ${d.color}14` }
            const cardInner = (
              <>
                <span
                  className="absolute left-0 top-6 h-9 w-1 rounded-r"
                  style={{ background: d.color }}
                  aria-hidden
                />
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl border"
                    style={{ borderColor: `${d.color}55`, background: `${d.color}14`, color: d.color }}
                  >
                    <d.Icon size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-text leading-tight">{d.name}</p>
                    <p className="font-mono text-[10.5px]" style={{ color: d.color }}>{d.secret}</p>
                  </div>
                </div>
                <p className="mt-4 text-[13px] leading-relaxed text-text-2 flex-1">{t(`demos.${d.key}`)}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-text-2 group-hover:text-text transition-colors">
                  {t('demos.cta')}
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" style={{ color: d.color }} />
                </span>
              </>
            )
            return (
              <motion.div
                key={d.key}
                initial={{ opacity: 0, y: 18 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.05, ease: [0.2, 0.7, 0.2, 1] }}
              >
                {d.href
                  ? <a href={d.href} className={cardCls} style={cardStyle}>{cardInner}</a>
                  : <Link to={d.to} className={cardCls} style={cardStyle}>{cardInner}</Link>}
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
