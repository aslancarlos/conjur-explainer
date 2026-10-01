import { useTranslation } from 'react-i18next'
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

      {/* Header */}
      <div className="w-full max-w-4xl text-center mb-6">
        <span className="badge mb-4">{t('csi.badge')}</span>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('csi.title')}</h1>
        <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          {t('csi.subtitle')}
        </p>
      </div>

      {/* Live demo button */}
      <a
        href="/csidriver/"
        className="inline-flex items-center gap-2 mb-10 px-6 py-3 rounded-full bg-csi text-white font-semibold hover:bg-csi/85 transition-colors shadow-lg"
      >
        {t('csi.cta')}
        <ExternalLink size={16} />
      </a>

      {/* Animated diagram (FlowPlayer, DESIGN.md §10) */}
      <div className="w-full max-w-5xl">
        <CsiFlow />
      </div>

      {/* Concept cards */}
      <div className="w-full max-w-5xl mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(n => (
          <div key={n} className="section-card">
            <p className="text-sm font-semibold text-white mb-2">{t(`csi.key${n}_title`)}</p>
            <p className="text-xs text-slate-400 leading-relaxed">{t(`csi.key${n}_desc`)}</p>
          </div>
        ))}
      </div>

      {/* Config reference table */}
      <div className="w-full max-w-5xl mt-6 bg-bg-card border border-border rounded-xl p-5">
        <p className="text-xs font-semibold text-slate-300 mb-1 uppercase tracking-widest font-mono">
          {t('csi.config_title')}
        </p>
        <p className="text-xs text-slate-500 mb-4">{t('csi.config_note')}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <tbody>
              {CONFIG.map(([k, v, src]) => (
                <tr key={k} className="border-t border-border/60">
                  <td className="py-2 pr-3 text-csi whitespace-nowrap">{k}</td>
                  <td className="py-2 pr-3 text-slate-200 whitespace-nowrap">{v}</td>
                  <td className="py-2 text-slate-500">{src}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Architecture reference */}
      <div className="w-full max-w-5xl mt-6 bg-bg-card border border-border rounded-xl p-5">
        <p className="text-xs font-semibold text-slate-300 mb-3 uppercase tracking-widest font-mono">
          {t('csi.arch_title')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="flex gap-3 items-start">
              <span className="text-csi font-mono text-xs font-bold mt-0.5 shrink-0">
                {String(n).padStart(2, '0')}
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-200">{t(`csi.arch${n}_title`)}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{t(`csi.arch${n}_desc`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <a
        href="/csidriver/"
        className="inline-flex items-center gap-2 mt-10 px-6 py-3 rounded-full bg-csi text-white font-semibold hover:bg-csi/85 transition-colors shadow-lg"
      >
        {t('csi.cta')}
        <ExternalLink size={16} />
      </a>
    </section>
  )
}
