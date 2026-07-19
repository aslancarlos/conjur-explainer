import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Minus } from 'lucide-react'

interface Row {
  feature: string
  spring: string; springIcon: string
  dotnet: string; dotnetIcon: string
  gha: string;    ghaIcon: string
  eso: string;    esoIcon: string
}

interface BestFor { title: string; desc: string }

const renderCell = (value: string, icon: string) => {
  if (icon === 'check') return (
    <span className="inline-flex items-center gap-1 text-spring font-medium text-xs sm:text-sm">
      <Check size={13} /> {value}
    </span>
  )
  if (icon === 'minus') return (
    <span className="inline-flex items-center gap-1 text-text-muted text-xs sm:text-sm">
      <Minus size={13} /> {value}
    </span>
  )
  return <span className="text-text-2 text-xs sm:text-sm">{value}</span>
}

export default function ComparisonTable() {
  const { t } = useTranslation()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  const rows = t('compare.rows', { returnObjects: true }) as Row[]
  const bestFor = t('compare.best_for', { returnObjects: true }) as BestFor[]

  const cols = [
    { key: 'spring', labelKey: 'compare.col_spring', color: 'text-spring',  dot: 'bg-spring'  },
    { key: 'dotnet', labelKey: 'compare.col_dotnet', color: 'text-dotnet',  dot: 'bg-dotnet'  },
    { key: 'gha',    labelKey: 'compare.col_gha',    color: 'text-gh',      dot: 'bg-gh'      },
    { key: 'eso',    labelKey: 'compare.col_eso',    color: 'text-eso',     dot: 'bg-eso'     },
  ] as const

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
          <p className="text-text-muted max-w-2xl mx-auto">{t('compare.subtitle')}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="overflow-x-auto rounded-2xl border border-border"
        >
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-border bg-bg-card">
                <th className="text-left px-5 py-4 text-text-muted font-medium w-[22%]">
                  {t('compare.col_feature')}
                </th>
                {cols.map(c => (
                  <th key={c.key} className="text-left px-4 py-4 w-[19.5%]">
                    <span className={`inline-flex items-center gap-2 ${c.color} font-semibold text-xs sm:text-sm`}>
                      <span className={`w-2 h-2 rounded-full ${c.dot} flex-shrink-0`} />
                      {t(c.labelKey)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0, x: -12 }} animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.35, delay: 0.3 + i * 0.06 }}
                  className={`border-b border-border/50 ${i % 2 === 0 ? 'bg-bg-base' : 'bg-bg-card/40'} hover:bg-bg-card transition-colors`}
                >
                  <td className="px-5 py-3.5 font-medium text-text text-xs sm:text-sm">{row.feature}</td>
                  <td className="px-4 py-3.5">{renderCell(row.spring, row.springIcon)}</td>
                  <td className="px-4 py-3.5">{renderCell(row.dotnet, row.dotnetIcon)}</td>
                  <td className="px-4 py-3.5">{renderCell(row.gha,    row.ghaIcon)}</td>
                  <td className="px-4 py-3.5">{renderCell(row.eso,    row.esoIcon)}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Best-for cards — 4 columns */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {bestFor.map((b, i) => {
            const border = ['border-spring/20', 'border-dotnet/20', 'border-gh/20', 'border-eso/20'][i]
            const color  = ['text-spring', 'text-dotnet', 'text-gh', 'text-eso'][i]
            return (
              <div key={i} className={`section-card ${border} space-y-2`}>
                <p className={`text-sm font-semibold ${color}`}>{b.title}</p>
                <p className="text-xs text-text-muted leading-relaxed">{b.desc}</p>
              </div>
            )
          })}
        </motion.div>

      </div>
    </section>
  )
}
