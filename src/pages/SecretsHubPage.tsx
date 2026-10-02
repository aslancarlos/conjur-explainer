import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import ShubFlow, { type ShubEnv } from '../components/flow/specs/ShubFlow'
import { ComponentsTable, DocsLinks, EnvToggle, LimitsCallout, TargetsSummary } from '../components/secretshub/ShubSections'

/**
 * Secrets Hub: two scenarios from the official docs, chosen with a segmented
 * switch and kept in the URL (?env=saas | ?env=pamsh, default saas):
 *   saas   Privilege Cloud as the source
 *   pamsh  PAM Self-Hosted as the source, through a connector pool to PVWA
 * The diagram, the limitations callout and the components table follow it.
 */
export default function SecretsHubPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const env: ShubEnv = params.get('env') === 'pamsh' ? 'pamsh' : 'saas'
  const choose = (e: ShubEnv) => setParams(p => {
    const n = new URLSearchParams(p)
    if (e === 'saas') n.delete('env'); else n.set('env', e)
    return n
  }, { replace: true, preventScrollReset: true })

  return (
    <section className="min-h-screen bg-bg-base px-4 py-16 flex flex-col items-center">

      {/* Header */}
      <div className="w-full max-w-4xl text-center mb-8">
        <span className="badge mb-4">{t('secretshub.badge')}</span>
        <h1 className="text-3xl md:text-4xl font-bold text-text mb-4">{t('secretshub.title')}</h1>
        <p className="text-text-muted text-sm md:text-base max-w-2xl mx-auto leading-relaxed">{t('secretshub.subtitle')}</p>
      </div>

      {/* Scenario switch + animated diagram */}
      <div className="w-full max-w-5xl space-y-5">
        <EnvToggle env={env} onChange={choose} />
        <ShubFlow env={env} />
      </div>

      {/* Concept cards */}
      <div className="w-full max-w-5xl mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(n => (
          <div key={n} className="section-card">
            <p className="text-sm font-semibold text-text mb-2">{t(`secretshub.key${n}_title`)}</p>
            <p className="text-xs text-text-muted leading-relaxed">{t(`secretshub.key${n}_desc`)}</p>
          </div>
        ))}
      </div>

      <div className="w-full max-w-5xl mt-12 space-y-12">
        <TargetsSummary />
        <LimitsCallout env={env} />
        <ComponentsTable env={env} />
        <DocsLinks env={env} />
      </div>
    </section>
  )
}
