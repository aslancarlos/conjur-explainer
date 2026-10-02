import { useTranslation } from 'react-i18next'
import PageHeader from '../components/PageHeader'
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

      <PageHeader className="max-w-5xl mb-8" badge={t('secretshub.badge')} title={t('secretshub.title')} subtitle={t('secretshub.subtitle')} />

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
