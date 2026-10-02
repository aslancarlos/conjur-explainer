import { useTranslation } from 'react-i18next'
import { Check, Cloud, Server } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import AuditFlow from '../../components/flow/specs/sm/AuditFlow'
import { usePlatform, type Platform } from '../../components/cp/CpPieces'
import { DocLinks, LimitsCallout, RoleTable, Section, SupportChips } from '../../components/authn/AuthnPieces'

const DOCS_SH = [
  { key: 'doc_sh_overview', href: 'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/operations/services/audit/dap-overview-audit-service.htm' },
  { key: 'doc_sh_events', href: 'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/operations/services/audit/dap-audit-events.htm' },
  { key: 'doc_sh_structure', href: 'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/operations/services/audit/dap-auditlog-structure.htm' },
  { key: 'doc_sh_thirdparty', href: 'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/operations/services/audit/dap-integrate-logs-thirdparty-sw.htm' },
  { key: 'doc_sh_rotate', href: 'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/operations/services/audit/cjr-logrotate-util.htm' },
  { key: 'doc_sh_splunk', href: 'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/integrations/splunk.html' },
  { key: 'doc_sh_arch', href: 'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/deployment/cjr-architecture.htm' },
] as const
const DOCS_SAAS = [
  { key: 'doc_saas_lp', href: 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/conjurcloud/ccl-audit-lp.htm' },
  { key: 'doc_saas_events', href: 'https://docs.cyberark.com/audit-and-reports/latest/en/content/audit/product-audits/isp-conjur-audit.htm' },
  { key: 'doc_saas_activities', href: 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/audit/isp_system-activities.htm' },
  { key: 'doc_saas_reports', href: 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/audit/isp_activities-reports.htm' },
  { key: 'doc_saas_siem', href: 'https://docs.cyberark.com/setup/latest/en/content/siem-integration/siem-export-3rd-party.htm' },
  { key: 'doc_saas_siem_api', href: 'https://docs.cyberark.com/audit-and-reports/latest/en/content/audit/isp_siem-integration-api.htm' },
  { key: 'doc_saas_splunk', href: 'https://docs.cyberark.com/setup/latest/en/content/siem-integration/siem-export-splunk.htm' },
] as const

/** Segmented control Self-Hosted | SaaS for Secrets Manager (radiogroup, 44px targets, ?env= in the URL). */
function EditionSwitch({ value, onChange }: { value: Platform; onChange: (p: Platform) => void }) {
  const { t } = useTranslation()
  const opts: Array<{ v: Platform; label: string; Icon: typeof Server }> = [
    { v: 'selfhosted', label: t('sm_audit.env_sh'), Icon: Server },
    { v: 'saas', label: t('sm_audit.env_saas'), Icon: Cloud },
  ]
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    onChange(value === 'selfhosted' ? 'saas' : 'selfhosted')
  }
  return (
    <div role="radiogroup" aria-label={t('sm_audit.env_label')} onKeyDown={onKey}
      className="inline-flex rounded-xl border border-border bg-bg-card p-1">
      {opts.map(o => {
        const on = value === o.v
        return (
          <button key={o.v} type="button" role="radio" aria-checked={on} tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.v)}
            className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors duration-200
              ${on ? 'bg-bg-muted text-text shadow-sm' : 'text-text-2 hover:text-text'}`}>
            <o.Icon size={16} aria-hidden="true" className={on ? 'text-domain-idira' : 'text-text-muted'} />{o.label}
          </button>
        )
      })}
    </div>
  )
}

/** Secrets Manager resources: audit trail and SIEM integration, Self-Hosted and SaaS. */
export default function AuditPage() {
  const { t } = useTranslation()
  const [platform, setPlatform] = usePlatform()
  const saas = platform === 'saas'
  const ed = saas ? 'saas' : 'sh'
  const p = (k: string) => t(`sm_audit.${k}`)
  const list = (k: string) => t(`sm_audit.${k}`, { returnObjects: true }) as string[]
  const pairs = (k: string) => t(`sm_audit.${k}`, { returnObjects: true }) as Array<[string, string]>
  const caps = t('sm_audit.caps', { returnObjects: true }) as Array<{ title: string; desc: string }>
  const docs = saas ? DOCS_SAAS : DOCS_SH

  return (
    <section className="min-h-screen bg-bg-base px-6 py-16">
      <div className="mx-auto max-w-5xl space-y-10">
        <PageHeader badge={p('badge')} title={p('title')} subtitle={p('subtitle')}>
          <div className="pt-2"><SupportChips saas selfHosted /></div>
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

        <Section title={p('flow_title')} lead={p(`flow_lead_${ed}`)}>
          <EditionSwitch value={platform} onChange={setPlatform} />
          <AuditFlow platform={platform} />
        </Section>

        <Section title={p('roles_title')} lead={p(`roles_lead_${ed}`)}>
          <RoleTable caption={p('roles_title')} colA={p('col_component')} colB={p('col_role')} rows={pairs(`roles_${ed}`)} />
        </Section>

        <Section title={p('events_title')} lead={p(`events_lead_${ed}`)}>
          <RoleTable caption={p('events_title')} colA={p('col_event')} colB={p('col_trigger')} rows={pairs(`events_${ed}`)} />
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

        <LimitsCallout title={p(`limits_title_${ed}`)} items={list(`limits_${ed}`)}
          source={{ label: p('limits_source'), href: saas ? DOCS_SAAS[3].href : DOCS_SH[4].href }} />

        <DocLinks title={p(`docs_title_${ed}`)} links={docs.map(d => ({ label: p(d.key), href: d.href }))} />
      </div>
    </section>
  )
}
