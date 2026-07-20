import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Clock, Eye, ShieldCheck, ExternalLink, Fingerprint, Lock, RefreshCw, ScrollText } from 'lucide-react'

const icons: Record<string, React.ElementType> = {
  alert: AlertTriangle,
  clock: Clock,
  eye: Eye,
}

interface Ref { label: string; href: string }

// Authoritative references per problem card (index-aligned with problem.items).
const REFS: Ref[][] = [
  [
    { label: 'MITRE ATT&CK T1552.001', href: 'https://attack.mitre.org/techniques/T1552/001/' },
    { label: 'CWE-798', href: 'https://cwe.mitre.org/data/definitions/798.html' },
    { label: 'OWASP A07:2021', href: 'https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/' },
  ],
  [
    { label: 'NIST SP 800-53 IA-5', href: 'https://csf.tools/reference/nist-sp-800-53/r5/ia/ia-5/' },
    { label: 'MITRE ATT&CK T1078', href: 'https://attack.mitre.org/techniques/T1078/' },
    { label: 'NIST SP 800-63B', href: 'https://pages.nist.gov/800-63-3/sp800-63b.html' },
  ],
  [
    { label: 'NIST SP 800-53 AU-2/AU-12', href: 'https://csf.tools/reference/nist-sp-800-53/r5/au/au-12/' },
    { label: 'CIS Control 8', href: 'https://www.cisecurity.org/controls/audit-log-management' },
    { label: 'PCI DSS Req. 10', href: 'https://www.pcisecuritystandards.org/document_library/' },
  ],
]

const SOLUTION_REFS: Ref[] = [
  { label: 'NIST SP 800-207 (Zero Trust)', href: 'https://csrc.nist.gov/pubs/sp/800/207/final' },
  { label: 'MITRE ATT&CK M1026', href: 'https://attack.mitre.org/mitigations/M1026/' },
  { label: 'NIST SP 800-53 IA-5 / AC-6', href: 'https://csf.tools/reference/nist-sp-800-53/r5/ac/ac-6/' },
  { label: 'CIS Control 5', href: 'https://www.cisecurity.org/controls/account-management' },
  { label: 'OWASP Secrets Management', href: 'https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html' },
]

// Icon + framework tag per solution pillar (index-aligned with problem.pillars).
const PILLAR_META: { Icon: React.ElementType; tag: string }[] = [
  { Icon: Fingerprint, tag: 'NIST IA-5' },
  { Icon: Lock,        tag: 'NIST AC-6' },
  { Icon: RefreshCw,   tag: 'NIST 800-63B' },
  { Icon: ScrollText,  tag: 'NIST AU-12' },
]

function RefPills({ refs, accent = 'red' }: { refs: Ref[]; accent?: 'red' | 'cyan' }) {
  const base =
    accent === 'cyan'
      ? 'border-conjur-cyan/30 bg-conjur-cyan/10 text-conjur-cyan hover:bg-conjur-cyan/20 hover:border-conjur-cyan/60'
      : 'border-conjur-red/30 bg-conjur-red/10 text-conjur-red hover:bg-conjur-red/20 hover:border-conjur-red/60'
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {refs.map(r => (
        <a
          key={r.label}
          href={r.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-[11px] font-medium transition-colors ${base}`}
        >
          {r.label}
          <ExternalLink size={11} aria-hidden="true" />
        </a>
      ))}
    </div>
  )
}

export default function ProblemSection() {
  const { t } = useTranslation()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  const items = t('problem.items', { returnObjects: true }) as Array<{
    icon: string; title: string; desc: string
  }>
  const pillars = t('problem.pillars', { returnObjects: true }) as Array<{
    title: string; desc: string
  }>

  return (
    <section id="problem" ref={ref} className="py-24 px-6">
      <div className="max-w-6xl mx-auto space-y-16">

        {/* Problem */}
        <div className="space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="text-center space-y-3"
          >
            <span className="badge bg-conjur-red/10 text-conjur-red border border-conjur-red/20">
              {t('problem.badge')}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">{t('problem.title')}</h2>
            <p className="max-w-2xl mx-auto text-base sm:text-lg text-text-2 leading-relaxed">
              {t('problem.subtitle')}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-6 items-stretch">
            {items.map((item, i) => {
              const Icon = icons[item.icon] ?? AlertTriangle
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-conjur-red/25 bg-gradient-to-b from-conjur-red/[0.07] to-bg-card p-6 transition-all hover:border-conjur-red/50 hover:-translate-y-1 hover:shadow-[0_20px_50px_-20px_rgba(239,68,68,0.35)]"
                >
                  {/* left accent bar */}
                  <span className="absolute left-0 top-0 h-full w-1 bg-conjur-red/70" aria-hidden />
                  {/* giant index numeral */}
                  <span className="pointer-events-none absolute -top-3 right-3 select-none font-black leading-none text-conjur-red/10 text-[92px]" aria-hidden>
                    {i + 1}
                  </span>

                  <div className="relative flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-conjur-red text-white shadow-lg shadow-conjur-red/30">
                      <Icon size={22} />
                    </div>
                  </div>

                  <h3 className="relative mt-4 text-xl font-bold leading-snug text-text">{item.title}</h3>
                  <p className="relative mt-2 text-sm leading-relaxed text-text-muted">{item.desc}</p>

                  <div className="relative mt-auto pt-5 space-y-2">
                    <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-conjur-red/80">
                      {t('problem.maps_to')}
                    </p>
                    <RefPills refs={REFS[i] ?? []} accent="red" />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Solution */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="relative section-card bg-gradient-to-br from-conjur-cyan/5 to-bg-card border-conjur-cyan/20"
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-conjur-cyan/5 to-transparent pointer-events-none" />
          <div className="relative space-y-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-conjur-cyan/10 flex items-center justify-center">
                <ShieldCheck size={22} className="text-conjur-cyan" />
              </div>
              <div className="space-y-3">
                <span className="badge bg-conjur-cyan/10 text-conjur-cyan border border-conjur-cyan/20 text-xs">
                  {t('problem.solution_badge')}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-text">{t('problem.solution_title')}</h3>
                <p className="text-text-muted leading-relaxed max-w-3xl">{t('problem.solution_desc')}</p>
              </div>
            </div>

            {/* Pillars — the four gaps, closed */}
            <div className="space-y-3">
              <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-conjur-cyan/80">
                {t('problem.pillars_label')}
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {pillars.map((p, i) => {
                  const { Icon, tag } = PILLAR_META[i] ?? PILLAR_META[0]
                  return (
                    <div key={i} className="rounded-xl border border-conjur-cyan/15 bg-conjur-cyan/[0.04] p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-conjur-cyan/12 text-conjur-cyan">
                        <Icon size={18} />
                      </div>
                      <h4 className="mt-3 text-sm font-bold text-text leading-snug">{p.title}</h4>
                      <p className="mt-1.5 text-[12.5px] leading-relaxed text-text-muted">{p.desc}</p>
                      <span className="mt-3 inline-flex items-center rounded-md border border-conjur-cyan/25 bg-conjur-cyan/10 px-2 py-0.5 font-mono text-[10px] font-medium text-conjur-cyan">
                        {tag}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Framework references */}
            <div className="space-y-2 border-t border-border/60 pt-5">
              <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-conjur-cyan/80">
                {t('problem.maps_to')}
              </p>
              <RefPills refs={SOLUTION_REFS} accent="cyan" />
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
