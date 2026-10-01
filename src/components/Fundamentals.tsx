import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Check, ExternalLink, Fingerprint, KeyRound, ScrollText, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// Definitions follow the Secrets Manager SaaS "Key concepts" pages.
const DOCS = {
  secret:   'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/get%20started/key_concepts/secrets.html',
  identity: 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/get%20started/key_concepts/machine_identity.html',
}

interface Concept { key: 'secret' | 'identity'; Icon: LucideIcon }
const CONCEPTS: Concept[] = [
  { key: 'secret',   Icon: KeyRound },
  { key: 'identity', Icon: Fingerprint },
]
const STEPS: Array<{ key: 'prove' | 'authorize' | 'deliver'; Icon: LucideIcon }> = [
  { key: 'prove',     Icon: Fingerprint },
  { key: 'authorize', Icon: ScrollText },
  { key: 'deliver',   Icon: KeyRound },
]

/**
 * Home "Fundamentals": what a secret is, what a machine identity is, and how
 * they fit (identity → policy → secret). Sits between the hero and the demo
 * catalogue so every demo that follows reads in these terms.
 */
export default function Fundamentals() {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const enter = (i: number) => ({
    initial: reduce ? false : { opacity: 0, y: 16 },
    animate: inView ? { opacity: 1, y: 0 } : {},
    transition: { duration: 0.45, delay: i * 0.08, ease: [0.2, 0.7, 0.2, 1] as [number, number, number, number] },
  })

  return (
    <section id="fundamentals" className="px-6 lg:px-10 py-20 md:py-24 border-b border-border">
      <div className="max-w-7xl mx-auto" ref={ref}>
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-tone-live">{t('fundamentals.kicker')}</p>
          <h2 className="mt-3 text-[clamp(26px,3.4vw,40px)] font-bold leading-tight tracking-[-0.02em] text-text">
            {t('fundamentals.title')}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-text-2">{t('fundamentals.subtitle')}</p>
        </div>

        {/* The two concepts */}
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {CONCEPTS.map((c, i) => {
            const examples = t(`fundamentals.${c.key}.examples`, { returnObjects: true }) as string[]
            const points = t(`fundamentals.${c.key}.points`, { returnObjects: true }) as string[]
            return (
              <motion.article key={c.key} {...enter(i)}
                className="flex flex-col rounded-2xl border border-border bg-bg-card p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-idira-blue/10 text-tone-accent" aria-hidden="true">
                    <c.Icon size={22} strokeWidth={1.8} />
                  </span>
                  <h3 className="text-xl font-semibold text-text">{t(`fundamentals.${c.key}.title`)}</h3>
                </div>
                <p className="mt-4 text-base leading-relaxed text-text-2">{t(`fundamentals.${c.key}.def`)}</p>

                <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-text-muted">{t('fundamentals.examples_label')}</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {examples.map(e => (
                    <li key={e} className="rounded-md border border-border bg-bg-muted px-2.5 py-1 font-mono text-xs text-text-2">{e}</li>
                  ))}
                </ul>

                <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-text-muted">{t('fundamentals.in_idira')}</p>
                <ul className="mt-2 space-y-2.5 flex-1">
                  {points.map(p => (
                    <li key={p} className="flex gap-2.5 text-sm leading-relaxed text-text-2">
                      <Check size={16} strokeWidth={2.2} className="mt-0.5 shrink-0 text-tone-accent" aria-hidden="true" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>

                <a href={DOCS[c.key]} target="_blank" rel="noreferrer"
                  className="mt-6 inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold text-tone-accent hover:underline underline-offset-4">
                  {t(`fundamentals.${c.key}.doc`)}<ExternalLink size={13} aria-hidden="true" />
                </a>
              </motion.article>
            )
          })}
        </div>

        {/* How they fit */}
        <motion.div {...enter(2)} className="mt-6 rounded-2xl border border-border bg-bg-muted/50 p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-text">{t('fundamentals.fit_title')}</h3>
          <ol className="mt-5 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.key} className="relative flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-bg-card text-tone-accent" aria-hidden="true">
                  <s.Icon size={17} strokeWidth={1.9} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text">
                    <span className="font-mono text-text-muted">{i + 1}.</span> {t(`fundamentals.steps.${s.key}.title`)}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-text-2">{t(`fundamentals.steps.${s.key}.desc`)}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <ArrowRight size={16} className="absolute -right-3 top-2.5 hidden md:block text-text-muted" aria-hidden="true" />
                )}
              </li>
            ))}
          </ol>
          <p className="mt-6 flex gap-2.5 border-t border-border pt-5 text-sm leading-relaxed text-text">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-tone-accent" aria-hidden="true" />
            <span><strong className="font-semibold">{t('fundamentals.zero_title')}</strong> {t('fundamentals.zero_desc')}</span>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
