import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Database, FileKey, Globe, Vault, Workflow } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from '../../FlowPlayer'

/**
 * MuleSoft Connector: the Mule app is configured with account, URL, workload
 * ID and API key (ideally through secure property placeholders). When a flow
 * runs, the Retrieve secret operation authenticates with the API key, asks
 * for a comma-separated list of secrets and hands the values to the next
 * step of the flow.
 */
export default function MuleSoftFlow() {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const p = (k: string) => t(`pf_mulesoft.flow.${k}`)
    const step = (n: number) => ({ title: p(`s${n}_title`), desc: p(`s${n}_desc`) })
    const pend = p('st_pending'), idle = p('st_idle'), check = p('st_check')
    return {
      id: 'pf-mulesoft',
      ariaLabel: p('diagram_label'),
      initial: { cfg: 'none', tok: 'none', sec: 'none', out: 'none', authn: 'idle', pol: 'idle', sess: 'idle' },
      nodes: [
        { id: 'props', domain: 'neutral', Icon: FileKey, title: 'conjur.properties', sub: p('n_props_sub') },
        { id: 'client', domain: 'neutral', Icon: Globe, title: p('n_client'), sub: p('n_client_sub') },
        { id: 'mule', domain: 'cp', Icon: Workflow, title: p('n_mule'), sub: 'ConjurVaultConnector', rows: [
          { label: p('r_config'), k: 'cfg', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_loaded'), tone: 'ok' }] },
          { label: p('r_token'), k: 'tok', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_received'), tone: 'ok' }] },
          { label: p('r_secret'), k: 'sec', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_flow'), tone: 'ok' }] },
          { label: p('r_response'), k: 'out', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: '200 OK', tone: 'ok' }] },
        ] },
        { id: 'sm', domain: 'idira', Icon: Vault, title: 'IDIRA Secrets Manager', sub: 'authn · API key', rows: [
          { label: 'authn', k: 'authn', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: check, tone: 'warn' }, { v: 'ok', text: p('st_valid'), tone: 'ok' }] },
          { label: 'policy', k: 'pol', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: 'consumers', tone: 'ok' }] },
        ] },
        { id: 'api', domain: 'svc', Icon: Database, title: p('n_backend'), sub: p('n_backend_sub'), rows: [
          { label: p('r_session'), k: 'sess', states: [{ v: 'idle', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_connected'), tone: 'ok' }] },
        ] },
      ],
      edgeKinds: { 'props-mule': 'control', 'client-mule': 'access', 'mule-sm': 'identity', 'mule-api': 'access' },
      layouts: {
        wide: {
          w: 980, h: 420,
          boxes: {
            props: { x: 40, y: 20, w: 230, h: 76 }, client: { x: 40, y: 300, w: 230, h: 76 },
            mule: { x: 370, y: 150, w: 260, h: 156 }, sm: { x: 730, y: 30, w: 230, h: 116 },
            api: { x: 730, y: 290, w: 230, h: 96 },
          },
          zones: [
            { d: 'neutral', x: 28, y: 10, w: 254, h: 96 }, { d: 'neutral', x: 28, y: 290, w: 254, h: 96 },
            { d: 'cp', x: 358, y: 138, w: 284, h: 180 }, { d: 'idira', x: 718, y: 18, w: 254, h: 140 },
            { d: 'svc', x: 718, y: 278, w: 254, h: 120 },
          ],
          edges: {
            'props-mule': 'M 155,96 C 155,190 260,190 370,190', 'client-mule': 'M 270,338 C 320,338 320,280 370,280',
            'mule-sm': 'M 630,190 C 680,190 680,88 730,88', 'mule-api': 'M 630,280 C 680,280 680,338 730,338',
          },
          labels: [
            { x: 560, y: 84, text: 'HTTPS · API key' },
            { x: 500, y: 360, text: 'Retrieve secret · key=a,b,c' },
          ],
        },
        narrow: {
          w: 360, h: 900, title: 14,
          boxes: {
            props: { x: 50, y: 30, w: 260, h: 76 }, client: { x: 50, y: 150, w: 260, h: 76 },
            mule: { x: 50, y: 290, w: 260, h: 156 }, sm: { x: 50, y: 530, w: 260, h: 116 },
            api: { x: 50, y: 740, w: 260, h: 96 },
          },
          edges: {
            'props-mule': 'M 50,68 C 8,68 8,330 50,330', 'client-mule': 'M 180,226 L 180,290',
            'mule-sm': 'M 180,446 L 180,530', 'mule-api': 'M 310,400 C 352,400 352,788 310,788',
          },
        },
      },
      steps: [
        { ...step(1), focus: ['mule', 'sm'], end: 0.6, fx: [] },
        { ...step(2), focus: ['props', 'mule'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'props-mule', label: p('p_props') }, { t: 'set', at: 1.3, k: 'cfg', v: 'ok', pop: true }] },
        { ...step(3), focus: ['client', 'mule'], end: 1.6, fx: [
          { t: 'packet', at: 0.3, edge: 'client-mule', label: p('p_request') }] },
        { ...step(4), focus: ['mule', 'sm'], end: 3.6, fx: [
          { t: 'packet', at: 0.3, edge: 'mule-sm', label: p('p_auth') }, { t: 'set', at: 1.3, k: 'authn', v: 'check' },
          { t: 'set', at: 1.8, k: 'authn', v: 'ok', pop: true },
          { t: 'packet', at: 2.0, edge: 'mule-sm', label: p('p_token'), reverse: true }, { t: 'set', at: 3.0, k: 'tok', v: 'ok', pop: true }] },
        { ...step(5), focus: ['mule', 'sm'], end: 3.6, fx: [
          { t: 'packet', at: 0.3, edge: 'mule-sm', label: 'Retrieve secret' }, { t: 'set', at: 1.2, k: 'pol', v: 'ok', pop: true },
          { t: 'packet', at: 1.6, edge: 'mule-sm', label: p('p_secret'), kind: 'secret', reverse: true }, { t: 'set', at: 2.6, k: 'sec', v: 'ok', pop: true }] },
        { ...step(6), focus: ['mule', 'api', 'client'], end: 3.8, fx: [
          { t: 'packet', at: 0.3, edge: 'mule-api', label: p('p_login') }, { t: 'set', at: 1.4, k: 'sess', v: 'ok', pop: true },
          { t: 'packet', at: 1.8, edge: 'client-mule', label: p('p_response'), reverse: true }, { t: 'set', at: 2.8, k: 'out', v: 'ok', pop: true }] },
      ],
    }
  }, [t])
  return <FlowPlayer spec={spec} />
}
