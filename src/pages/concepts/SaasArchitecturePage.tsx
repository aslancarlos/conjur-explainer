import { useTranslation } from 'react-i18next'
import { ExternalLink, Gauge, Network, ShieldCheck, Waypoints, Zap } from 'lucide-react'
import ConceptLayout from '../../components/concepts/ConceptLayout'
import SaasArchFlow from '../../components/flow/specs/SaasArchFlow'

/** Components of the reference architecture, in diagram order. */
const COMPONENTS = ['identity', 'tenant', 'pcloud', 'vsync', 'edge', 'lb', 'proxy', 'iot', 'siem', 'workloads'] as const

const BENEFITS = [
  { key: 'readonly', Icon: ShieldCheck },
  { key: 'ha', Icon: Waypoints },
  { key: 'latency', Icon: Zap },
] as const

const PANELS = [
  { key: 'lb', Icon: Network, items: 5 },
  { key: 'sizing', Icon: Gauge, items: 5 },
  { key: 'firewall', Icon: ShieldCheck, items: 4 },
] as const

const DOCS = [
  ['overview', 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/conjurcloud/cl_conjurcloudoverview.htm'],
  ['edge', 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/conjurcloud/edge/ccl-edge-ovw.htm'],
  ['install', 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/conjurcloud/edge/ccl-edge-install.htm'],
  ['openshift', 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/conjurcloud/edge/ccl-edge-openshift-install.htm'],
  ['support', 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/conjurcloud/edge/ccl-edge-support.htm'],
  ['siem', 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/conjurcloud/edge/ccl-edge-siem-int.htm'],
  ['sync', 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/conjurcloud/cl_addaccount.htm'],
] as const

/**
 * Concepts: how IDIRA Secrets Manager SaaS is laid out, from the ISPSS
 * platform services to the Edges in the customer network (DESIGN.md §7, §10).
 */
export default function SaasArchitecturePage() {
  const { t } = useTranslation()
  const c = (k: string) => t(`saasarch.${k}`)

  return (
    <ConceptLayout title={c('title')} subtitle={c('subtitle')}>
      {/* What it is */}
      <section className="grid gap-4 md:grid-cols-3">
        {BENEFITS.map(({ key, Icon }) => (
          <div key={key} className="rounded-2xl border border-border bg-bg-card p-5">
            <Icon size={20} className="text-domain-idira" aria-hidden="true" />
            <h2 className="mt-3 text-base font-semibold text-text">{c(`benefits.${key}_title`)}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-text-2">{c(`benefits.${key}_desc`)}</p>
          </div>
        ))}
      </section>

      {/* Animated reference architecture */}
      <section aria-labelledby="saasarch-flow">
        <h2 id="saasarch-flow" className="text-xl font-semibold text-text">{c('flow_title')}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-2">{c('flow_intro')}</p>
        <div className="mt-5"><SaasArchFlow /></div>
      </section>

      {/* Components */}
      <section aria-labelledby="saasarch-components">
        <h2 id="saasarch-components" className="text-xl font-semibold text-text">{c('components_title')}</h2>
        <div className="mt-5 grid gap-3 md:hidden">
          {COMPONENTS.map(k => (
            <div key={k} className="rounded-2xl border border-border bg-bg-card p-4">
              <p className="font-semibold text-text">{c(`components.${k}.name`)}</p>
              <dl className="mt-2 space-y-2 text-sm">
                {(['role', 'where', 'ports'] as const).map(col => (
                  <div key={col}>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-text-muted">{c(`col_${col}`)}</dt>
                    <dd className="mt-0.5 leading-relaxed text-text-2">{c(`components.${k}.${col}`)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
        <div className="mt-5 hidden md:block overflow-hidden rounded-2xl border border-border bg-bg-card">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{c('components_title')}</caption>
            <thead className="bg-bg-muted text-xs font-semibold uppercase tracking-wider text-text-muted">
              <tr>
                <th scope="col" className="px-5 py-3">{c('col_component')}</th>
                <th scope="col" className="px-5 py-3">{c('col_role')}</th>
                <th scope="col" className="px-5 py-3">{c('col_where')}</th>
                <th scope="col" className="px-5 py-3">{c('col_ports')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {COMPONENTS.map(k => (
                <tr key={k} className="align-top">
                  <th scope="row" className="px-5 py-4 font-semibold text-text">{c(`components.${k}.name`)}</th>
                  <td className="px-5 py-4 leading-relaxed text-text-2">{c(`components.${k}.role`)}</td>
                  <td className="px-5 py-4 leading-relaxed text-text-2">{c(`components.${k}.where`)}</td>
                  <td className="px-5 py-4 leading-relaxed text-text-2">{c(`components.${k}.ports`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Load balancer, sizing, firewall */}
      <section className="grid gap-4 lg:grid-cols-3">
        {PANELS.map(({ key, Icon, items }) => (
          <div key={key} className="rounded-2xl border border-border bg-bg-card p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-text">
              <Icon size={18} className="text-domain-idira" aria-hidden="true" />{c(`${key}.title`)}
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-text-2">
              {Array.from({ length: items }, (_, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-domain-idira" aria-hidden="true" />
                  <span className="[overflow-wrap:anywhere]">{c(`${key}.i${i + 1}`)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* Official documentation */}
      <section aria-labelledby="saasarch-docs">
        <h2 id="saasarch-docs" className="text-xl font-semibold text-text">{c('docs_title')}</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {DOCS.map(([key, href]) => (
            <li key={key}>
              <a href={href} target="_blank" rel="noopener noreferrer"
                className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-border bg-bg-card px-4 py-2.5 text-sm font-medium text-text hover:bg-bg-muted transition-colors">
                {c(`docs.${key}`)}
                <ExternalLink size={14} className="shrink-0 text-text-muted" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </ConceptLayout>
  )
}
