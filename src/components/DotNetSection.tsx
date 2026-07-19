import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ExternalLink, Puzzle } from 'lucide-react'

const colorMap: Record<string, string> = {
  purple: 'text-dotnet border-dotnet/30 bg-dotnet/5',
  gold:   'text-conjur-gold border-conjur-gold/30 bg-conjur-gold/5',
  cyan:   'text-conjur-cyan border-conjur-cyan/30 bg-conjur-cyan/5',
}

export default function DotNetSection() {
  const { t } = useTranslation()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  const steps = t('dotnet.steps', { returnObjects: true }) as Array<{
    n: string; title: string; code: string; color: string
  }>
  const features = t('dotnet.features', { returnObjects: true }) as Array<{
    title: string; desc: string
  }>

  return (
    <section id="dotnet" ref={ref} className="py-24 px-6 bg-bg-muted/40">
      <div className="max-w-6xl mx-auto space-y-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-3">
            <span className="badge bg-dotnet/10 text-dotnet border border-dotnet/20">{t('dotnet.badge')}</span>
            <span className="badge bg-bg-card border-border text-text-muted">{t('dotnet.label')}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold flex items-center gap-3">
            <Puzzle size={32} className="text-dotnet" />
            {t('dotnet.title')}
            <span className="text-dotnet">{t('dotnet.titleAccent')}</span>
          </h2>
          <p className="text-text-muted leading-relaxed max-w-2xl">{t('dotnet.desc')}</p>
        </motion.div>

        {/* Zero-code highlight */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }} animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="section-card border-dotnet/20 bg-gradient-to-r from-dotnet/5 to-bg-card"
        >
          <p className="text-center text-2xl font-bold">
            <span className="text-dotnet">Zero Conjur code</span>{' '}
            <span className="text-text-muted font-normal text-lg">in the .NET application.</span>{' '}
            <span className="text-text">The sidecar does the work.</span>
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

          {/* Features + sidecar diagram */}
          <div className="space-y-6">
            {/* Sidecar visual */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="section-card border-dotnet/20 space-y-4"
            >
              <h4 className="font-semibold text-text text-sm">Pod anatomy</h4>
              <div className="rounded-xl border border-border bg-bg-base p-4 space-y-3">
                {/* Pod container */}
                <div className="text-xs text-text-muted font-mono mb-2">K8s Pod</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-dotnet/30 bg-dotnet/5 p-3 space-y-1">
                    <div className="text-xs font-bold text-dotnet">secrets-provider</div>
                    <div className="text-xs text-text-muted">authenticates with Conjur</div>
                    <div className="text-xs text-text-muted">writes K8s Secret</div>
                    <div className="w-2 h-2 rounded-full bg-dotnet animate-pulse-slow" />
                  </div>
                  <div className="rounded-lg border border-conjur-cyan/30 bg-conjur-cyan/5 p-3 space-y-1">
                    <div className="text-xs font-bold text-conjur-cyan">dotnet app</div>
                    <div className="text-xs text-text-muted">reads env vars</div>
                    <div className="text-xs text-text-muted">DB_USER / DB_PASS</div>
                    <div className="w-2 h-2 rounded-full bg-conjur-cyan animate-pulse-slow" />
                  </div>
                </div>
                <div className="text-xs text-center text-text-muted font-mono">
                  ↑ both share the same pod, different containers
                </div>
              </div>
            </motion.div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.5 + i * 0.08 }}
                  className="section-card space-y-1"
                >
                  <p className="text-sm font-semibold text-text">{f.title}</p>
                  <p className="text-xs text-text-muted leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>

            <motion.a
              initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.7 }}
              href="/dotnet/usuarios"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-dotnet text-white text-sm font-semibold hover:bg-dotnet/80 transition-colors"
            >
              {t('dotnet.cta')} <ExternalLink size={14} />
            </motion.a>
          </div>
        </div>
      </div>
    </section>
  )
}
