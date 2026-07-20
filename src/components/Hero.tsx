import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import CommandCenterFlow from './CommandCenterFlow'
import securityLayers from '../assets/brand/security-layers-blue.png'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.2, 0.7, 0.2, 1] as [number, number, number, number] },
})

const FEDERATED = ['Kubernetes', 'AWS', 'GitHub', 'Spring Boot', '.NET', 'Conjur Cloud']

export default function Hero() {
  const { t } = useTranslation()

  return (
    <section className="relative overflow-hidden bg-[#070c1c] text-white">
      {/* Official IDIRA "security layers" backdrop (right-anchored) */}
      <img
        src={securityLayers}
        alt=""
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 w-[52%] max-w-[720px] h-auto opacity-70 mix-blend-screen select-none"
      />
      {/* Iridescent mesh + dot grid */}
      <div className="hero-mesh pointer-events-none absolute inset-0 opacity-90" aria-hidden />
      <div className="hero-grid pointer-events-none absolute inset-0" aria-hidden />
      {/* Fade the backdrop into the copy on the left */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#070c1c] via-[#070c1c]/85 to-transparent" aria-hidden />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-10">
        {/* Copy */}
        <div className="max-w-3xl">
          <motion.h1 {...fadeUp(0.05)}
            className="font-semibold tracking-[-0.03em] leading-[0.98] text-[clamp(40px,6.4vw,80px)] max-w-[15ch]">
            {t('hero.title')}{' '}
            <em className="not-italic idira-shimmer">{t('hero.titleAccent')}</em>
          </motion.h1>

          <motion.p {...fadeUp(0.16)}
            className="mt-6 text-[15px] md:text-base leading-[1.65] text-slate-300/90 max-w-[62ch]">
            {t('hero.subtitle')}
          </motion.p>
        </div>

        {/* Command Center flow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.28, ease: [0.2, 0.7, 0.2, 1] }}
          className="mt-8 -mx-2 sm:mx-0 rounded-2xl border border-white/10 bg-white/[0.02] p-3 sm:p-5 overflow-x-auto"
        >
          <div className="min-w-[720px]">
            <CommandCenterFlow />
          </div>
        </motion.div>

        {/* Federated workloads strip */}
        <motion.div {...fadeUp(0.42)} className="mt-9">
          <p className="text-[10.5px] font-mono uppercase tracking-[0.16em] text-slate-500">{t('hero.federated_label')}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            {FEDERATED.map(f => (
              <span key={f} className="text-[13px] font-medium text-slate-400">{f}</span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Scroll hint */}
      <div className="relative pb-8 text-center">
        <a href="#problem" className="text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors">
          {t('hero.cta_explore')}
        </a>
      </div>
    </section>
  )
}
