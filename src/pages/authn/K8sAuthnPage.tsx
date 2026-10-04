import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { DocLinks, LimitsCallout, RoleTable, Section, SupportChips } from '../../components/authn/AuthnPieces'
import K8sAuthnFlow from '../../components/flow/specs/authn/K8sAuthnFlow'

const SH = 'https://docs.cyberark.com/secrets-manager-sh/latest/en/content'
const SAAS = 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content'
const DOCS = [
  { key: 'doc_k8s', href: `${SH}/integrations/k8s-ocp/k8s-k8s-authn.htm` },
  { key: 'doc_compare', href: `${SH}/integrations/k8s-ocp/k8s-admin-lp.htm#authent` },
  { key: 'doc_identity', href: `${SH}/integrations/k8s-ocp/k8s-app-identity.htm` },
  { key: 'doc_apps', href: `${SH}/integrations/k8s-ocp/k8s-set-up-apps.htm` },
  { key: 'doc_arch', href: `${SH}/integrations/k8s-ocp/k8s-architecture.htm` },
  { key: 'doc_support', href: `${SH}/operations/authn/cjr-authn-support.htm` },
  { key: 'doc_saas_k8s', href: `${SAAS}/integrations/k8s-ocp/k8s_lp.htm` },
]
const ROLES = ['client', 'follower', 'api', 'ca', 'host', 'volume'] as const
const IDS = ['namespace', 'labels', 'deployment', 'deploymentconfig', 'statefulset', 'serviceaccount', 'pod'] as const
const CMP = ['editions', 'identity', 'performance', 'setup', 'maintenance', 'network'] as const

/** Native Kubernetes authenticator (authn-k8s): certificate-based, Self-Hosted. */
export default function K8sAuthnPage() {
  const { t } = useTranslation()
  const p = (k: string) => t(`authn_k8s.${k}`)
  const list = (k: string) => t(`authn_k8s.${k}`, { returnObjects: true }) as string[]

  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="space-y-4">
          <PageHeader badge={p('badge')} title={p('title')} subtitle={p('subtitle')} />
          <SupportChips saas={false} selfHosted />
        </div>

        <K8sAuthnFlow />

        <Section title={p('how_title')} lead={p('how_lead')}>
          <RoleTable caption={p('how_title')} colA={p('col_component')} colB={p('col_role')}
            rows={ROLES.map(r => [p(`role_${r}_a`), p(`role_${r}_b`)] as [string, string])} />
        </Section>

        <Section title={p('ids_title')} lead={p('ids_lead')}>
          <RoleTable caption={p('ids_title')} colA={p('col_annotation')} colB={p('col_scope')}
            rows={IDS.map(r => [`authn-k8s/${p(`id_${r}_a`)}`, p(`id_${r}_b`)] as [string, string])} />
        </Section>

        <Section title={p('cmp_title')} lead={p('cmp_lead')}>
          <div className="overflow-x-auto rounded-2xl border border-border bg-bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue" tabIndex={0} role="region" aria-label={p('cmp_title')}>
            <table className="w-full text-left text-sm">
              <caption className="sr-only">{p('cmp_title')}</caption>
              <thead className="bg-bg-muted text-xs font-semibold uppercase tracking-wider text-text-muted">
                <tr>
                  <th scope="col" className="px-5 py-3 w-1/5">{p('cmp_col_aspect')}</th>
                  <th scope="col" className="px-5 py-3">authn-k8s</th>
                  <th scope="col" className="px-5 py-3">authn-jwt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {CMP.map(r => (
                  <tr key={r} className="align-top">
                    <th scope="row" className="px-5 py-4 font-semibold text-text">{p(`cmp_${r}`)}</th>
                    <td className="px-5 py-4 leading-relaxed text-text-2">{p(`cmp_${r}_k8s`)}</td>
                    <td className="px-5 py-4 leading-relaxed text-text-2">{p(`cmp_${r}_jwt`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title={p('when_title')}>
          <ul className="space-y-2.5">
            {list('when').map(it => (
              <li key={it} className="flex gap-2.5 text-base leading-relaxed text-text-2">
                <Check size={18} strokeWidth={2.2} className="mt-1 shrink-0 text-domain-idira" aria-hidden="true" />
                <span>{it}</span>
              </li>
            ))}
          </ul>
        </Section>

        <LimitsCallout title={p('limits_title')} items={list('limits')}
          source={{ label: p('limits_source'), href: DOCS[0].href }} />

        <DocLinks title={p('docs_title')} links={DOCS.map(d => ({ label: p(d.key), href: d.href }))} />
      </div>
    </section>
  )
}
