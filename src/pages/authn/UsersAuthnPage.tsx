import { useTranslation } from 'react-i18next'
import { Info } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { DocLinks, LimitsCallout, RoleTable, Section, SupportChips } from '../../components/authn/AuthnPieces'
import UsersAuthnFlow from '../../components/flow/specs/authn/UsersAuthnFlow'

const SH = 'https://docs.cyberark.com/secrets-manager-sh/latest/en/content'
const SAAS = 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content'
const DOCS = [
  { key: 'doc_saas_access', href: `${SAAS}/conjurcloud/ccl-access.htm` },
  { key: 'doc_saas_login', href: `${SAAS}/conjurcloud/cli/cli-login.htm` },
  { key: 'doc_saas_api', href: `${SAAS}/developer/conjur_api_authenticate_user.htm` },
  { key: 'doc_saas_tokens', href: `${SAAS}/conjurcloud/ccl-authentication.htm` },
  { key: 'doc_saas_scope', href: `${SAAS}/conjurcloud/ccl-support.htm` },
  { key: 'doc_sh_authn', href: `${SH}/operations/services/authentication-new.htm` },
  { key: 'doc_sh_oidc', href: `${SH}/oidc/oidc-for-ui-and-cli.htm` },
  { key: 'doc_sh_ldap', href: `${SH}/integrations/ldap/ldap-sync-authn-integration.htm` },
]
const METHODS = ['saas', 'oidc', 'ldap', 'apikey'] as const

/** How people (not workloads) sign in to Secrets Manager, SaaS vs Self-Hosted. */
export default function UsersAuthnPage() {
  const { t } = useTranslation()
  const p = (k: string) => t(`authn_users.${k}`)
  const list = (k: string) => t(`authn_users.${k}`, { returnObjects: true }) as string[]

  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="space-y-4">
          <PageHeader badge={p('badge')} title={p('title')} subtitle={p('subtitle')} />
          <SupportChips saas selfHosted />
        </div>

        <aside className="callout-info rounded-2xl p-5 text-base text-text">
          <Info size={20} className="mt-0.5 shrink-0 text-tone-accent" aria-hidden="true" />
          <p>{p('people_note')}</p>
        </aside>

        <UsersAuthnFlow />

        <Section title={p('how_title')} lead={p('how_lead')}>
          <div className="overflow-x-auto rounded-2xl border border-border bg-bg-card">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">{p('how_title')}</caption>
              <thead className="bg-bg-muted text-xs font-semibold uppercase tracking-wider text-text-muted">
                <tr>
                  <th scope="col" className="px-5 py-3">{p('col_method')}</th>
                  <th scope="col" className="px-5 py-3">{p('col_edition')}</th>
                  <th scope="col" className="px-5 py-3">{p('col_how')}</th>
                  <th scope="col" className="px-5 py-3">{p('col_token')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {METHODS.map(m => (
                  <tr key={m} className="align-top">
                    <th scope="row" className="px-5 py-4 font-semibold text-text whitespace-nowrap">{p(`m_${m}`)}</th>
                    <td className="px-5 py-4 text-text-2 whitespace-nowrap">{p(`m_${m}_edition`)}</td>
                    <td className="px-5 py-4 leading-relaxed text-text-2">{p(`m_${m}_how`)}</td>
                    <td className="px-5 py-4 leading-relaxed text-text-2">{p(`m_${m}_token`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title={p('roles_title')}>
          <RoleTable caption={p('roles_title')} colA={p('col_component')} colB={p('col_role')}
            rows={(['identity', 'idp', 'ldap', 'cli', 'policy'] as const).map(r => [p(`role_${r}_a`), p(`role_${r}_b`)] as [string, string])} />
        </Section>

        <LimitsCallout title={p('limits_saas_title')} items={list('limits_saas')}
          source={{ label: p('limits_source'), href: DOCS[4].href }} />
        <LimitsCallout title={p('limits_sh_title')} items={list('limits_sh')}
          source={{ label: p('limits_source'), href: DOCS[6].href }} />

        <DocLinks title={p('docs_title')} links={DOCS.map(d => ({ label: p(d.key), href: d.href }))} />
      </div>
    </section>
  )
}
