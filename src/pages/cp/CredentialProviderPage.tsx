import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import CredentialProviderFlow from '../../components/flow/specs/cp/CredentialProviderFlow'
import { PlatformChips, PlatformSwitch, usePlatform } from '../../components/cp/CpPieces'
import { DocLinks, LimitsCallout, RoleTable, Section } from '../../components/authn/AuthnPieces'

const DOCS = [
  { key: 'doc_lp', href: 'https://docs.cyberark.com/credential-providers/latest/en/content/landingpages/lp_cp.htm' },
  { key: 'doc_sysreq', href: 'https://docs.cyberark.com/credential-providers/latest/en/content/cp%20and%20ascp/sysreq-credential-provider.htm' },
  { key: 'doc_env', href: 'https://docs.cyberark.com/credential-providers/latest/en/content/cp%20and%20ascp/building-cp-environment.htm' },
  { key: 'doc_authproc', href: 'https://docs.cyberark.com/credential-providers/latest/en/content/cp%20and%20ascp/authentication-process.htm' },
  { key: 'doc_caching', href: 'https://docs.cyberark.com/credential-providers/latest/en/content/cp%20and%20ascp/configuring-caching.htm' },
  { key: 'doc_sdks', href: 'https://docs.cyberark.com/credential-providers/latest/en/content/cp%20and%20ascp/working-with-application-password-sdk.htm' },
  { key: 'doc_capacity', href: 'https://docs.cyberark.com/credential-providers/latest/en/content/cp%20and%20ascp/cps_capacity-best-practices.htm' },
  { key: 'doc_audit', href: 'https://docs.cyberark.com/credential-providers/latest/en/content/cp%20and%20ascp/monitoring-cp-auditing.htm' },
  { key: 'doc_pcloud', href: 'https://docs.cyberark.com/setup/latest/en/content/ispss-deployment/privilege%20cloud/privcloud-cp-integration.htm' },
] as const

/** Credential Providers: the Credential Provider (agent on the application host). */
export default function CredentialProviderPage() {
  const { t } = useTranslation()
  const [platform, setPlatform] = usePlatform()
  const p = (k: string) => t(`cp_cp.${k}`)
  const list = (k: string) => t(`cp_cp.${k}`, { returnObjects: true }) as string[]
  const pairs = (k: string) => t(`cp_cp.${k}`, { returnObjects: true }) as Array<[string, string]>
  const caps = t('cp_cp.caps', { returnObjects: true }) as Array<{ title: string; desc: string }>

  return (
    <section className="min-h-screen bg-bg-base px-6 py-16">
      <div className="mx-auto max-w-5xl space-y-10">
        <PageHeader badge={p('badge')} title={p('title')} subtitle={p('subtitle')}>
          <PlatformChips selfHosted saas />
        </PageHeader>

        <Section title={p('caps_title')} lead={p('caps_lead')}>
          <div className="grid gap-4 md:grid-cols-3">
            {caps.map(c => (
              <div key={c.title} className="rounded-2xl border border-border bg-bg-card p-5">
                <h3 className="text-base font-semibold text-text">{c.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-text-2">{c.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title={p('flow_title')} lead={p('flow_lead')}>
          <PlatformSwitch value={platform} onChange={setPlatform} />
          <CredentialProviderFlow platform={platform} />
        </Section>

        <Section title={p('roles_title')} lead={p('roles_lead')}>
          <RoleTable caption={p('roles_title')} colA={p('col_component')} colB={p('col_role')} rows={pairs('roles')} />
        </Section>

        <Section title={p('when_title')}>
          <ul className="grid gap-3 sm:grid-cols-2">
            {list('when').map(w => (
              <li key={w} className="flex gap-2.5 rounded-xl border border-border bg-bg-card px-4 py-3 text-sm leading-relaxed text-text-2">
                <Check size={16} className="mt-0.5 shrink-0 text-tone-accent" aria-hidden="true" /><span>{w}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title={p('diff_title')} lead={p('diff_lead')}>
          <RoleTable caption={p('diff_title')} colA={p('col_topic')} colB={p('col_detail')} rows={pairs('diff')} />
        </Section>

        <LimitsCallout title={p('limits_title')} items={list('limits')}
          source={{ label: p('limits_source'), href: DOCS[6].href }} />

        <Section title={p('config_title')} lead={p('config_lead')}>
          <RoleTable caption={p('config_title')} colA={p('col_param')} colB={p('col_reco')} rows={pairs('config')} />
        </Section>

        <DocLinks title={p('docs_title')} links={DOCS.map(d => ({ label: p(d.key), href: d.href }))} />
      </div>
    </section>
  )
}
