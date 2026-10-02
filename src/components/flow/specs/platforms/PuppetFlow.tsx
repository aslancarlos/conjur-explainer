import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FileCode, HardDrive, Server, Vault } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from '../../FlowPlayer'

/**
 * Puppet module: the node already carries its own Secrets Manager identity.
 * The server compiles a catalog that holds a Deferred call instead of the
 * value; the agent authenticates, fetches the secret at apply time and
 * writes the managed resource. The value never travels in the catalog.
 */
export default function PuppetFlow() {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const p = (k: string) => t(`pf_puppet.flow.${k}`)
    const step = (n: number) => ({ title: p(`s${n}_title`), desc: p(`s${n}_desc`) })
    const pend = p('st_pending'), idle = p('st_idle'), check = p('st_check')
    return {
      id: 'pf-puppet',
      ariaLabel: p('diagram_label'),
      initial: { cat: 'idle', id: 'none', recv: 'none', tok: 'none', sec: 'none', authn: 'idle', pol: 'idle', res: 'idle' },
      nodes: [
        { id: 'srv', domain: 'neutral', Icon: Server, title: 'Puppet Server', sub: p('n_srv_sub'), rows: [
          { label: p('r_catalog'), k: 'cat', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: 'Deferred', tone: 'ok' }] },
        ] },
        { id: 'agent', domain: 'cp', Icon: HardDrive, title: p('n_agent'), sub: p('n_agent_sub'), rows: [
          { label: p('r_identity'), k: 'id', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: 'host/{node}', tone: 'ok' }] },
          { label: p('r_catalog'), k: 'recv', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_novalue'), tone: 'ok' }] },
          { label: p('r_token'), k: 'tok', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_received'), tone: 'ok' }] },
          { label: p('r_secret'), k: 'sec', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_apply'), tone: 'ok' }] },
        ] },
        { id: 'sm', domain: 'idira', Icon: Vault, title: 'IDIRA Secrets Manager', sub: 'authn · API key', rows: [
          { label: 'authn', k: 'authn', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: check, tone: 'warn' }, { v: 'ok', text: p('st_valid'), tone: 'ok' }] },
          { label: 'policy', k: 'pol', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_allowed'), tone: 'ok' }] },
        ] },
        { id: 'tgt', domain: 'svc', Icon: FileCode, title: p('n_tgt'), sub: p('n_tgt_sub'), rows: [
          { label: p('r_state'), k: 'res', states: [{ v: 'idle', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_applied'), tone: 'ok' }] },
        ] },
      ],
      edgeKinds: { 'srv-agent': 'control', 'agent-sm': 'identity', 'sm-agent': 'identity', 'agent-tgt': 'access' },
      layouts: {
        wide: {
          w: 980, h: 410,
          boxes: {
            srv: { x: 40, y: 20, w: 250, h: 96 }, agent: { x: 40, y: 180, w: 250, h: 156 },
            sm: { x: 430, y: 180, w: 260, h: 116 }, tgt: { x: 770, y: 180, w: 190, h: 96 },
          },
          zones: [
            { d: 'neutral', x: 28, y: 10, w: 274, h: 116 }, { d: 'cp', x: 28, y: 168, w: 274, h: 180 },
            { d: 'idira', x: 418, y: 168, w: 284, h: 140 }, { d: 'svc', x: 758, y: 168, w: 214, h: 120 },
          ],
          edges: {
            'srv-agent': 'M 165,116 L 165,180', 'agent-sm': 'M 290,214 L 430,214', 'sm-agent': 'M 430,268 L 290,268',
            'agent-tgt': 'M 290,318 C 560,372 700,372 865,276',
          },
          labels: [
            { x: 165, y: 148, text: 'HTTPS 8140' },
            { x: 560, y: 120, text: 'POST /authn/{account}/host%2F{node}/authenticate' },
          ],
        },
        narrow: {
          w: 360, h: 820, title: 14,
          boxes: {
            srv: { x: 50, y: 30, w: 260, h: 96 }, agent: { x: 50, y: 180, w: 260, h: 156 },
            sm: { x: 50, y: 420, w: 260, h: 116 }, tgt: { x: 50, y: 680, w: 260, h: 96 },
          },
          edges: {
            'srv-agent': 'M 180,126 L 180,180', 'agent-sm': 'M 160,336 L 160,420', 'sm-agent': 'M 200,420 L 200,336',
            'agent-tgt': 'M 310,300 C 352,300 352,728 310,728',
          },
        },
      },
      steps: [
        { ...step(1), focus: ['agent', 'sm'], end: 0.6, fx: [] },
        { ...step(2), focus: ['agent'], end: 1.2, fx: [{ t: 'set', at: 0.3, k: 'id', v: 'ok', pop: true }] },
        { ...step(3), focus: ['srv', 'agent'], end: 2.6, fx: [
          { t: 'set', at: 0.3, k: 'cat', v: 'ok', pop: true },
          { t: 'packet', at: 0.7, edge: 'srv-agent', label: p('p_catalog') }, { t: 'set', at: 1.7, k: 'recv', v: 'ok', pop: true }] },
        { ...step(4), focus: ['agent', 'sm'], end: 3.6, fx: [
          { t: 'packet', at: 0.3, edge: 'agent-sm', label: p('p_auth') }, { t: 'set', at: 1.3, k: 'authn', v: 'check' },
          { t: 'set', at: 1.8, k: 'authn', v: 'ok', pop: true },
          { t: 'packet', at: 2.0, edge: 'sm-agent', label: p('p_token') }, { t: 'set', at: 3.0, k: 'tok', v: 'ok', pop: true }] },
        { ...step(5), focus: ['agent', 'sm'], end: 3.6, fx: [
          { t: 'packet', at: 0.3, edge: 'agent-sm', label: 'conjur::secret' }, { t: 'set', at: 1.2, k: 'pol', v: 'ok', pop: true },
          { t: 'packet', at: 1.6, edge: 'sm-agent', label: p('p_secret'), kind: 'secret' }, { t: 'set', at: 2.6, k: 'sec', v: 'ok', pop: true }] },
        { ...step(6), focus: ['agent', 'tgt'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'agent-tgt', label: p('p_apply') }, { t: 'set', at: 1.4, k: 'res', v: 'ok', pop: true }] },
      ],
    }
  }, [t])
  return <FlowPlayer spec={spec} />
}
