import { useTranslation } from 'react-i18next'
import { Check, Cloud, ExternalLink, KeyRound, ShieldCheck, TriangleAlert } from 'lucide-react'
import ConceptLayout from '../../components/concepts/ConceptLayout'
import SwaArchFlow from '../../components/flow/specs/SwaArchFlow'

/** Components of the SWA architecture, in diagram order. */
const COMPONENTS = ['sm', 'oidc', 'server', 'lb', 'agent', 'vm', 'attestors', 'wapi', 'svid', 'cloud', 'authn'] as const

const PORTS = ['p8443', 'p8080', 'p8082', 'pcp', 'puds', 'poidc', 'pk8s', 'paws'] as const

const INTRO = [
  { key: 'issue', Icon: ShieldCheck },
  { key: 'federate', Icon: Cloud },
  { key: 'exchange', Icon: KeyRound },
] as const

const LIMITS = 9
const PRACTICES = 7

const DOCS = [
  ['overview', 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-overview.htm'],
  ['getstarted', 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-getstarted-k8.htm'],
  ['helm', 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-install-helm.htm'],
  ['values', 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-helm-values.htm'],
  ['lb', 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-loadbalancer.htm'],
  ['vm', 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-install-agent-machine.htm'],
  ['oidc', 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-oidc.htm'],
  ['jwt', 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-jwt.htm'],
  ['aws', 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-aws.htm'],
  ['azure', 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-azure.htm'],
  ['gcp', 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-gcp.htm'],
  ['authn', 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/operations/services/cjr-authn-jwt-swa.htm'],
  ['support', 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/conjurcloud/ccl-support.htm'],
] as const

/** Concepts: how IDIRA Secure Workload Access (SWA) is laid out (DESIGN.md §7, §10). */
export default function SwaArchitecturePage() {
  const { t } = useTranslation()
  const c = (k: string) => t(`swaarch.${k}`)

  return (
    <ConceptLayout title={c('title')} subtitle={c('subtitle')}>
      <section className="grid gap-4 md:grid-cols-3">
        {INTRO.map(({ key, Icon }) => (
          <div key={key} className="rounded-2xl border border-border bg-bg-card p-5">
            <Icon size={20} className="text-domain-idira" aria-hidden="true" />
            <h2 className="mt-3 text-base font-semibold text-text">{c(`intro.${key}_title`)}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-text-2">{c(`intro.${key}_desc`)}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="swaarch-flow">
        <h2 id="swaarch-flow" className="text-xl font-semibold text-text">{c('flow_title')}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-2">{c('flow_intro')}</p>
        <div className="mt-5"><SwaArchFlow /></div>
      </section>

      {/* Components and their role */}
      <section aria-labelledby="swaarch-components">
        <h2 id="swaarch-components" className="text-xl font-semibold text-text">{c('components_title')}</h2>
        <div className="mt-5 grid gap-3 md:hidden">
          {COMPONENTS.map(k => (
            <div key={k} className="rounded-2xl border border-border bg-bg-card p-4">
              <p className="font-semibold text-text">{c(`components.${k}.name`)}</p>
              <dl className="mt-2 space-y-2 text-sm">
                {(['role', 'where'] as const).map(col => (
                  <div key={col}>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-text-muted">{c(`col_${col}`)}</dt>
                    <dd className="mt-0.5 leading-relaxed text-text-2 [overflow-wrap:anywhere]">{c(`components.${k}.${col}`)}</dd>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {COMPONENTS.map(k => (
                <tr key={k} className="align-top">
                  <th scope="row" className="px-5 py-4 font-semibold text-text">{c(`components.${k}.name`)}</th>
                  <td className="px-5 py-4 leading-relaxed text-text-2">{c(`components.${k}.role`)}</td>
                  <td className="px-5 py-4 leading-relaxed text-text-2">{c(`components.${k}.where`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Ports and protocols */}
      <section aria-labelledby="swaarch-ports">
        <h2 id="swaarch-ports" className="text-xl font-semibold text-text">{c('ports_title')}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-2">{c('ports_sub')}</p>
        <div className="mt-5 overflow-x-auto rounded-2xl border border-border bg-bg-card">
          <table className="w-full min-w-[560px] text-left text-sm">
            <caption className="sr-only">{c('ports_title')}</caption>
            <thead className="bg-bg-muted text-xs font-semibold uppercase tracking-wider text-text-muted">
              <tr>
                <th scope="col" className="px-5 py-3">{c('col_port')}</th>
                <th scope="col" className="px-5 py-3">{c('col_path')}</th>
                <th scope="col" className="px-5 py-3">{c('col_purpose')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {PORTS.map(k => (
                <tr key={k} className="align-top">
                  <th scope="row" className="px-5 py-4 font-mono font-semibold text-text whitespace-nowrap">{c(`ports.${k}.port`)}</th>
                  <td className="px-5 py-4 leading-relaxed text-text-2">{c(`ports.${k}.path`)}</td>
                  <td className="px-5 py-4 leading-relaxed text-text-2">{c(`ports.${k}.purpose`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Requirements and limits */}
      <section aria-labelledby="swaarch-limits" className="rounded-2xl border border-tone-warning/40 bg-tone-warning/[0.06] p-5 sm:p-6">
        <h2 id="swaarch-limits" className="flex items-center gap-2 text-lg font-semibold text-text">
          <TriangleAlert size={20} className="shrink-0 text-tone-warning" aria-hidden="true" />{c('limits_title')}
        </h2>
        <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-text-2">
          {Array.from({ length: LIMITS }, (_, i) => (
            <li key={i} className="flex gap-2.5">
              <TriangleAlert size={14} className="mt-1 shrink-0 text-tone-warning" aria-hidden="true" />
              <span className="[overflow-wrap:anywhere]">{c(`limits.i${i + 1}`)}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Best practices */}
      <section aria-labelledby="swaarch-practices">
        <h2 id="swaarch-practices" className="text-xl font-semibold text-text">{c('practices_title')}</h2>
        <ul className="mt-4 space-y-2.5">
          {Array.from({ length: PRACTICES }, (_, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-text-2">
              <Check size={16} strokeWidth={2.2} className="mt-0.5 shrink-0 text-tone-accent" aria-hidden="true" />
              <span className="[overflow-wrap:anywhere]">{c(`practices.i${i + 1}`)}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Official documentation */}
      <section aria-labelledby="swaarch-docs">
        <h2 id="swaarch-docs" className="text-xl font-semibold text-text">{c('docs_title')}</h2>
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
