import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Boxes, Check, Globe, Minus, Server } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import CpHubFlow from '../../components/flow/specs/cp/CpHubFlow'
import { PlatformChips, PlatformSwitch, usePlatform } from '../../components/cp/CpPieces'
import { DocLinks, LimitsCallout, RoleTable, Section } from '../../components/authn/AuthnPieces'

const DOCS = [
  { key: 'doc_overview', href: 'https://docs.cyberark.com/credential-providers/latest/en/content/ccp/the-cyberark-application-identity-management-solution.htm' },
  { key: 'doc_offerings', href: 'https://docs.cyberark.com/credential-providers/latest/en/content/ccp/aam-cp-offerings.htm' },
  { key: 'doc_authmethods', href: 'https://docs.cyberark.com/credential-providers/latest/en/content/cp%20and%20ascp/application-authentication-methods-general.htm' },
  { key: 'doc_caching', href: 'https://docs.cyberark.com/credential-providers/latest/en/content/cp%20and%20ascp/configuring-caching.htm' },
  { key: 'doc_capacity', href: 'https://docs.cyberark.com/credential-providers/latest/en/content/cp%20and%20ascp/cps_capacity-best-practices.htm' },
  { key: 'doc_pcloud', href: 'https://docs.cyberark.com/setup/latest/en/content/ispss-deployment/privilege%20cloud/privcloud-cp-integration.htm' },
  { key: 'doc_restflow', href: 'https://docs.cyberark.com/credential-providers/latest/en/content/cp%20and%20ascp/cp-flow-rest-api.htm' },
] as const

const OFFERINGS = [
  { key: 'cp', to: '/cp/credential-provider', Icon: Server },
  { key: 'ascp', to: '/cp/ascp', Icon: Boxes },
  { key: 'ccp', to: '/cp/ccp', Icon: Globe },
] as const

// Supported application authentication methods per provider, as documented
// (application-authentication-methods-general): methods x [CP, CCP, z/OS, ASCP, drivers].
const METHODS: Array<[string, boolean[]]> = [
  ['m_machines', [true, true, true, true, true]],
  ['m_osuser', [true, true, true, true, true]],
  ['m_path', [true, false, false, true, false]],
  ['m_hash', [true, false, false, true, false]],
  ['m_certserial', [false, true, false, false, false]],
  ['m_certattr', [false, true, false, false, false]],
]

