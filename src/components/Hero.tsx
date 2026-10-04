import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowDown, Fingerprint, KeyRound } from 'lucide-react'
import securityLayers from '../assets/brand/security-layers-blue.png'

/**
 * Home hero: teaches first: the headline is the machine-identity idea, and the
 * two calls to action open the Concepts pages. The live flow diagram follows
 * in its own section (FlowSection).
 */
export default function Hero() {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const fadeUp = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: [0.2, 0.7, 0.2, 1] as [number, number, number, number] },
  })

  return (
    <section className="relative overflow-hidden hero-band">
      {/* Official IDIRA "security layers" backdrop (right-anchored) */}
      <img src={securityLayers} alt="" aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 w-[95%] sm:w-[52%] max-w-[720px] h-auto opacity-40 sm:opacity-70 mix-blend-screen select-none" />
      <div className="hero-mesh pointer-events-none absolute inset-0 opacity-90" aria-hidden="true" />
      <div className="hero-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-idira-navy via-idira-navy/85 to-transparent" aria-hidden="true" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-12 md:pt-24 md:pb-16">
        <div className="max-w-3xl">
          <motion.p {...fadeUp(0)} className="font-mono text-xs uppercase tracking-[0.16em] text-idira-cyan">
            {t('hero.eyebrow')}
          </motion.p>
          <motion.h1 {...fadeUp(0.05)}
            className="mt-4 font-semibold tracking-[-0.03em] leading-[1.02] text-[clamp(38px,6vw,76px)] max-w-[16ch]">
            {t('hero.title')}{' '}
            <em className="not-italic idira-shimmer">{t('hero.titleAccent')}</em>
          </motion.h1>
          <motion.p {...fadeUp(0.16)} className="mt-6 text-base md:text-lg leading-relaxed text-slate-300/90 max-w-[60ch]">
            {t('hero.subtitle')}
          </motion.p>

          <motion.div {...fadeUp(0.26)} className="mt-9 flex flex-wrap gap-3">
            <Link to="/concepts/secrets"
              className="btn-primary focus-visible:ring-offset-idira-deep">
              <KeyRound size={17} aria-hidden="true" />{t('hero.cta_secret')}
            </Link>
            <Link to="/concepts/machine-identity"
              className="btn border border-white/25 bg-white/5 text-white hover:border-white/40 hover:bg-white/10 focus-visible:ring-offset-idira-deep">
              <Fingerprint size={17} aria-hidden="true" />{t('hero.cta_identity')}
            </Link>
          </motion.div>
        </div>
      </div>

      <div className="relative pb-8 text-center">
        <a href="#flow-live" className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 font-mono text-xs text-slate-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-cyan">
          {t('hero.cta_explore')}<ArrowDown size={13} aria-hidden="true" />
        </a>
      </div>
    </section>
  )
}
