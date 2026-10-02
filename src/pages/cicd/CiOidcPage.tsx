import type { ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { DocLinks, LimitsCallout, RoleTable, Section, SupportChips } from '../../components/authn/AuthnPieces'

/**
 * Shared layout for the CI/CD pages whose plugin trades the platform's OIDC
 * token for secrets via authn-jwt (Bitbucket, CircleCI, Octopus).
 * Copy lives in `ns`: badge, title, subtitle, flow_title/lead, caps_title/
 * caps[], how_title/lead, roles ([component, role][]), fields_title/lead,
 * fields ([field, meaning][]), when_title/when[], diff_title/diff[],
 * limits_title/limits[], docs_title/docs[] (labels aligned with `docs` hrefs).
 */
export default function CiOidcPage({ ns, Flow, saas, selfHosted, docs }: {
  ns: string
  Flow: ComponentType
  saas: boolean
  selfHosted: boolean
  docs: string[]
}) {
  const { t } = useTranslation()
  const p = (k: string) => t(`${ns}.${k}`)
  const list = (k: string) => t(`${ns}.${k}`, { returnObjects: true }) as string[]
  const pairs = (k: string) => t(`${ns}.${k}`, { returnObjects: true }) as Array<[string, string]>
  const docLabels = list('docs')

  const bullets = (items: string[], ok: boolean) => (
    <ul className="space-y-2.5">
      {items.map(it => (
        <li key={it} className="flex gap-2.5 text-sm leading-relaxed text-text-2">
          {ok
            ? <Check size={16} strokeWidth={2.2} className="mt-0.5 shrink-0 text-tone-success" aria-hidden="true" />
            : <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-domain-idira" aria-hidden="true" />}
          <span>{it}</span>
        </li>
      ))}
    </ul>
  )

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-5xl space-y-10">
        <PageHeader badge={p('badge')} title={p('title')} subtitle={p('subtitle')}>
          <div className="pt-2"><SupportChips saas={saas} selfHosted={selfHosted} /></div>
        </PageHeader>

        <Section title={p('flow_title')} lead={p('flow_lead')}>
          <Flow />
        </Section>

        <Section title={p('caps_title')}>
          {bullets(list('caps'), true)}
        </Section>

        <Section title={p('how_title')} lead={p('how_lead')}>
          <RoleTable caption={p('how_title')} colA={p('col_component')} colB={p('col_role')} rows={pairs('roles')} />
        </Section>

        <Section title={p('fields_title')} lead={p('fields_lead')}>
          <RoleTable caption={p('fields_title')} colA={p('col_field')} colB={p('col_meaning')} rows={pairs('fields')} />
        </Section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title={p('when_title')}>{bullets(list('when'), true)}</Section>
          <Section title={p('diff_title')}>{bullets(list('diff'), false)}</Section>
        </div>

        <LimitsCallout title={p('limits_title')} items={list('limits')} />

        <DocLinks title={p('docs_title')} links={docs.map((href, i) => ({ href, label: docLabels[i] ?? href }))} />
      </div>
    </section>
  )
}
