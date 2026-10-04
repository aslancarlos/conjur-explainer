import PageHeader from '../../components/PageHeader'
import { DocLinks, LimitsCallout, RoleTable, Section, SupportChips } from '../../components/authn/AuthnPieces'
import McpServerFlow from '../../components/flow/specs/ai/McpServerFlow'
import { StepList, WhenDiff, useNs } from './AiPieces'

// Official sources for every fact on this page (docs mirror front matter).
const DOCS = [
  'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/conjurcloud/cc-mcp-server.htm',
  'https://docs.cyberark.com/identity/latest/en/content/coreservices/authenticate/oauth2-client.htm',
  'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/conjurcloud/cl_usermanage.htm',
  'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/conjurcloud/whatsnew.htm',
]

/** AI agents: Secrets Manager MCP server (beta, development only). */
export default function McpServerPage() {
  const ns = 'ai_mcp'
  const { p, list } = useNs(ns)
  const docLabels = list('docs')

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-5xl space-y-10">
        <PageHeader badge={p('badge')} title={p('title')} subtitle={p('subtitle')}>
          <div className="pt-2"><SupportChips saas selfHosted={false} /></div>
        </PageHeader>

        <Section title={p('flow_title')} lead={p('flow_lead')}>
          <McpServerFlow />
        </Section>

        <Section title={p('how_title')} lead={p('how_lead')}>
          <RoleTable caption={p('how_title')} colA={p('col_component')} colB={p('col_role')} rows={list<[string, string]>('roles')} />
        </Section>

        <Section title={p('tools_title')} lead={p('tools_lead')}>
          <RoleTable caption={p('tools_title')} colA={p('col_tool')} colB={p('col_does')} rows={list<[string, string]>('tools')} />
        </Section>

        <Section title={p('setup_title')} lead={p('setup_lead')}>
          <StepList items={list('setup')} />
        </Section>

        <Section title={p('env_title')} lead={p('env_lead')}>
          <RoleTable caption={p('env_title')} colA={p('col_var')} colB={p('col_value')} rows={list<[string, string]>('env')} />
        </Section>

        <WhenDiff ns={ns} />

        <LimitsCallout title={p('limits_title')} items={list('limits')} />

        <DocLinks title={p('docs_title')} links={DOCS.map((href, i) => ({ href, label: docLabels[i] ?? href }))} />
      </div>
    </section>
  )
}