/** Credential Providers: overview and comparison of CP, ASCP and CCP. */
export default function CpHubPage() {
  const { t } = useTranslation()
  const [platform, setPlatform] = usePlatform()
  const p = (k: string) => t(`cphub.${k}`)
  const list = (k: string) => t(`cphub.${k}`, { returnObjects: true }) as string[]
  const compare = t('cphub.compare', { returnObjects: true }) as Array<{ k: string; cp: string; ascp: string; ccp: string }>
  const caching = t('cphub.caching', { returnObjects: true }) as Array<[string, string]>
  const yes = (ok: boolean) => ok
    ? <span className="inline-flex items-center gap-1 text-tone-success"><Check size={14} aria-hidden="true" />{p('yes')}</span>
    : <span className="inline-flex items-center gap-1 text-text-muted"><Minus size={14} aria-hidden="true" />{p('no')}</span>

  return (
    <section className="min-h-screen bg-bg-base px-6 py-16">
      <div className="mx-auto max-w-5xl space-y-10">
        <PageHeader badge={p('badge')} title={p('title')} subtitle={p('subtitle')}>
          <PlatformChips selfHosted saas />
        </PageHeader>

        <Section title={p('problem_title')} lead={p('problem_lead')}>
          <div className="grid gap-4 md:grid-cols-3">
            {OFFERINGS.map(({ key, to, Icon }) => (
              <Link key={key} to={to}
                className="group flex flex-col rounded-2xl border border-border bg-bg-card p-5 transition-colors hover:border-idira-blue">
                <Icon size={20} className="text-domain-idira" aria-hidden="true" />
                <h3 className="mt-3 text-base font-semibold text-text">{p(`off_${key}_title`)}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-text-2">{p(`off_${key}_desc`)}</p>
                <span className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-tone-accent">
                  {p('open_page')}<ArrowRight size={14} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </Section>

        <Section title={p('flow_title')} lead={p('flow_lead')}>
          <PlatformSwitch value={platform} onChange={setPlatform} />
          <CpHubFlow platform={platform} />
        </Section>

        <Section title={p('compare_title')} lead={p('compare_lead')}>
          <div className="overflow-x-auto rounded-2xl border border-border bg-bg-card">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">{p('compare_title')}</caption>
              <thead className="bg-bg-muted text-xs font-semibold uppercase tracking-wider text-text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 w-44"><span className="sr-only">{p('col_topic')}</span></th>
                  <th scope="col" className="px-4 py-3"><Link to="/cp/credential-provider" className="hover:underline">Credential Provider</Link></th>
                  <th scope="col" className="px-4 py-3"><Link to="/cp/ascp" className="hover:underline">ASCP</Link></th>
                  <th scope="col" className="px-4 py-3"><Link to="/cp/ccp" className="hover:underline">Central Credential Provider</Link></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {compare.map(r => (
                  <tr key={r.k} className="align-top">
                    <th scope="row" className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">{r.k}</th>
                    <td className="px-4 py-3 leading-relaxed text-text-2">{r.cp}</td>
                    <td className="px-4 py-3 leading-relaxed text-text-2">{r.ascp}</td>
                    <td className="px-4 py-3 leading-relaxed text-text-2">{r.ccp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title={p('auth_title')} lead={p('auth_lead')}>
          <div className="overflow-x-auto rounded-2xl border border-border bg-bg-card">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">{p('auth_title')}</caption>
              <thead className="bg-bg-muted text-xs font-semibold uppercase tracking-wider text-text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3">{p('col_method')}</th>
                  <th scope="col" className="px-4 py-3">CP</th>
                  <th scope="col" className="px-4 py-3">CCP</th>
                  <th scope="col" className="px-4 py-3">CP z/OS</th>
                  <th scope="col" className="px-4 py-3">ASCP</th>
                  <th scope="col" className="px-4 py-3">{p('col_drivers')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {METHODS.map(([k, vals]) => (
                  <tr key={k}>
                    <th scope="row" className="px-4 py-3 font-semibold text-text">{p(k)}</th>
                    {vals.map((v, i) => <td key={i} className="px-4 py-3">{yes(v)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="space-y-2">
            {list('auth_notes').map(n => (
              <li key={n} className="flex gap-2.5 text-sm leading-relaxed text-text-2">
                <Check size={16} className="mt-0.5 shrink-0 text-tone-accent" aria-hidden="true" /><span>{n}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title={p('caching_title')} lead={p('caching_lead')}>
          <RoleTable caption={p('caching_title')} colA={p('col_level')} colB={p('col_behaviour')} rows={caching} />
        </Section>

        <Section title={p('more_title')}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-bg-card p-5">
              <h3 className="text-base font-semibold text-text">{p('zos_title')}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-text-2">{p('zos_desc')}</p>
            </div>
            <Link to="/dualaccounts" className="group rounded-2xl border border-border bg-bg-card p-5 transition-colors hover:border-idira-blue">
              <h3 className="text-base font-semibold text-text">{p('dual_title')}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-text-2">{p('dual_desc')}</p>
              <span className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-tone-accent">
                {p('open_page')}<ArrowRight size={14} aria-hidden="true" />
              </span>
            </Link>
          </div>
        </Section>

        <LimitsCallout title={p('limits_title')} items={list('limits')}
          source={{ label: p('limits_source'), href: DOCS[4].href }} />

        <DocLinks title={p('docs_title')} links={DOCS.map(d => ({ label: p(d.key), href: d.href }))} />
      </div>
    </section>
  )
}
