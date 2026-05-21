import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Server, Key, Database, Lock, Cloud } from 'lucide-react'

const steps = [
  { icon: Key,      color: 'text-conjur-cyan',  bg: 'bg-conjur-cyan/10',  border: 'border-conjur-cyan/30' },
  { icon: Lock,     color: 'text-conjur-gold',  bg: 'bg-conjur-gold/10',  border: 'border-conjur-gold/30' },
  { icon: Cloud,    color: 'text-conjur-gold',  bg: 'bg-conjur-gold/10',  border: 'border-conjur-gold/30' },
  { icon: Server,   color: 'text-conjur-cyan',  bg: 'bg-conjur-cyan/10',  border: 'border-conjur-cyan/30' },
  { icon: Database, color: 'text-spring',        bg: 'bg-spring/10',       border: 'border-spring/30' },
  { icon: Server,   color: 'text-slate-400',     bg: 'bg-bg-muted',        border: 'border-border' },
]

export default function ArchitectureDiagram() {
  const { t } = useTranslation()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  const flow = t('architecture.flow', { returnObjects: true }) as string[]

  return (
    <section id="architecture" ref={ref} className="py-24 px-6 bg-bg-muted/40">
      <div className="max-w-6xl mx-auto space-y-12">

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center space-y-3"
        >
          <span className="badge bg-conjur-gold/10 text-conjur-gold border border-conjur-gold/20">
            {t('architecture.badge')}
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold">{t('architecture.title')}</h2>
        </motion.div>

        {/* Animated node diagram */}
        <motion.div
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col items-center gap-0"
        >
          {flow.map((text, i) => {
            const { icon: Icon, color, bg, border } = steps[i] ?? steps[steps.length - 1]
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.12 }}
                className="flex flex-col items-center w-full max-w-2xl"
              >
                <div className={`w-full section-card ${border} flex gap-4 items-start py-4 px-5`}>
                  <div className={`flex-shrink-0 w-9 h-9 rounded-xl ${bg} border ${border} flex items-center justify-center`}>
                    <Icon size={16} className={color} />
                  </div>
                  <div className="flex items-start gap-3 flex-1">
                    <span className={`flex-shrink-0 text-xs font-bold font-mono ${color} w-5 pt-0.5`}>{i + 1}</span>
                    <p className="text-sm text-slate-300 leading-relaxed">{text}</p>
                  </div>
                </div>
                {i < flow.length - 1 && (
                  <motion.div
                    initial={{ scaleY: 0 }} animate={inView ? { scaleY: 1 } : {}}
                    transition={{ duration: 0.3, delay: 0.5 + i * 0.12 }}
                    className="step-connector origin-top"
                  />
                )}
              </motion.div>
            )
          })}
        </motion.div>

      </div>
    </section>
  )
}
