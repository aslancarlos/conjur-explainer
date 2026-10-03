import PageHeader from '../../components/PageHeader'
import { DocLinks, LimitsCallout, RoleTable, Section, SupportChips } from '../../components/authn/AuthnPieces'
import SwaAiAgentsFlow from '../../components/flow/specs/ai/SwaAiAgentsFlow'
import { WhenDiff, useNs } from './AiPieces'

// Official sources for every fact on this page (docs mirror front matter).
const DOCS = [
  'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/operations/authn/authenticate-ai-spiffe.htm',
  'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-claude.htm',
  'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-gemini-enterprise.htm',
  'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-oidc.htm',
  'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/operations/services/cjr-authn-jwt-lp.htm',
  'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/conjurcloud/ccl-support.htm',
]

type Variant = { title: string; who: string; how: string; svid: string }

/** AI agents: SPIFFE identities (SWA JWT-SVIDs) instead of API keys. */
export default function SwaAiAgentsPage() {
  const ns = 'ai_swa'
  const { p, list } = useNs(ns)
  const docLabels = list('docs')

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-5xl space-y-10">
        <PageHeader badge={p('badge')} title={p('title')} subtitle={p('subtitle')}>
          <div className="pt-2"><SupportChips saas selfHosted={false} /></div>
        </PageHeader>

        <Section title={p('flow_title')} lead={p('flow_lead')}>
          <SwaAiAgentsFlow />
        </Section>

        <Section title={p('how_title')} lead={p('how_lead')}>
          <RoleTable caption={p('how_title')} colA={p('col_component')} colB={p('col_role')} rows={list<[string, string]>('roles')} />
        </Section>

        <Section title={p('variants_title')} lead={p('variants_lead')}>
          <div className="grid gap-4 lg:grid-cols-3">
            {list<Variant>('variants').map(v => (
              <article key={v.title} className="flex flex-col gap-3 card">
                <h3 className="text-base font-semibold text-text">{v.title}</h3>
                <p className="text-xs font-medium uppercase tracking-wider text-text-muted">{v.who}</p>
                <p className="text-sm leading-relaxed text-text-2">{v.how}</p>
                <p className="mt-auto [overflow-wrap:anywhere] rounded-lg bg-bg-muted px-3 py-2 font-mono text-xs text-text">{v.svid}</p>
              </article>
            ))}
          </div>
        </Section>

        <WhenDiff ns={ns} />

        <LimitsCallout title={p('limits_title')} items={list('limits')} />

        <DocLinks title={p('docs_title')} links={DOCS.map((href, i) => ({ href, label: docLabels[i] ?? href }))} />
      </div>
    </section>
  )
}
