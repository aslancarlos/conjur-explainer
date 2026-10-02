import { useTranslation } from 'react-i18next'
import PageHeader from '../../components/PageHeader'
import CcpFlow from '../../components/flow/specs/cp/CcpFlow'
import { PlatformChips, PlatformSwitch, usePlatform } from '../../components/cp/CpPieces'
import { DocLinks, LimitsCallout, RoleTable, Section } from '../../components/authn/AuthnPieces'

// Official sources (credential-providers docs) for every fact on this page.
const BASE = 'https://docs.cyberark.com/credential-providers/latest/en/content'
const DOCS = [
  { key: 'doc_overview', href: `${BASE}/ccp/the-central%20-credential-provider.htm` },
  { key: 'doc_install', href: `${BASE}/ccp/ccp-installation.htm` },
  { key: 'doc_rest_get', href: `${BASE}/ccp/calling-the-web-service-using-rest.htm` },
  { key: 'doc_rest_post', href: `${BASE}/ccp/calling-the-web-service-using-rest_post.htm` },
  { key: 'doc_authn', href: `${BASE}/cp%20and%20ascp/authentication-methods-for-ccp.htm` },
  { key: 'doc_appauth', href: `${BASE}/cp%20and%20ascp/application-authentication-methods-general.htm` },
  { key: 'doc_lb', href: `${BASE}/ccp/load-balancing-the-central-credential-provider.htm` },
  { key: 'doc_config', href: `${BASE}/ccp/configure_ccpwindows.htm` },
  { key: 'doc_cache', href: `${BASE}/cp%20and%20ascp/configuring-caching.htm` },
  { key: 'doc_dr', href: `${BASE}/ccp/disaster-recovery.htm` },
  { key: 'doc_monitor', href: `${BASE}/ccp/monitoring-the-central-credential-provider-web-service.htm` },
  { key: 'doc_usage', href: `${BASE}/ccp/api-ccp-usage.htm` },
] as const

/** Credential Providers: the Central Credential Provider (CCP) web service. */
export default function CcpPage() {
  const { t } = useTranslation()
  const [platform, setPlatform] = usePlatform()
  const p = (k: string) => t(`cp_ccp.${k}`)
  const list = (k: string) => t(`cp_ccp.${k}`, { returnObjects: true }) as string[]
  const pairs = (k: string) => t(`cp_ccp.${k}`, { returnObjects: true }) as Array<[string, string]>

  return (
    <section className="min-h-screen bg-bg-base px-6 py-16">
      <div className="mx-auto max-w-5xl space-y-10">
        <PageHeader badge={p('badge')} title={p('title')} subtitle={p('subtitle')}>
          <PlatformChips selfHosted saas />
        </PageHeader>

        <Section title={p('flow_title')} lead={p('flow_lead')}>
          <div className="space-y-4">
            <PlatformSwitch value={platform} onChange={setPlatform} />
            <p className="max-w-[70ch] text-sm leading-relaxed text-text-2">{p(platform === 'saas' ? 'platform_note_saas' : 'platform_note_sh')}</p>
            <CcpFlow platform={platform} />
          </div>
        </Section>

        <Section title={p('caps_title')} lead={p('caps_lead')}>
          <RoleTable caption={p('caps_title')} colA={p('col_capability')} colB={p('col_detail')} rows={pairs('caps')} />
        </Section>

        <Section title={p('api_title')} lead={p('api_lead')}>
          <RoleTable caption={p('api_title')} colA={p('col_param')} colB={p('col_detail')} rows={pairs('api')} />
        </Section>

        <Section title={p('auth_title')} lead={p('auth_lead')}>
          <RoleTable caption={p('auth_title')} colA={p('col_method')} colB={p('col_detail')} rows={pairs('auth')} />
        </Section>

        <Section title={p('roles_title')} lead={p('roles_lead')}>
          <RoleTable caption={p('roles_title')} colA={p('col_component')} colB={p('col_role')} rows={pairs('roles')} />
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
          source={{ label: p('limits_source'), href: DOCS[2].href }} />

        <DocLinks title={p('docs_title')} links={DOCS.map(d => ({ label: p(d.key), href: d.href }))} />
      </div>
    </section>
  )
}
