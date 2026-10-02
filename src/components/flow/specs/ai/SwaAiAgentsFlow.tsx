import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Bot, Fingerprint, Globe, Sparkles, Vault } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from '../../FlowPlayer'

/**
 * AI agent with no stored credential: the SPIFFE agent (SWA Agent) attests
 * the agent and issues short-lived JWT-SVIDs per audience. With aud=conjur
 * the agent authenticates to Secrets Manager (authn-jwt, sub claim mapped to
 * a workload of type AI Agent); with aud=https://api.anthropic.com it
 * exchanges the JWT-SVID for a scoped Anthropic access token (workload
 * identity federation). Both relying parties verify the signature against
 * the trust domain's public OIDC issuer / JWKS.
 */
export default function SwaAiAgentsFlow() {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const p = (k: string) => t(`ai_swa.flow.${k}`)
    const step = (n: number) => ({ title: p(`s${n}_title`), desc: p(`s${n}_desc`) })
    const pend = p('st_pending'), idle = p('st_idle'), check = p('st_check')
    return {
      id: 'ai-swa',
      ariaLabel: p('diagram_label'),
      initial: { att: 'idle', svid: 'none', smtok: 'none', sec: 'none', ant: 'none', sig: 'idle', map: 'idle', pol: 'idle', rule: 'idle', scope: 'idle' },
      nodes: [
        { id: 'swa', domain: 'idira', Icon: Fingerprint, title: p('n_swa'), sub: 'SPIFFE Workload API', rows: [
          { label: p('r_attest'), k: 'att', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: check, tone: 'warn' }, { v: 'ok', text: 'SPIFFE ID', tone: 'ok' }] },
        ] },
        { id: 'agent', domain: 'cp', Icon: Bot, title: p('n_agent'), sub: p('n_agent_sub'), rows: [
          { label: 'JWT-SVID', k: 'svid', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'conjur', text: 'aud: conjur', tone: 'ok' }, { v: 'ant', text: 'aud: anthropic', tone: 'ok' }] },
          { label: p('r_smtoken'), k: 'smtok', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_received'), tone: 'ok' }] },
          { label: p('r_secret'), k: 'sec', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_memory'), tone: 'ok' }] },
          { label: p('r_anttoken'), k: 'ant', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: '600 s', tone: 'ok' }] },
        ] },
        { id: 'sm', domain: 'idira', Icon: Vault, title: 'IDIRA Secrets Manager', sub: 'authn-jwt/spiffe-auth', rows: [
          { label: p('r_sig'), k: 'sig', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: check, tone: 'warn' }, { v: 'ok', text: p('st_valid'), tone: 'ok' }] },
          { label: p('r_map'), k: 'map', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_aiagent'), tone: 'ok' }] },
          { label: 'policy', k: 'pol', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_allowed'), tone: 'ok' }] },
        ] },
        { id: 'ant', domain: 'svc', Icon: Sparkles, title: 'Claude API', sub: p('n_ant_sub'), rows: [
          { label: p('r_rule'), k: 'rule', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: check, tone: 'warn' }, { v: 'ok', text: 'fdrl_ match', tone: 'ok' }] },
          { label: 'scope', k: 'scope', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: 'inference', tone: 'ok' }] },
        ] },
        { id: 'oidc', domain: 'idira', Icon: Globe, title: p('n_oidc'), sub: '/.well-known', rows: [
          { label: 'JWKS', value: p('st_public'), tone: 'ok' },
        ] },
      ],
      edgeKinds: { 'swa-agent': 'identity', 'agent-sm': 'identity', 'agent-ant': 'identity', 'sm-oidc': 'control', 'ant-oidc': 'control' },
      layouts: {
        wide: {
          w: 980, h: 430,
          boxes: {
            swa: { x: 40, y: 20, w: 240, h: 96 }, agent: { x: 40, y: 200, w: 240, h: 156 },
            sm: { x: 400, y: 20, w: 260, h: 136 }, ant: { x: 400, y: 250, w: 260, h: 116 },
            oidc: { x: 770, y: 140, w: 190, h: 96 },
          },
          zones: [
            { d: 'idira', x: 28, y: 10, w: 264, h: 116 }, { d: 'cp', x: 28, y: 188, w: 264, h: 180 },
            { d: 'idira', x: 388, y: 10, w: 284, h: 156 }, { d: 'svc', x: 388, y: 238, w: 284, h: 140 },
            { d: 'idira', x: 758, y: 128, w: 214, h: 120 },
          ],
          edges: {
            'swa-agent': 'M 160,116 L 160,200',
            'agent-sm': 'M 280,240 C 340,240 340,88 400,88',
            'agent-ant': 'M 280,308 L 400,308',
            'sm-oidc': 'M 660,88 C 715,88 715,170 770,170',
            'ant-oidc': 'M 660,308 C 715,308 715,210 770,210',
          },
          labels: [
            { x: 160, y: 158, text: 'api.sock' },
            { x: 530, y: 408, text: 'POST /v1/oauth/token · jwt-bearer' },
            { x: 865, y: 272, text: 'jwks_uri · HTTPS' },
          ],
        },
        narrow: {
          w: 360, h: 960, title: 14,
          boxes: {
            swa: { x: 50, y: 30, w: 260, h: 96 }, agent: { x: 50, y: 190, w: 260, h: 156 },
            sm: { x: 50, y: 420, w: 260, h: 136 }, ant: { x: 50, y: 620, w: 260, h: 116 },
            oidc: { x: 50, y: 820, w: 260, h: 96 },
          },
          edges: {
            'swa-agent': 'M 180,126 L 180,190',
            'agent-sm': 'M 180,346 L 180,420',
            'agent-ant': 'M 50,300 C 10,300 10,678 50,678',
            'sm-oidc': 'M 310,488 C 350,488 350,850 310,850',
            'ant-oidc': 'M 180,736 L 180,820',
          },
        },
      },
      steps: [
        { ...step(1), focus: ['agent'], end: 0.6, fx: [] },
        { ...step(2), focus: ['agent', 'swa'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'swa-agent', label: p('p_attest'), reverse: true }, { t: 'set', at: 1.2, k: 'att', v: 'check' },
          { t: 'set', at: 2.0, k: 'att', v: 'ok', pop: true }] },
        { ...step(3), focus: ['swa', 'agent'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'swa-agent', label: 'aud: conjur' }, { t: 'set', at: 1.3, k: 'svid', v: 'conjur', pop: true }] },
        { ...step(4), focus: ['agent', 'sm', 'oidc'], end: 4.0, fx: [
          { t: 'packet', at: 0.3, edge: 'agent-sm', label: 'JWT-SVID' }, { t: 'set', at: 1.3, k: 'sig', v: 'check' },
          { t: 'packet', at: 1.5, edge: 'sm-oidc', label: 'GET /keys' }, { t: 'packet', at: 2.5, edge: 'sm-oidc', label: p('p_keys'), reverse: true },
          { t: 'set', at: 3.5, k: 'sig', v: 'ok', pop: true }] },
        { ...step(5), focus: ['sm'], end: 1.4, fx: [{ t: 'set', at: 0.3, k: 'map', v: 'ok', pop: true }] },
        { ...step(6), focus: ['sm', 'agent'], end: 3.8, fx: [
          { t: 'packet', at: 0.3, edge: 'agent-sm', label: p('p_token'), reverse: true }, { t: 'set', at: 1.3, k: 'smtok', v: 'ok', pop: true },
          { t: 'packet', at: 1.6, edge: 'agent-sm', label: p('p_get') }, { t: 'set', at: 2.5, k: 'pol', v: 'ok', pop: true },
          { t: 'packet', at: 2.6, edge: 'agent-sm', label: p('p_secret'), kind: 'secret', reverse: true }, { t: 'set', at: 3.5, k: 'sec', v: 'ok', pop: true }] },
        { ...step(7), focus: ['swa', 'agent'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'swa-agent', label: 'aud: api.anthropic.com' }, { t: 'set', at: 1.3, k: 'svid', v: 'ant', pop: true }] },
        { ...step(8), focus: ['agent', 'ant', 'oidc'], end: 4.4, fx: [
          { t: 'packet', at: 0.3, edge: 'agent-ant', label: 'jwt-bearer' }, { t: 'set', at: 1.3, k: 'rule', v: 'check' },
          { t: 'packet', at: 1.5, edge: 'ant-oidc', label: 'jwks_uri' }, { t: 'packet', at: 2.5, edge: 'ant-oidc', label: p('p_keys'), reverse: true },
          { t: 'set', at: 3.4, k: 'rule', v: 'ok', pop: true }] },
        { ...step(9), focus: ['ant', 'agent'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'agent-ant', label: 'sk-ant-oat01-…', reverse: true }, { t: 'set', at: 1.3, k: 'ant', v: 'ok', pop: true }] },
        { ...step(10), focus: ['agent', 'ant'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'agent-ant', label: 'messages.create' }, { t: 'set', at: 1.3, k: 'scope', v: 'ok', pop: true }] },
      ],
    }
  }, [t])
  return <FlowPlayer spec={spec} />
}
