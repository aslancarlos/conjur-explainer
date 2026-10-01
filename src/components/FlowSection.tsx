import { useTranslation } from 'react-i18next'
import CommandCenterFlow from './CommandCenterFlow'

/**
 * "See it live": the Command Center diagram as an illustration of the
 * prove → authorize → deliver model taught above. Always-dark band, because
 * the diagram is drawn for a dark ground (DESIGN.md §2).
 */
export default function FlowSection() {
  const { t } = useTranslation()
  return (
    <section id="flow-live" className="relative overflow-hidden bg-[#070c1c] text-white px-6 lg:px-10 py-20 md:py-24">
      <div className="hero-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="relative max-w-7xl mx-auto">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#4ad1f0]">{t('flowlive.kicker')}</p>
          <h2 className="mt-3 text-[clamp(26px,3.4vw,40px)] font-bold leading-tight tracking-[-0.02em]">{t('flowlive.title')}</h2>
          <p className="mt-4 text-base leading-relaxed text-slate-300/90">{t('flowlive.subtitle')}</p>
        </div>
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
          <CommandCenterFlow />
        </div>
      </div>
    </section>
  )
}
