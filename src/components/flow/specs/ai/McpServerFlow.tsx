import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Bot, Container, LogIn, Vault } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from '../../FlowPlayer'

/**
 * Secrets Manager MCP server (beta, dev only): the AI tool starts the MCP
 * server container over stdio, the developer signs in through an Idira
 * Identity OAuth2 client as a dedicated least-privileged user, and the AI
 * then calls MCP tools (create_branch, create_secret, create_workload,
 * grant_secret_permission, generate_fetch_code) to move hard-coded secrets
 * into Secrets Manager under the user's own permissions.
 */
export default function McpServerFlow() {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const p = (k: string) => t(`ai_mcp.flow.${k}`)
    const step = (n: number) => ({ title: p(`s${n}_title`), desc: p(`s${n}_desc`) })
    const pend = p('st_pending'), idle = p('st_idle'), check = p('st_check')
    return {
      id: 'ai-mcp',
      ariaLabel: p('diagram_label'),
      initial: { code: 'hard', auth: 'none', sess: 'none', tool: 'idle', login: 'idle', pol: 'idle', br: 'idle', sec: 'idle', host: 'idle' },
      nodes: [
        { id: 'ai', domain: 'cp', Icon: Bot, title: p('n_ai'), sub: 'Claude Code · Cursor · Copilot', rows: [
          { label: p('r_code'), k: 'code', states: [{ v: 'hard', text: p('st_hard'), tone: 'bad' }, { v: 'ok', text: p('st_sdk'), tone: 'ok' }] },
          { label: p('r_auth'), k: 'auth', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_user'), tone: 'ok' }] },
        ] },
        { id: 'mcp', domain: 'cp', Icon: Container, title: p('n_mcp'), sub: 'cyberark/mcp-server · beta', rows: [
          { label: p('r_session'), k: 'sess', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: 'OAuth2', tone: 'ok' }] },
          { label: p('r_tool'), k: 'tool', states: [
            { v: 'idle', text: idle, tone: 'muted' }, { v: 'url', text: 'get_auth_url', tone: 'warn' },
            { v: 'branch', text: 'create_branch', tone: 'warn' }, { v: 'secret', text: 'create_secret', tone: 'warn' },
            { v: 'host', text: 'create_workload', tone: 'warn' }, { v: 'code', text: 'generate_fetch_code', tone: 'ok' }] },
        ] },
        { id: 'idp', domain: 'idira', Icon: LogIn, title: 'Idira Identity', sub: p('n_idp_sub'), rows: [
          { label: p('r_login'), k: 'login', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: check, tone: 'warn' }, { v: 'ok', text: p('st_login'), tone: 'ok' }] },
        ] },
        { id: 'sm', domain: 'idira', Icon: Vault, title: 'IDIRA Secrets Manager', sub: 'data/mcp-server', rows: [
          { label: 'policy', k: 'pol', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_policy'), tone: 'ok' }] },
          { label: p('r_branch'), k: 'br', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: 'mcp-server/my-app', tone: 'ok' }] },
          { label: p('r_secrets'), k: 'sec', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_created'), tone: 'ok' }] },
          { label: p('r_workload'), k: 'host', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_granted'), tone: 'ok' }] },
        ] },
      ],
      edgeKinds: { 'ai-mcp': 'control', 'mcp-idp': 'identity', 'mcp-sm': 'access' },
      layouts: {
        wide: {
          w: 980, h: 440,
          boxes: {
            ai: { x: 40, y: 160, w: 240, h: 116 }, mcp: { x: 380, y: 160, w: 240, h: 116 },
            idp: { x: 740, y: 20, w: 220, h: 96 }, sm: { x: 740, y: 230, w: 220, h: 156 },
          },
          zones: [
            { d: 'cp', x: 28, y: 148, w: 604, h: 140 },
            { d: 'idira', x: 728, y: 10, w: 244, h: 116 }, { d: 'idira', x: 728, y: 218, w: 244, h: 180 },
          ],
          edges: {
            'ai-mcp': 'M 280,218 L 380,218',
            'mcp-idp': 'M 620,190 C 680,190 680,68 740,68',
            'mcp-sm': 'M 620,250 C 680,250 680,308 740,308',
          },
          labels: [
            { x: 330, y: 196, text: 'stdio' },
            { x: 330, y: 318, text: 'docker run -i -p 8080:8080' },
            { x: 850, y: 172, text: 'localhost:8080/callback' },
            { x: 850, y: 420, text: 'REST API · HTTPS' },
          ],
        },
        narrow: {
          w: 360, h: 760, title: 14,
          boxes: {
            ai: { x: 50, y: 30, w: 260, h: 116 }, mcp: { x: 50, y: 210, w: 260, h: 116 },
            idp: { x: 50, y: 390, w: 260, h: 96 }, sm: { x: 50, y: 560, w: 260, h: 156 },
          },
          edges: {
            'ai-mcp': 'M 180,146 L 180,210',
            'mcp-idp': 'M 180,326 L 180,390',
            'mcp-sm': 'M 310,268 C 350,268 350,638 310,638',
          },
        },
      },
      steps: [
        { ...step(1), focus: ['ai'], end: 0.6, fx: [] },
        { ...step(2), focus: ['sm', 'idp'], end: 1.4, fx: [{ t: 'set', at: 0.4, k: 'pol', v: 'ok', pop: true }] },
        { ...step(3), focus: ['ai', 'mcp'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'ai-mcp', label: 'docker run' }, { t: 'set', at: 1.3, k: 'tool', v: 'url', pop: true }] },
        { ...step(4), focus: ['mcp', 'idp'], end: 3.6, fx: [
          { t: 'packet', at: 0.3, edge: 'mcp-idp', label: p('p_authorize') }, { t: 'set', at: 1.2, k: 'login', v: 'check' },
          { t: 'set', at: 2.0, k: 'login', v: 'ok', pop: true },
          { t: 'packet', at: 2.2, edge: 'mcp-idp', label: p('p_code'), reverse: true }, { t: 'set', at: 3.2, k: 'sess', v: 'ok', pop: true }] },
        { ...step(5), focus: ['ai', 'mcp'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'ai-mcp', label: 'authenticate' }, { t: 'set', at: 1.3, k: 'auth', v: 'ok', pop: true }] },
        { ...step(6), focus: ['ai', 'mcp', 'sm'], end: 3.4, fx: [
          { t: 'packet', at: 0.3, edge: 'ai-mcp', label: p('p_prompt') }, { t: 'set', at: 1.2, k: 'tool', v: 'branch' },
          { t: 'packet', at: 1.5, edge: 'mcp-sm', label: 'create_branch' }, { t: 'set', at: 2.6, k: 'br', v: 'ok', pop: true }] },
        { ...step(7), focus: ['mcp', 'sm'], end: 2.4, fx: [
          { t: 'set', at: 0.2, k: 'tool', v: 'secret' },
          { t: 'packet', at: 0.4, edge: 'mcp-sm', label: 'create_secret', kind: 'secret' }, { t: 'set', at: 1.5, k: 'sec', v: 'ok', pop: true }] },
        { ...step(8), focus: ['mcp', 'sm'], end: 3.4, fx: [
          { t: 'set', at: 0.2, k: 'tool', v: 'host' },
          { t: 'packet', at: 0.4, edge: 'mcp-sm', label: 'create_workload' },
          { t: 'packet', at: 1.5, edge: 'mcp-sm', label: 'grant_secret_permission' }, { t: 'set', at: 2.6, k: 'host', v: 'ok', pop: true }] },
        { ...step(9), focus: ['ai', 'mcp'], end: 2.6, fx: [
          { t: 'set', at: 0.2, k: 'tool', v: 'code', pop: true },
          { t: 'packet', at: 0.5, edge: 'ai-mcp', label: p('p_sdk'), reverse: true }, { t: 'set', at: 1.6, k: 'code', v: 'ok', pop: true }] },
      ],
    }
  }, [t])
  return <FlowPlayer spec={spec} />
}
