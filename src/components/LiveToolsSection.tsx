import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ExternalLink, LayoutDashboard, ShoppingCart, BarChart2, Leaf, Code2, Monitor, Power, KeyRound } from 'lucide-react'

interface Tool {
  icon: React.ElementType
  color: string
  border: string
  bg: string
  dot: string
  titleKey: string
  descKey: string
  badgeKey: string
  href: string
  ctaKey: string
}

const TOOLS: Tool[] = [
  {
    icon: Monitor,
    color: 'text-conjur-cyan',
    border: 'border-conjur-cyan/30',
    bg: 'bg-conjur-cyan/5',
    dot: 'bg-conjur-cyan',
    titleKey: 'livetools.k8s_title',
    descKey: 'livetools.k8s_desc',
    badgeKey: 'livetools.k8s_badge',
    href: '/dashboard/',
    ctaKey: 'livetools.open',
  },
  {
    icon: KeyRound,
    color: 'text-eso',
    border: 'border-eso/30',
    bg: 'bg-eso/5',
    dot: 'bg-eso',
    titleKey: 'livetools.swa_title',
    descKey: 'livetools.swa_desc',
    badgeKey: 'livetools.swa_badge',
    href: '/swa-s3',
    ctaKey: 'livetools.open',
  },
  {
    icon: BarChart2,
    color: 'text-conjur-gold',
    border: 'border-conjur-gold/30',
    bg: 'bg-conjur-gold/5',
    dot: 'bg-conjur-gold',
    titleKey: 'livetools.grafana_title',
    descKey: 'livetools.grafana_desc',
    badgeKey: 'livetools.grafana_badge',
    href: '/grafana',
    ctaKey: 'livetools.open',
  },
  {
    icon: ShoppingCart,
    color: 'text-eso',
    border: 'border-eso/30',
    bg: 'bg-eso/5',
    dot: 'bg-eso',
    titleKey: 'livetools.eso_title',
    descKey: 'livetools.eso_desc',
    badgeKey: 'livetools.eso_badge',
    href: '/k8s-eso/dashboard',
    ctaKey: 'livetools.open',
  },
  {
    icon: Leaf,
    color: 'text-spring',
    border: 'border-spring/30',
    bg: 'bg-spring/5',
    dot: 'bg-spring',
    titleKey: 'livetools.spring_title',
    descKey: 'livetools.spring_desc',
    badgeKey: 'livetools.spring_badge',
    href: '/springboot/dashboard',
    ctaKey: 'livetools.open',
  },
  {
    icon: Code2,
    color: 'text-dotnet',
    border: 'border-dotnet/30',
    bg: 'bg-dotnet/5',
    dot: 'bg-dotnet',
    titleKey: 'livetools.dotnet_title',
    descKey: 'livetools.dotnet_desc',
    badgeKey: 'livetools.dotnet_badge',
    href: '/dotnet/usuarios',
    ctaKey: 'livetools.open',
  },
  {
    icon: LayoutDashboard,
    color: 'text-eso',
    border: 'border-eso/30',
    bg: 'bg-eso/5',
    dot: 'bg-eso',
    titleKey: 'livetools.esoshop_title',
    descKey: 'livetools.esoshop_desc',
    badgeKey: 'livetools.esoshop_badge',
    href: '/k8s-eso/',
    ctaKey: 'livetools.open',
  },
  {
    icon: Power,
    color: 'text-conjur-red',
    border: 'border-conjur-red/30',
    bg: 'bg-conjur-red/5',
    dot: 'bg-conjur-red',
    titleKey: 'livetools.controller_title',
    descKey: 'livetools.controller_desc',
    badgeKey: 'livetools.controller_badge',
    href: '/controller',
    ctaKey: 'livetools.open',
  },
]

export default function LiveToolsSection() {
  const { t } = useTranslation()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="livetools" ref={ref} className="py-24 px-6">
      <div className="max-w-6xl mx-auto space-y-12">

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center space-y-3"
        >
          <span className="badge bg-conjur-cyan/10 text-conjur-cyan border border-conjur-cyan/20">
            {t('livetools.badge')}
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold">{t('livetools.title')}</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">{t('livetools.subtitle')}</p>
        </motion.div>

        {/* K8s Dashboard — featured card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="section-card border-conjur-cyan/20 bg-gradient-to-br from-conjur-cyan/5 to-bg-card"
        >
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl border border-conjur-cyan/30 bg-conjur-cyan/10 flex items-center justify-center">
              <Monitor size={26} className="text-conjur-cyan" />
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-xl font-bold text-white">{t('livetools.k8s_title')}</h3>
                <span className="badge bg-conjur-cyan/10 text-conjur-cyan border border-conjur-cyan/20 text-xs">
                  {t('livetools.k8s_badge')}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-green-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-slow" />
                  {t('livetools.live')}
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed max-w-2xl">{t('livetools.k8s_desc')}</p>
              <div className="grid sm:grid-cols-3 gap-3 pt-1">
                {(t('livetools.k8s_features', { returnObjects: true }) as string[]).map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="w-1 h-1 rounded-full bg-conjur-cyan flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <a
                  href="/dashboard/"
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-conjur-cyan text-bg-base text-sm font-semibold hover:bg-conjur-cyan/80 transition-colors"
                >
                  <Monitor size={14} /> {t('livetools.k8s_cta')}
                </a>
                <div className="flex items-center gap-2 text-xs text-slate-500 px-3 py-2 rounded-full border border-border">
                  <span className="font-mono text-slate-400">{t('livetools.k8s_login')}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Other tools grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TOOLS.slice(1).map((tool, i) => {
            const Icon = tool.icon
            return (
              <motion.a
                key={i}
                href={tool.href}
                target="_blank"
                rel="noopener"
                initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.25 + i * 0.08 }}
                className={`section-card ${tool.border} group hover:scale-[1.02] transition-transform cursor-pointer space-y-3`}
              >
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-xl border ${tool.border} ${tool.bg} flex items-center justify-center`}>
                    <Icon size={18} className={tool.color} />
                  </div>
                  <ExternalLink size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors mt-1" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${tool.dot} animate-pulse-slow`} />
                    <span className={`text-[10px] font-semibold ${tool.color}`}>{t(tool.badgeKey)}</span>
                  </div>
                  <p className="font-semibold text-white text-sm">{t(tool.titleKey)}</p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{t(tool.descKey)}</p>
                </div>
              </motion.a>
            )
          })}
        </div>

      </div>
    </section>
  )
}
