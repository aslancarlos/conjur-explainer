import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import SummonFlow from '../../components/flow/specs/sm/SummonFlow'
import { DocLinks, LimitsCallout, RoleTable, Section, SupportChips } from '../../components/authn/AuthnPieces'

const DOCS = [
  { key: 'doc_summon', href: 'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/tools/summon.html' },
  { key: 'doc_tf_summon', href: 'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/integrations/terraform_summon.htm' },
  { key: 'doc_tf', href: 'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/integrations/terraform.htm' },
  { key: 'doc_ansible', href: 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/integrations/ansible.html' },
  { key: 'doc_site', href: 'https://cyberark.github.io/summon' },
  { key: 'doc_repo', href: 'https://github.com/cyberark/summon' },
] as const

/** Secrets Manager resources: Summon, inject secrets as environment variables of a child process. */
export default function SummonPage() {
  const { t } = useTranslation()
  const p = (k: string) => t(`sm_summon.${k}`)
  const list = (k: string) => t(`sm_summon.${k}`, { returnObjects: true }) as string[]
  const pairs = (k: string) => t(`sm_summon.${k}`, { returnObjects: true }) as Array<[string, string]>
  const caps = t('sm_summon.caps', { returnObjects: true }) as Array<{ title: string; desc: string }>

  return (
    <section className="min-h-screen bg-bg-base px-6 py-16">
      <div className="mx-auto max-w-5xl space-y-10">
        <PageHeader badge={p('badge')} title={p('title')} subtitle={p('subtitle')}>
          <div className="pt-2"><SupportChips saas selfHosted /></div>
        </PageHeader>

        <Section title={p('caps_title')} lead={p('caps_lead')}>
          <div className="grid gap-4 md:grid-cols-3">
            {caps.map(c => (
              <div key={c.title} className="card">
                <h3 className="text-base font-semibold text-text">{c.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-text-2">{c.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title={p('flow_title')} lead={p('flow_lead')}>
          <SummonFlow />
        </Section>

        <Section title={p('roles_title')} lead={p('roles_lead')}>
          <RoleTable caption={p('roles_title')} colA={p('col_component')} colB={p('col_role')} rows={pairs('roles')} />
        </Section>

        <Section title={p('example_title')} lead={p('example_lead')}>
          <div className="grid gap-4 lg:grid-cols-2">
            <figure className="card">
              <figcaption className="text-sm font-semibold text-text">{p('example_yml')}</figcaption>
              <pre translate="no" className="code-block mt-3 overflow-x-auto text-xs leading-relaxed" role="region" tabIndex={0} aria-label={p('example_yml')}><code>{`# secrets.yml
TF_VAR_access_key: !var aws/dev/access_key_id
TF_VAR_secret_key: !var aws/dev/secret_access_key`}</code></pre>
            </figure>
            <figure className="card">
              <figcaption className="text-sm font-semibold text-text">{p('example_run')}</figcaption>
              <pre translate="no" className="code-block mt-3 overflow-x-auto text-xs leading-relaxed" role="region" tabIndex={0} aria-label={p('example_run')}><code>{`summon terraform apply

# inline, one variable (systemd ExecStart)
summon --yaml 'DB_PASSWORD: !var data/myapp/database/password' \\
  /usr/local/bin/myapp`}</code></pre>
            </figure>
          </div>
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
          source={{ label: p('limits_source'), href: DOCS[1].href }} />

        <DocLinks title={p('docs_title')} links={DOCS.map(d => ({ label: p(d.key), href: d.href }))} />
      </div>
    </section>
  )
}
