import { useTranslation } from 'react-i18next'
import PageHeader from '../../components/PageHeader'
import SecretlessFlow from '../../components/flow/specs/k8s/SecretlessFlow'
import { DocLinks, LimitsCallout, RoleTable, Section, SupportChips } from '../../components/authn/AuthnPieces'

// Official sources (Secrets Manager Self-Hosted docs) for every fact on this page.
const SH = 'https://docs.cyberark.com/secrets-manager-sh/latest/en/content'
const DOCS = [
  { key: 'doc_overview', href: `${SH}/overview/scl_secretless_overview.htm` },
  { key: 'doc_how', href: `${SH}/overview/scl_how_it_works.htm` },
  { key: 'doc_security', href: `${SH}/overview/scl_security.htm` },
  { key: 'doc_sidecar', href: `${SH}/integrations/k8s-ocp/k8s-secretless-sidecar.htm` },
  { key: 'doc_connectors', href: `${SH}/references/connectors/scl_connectors_overview.htm` },
  { key: 'doc_providers', href: `${SH}/references/providers/scl_providers_overview.htm` },
  { key: 'doc_mssql', href: `${SH}/references/connectors/scl_mssql.htm` },
  { key: 'doc_http', href: `${SH}/references/connectors/scl_handlers-https.htm` },
] as const

/** Secretless Broker: the app connects without credentials, the sidecar injects them. */
export default function SecretlessPage() {
  const { t } = useTranslation()
  const p = (k: string) => t(`k8s_secretless.${k}`)
  const list = (k: string) => t(`k8s_secretless.${k}`, { returnObjects: true }) as string[]
  const pairs = (k: string) => t(`k8s_secretless.${k}`, { returnObjects: true }) as Array<[string, string]>

  return (
    <section className="min-h-screen bg-bg-base px-6 py-16">
      <div className="mx-auto max-w-5xl space-y-10">
        <PageHeader badge={p('badge')} title={p('title')} subtitle={p('subtitle')}>
          <SupportChips saas={false} selfHosted />
        </PageHeader>

        <Section title={p('flow_title')} lead={p('flow_lead')}>
          <SecretlessFlow />
        </Section>

        <Section title={p('roles_title')} lead={p('roles_lead')}>
          <RoleTable caption={p('roles_title')} colA={p('col_component')} colB={p('col_role')} rows={pairs('roles')} />
        </Section>

        <Section title={p('conn_title')} lead={p('conn_lead')}>
          <RoleTable caption={p('conn_title')} colA={p('col_connector')} colB={p('col_detail')} rows={pairs('conn')} />
        </Section>

        <Section title={p('prov_title')} lead={p('prov_lead')}>
          <RoleTable caption={p('prov_title')} colA={p('col_provider')} colB={p('col_detail')} rows={pairs('prov')} />
        </Section>

        <Section title={p('caps_title')}>
          <RoleTable caption={p('caps_title')} colA={p('col_capability')} colB={p('col_detail')} rows={pairs('caps')} />
        </Section>

        <Section title={p('when_title')}>
          <ul className="grid gap-3 sm:grid-cols-2">
            {list('when').map(w => (
              <li key={w} className="rounded-xl border border-border bg-bg-card px-4 py-3 text-sm leading-relaxed text-text-2">{w}</li>
            ))}
          </ul>
        </Section>

        <Section title={p('diff_title')}>
          <RoleTable caption={p('diff_title')} colA={p('col_topic')} colB={p('col_detail')} rows={pairs('diff')} />
        </Section>

        <LimitsCallout title={p('limits_title')} items={list('limits')}
          source={{ label: p('limits_source'), href: DOCS[4].href }} />

        <DocLinks title={p('docs_title')} links={DOCS.map(d => ({ label: p(d.key), href: d.href }))} />
      </div>
    </section>
  )
}
