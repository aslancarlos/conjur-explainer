import { useRef } from 'react'
import { m, useInView } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { KeyRound, RefreshCw, ShieldCheck, ScrollText, Github, Globe } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// Theme tokens only (AA in both themes): ownership/tone colours from DESIGN.md.
const CAPS: Array<{ key: string; Icon: LucideIcon; tone: string }> = [
  { key: 'identity', Icon: KeyRound,    tone: 'text-tone-live border-tone-live/30 bg-tone-live/10' },
  { key: 'rotation', Icon: RefreshCw,   tone: 'text-domain-cp border-domain-cp/30 bg-domain-cp/10' },
  { key: 'policy',   Icon: ShieldCheck, tone: 'text-domain-idira border-domain-idira/30 bg-domain-idira/10' },
  { key: 'audit',    Icon: ScrollText,  tone: 'text-tone-accent border-tone-accent/30 bg-tone-accent/10' },
  { key: 'oss',      Icon: Github,      tone: 'text-domain-k8s border-domain-k8s/30 bg-domain-k8s/10' },
  { key: 'live',     Icon: Globe,       tone: 'text-domain-svc border-domain-svc/30 bg-domain-svc/10' },
]

export default function Capabilities() {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="px-6 lg:px-10 py-20 md:py-24 border-t border-border">
      <div className="max-w-7xl mx-auto" ref={ref}>
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-tone-live">{t('caps.kicker')}</p>
          <h2 className="mt-3 text-[clamp(26px,3.4vw,40px)] font-bold leading-tight tracking-[-0.02em] text-text">{t('caps.title')}</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-text-2">{t('caps.subtitle')}</p>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CAPS.map((c, i) => (
            <m.div
              key={c.key}
              initial={{ opacity: 0, y: 18 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.05, ease: [0.2, 0.7, 0.2, 1] }}
              className="rounded-2xl border border-border bg-bg-card p-6"
            >
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl border ${c.tone}`}>
                <c.Icon size={20} aria-hidden="true" />
              </span>
              <p className="mt-4 text-[15px] font-bold text-text">{t(`caps.${c.key}_title`)}</p>
              <p className="mt-2 text-sm leading-relaxed text-text-2">{t(`caps.${c.key}_desc`)}</p>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  )
}
