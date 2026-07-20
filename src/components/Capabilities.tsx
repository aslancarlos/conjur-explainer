import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { KeyRound, RefreshCw, ShieldCheck, ScrollText, Github, Globe } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const CAPS: Array<{ key: string; Icon: LucideIcon; color: string }> = [
  { key: 'identity', Icon: KeyRound,    color: '#4ad1f0' },
  { key: 'rotation', Icon: RefreshCw,   color: '#7c8cff' },
  { key: 'policy',   Icon: ShieldCheck, color: '#007bff' },
  { key: 'audit',    Icon: ScrollText,  color: '#00c0e8' },
  { key: 'oss',      Icon: Github,      color: '#fa582d' },
  { key: 'live',     Icon: Globe,       color: '#a9b6ff' },
]

export default function Capabilities() {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="px-6 lg:px-10 py-20 md:py-24 border-t border-border">
      <div className="max-w-7xl mx-auto" ref={ref}>
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-idira-cyan">{t('caps.kicker')}</p>
          <h2 className="mt-3 text-[clamp(26px,3.4vw,40px)] font-bold tracking-[-0.02em] text-text">{t('caps.title')}</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-text-2">{t('caps.subtitle')}</p>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CAPS.map((c, i) => (
            <motion.div
              key={c.key}
              initial={{ opacity: 0, y: 18 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.05, ease: [0.2, 0.7, 0.2, 1] }}
              className="rounded-2xl border border-border bg-bg-card p-6"
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl border"
                style={{ borderColor: `${c.color}55`, background: `${c.color}14`, color: c.color }}
              >
                <c.Icon size={20} />
              </span>
              <p className="mt-4 text-[15px] font-bold text-text">{t(`caps.${c.key}_title`)}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-text-2">{t(`caps.${c.key}_desc`)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
