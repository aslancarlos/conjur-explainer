import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ExternalLink, GitBranch, Github, ShieldCheck } from 'lucide-react'
import GhaLiveRunner from './GhaLiveRunner'

const colorMap: Record<string, string> = {
  cyan:   'text-conjur-cyan border-conjur-cyan/30 bg-conjur-cyan/5',
  gold:   'text-conjur-gold border-conjur-gold/30 bg-conjur-gold/5',
  gh:     'text-gh border-gh/30 bg-gh/5',
  spring: 'text-spring border-spring/30 bg-spring/5',
}

export default function GitHubActionsSection() {
  const { t } = useTranslation()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  const steps = t('gha.steps', { returnObjects: true }) as Array<{
    n: string; title: string; code: string; color: string
  }>
  const features = t('gha.features', { returnObjects: true }) as Array<{
    title: string; desc: string
  }>
  const stages = t('gha.stages', { returnObjects: true }) as Array<{
    n: string; title: string
  }>

  return (
    <section id="gha" ref={ref} className="py-24 px-6 bg-bg-muted/40">
      <div className="max-w-6xl mx-auto space-y-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-3">
            <span className="badge bg-gh/10 text-gh border border-gh/20">{t('gha.badge')}</span>
            <span className="badge bg-bg-card border-border text-text-muted">{t('gha.label')}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold flex items-center gap-3">
            <Github size={32} className="text-gh" />
            {t('gha.title')}
            <span className="text-gh">{t('gha.titleAccent')}</span>
          </h2>
          <p className="text-text-muted leading-relaxed max-w-2xl">{t('gha.desc')}</p>
        </motion.div>

        {/* Zero-credential highlight */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }} animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="section-card border-gh/20 bg-gradient-to-r from-gh/5 to-bg-card"
        >
          <p className="text-center text-2xl font-bold">
            <span className="text-gh">Zero credentials stored</span>{' '}
            <span className="text-text-muted font-normal text-lg">in the runner, repository, or pipeline.</span>{' '}
            <span className="text-text">GitHub's identity IS the credential.</span>
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">

          {/* Steps */}
          <div className="space-y-0">
            {steps.map((step, i) => {
              const cls = colorMap[step.color] ?? colorMap.cyan
              const borderCls = cls.split(' ').find(c => c.startsWith('border')) ?? ''
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }} animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.12 }}
                  className="flex flex-col"
                >
                  <div className={`section-card border ${borderCls}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${cls}`}>
                        {step.n}
                      </span>
                      <span className="font-semibold text-text text-sm">{step.title}</span>
                    </div>
                    <pre className="code-block text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap">
                      <code className="text-text-2">{step.code}</code>
                    </pre>
                  </div>
                  {i < steps.length - 1 && <div className="step-connector" />}
                </motion.div>
              )
            })}
          </div>

          {/* Right column */}
          <div className="space-y-6">

            {/* Flow diagram */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="section-card border-gh/20 space-y-4"
            >
              <h4 className="font-semibold text-text text-sm flex items-center gap-2">
                <GitBranch size={14} className="text-gh" />
                {t('gha.flow_title')}
              </h4>

              <div className="space-y-2">
                {[
                  { label: 'GitHub Actions Runner', sub: 'workflow triggered', color: 'text-gh', dot: 'bg-gh' },
                  { label: 'GitHub OIDC Provider', sub: 'issues signed JWT', color: 'text-conjur-cyan', dot: 'bg-conjur-cyan' },
                  { label: 'PANW|IDIRA Conjur', sub: 'validates JWT claims (repo + workflow)', color: 'text-conjur-gold', dot: 'bg-conjur-gold' },
                  { label: 'Privilege Cloud Vault', sub: 'returns secret values', color: 'text-conjur-gold', dot: 'bg-conjur-gold' },
                  { label: 'Workflow Steps', sub: 'masked env vars injected', color: 'text-spring', dot: 'bg-spring' },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-start">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ${item.dot} flex-shrink-0`} />
                      <span className={`text-xs font-semibold ${item.color}`}>{item.label}</span>
                      <span className="text-xs text-text-muted">{item.sub}</span>
                    </div>
                    {i < 4 && (
                      <div className="ml-[3px] w-px h-4 border-l border-dashed border-border" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Workshop stages — live runner */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <GhaLiveRunner stages={stages} />
            </motion.div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: 1.0 + i * 0.08 }}
                  className="section-card space-y-1"
                >
                  <p className="text-sm font-semibold text-text">{f.title}</p>
                  <p className="text-xs text-text-muted leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.4, delay: 1.2 }}
              className="flex flex-wrap gap-3"
            >
              <a
                href="https://github.com/aslancarlos/workshop-action"
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gh text-white text-sm font-semibold hover:bg-gh/80 transition-colors"
              >
                <Github size={14} /> {t('gha.cta_repo')}
              </a>
              <a
                href="https://github.com/aslancarlos/workshop-action/blob/main/.github/workflows/main.yml"
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gh/30 text-gh text-sm font-semibold hover:bg-gh/10 transition-colors"
              >
                <ShieldCheck size={14} /> {t('gha.cta_workflow')} <ExternalLink size={12} />
              </a>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  )
}
