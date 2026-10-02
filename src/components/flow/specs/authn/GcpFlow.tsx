import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Database, MonitorCog, Server, Vault } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from '../../FlowPlayer'

/**
 * GCP authenticator (authn-gcp): the workload asks the Google metadata server
 * for an identity token whose audience is its Secrets Manager host ID (full
 * format), posts it to Secrets Manager (no host ID in the URL), which
 * resolves the host from the audience and matches the token claims against
 * the host's authn-gcp/* annotations (AND).
 */
export default function GcpFlow() {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const p = (k: string) => t(`authn_gcp.flow.${k}`)
    const step = (n: number) => ({ title: p(`s${n}_title`), desc: p(`s${n}_desc`) })
    const pend = p('st_pending'), idle = p('st_idle'), check = p('st_check')
    return {
      id: 'authn-gcp',
      ariaLabel: p('diagram_label'),
      initial: { idt: 'none', tok: 'none', sec: 'none', aud: 'idle', ann: 'idle', perm: 'idle', pol: 'idle', db: 'idle' },
      nodes: [
        { id: 'meta', domain: 'svc', Icon: MonitorCog, title: p('n_meta'), sub: p('n_meta_sub') },
        { id: 'wl', domain: 'cp', Icon: Server, title: p('n_wl'), sub: p('n_wl_sub'), rows: [
          { label: p('r_idt'), k: 'idt', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_full'), tone: 'ok' }] },
          { label: p('r_token'), k: 'tok', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_received'), tone: 'ok' }] },
          { label: p('r_secret'), k: 'sec', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_memory'), tone: 'ok' }] },
        ] },
        { id: 'sm', domain: 'idira', Icon: Vault, title: 'IDIRA Secrets Manager', sub: 'authn-gcp', rows: [
          { label: p('r_aud'), k: 'aud', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: check, tone: 'warn' }, { v: 'ok', text: p('st_host'), tone: 'ok' }] },
          { label: p('r_annot'), k: 'ann', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: check, tone: 'warn' }, { v: 'ok', text: p('st_match'), tone: 'ok' }] },
          { label: p('r_perm'), k: 'perm', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_apps'), tone: 'ok' }] },
          { label: 'policy', k: 'pol', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_allowed'), tone: 'ok' }] },
        ] },
        { id: 'db', domain: 'svc', Icon: Database, title: p('n_db'), sub: p('n_db_sub'), rows: [
          { label: p('r_session'), k: 'db', states: [{ v: 'idle', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_connected'), tone: 'ok' }] },
        ] },
      ],
      edgeKinds: { 'wl-meta': 'identity', 'wl-sm': 'identity', 'sm-wl': 'identity', 'wl-db': 'access' },
      layouts: {
        wide: {
          w: 980, h: 420,
          boxes: {
            meta: { x: 40, y: 20, w: 260, h: 76 }, wl: { x: 40, y: 160, w: 260, h: 136 },
            sm: { x: 460, y: 140, w: 280, h: 160 }, db: { x: 760, y: 20, w: 200, h: 96 },
          },
          zones: [
            { d: 'svc', x: 28, y: 10, w: 284, h: 96 }, { d: 'cp', x: 28, y: 148, w: 284, h: 160 },
            { d: 'idira', x: 448, y: 128, w: 304, h: 184 }, { d: 'svc', x: 748, y: 10, w: 224, h: 116 },
          ],
          edges: {
            'wl-meta': 'M 170,160 L 170,96', 'wl-sm': 'M 300,196 L 460,196', 'sm-wl': 'M 460,258 L 300,258',
            'wl-db': 'M 300,180 C 420,60 640,68 760,68',
          },
          labels: [
            { x: 170, y: 128, text: 'metadata/computeMetadata/v1' },
            { x: 380, y: 352, text: 'POST /api/authn-gcp/conjur/authenticate' },
            { x: 600, y: 386, text: 'aud = conjur/conjur/host/data/<branch>/<host>' },
          ],
        },
        narrow: {
          w: 360, h: 760, title: 14,
          boxes: {
            meta: { x: 50, y: 30, w: 260, h: 76 }, wl: { x: 50, y: 150, w: 260, h: 136 },
            sm: { x: 50, y: 360, w: 260, h: 160 }, db: { x: 50, y: 620, w: 260, h: 96 },
          },
          edges: {
            'wl-meta': 'M 180,150 L 180,106', 'wl-sm': 'M 160,286 L 160,360', 'sm-wl': 'M 200,360 L 200,286',
            'wl-db': 'M 310,218 C 352,218 352,668 310,668',
          },
        },
      },
      steps: [
        { ...step(1), focus: ['wl', 'sm'], end: 0.6, fx: [] },
        { ...step(2), focus: ['wl', 'meta'], end: 3.4, fx: [
          { t: 'packet', at: 0.3, edge: 'wl-meta', label: p('p_ask') },
          { t: 'packet', at: 1.6, edge: 'wl-meta', label: p('p_jwt'), reverse: true }, { t: 'set', at: 2.6, k: 'idt', v: 'ok', pop: true }] },
        { ...step(3), focus: ['wl', 'sm'], end: 2.0, fx: [
          { t: 'packet', at: 0.3, edge: 'wl-sm', label: 'jwt=…' }, { t: 'set', at: 1.3, k: 'aud', v: 'check' }] },
        { ...step(4), focus: ['sm'], end: 1.4, fx: [{ t: 'set', at: 0.4, k: 'aud', v: 'ok', pop: true }] },
        { ...step(5), focus: ['sm'], end: 2.2, fx: [
          { t: 'set', at: 0.2, k: 'ann', v: 'check' }, { t: 'set', at: 1.0, k: 'ann', v: 'ok', pop: true }, { t: 'set', at: 1.5, k: 'perm', v: 'ok', pop: true }] },
        { ...step(6), focus: ['sm', 'wl'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'sm-wl', label: p('p_token') }, { t: 'set', at: 1.3, k: 'tok', v: 'ok', pop: true }] },
        { ...step(7), focus: ['wl', 'sm'], end: 3.6, fx: [
          { t: 'packet', at: 0.3, edge: 'wl-sm', label: p('p_get') }, { t: 'set', at: 1.2, k: 'pol', v: 'ok', pop: true },
          { t: 'packet', at: 1.6, edge: 'sm-wl', label: p('p_secret'), kind: 'secret' }, { t: 'set', at: 2.6, k: 'sec', v: 'ok', pop: true }] },
        { ...step(8), focus: ['wl', 'db'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'wl-db', label: p('p_login') }, { t: 'set', at: 1.4, k: 'db', v: 'ok', pop: true }] },
      ],
    }
  }, [t])
  return <FlowPlayer spec={spec} />
}
