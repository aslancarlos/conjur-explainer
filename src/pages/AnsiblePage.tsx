import { useTranslation } from 'react-i18next'
import PageHeader from '../components/PageHeader'
import AnsibleFlow from '../components/flow/specs/AnsibleFlow'

export default function AnsiblePage() {
  const { t } = useTranslation()

  return (
    <section className="min-h-screen bg-bg-base px-4 py-16 flex flex-col items-center">

      <PageHeader className="max-w-5xl mb-10" badge={t('ansible.badge')} title={t('ansible.title')} subtitle={t('ansible.subtitle')} />

      {/* Animated diagram (FlowPlayer, DESIGN.md §10) */}
      <div className="w-full max-w-5xl">
        <AnsibleFlow />
      </div>

      {/* Concept cards */}
      <div className="w-full max-w-5xl mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(n => (
          <div key={n} className="section-card">
            <p className="text-sm font-semibold text-text mb-2">{t(`ansible.key${n}_title`)}</p>
            <p className="text-xs text-text-2 leading-relaxed">{t(`ansible.key${n}_desc`)}</p>
          </div>
        ))}
      </div>

      {/* Architecture reference */}
      <div className="w-full max-w-5xl mt-6 bg-bg-card border border-border rounded-xl p-5">
        <p className="text-xs font-semibold text-text-2 mb-3 uppercase tracking-widest font-mono">
          {t('ansible.arch_title')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="flex gap-3 items-start">
              <span className="text-domain-cp font-mono text-xs font-bold mt-0.5 shrink-0">
                {String(n).padStart(2, '0')}
              </span>
              <div>
                <p className="text-xs font-semibold text-text">{t(`ansible.arch${n}_title`)}</p>
                <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{t(`ansible.arch${n}_desc`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
