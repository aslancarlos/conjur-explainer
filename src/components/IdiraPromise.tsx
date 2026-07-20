import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * IDIRA promise band — the "zero hardcoded secrets" closing statement.
 * Always deep navy in both themes; rotating conic PANTONE gradient behind;
 * giant 0 numeral with a Living Coral glow on the trailing dot.
 */
export default function IdiraPromise() {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: 16 },
    animate: inView ? { opacity: 1, y: 0 } : {},
    transition: { duration: 0.7, delay, ease: [0.2, 0.7, 0.2, 1] as [number, number, number, number] },
  })

  return (
    <section className="px-6 lg:px-10 py-20 md:py-24">
      <div className="max-w-7xl mx-auto">
        <div ref={ref} className="idira-promise">
          <div className="relative z-10 max-w-[780px]">
            <motion.p {...rise(0)}
              className="flex items-center gap-4 font-mono text-[12px] uppercase tracking-[0.12em] text-slate-400">
              <span className="w-9 h-px bg-[#4ad1f0] inline-block" />
              {t('promise.eyebrow')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.9, delay: 0.1, ease: [0.2, 0.7, 0.2, 1] }}
              className="mt-4"
              aria-hidden
            >
              <span className="idira-promise-zero">0</span>
            </motion.div>

            <motion.h3 {...rise(0.25)}
              className="mt-6 text-[clamp(22px,2.6vw,34px)] font-semibold leading-[1.25] tracking-[-0.02em]">
              {t('promise.claim_pre')}{' '}
              <mark className="bg-transparent idira-shimmer font-bold">{t('promise.claim_mark')}</mark>
            </motion.h3>

            <motion.p {...rise(0.35)}
              className="mt-7 text-[15px] leading-[1.7] text-slate-300 max-w-[62ch]">
              {t('promise.detail')}
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  )
}
