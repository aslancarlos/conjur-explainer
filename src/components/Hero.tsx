import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ArrowDown, ExternalLink } from 'lucide-react'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay },
})

export default function Hero() {
  const { t } = useTranslation()

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-16 overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-conjur-cyan/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-spring/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-dotnet/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-64 h-64 bg-eso/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto text-center space-y-6">
        <motion.p {...fadeUp(0.1)} className="badge bg-conjur-cyan/10 text-conjur-cyan border border-conjur-cyan/20">
          {t('hero.eyebrow')}
        </motion.p>

        <motion.h1 {...fadeUp(0.2)} className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
          {t('hero.title')}{' '}
          <span className="bg-gradient-to-r from-conjur-cyan via-conjur-gold via-spring to-eso bg-clip-text text-transparent">
            {t('hero.titleAccent')}
          </span>
        </motion.h1>

        <motion.p {...fadeUp(0.3)} className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          {t('hero.subtitle')}
        </motion.p>

        <motion.div {...fadeUp(0.4)} className="flex flex-wrap gap-4 justify-center pt-4">
          <a
            href="/springboot/dashboard"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-spring text-white font-semibold hover:bg-spring/80 transition-colors"
          >
            {t('hero.cta_spring')} <ExternalLink size={14} />
          </a>
          <a
            href="/dotnet/usuarios"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-dotnet text-white font-semibold hover:bg-dotnet/80 transition-colors"
          >
            {t('hero.cta_dotnet')} <ExternalLink size={14} />
          </a>
          <a
            href="/k8s-eso/"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-eso text-white font-semibold hover:bg-eso/80 transition-colors"
          >
            {t('hero.cta_eso')} <ExternalLink size={14} />
          </a>
        </motion.div>

        <motion.a
          {...fadeUp(0.6)}
          href="#problem"
          className="inline-flex flex-col items-center gap-2 text-slate-500 hover:text-conjur-cyan transition-colors mt-8"
        >
          <span className="text-sm">{t('hero.cta_explore')}</span>
          <ArrowDown size={16} className="animate-bounce" />
        </motion.a>
      </div>

      {/* Floating tech badges */}
      <div className="absolute bottom-12 left-6 hidden lg:flex flex-col gap-2 text-xs text-slate-600">
        {['Spring Boot 3.5', '.NET 8', 'GitHub Actions'].map(label => (
          <span key={label} className="badge bg-bg-card border-border text-slate-500">{label}</span>
        ))}
      </div>
      <div className="absolute bottom-12 right-6 hidden lg:flex flex-col gap-2 text-xs text-slate-600">
        {['ESO v2.1', 'Node.js 20', 'Conjur Cloud'].map(label => (
          <span key={label} className="badge bg-bg-card border-border text-slate-500">{label}</span>
        ))}
      </div>
    </section>
  )
}
