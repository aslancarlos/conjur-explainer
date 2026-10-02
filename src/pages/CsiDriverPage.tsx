import { useTranslation } from 'react-i18next'
import PageHeader from '../components/PageHeader'
import CsiFlow from '../components/flow/specs/CsiFlow'
import { ExternalLink } from 'lucide-react'

export default function CsiDriverPage() {
  const { t } = useTranslation()

  const CONFIG: Array<[string, string, string]> = [
    ['CSI_ROTATION_INTERVAL', '2m0s', 'rotationPollInterval'],
    ['CSI_ROTATION_ENABLED', 'true', '--enable-secret-rotation'],
    ['CSI_PROVIDER_HEALTHCHECK', '2m', '--provider-health-check-interval'],
    ['CSI_REQUIRES_REPUBLISH', 'false', 'CSIDriver spec.requiresRepublish'],
    ['CSI_TOKEN_AUDIENCE', 'conjur', 'CSIDriver spec.tokenRequests'],
    ['CSI_VOLUME_MODE', 'Ephemeral (tmpfs)', 'volumeLifecycleModes'],
    ['CONJUR_APPLIANCE', 'your-tenant.secretsmgr.cyberark.cloud/api', 'SecretProviderClass'],
    ['CONJUR_ACCOUNT', 'conjur', 'SecretProviderClass'],
    ['CONJUR_AUTHN_ID', 'authn-jwt/your-cluster', 'SecretProviderClass'],
    ['CONJUR_CFG_VERSION', '0.2.0', 'conjur.org/configurationVersion'],
  ]

  return (
    <section className="min-h-screen bg-bg-base px-4 py-16 flex flex-col items-center">

      <PageHeader className="max-w-5xl mb-6" badge={t('csi.badge')} title={t('csi.title')} subtitle={t('csi.subtitle')} />

      {/* Live demo button (aligned with the header) */}
      <div className="w-full max-w-5xl mb-10">
      <a
        href="/csidriver/"
        className="inline-flex min-h-11 items-center gap-2 px-6 rounded-full bg-csi-solid text-white font-semibold hover:bg-csi-solid/90 transition-colors shadow-lg"
      >
        {t('csi.cta')}
        <ExternalLink size={16} />
      </a>
      </div>

      {/* Animated diagram (FlowPlayer, DESIGN.md §10) */}
      <div className="w-full max-w-5xl">
        <CsiFlow />
      </div>

      {/* Concept cards */}
      <div className="w-full max-w-5xl mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(n => (
          <div key={n} className="section-card">
            <p className="text-sm font-semibold text-text mb-2">{t(`csi.key${n}_title`)}</p>
            <p className="text-xs text-text-2 leading-relaxed">{t(`csi.key${n}_desc`)}</p>
          </div>
        ))}
      </div>

      {/* Config reference table */}
      <div className="w-full max-w-5xl mt-6 bg-bg-card border border-border rounded-xl p-5">
        <p className="text-xs font-semibold text-text-2 mb-1 uppercase tracking-widest font-mono">
          {t('csi.config_title')}
        </p>
        <p className="text-xs text-text-muted mb-4">{t('csi.config_note')}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <tbody>
              {CONFIG.map(([k, v, src]) => (
                <tr key={k} className="border-t border-border/60">
                  <td className="py-2 pr-3 text-csi whitespace-nowrap">{k}</td>
                  <td className="py-2 pr-3 text-text whitespace-nowrap">{v}</td>
                  <td className="py-2 text-text-muted">{src}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Architecture reference */}
      <div className="w-full max-w-5xl mt-6 bg-bg-card border border-border rounded-xl p-5">
        <p className="text-xs font-semibold text-text-2 mb-3 uppercase tracking-widest font-mono">
          {t('csi.arch_title')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="flex gap-3 items-start">
              <span className="text-csi font-mono text-xs font-bold mt-0.5 shrink-0">
                {String(n).padStart(2, '0')}
              </span>
              <div>
                <p className="text-xs font-semibold text-text">{t(`csi.arch${n}_title`)}</p>
                <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{t(`csi.arch${n}_desc`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <a
        href="/csidriver/"
        className="inline-flex min-h-11 items-center gap-2 mt-10 px-6 rounded-full bg-csi-solid text-white font-semibold hover:bg-csi-solid/90 transition-colors shadow-lg"
      >
        {t('csi.cta')}
        <ExternalLink size={16} />
      </a>
    </section>
  )
}
