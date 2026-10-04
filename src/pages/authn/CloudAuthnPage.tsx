import type { ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { DocLinks, LimitsCallout, RoleTable, Section, SupportChips } from '../../components/authn/AuthnPieces'

/**
 * Shared layout for the cloud authenticator pages (AWS IAM, Azure, GCP).
 * All copy lives in the page's i18n namespace (`ns`): badge, title, subtitle,
 * flow_title/lead, how_title/lead, roles ([component, role][]), when_title/
 * when[], diff_title/diff[], limits_title/limits[], docs_title/docs[] (labels,
 * aligned with `docs` hrefs).
 */
export default function CloudAuthnPage({ ns, Flow, saas, selfHosted, docs }: {
  ns: string
  Flow: ComponentType
  saas: boolean
  selfHosted: boolean
  docs: string[]
}) {
  const { t } = useTranslation()
  const p = (k: string) => t(`${ns}.${k}`)
  const list = (k: string) => t(`${ns}.${k}`, { returnObjects: true }) as string[]
  const roles = t(`${ns}.roles`, { returnObjects: true }) as Array<[string, string]>
  const docLabels = list('docs')

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-5xl space-y-10">
        <PageHeader badge={p('badge')} title={p('title')} subtitle={p('subtitle')}>
          <div className="pt-2"><SupportChips saas={saas} selfHosted={selfHosted} /></div>
        </PageHeader>

        <Section title={p('flow_title')} lead={p('flow_lead')}>
          <Flow />
        </Section>

        <Section title={p('how_title')} lead={p('how_lead')}>
          <RoleTable caption={p('how_title')} colA={p('col_component')} colB={p('col_role')} rows={roles} />
        </Section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title={p('when_title')}>
            <ul className="space-y-2.5">
              {list('when').map(it => (
                <li key={it} className="flex gap-2.5 text-sm leading-relaxed text-text-2">
                  <Check size={16} strokeWidth={2.2} className="mt-0.5 shrink-0 text-domain-idira" aria-hidden="true" />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </Section>
          <Section title={p('diff_title')}>
            <ul className="space-y-2.5">
              {list('diff').map(it => (
                <li key={it} className="flex gap-2.5 text-sm leading-relaxed text-text-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-domain-idira" aria-hidden="true" />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </Section>
        </div>

        <LimitsCallout title={p('limits_title')} items={list('limits')} />

        <DocLinks title={p('docs_title')} links={docs.map((href, i) => ({ href, label: docLabels[i] ?? href }))} />
      </div>
    </section>
  )
}
