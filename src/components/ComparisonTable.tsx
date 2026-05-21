import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Minus } from 'lucide-react'

export default function ComparisonTable() {
  const { t } = useTranslation()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  const rows = t('compare.rows', { returnObjects: true }) as Array<{
    feature: string
    spring: string
    dotnet: string
    springIcon: string
    dotnetIcon: string
  }>

  const renderCell = (value: string, icon: string) => {
    if (icon === 'check') return (
      <span className="inline-flex items-center gap-1.5 text-spring font-medium">
        <Check size={14} /> {value}
      </span>
    )
    if (icon === 'minus') return (
      <span className="inline-flex items-center gap-1.5 text-slate-500">
        <Minus size={14} /> {value}
      </span>
    )
    return <span className="text-slate-300">{value}</span>
  }

  return (
    <section id="compare" ref={ref} className="py-24 px-6 bg-bg-muted/40">
      <div className="max-w-6xl mx-auto space-y-12">

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center space-y-3"
        >
          <span className="badge bg-conjur-gold/10 text-conjur-gold border border-conjur-gold/20">
            {t('compare.badge')}
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold">{t('compare.title')}</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">{t('compare.subtitle')}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="overflow-x-auto rounded-2xl border border-border"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-card">
                <th className="text-left px-6 py-4 text-slate-400 font-medium w-1/3">
                  {t('compare.col_feature')}
                </th>
                <th className="text-left px-6 py-4 w-1/3">
                  <span className="inline-flex items-center gap-2 text-spring font-semibold">
                    <span className="w-2 h-2 rounded-full bg-spring" />
                    {t('compare.col_spring')}
                  </span>
                </th>
                <th className="text-left px-6 py-4 w-1/3">
                  <span className="inline-flex items-center gap-2 text-dotnet font-semibold">
                    <span className="w-2 h-2 rounded-full bg-dotnet" />
                    {t('compare.col_dotnet')}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0, x: -12 }} animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.35, delay: 0.3 + i * 0.07 }}
                  className={`border-b border-border/50 ${i % 2 === 0 ? 'bg-bg-base' : 'bg-bg-card/40'} hover:bg-bg-card transition-colors`}
                >
                  <td className="px-6 py-4 font-medium text-white">{row.feature}</td>
                  <td className="px-6 py-4">{renderCell(row.spring, row.springIcon)}</td>
                  <td className="px-6 py-4">{renderCell(row.dotnet, row.dotnetIcon)}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="grid sm:grid-cols-2 gap-6"
        >
          <div className="section-card border-spring/20 space-y-2">
            <p className="text-sm font-semibold text-spring">{t('compare.spring_best_for_title')}</p>
            <p className="text-sm text-slate-400">{t('compare.spring_best_for_desc')}</p>
          </div>
          <div className="section-card border-dotnet/20 space-y-2">
            <p className="text-sm font-semibold text-dotnet">{t('compare.dotnet_best_for_title')}</p>
            <p className="text-sm text-slate-400">{t('compare.dotnet_best_for_desc')}</p>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
