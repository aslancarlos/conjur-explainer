import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ExternalLink, Puzzle } from 'lucide-react'
import SidecarFlow from './flow/specs/SidecarFlow'

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
          transition={{ duration: 0.3 }}
          className="space-y-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge bg-dotnet/10 text-dotnet border border-dotnet/20">{t('dotnet.badge')}</span>
            <span className="badge bg-bg-card border-border text-text-muted">{t('dotnet.label')}</span>
            <span className="badge bg-bg-card border-border text-text-muted">{t('dotnet.example')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-3">
            <Puzzle size={32} className="text-dotnet" />
            {t('dotnet.title')}
            <span className="text-dotnet">{t('dotnet.titleAccent')}</span>
          </h1>
          <p className="text-text-muted leading-relaxed max-w-2xl">{t('dotnet.desc')}</p>
        </motion.div>

        {/* How it works (FlowPlayer, DESIGN.md §10) */}
        <SidecarFlow />

        {/* Zero-code highlight */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }} animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="section-card border-dotnet/20 bg-gradient-to-r from-dotnet/5 to-bg-card"
        >
          <p className="text-center text-2xl font-bold">
            <span className="text-dotnet">{t('dotnet.banner_zero')}</span>{' '}
            <span className="text-text-muted font-normal text-lg">{t('dotnet.banner_app')}</span>{' '}
            <span className="text-text">{t('dotnet.banner_sidecar')}</span>
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
                  transition={{ duration: 0.3, delay: 0.1 + i * 0.12 }}
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
            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.3, delay: 0.5 + i * 0.08 }}
                  className="section-card space-y-1"
                >
                  <p className="text-sm font-semibold text-text">{f.title}</p>
                  <p className="text-xs text-text-muted leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>

            <motion.a
              initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.3, delay: 0.7 }}
              href="/dotnet/usuarios"
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-11 items-center gap-2 px-5 rounded-full bg-dotnet-solid text-white text-sm font-semibold hover:bg-dotnet-solid/90 transition-colors"
            >
              {t('dotnet.cta')} <ExternalLink size={14} />
            </motion.a>
          </div>
        </div>
      </div>
    </section>
  )
}
