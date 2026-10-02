import type { ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../../components/PageHeader'
import { DocLinks, LimitsCallout, RoleTable, Section, SupportChips } from '../../components/authn/AuthnPieces'

export interface CiDoc { key: string; href: string }

/**
 * Shared layout for the CI/CD and IaC use-case pages (Terraform, GitLab,
 * Azure DevOps): header with SaaS / Self-Hosted availability, the animated
 * diagram, capabilities, components, when to use, SaaS vs Self-Hosted
 * differences, a prominent limitations callout and the official docs.
 * All copy lives in the page's own i18n namespace (`ns`).
 */
export default function CiToolPage({ ns, Flow, docs, saas = true, selfHosted = true }: {
  ns: string; Flow: ComponentType; docs: CiDoc[]; saas?: boolean; selfHosted?: boolean
}) {
  const { t } = useTranslation()
  const p = (k: string) => t(`${ns}.${k}`)
  const list = (k: string) => t(`${ns}.${k}`, { returnObjects: true }) as string[]
  const pairs = (k: string) => t(`${ns}.${k}`, { returnObjects: true }) as Array<[string, string]>

  return (
    <section className="min-h-screen bg-bg-base px-6 py-16">
      <div className="mx-auto max-w-5xl space-y-10">
        <PageHeader badge={p('badge')} title={p('title')} subtitle={p('subtitle')}>
          <SupportChips saas={saas} selfHosted={selfHosted} />
        </PageHeader>

        <Section title={p('flow_title')} lead={p('flow_lead')}>
          <Flow />
        </Section>

        <Section title={p('caps_title')} lead={p('caps_lead')}>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pairs('caps').map(([title, desc]) => (
              <li key={title} className="rounded-2xl border border-border bg-bg-card p-5">
                <h3 className="text-base font-semibold text-text">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-text-2">{desc}</p>
              </li>
            ))}
          </ul>
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

        <Section title={p('diff_title')} lead={p('diff_lead')}>
          <RoleTable caption={p('diff_title')} colA={p('col_topic')} colB={p('col_detail')} rows={pairs('diff')} />
        </Section>

        <LimitsCallout title={p('limits_title')} items={list('limits')}
          source={{ label: p('limits_source'), href: docs[0].href }} />

        <DocLinks title={p('docs_title')} links={docs.map(d => ({ label: p(d.key), href: d.href }))} />
      </div>
    </section>
  )
}
