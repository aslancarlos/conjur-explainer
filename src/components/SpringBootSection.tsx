import { motion, useInView } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ExternalLink, RefreshCw, Leaf } from 'lucide-react'

interface CheckItResponse {
  status: string
  dbHost: string
  dbUserMasked: string
  dbPasswordMasked: string
  cacheAgeSeconds: number
}

const colorMap: Record<string, string> = {
  cyan:   'text-conjur-cyan border-conjur-cyan/30 bg-conjur-cyan/5',
  gold:   'text-conjur-gold border-conjur-gold/30 bg-conjur-gold/5',
  spring: 'text-spring border-spring/30 bg-spring/5',
}

export default function SpringBootSection() {
  const { t } = useTranslation()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  const [data, setData] = useState<CheckItResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/springboot/checkit')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'fetch failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (inView) fetchStatus() }, [inView])

  const steps = t('springboot.steps', { returnObjects: true }) as Array<{
    n: string; title: string; code: string; color: string
  }>
  const features = t('springboot.features', { returnObjects: true }) as Array<{
    title: string; desc: string
  }>

  return (
    <section id="springboot" ref={ref} className="py-24 px-6">
      <div className="max-w-6xl mx-auto space-y-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-3">
            <span className="badge bg-spring/10 text-spring border border-spring/20">{t('springboot.badge')}</span>
            <span className="badge bg-bg-card border-border text-slate-400">{t('springboot.label')}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold flex items-center gap-3">
            <Leaf size={32} className="text-spring" />
            {t('springboot.title')}
            <span className="text-spring">{t('springboot.titleAccent')}</span>
          </h2>
          <p className="text-slate-400 leading-relaxed max-w-2xl">{t('springboot.desc')}</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Steps */}
          <div className="space-y-0">
            {steps.map((step, i) => {
              const cls = colorMap[step.color] ?? colorMap.cyan
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
                      <span className="font-semibold text-white text-sm">{step.title}</span>
                    </div>
                    <pre className="code-block text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap">
                      <code className="text-slate-300">{step.code}</code>
                    </pre>
                  </div>
                  {i < steps.length - 1 && <div className="step-connector" />}
                </motion.div>
              )
            })}
          </div>

          {/* Live status + features */}
          <div className="space-y-6">
            {/* Live card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="section-card border-spring/20 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-spring animate-pulse-slow" />
                  <span className="badge bg-spring/10 text-spring border border-spring/20 text-xs">
                    {t('springboot.live_badge')}
                  </span>
                </div>
                <button
                  onClick={fetchStatus}
                  disabled={loading}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-spring hover:bg-spring/10 transition-colors"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>

              <h4 className="font-semibold text-white">{t('springboot.live_title')}</h4>

              {error && (
                <p className="text-xs text-conjur-red bg-conjur-red/10 rounded-lg px-3 py-2">{error}</p>
              )}
              {data && (
                <div className="code-block space-y-1 text-xs">
                  {[
                    ['status',    data.status],
                    ['dbHost',    data.dbHost],
                    ['dbUser',    data.dbUserMasked],
                    ['dbPass',    data.dbPasswordMasked],
                    ['cacheAge',  `${data.cacheAgeSeconds}s`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <span className="text-conjur-cyan w-20 flex-shrink-0">{k}:</span>
                      <span className="text-conjur-gold">&quot;{v}&quot;</span>
                    </div>
                  ))}
                </div>
              )}
              {!data && !error && loading && (
                <div className="text-xs text-slate-500 animate-pulse">fetching /springboot/checkit…</div>
              )}
              <p className="text-xs text-slate-500">{t('springboot.live_note')}</p>
            </motion.div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.5 + i * 0.08 }}
                  className="section-card space-y-1"
                >
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>

            <motion.a
              initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.7 }}
              href="/springboot/dashboard"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-spring text-white text-sm font-semibold hover:bg-spring/80 transition-colors"
            >
              {t('springboot.cta')} <ExternalLink size={14} />
            </motion.a>
          </div>
        </div>
      </div>
    </section>
  )
}
