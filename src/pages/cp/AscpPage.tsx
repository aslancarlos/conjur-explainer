import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { DocLinks, LimitsCallout, RoleTable, Section } from '../../components/authn/AuthnPieces'
import { PlatformChips, PlatformSwitch, usePlatform } from '../../components/cp/CpPieces'
import AscpFlow from '../../components/flow/specs/cp/AscpFlow'

// Official sources (credential-providers docs) for every fact on this page.
const DOCS = [
  'https://docs.cyberark.com/credential-providers/latest/en/content/cp%20and%20ascp/lp_ascp.htm',
  'https://docs.cyberark.com/credential-providers/latest/en/content/cp%20and%20ascp/sysreq-application-server-credential-provider.htm',
  'https://docs.cyberark.com/credential-providers/latest/en/content/cp%20and%20ascp/tomcat-jdbc-proxy-config.htm',
  'https://docs.cyberark.com/credential-providers/latest/en/content/cp%20and%20ascp/weblogic_jdbcdrivemodel.htm',
  'https://docs.cyberark.com/credential-providers/latest/en/content/cp%20and%20ascp/jboss-proxymoduleconfig.htm',
  'https://docs.cyberark.com/credential-providers/latest/en/content/cp%20and%20ascp/jdbc-driver-for-websphere-classic.htm',
  'https://docs.cyberark.com/credential-providers/latest/en/content/cp%20and%20ascp/application-authentication-methods-general.htm',
  'https://docs.cyberark.com/credential-providers/latest/en/content/cp%20and%20ascp/configuring-caching.htm',
  'https://docs.cyberark.com/credential-providers/latest/en/content/cp%20and%20ascp/cps_capacity-best-practices.htm',
  'https://docs.cyberark.com/credential-providers/latest/en/content/cp%20and%20ascp/cv_automatic_dual_account.htm',
]

function Bullets({ items, tone = 'idira' }: { items: string[]; tone?: 'idira' | 'ok' }) {
  return (
    <ul className="space-y-2.5">
      {items.map(it => (
        <li key={it} className="flex gap-2.5 text-sm leading-relaxed text-text-2">
          {tone === 'ok'
            ? <Check size={16} strokeWidth={2.2} className="mt-0.5 shrink-0 text-tone-success" aria-hidden="true" />
            : <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-domain-idira" aria-hidden="true" />}
          <span>{it}</span>
        </li>
      ))}
    </ul>
  )
}

/** Credential Providers / Application Server Credential Provider (ASCP). */
export default function AscpPage() {
  const { t } = useTranslation()
  const [platform, setPlatform] = usePlatform()
  const p = (k: string) => t(`cp_ascp.${k}`)
  const list = (k: string) => t(`cp_ascp.${k}`, { returnObjects: true }) as string[]
  const servers = t('cp_ascp.servers', { returnObjects: true }) as Array<[string, string, string, string]>
  const roles = t('cp_ascp.roles', { returnObjects: true }) as Array<[string, string]>
  const docLabels = list('docs')

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-5xl space-y-10">
        <PageHeader badge={p('badge')} title={p('title')} subtitle={p('subtitle')}>
          <div className="pt-2"><PlatformChips selfHosted saas /></div>
        </PageHeader>

        <Section title={p('flow_title')} lead={p('flow_lead')}>
          <div className="flex flex-wrap items-center gap-3">
            <PlatformSwitch value={platform} onChange={setPlatform} />
            <p className="text-sm text-text-2">{platform === 'saas' ? p('switch_saas') : p('switch_sh')}</p>
          </div>
          <AscpFlow platform={platform} />
        </Section>

        <Section title={p('cap_title')} lead={p('cap_lead')}>
          <div className="overflow-x-auto rounded-2xl border border-border bg-bg-card">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">{p('cap_title')}</caption>
              <thead className="bg-bg-muted text-xs font-semibold uppercase tracking-wider text-text-muted">
                <tr>
                  <th scope="col" className="px-5 py-3">{p('col_server')}</th>
                  <th scope="col" className="px-5 py-3">{p('col_versions')}</th>
                  <th scope="col" className="px-5 py-3">{p('col_datasources')}</th>
                  <th scope="col" className="px-5 py-3">{p('col_databases')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {servers.map(([s, v, d, db]) => (
                  <tr key={s} className="align-top">
                    <th scope="row" className="px-5 py-4 font-semibold text-text whitespace-nowrap">{s}</th>
                    <td className="px-5 py-4 text-text-2">{v}</td>
                    <td className="px-5 py-4 text-text-2">{d}</td>
                    <td className="px-5 py-4 text-text-2">{db}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Bullets items={list('cap_notes')} />
        </Section>

        <Section title={p('how_title')} lead={p('how_lead')}>
          <RoleTable caption={p('how_title')} colA={p('col_component')} colB={p('col_role')} rows={roles} />
        </Section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title={p('when_title')}><Bullets items={list('when')} tone="ok" /></Section>
          <Section title={p('diff_title')}><Bullets items={list('diff')} /></Section>
        </div>

        <LimitsCallout title={p('limits_title')} items={list('limits')} />

        <DocLinks title={p('docs_title')} links={DOCS.map((href, i) => ({ href, label: docLabels[i] ?? href }))} />
      </div>
    </section>
  )
}
