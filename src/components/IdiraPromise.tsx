import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * IDIRA promise band — the "Zero hardcoded secrets" closing statement.
 *
 * Visual signatures:
 *  - Always deep navy (#001236) in both themes
 *  - Rotating conic-gradient blurred behind (40s loop)
 *  - Giant 0 numeral with orange glow on the dot
 *  - Iridescent cyan emphasis on the claim
 */
export default function IdiraPromise() {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="px-6 lg:px-10 py-24">
      <div className="max-w-7xl mx-auto">
        <div ref={ref} className="idira-promise">
          <div className="relative z-10 max-w-[760px]">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
              className="flex items-center gap-4 font-mono text-[12.5px] uppercase tracking-[0.12em] text-slate-400/80"
            >
              <span className="w-9 h-px bg-idira-blue inline-block" />
              {t('promise.eyebrow')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.9, delay: 0.1, ease: [0.2, 0.7, 0.2, 1] }}
              className="mt-6"
              aria-label="Zero"
            >
              <span className="idira-promise-zero">0</span>
            </motion.div>

            <motion.h3
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
              className="mt-8 text-[clamp(22px,2.5vw,32px)] font-semibold leading-[1.25] tracking-[-0.02em]"
            >
              {t('promise.claim_pre')}{' '}
              <mark className="bg-transparent text-idira-cyan font-bold">
                {t('promise.claim_mark')}
              </mark>
            </motion.h3>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
              className="mt-7 text-[15px] leading-[1.65] text-slate-300 max-w-[58ch]"
            >
              {t('promise.detail')}
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  )
}
