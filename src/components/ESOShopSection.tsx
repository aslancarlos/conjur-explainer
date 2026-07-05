import { motion, useInView } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ExternalLink, RefreshCw, ShoppingCart, BarChart2 } from 'lucide-react'

interface HealthResponse {
  status: string
  secretsSource: string
  conjurPath: string
  dbHost: string
  dbUser: string
}

const colorMap: Record<string, string> = {
  cyan:   'text-conjur-cyan border-conjur-cyan/30 bg-conjur-cyan/5',
  gold:   'text-conjur-gold border-conjur-gold/30 bg-conjur-gold/5',
  eso:    'text-eso border-eso/30 bg-eso/5',
  purple: 'text-dotnet border-dotnet/30 bg-dotnet/5',
}

export default function ESOShopSection() {
  const { t } = useTranslation()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  const [data, setData] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHealth = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/k8s-eso/health')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'fetch failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (inView) fetchHealth() }, [inView])

  const steps = t('esoshop.steps', { returnObjects: true }) as Array<{
    n: string; title: string; code: string; color: string
  }>
  const features = t('esoshop.features', { returnObjects: true }) as Array<{
    title: string; desc: string
  }>

  return (
    <section id="esoshop" ref={ref} className="py-24 px-6 bg-bg-card/30">
      <div className="max-w-6xl mx-auto space-y-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-3">
            <span className="badge bg-eso/10 text-eso border border-eso/20">{t('esoshop.badge')}</span>
            <span className="badge bg-bg-card border-border text-text-muted">{t('esoshop.label')}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold flex items-center gap-3">
            <ShoppingCart size={32} className="text-eso" />
            {t('esoshop.title')}
            <span className="text-eso">{t('esoshop.titleAccent')}</span>
          </h2>
          <p className="text-text-muted leading-relaxed max-w-2xl">{t('esoshop.desc')}</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Steps */}
          <div className="space-y-0">
            {steps.map((step, i) => {
              const cls = colorMap[step.color] ?? colorMap.eso
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }} animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.12 }}
                  className="flex flex-col"
                >
                  <div className={`section-card border ${cls.split(' ').find(c => c.startsWith('border'))}`}>
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

          {/* Live status + features + links */}
          <div className="space-y-6">
            {/* Live health card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="section-card border-eso/20 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-eso animate-pulse-slow" />
                  <span className="badge bg-eso/10 text-eso border border-eso/20 text-xs">
                    {t('esoshop.live_badge')}
                  </span>
                </div>
                <button
                  onClick={fetchHealth}
                  disabled={loading}
                  aria-label="Refresh"
                  className="p-1.5 rounded-lg text-text-muted hover:text-eso hover:bg-eso/10 transition-colors"
                >
                  <RefreshCw size={14} aria-hidden="true" className={loading ? 'animate-spin' : ''} />
                </button>
              </div>

              <h4 className="font-semibold text-text">{t('esoshop.live_title')}</h4>

              {error && (
                <p className="text-xs text-conjur-red bg-conjur-red/10 rounded-lg px-3 py-2">{error}</p>
              )}
              {data && (
                <div className="code-block space-y-1 text-xs">
                  {[
                    ['status',      data.status],
                    ['source',      data.secretsSource],
                    ['conjurPath',  data.conjurPath],
                    ['dbHost',      data.dbHost],
                    ['dbUser',      data.dbUser],
                  ].map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <span className="text-conjur-cyan w-24 flex-shrink-0">{k}:</span>
                      <span className="text-conjur-gold break-all">&quot;{v}&quot;</span>
                    </div>
                  ))}
                </div>
              )}
              {!data && !error && loading && (
                <div className="text-xs text-text-muted animate-pulse">fetching /k8s-eso/health…</div>
              )}
              <p className="text-xs text-text-muted">{t('esoshop.live_note')}</p>
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

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.7 }}
              className="flex flex-wrap gap-3"
            >
              <a
                href="/k8s-eso/"
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-eso text-white text-sm font-semibold hover:bg-eso/80 transition-colors"
              >
                <ShoppingCart size={14} /> {t('esoshop.cta_shop')}
              </a>
              <a
                href="/k8s-eso/dashboard"
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-eso/30 text-eso text-sm font-semibold hover:bg-eso/10 transition-colors"
              >
                <BarChart2 size={14} /> {t('esoshop.cta_dashboard')}
              </a>
              <a
                href="/grafana"
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-conjur-gold/30 text-conjur-gold text-sm font-semibold hover:bg-conjur-gold/10 transition-colors"
              >
                <ExternalLink size={14} /> {t('esoshop.cta_grafana')}
              </a>
            </motion.div>
          </div>
        </div>

        {/* Operator architecture callout */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="section-card border-conjur-gold/20 space-y-4"
        >
          <div className="flex items-center gap-3">
            <span className="badge bg-conjur-gold/10 text-conjur-gold border border-conjur-gold/20">
              {t('esoshop.operator_badge')}
            </span>
          </div>
          <h3 className="text-lg font-bold text-text">{t('esoshop.operator_title')}</h3>
          <p className="text-sm text-text-muted leading-relaxed max-w-3xl">{t('esoshop.operator_desc')}</p>
          <div className="grid sm:grid-cols-3 gap-4 pt-2">
            {(t('esoshop.operator_steps', { returnObjects: true }) as Array<{ n: string; title: string; desc: string }>).map((s, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-conjur-gold/10 border border-conjur-gold/20 flex items-center justify-center text-xs font-bold text-conjur-gold">
                    {s.n}
                  </span>
                  <span className="text-sm font-semibold text-text">{s.title}</span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed pl-8">{s.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
