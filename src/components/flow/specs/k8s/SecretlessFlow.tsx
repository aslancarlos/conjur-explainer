import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Boxes, Database, Shield, Vault } from 'lucide-react'
import FlowPlayer, { type FlowLayout, type FlowSpec } from '../../FlowPlayer'

/**
 * Secretless Broker as a Kubernetes sidecar, from the Secrets Manager
 * Self-Hosted docs (scl_how_it_works, k8s-secretless-sidecar): the app
 * connects to a local socket with no credentials; Secretless authenticates to
 * the Follower (authn-k8s), fetches the database credentials, performs the
 * protocol handshake with the target and then streams the traffic. After a
 * rotation, new connections use the new secret with no restart.
 */
export default function SecretlessFlow() {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const p = (k: string) => t(`k8s_secretless.flow.${k}`)
    const step = (n: number) => ({ title: p(`s${n}_title`), desc: p(`s${n}_desc`) })
    const idle = t('idflow.st_idle')

    const wide: FlowLayout = {
      w: 980, h: 440,
      boxes: {
        app: { x: 16, y: 50, w: 180, h: 130 }, sl: { x: 320, y: 40, w: 220, h: 150 },
        db: { x: 760, y: 50, w: 204, h: 130 }, sm: { x: 320, y: 290, w: 220, h: 110 },
      },
      zones: [
        { d: 'k8s', x: 6, y: 28, w: 544, h: 180 },
        { d: 'idira', x: 310, y: 270, w: 240, h: 150 },
        { d: 'svc', x: 750, y: 28, w: 224, h: 164 },
      ],
      lanes: [{ x: 16, y: 20, text: p('lane_pod') }, { x: 320, y: 262, text: p('lane_follower') }, { x: 760, y: 20, text: p('lane_target') }],
      edges: { 'app-sl': 'M 196,115 L 320,115', 'sl-db': 'M 540,115 L 760,115', 'sl-sm': 'M 430,190 L 430,290' },
      labels: [
        { x: 258, y: 85, text: 'localhost:5432' },
        { x: 650, y: 150, text: 'TLS · 5432' },
        { x: 500, y: 240, text: 'authn-k8s · 443' },
      ],
    }

    const narrow: FlowLayout = {
      w: 360, h: 720, title: 14,
      boxes: {
        app: { x: 70, y: 30, w: 220, h: 120 }, sl: { x: 60, y: 200, w: 240, h: 150 },
        db: { x: 70, y: 410, w: 220, h: 120 }, sm: { x: 70, y: 580, w: 220, h: 110 },
      },
      zones: [
        { d: 'k8s', x: 40, y: 20, w: 280, h: 340 },
        { d: 'svc', x: 60, y: 400, w: 240, h: 140 },
        { d: 'idira', x: 60, y: 570, w: 240, h: 130 },
      ],
      edges: { 'app-sl': 'M 180,150 L 180,200', 'sl-db': 'M 180,350 L 180,410', 'sl-sm': 'M 300,275 C 350,275 350,635 290,635' },
    }

    return {
      id: 'k8s-secretless',
      ariaLabel: p('diagram_label'),
      initial: { creds: 'none', conn: 'idle', auth: 'idle', held: 'none', val: 'v1', sess: 'idle' },
      nodes: [
        { id: 'app', domain: 'k8s', Icon: Boxes, title: p('n_app'), sub: p('n_app_sub'), rows: [
          { label: p('r_creds'), value: p('st_none'), tone: 'ok' },
          { label: p('r_conn'), k: 'conn', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'open', text: t('idflow.st_connected'), tone: 'ok' }] },
        ] },
        { id: 'sl', domain: 'idira', Icon: Shield, title: 'Secretless Broker', sub: p('n_sl_sub'), rows: [
          { label: p('r_auth'), k: 'auth', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: t('idflow.st_check'), tone: 'warn' }, { v: 'ok', text: p('st_token'), tone: 'ok' }] },
          { label: p('r_held'), k: 'held', states: [{ v: 'none', text: t('idflow.st_none'), tone: 'muted' }, { v: 'v1', text: p('st_v1_mem'), tone: 'ok' }, { v: 'v2', text: p('st_v2_mem'), tone: 'ok' }] },
        ] },
        { id: 'sm', domain: 'idira', Icon: Vault, title: 'Secrets Manager', sub: p('n_sm_sub'), rows: [
          { label: p('r_value'), k: 'val', states: [{ v: 'v1', text: 'v1', tone: 'ok' }, { v: 'v2', text: p('st_rotated'), tone: 'ok' }] },
        ] },
        { id: 'db', domain: 'svc', Icon: Database, title: p('n_db'), sub: p('n_db_sub'), rows: [
          { label: p('r_sess'), k: 'sess', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_auth_ok'), tone: 'ok' }, { v: 'new', text: p('st_new_conn'), tone: 'ok' }] },
        ] },
      ],
      edgeKinds: { 'app-sl': 'access', 'sl-db': 'access', 'sl-sm': 'identity' },
      layouts: { wide, narrow },
      steps: [
        { ...step(1), focus: ['app', 'sl'], end: 2.0, fx: [
          { t: 'packet', at: 0.3, edge: 'app-sl', label: p('p_connect') }] },
        { ...step(2), focus: ['sl', 'sm'], end: 2.6, fx: [
          { t: 'set', at: 0.2, k: 'auth', v: 'check' },
          { t: 'packet', at: 0.4, edge: 'sl-sm', label: 'authn-k8s' }, { t: 'set', at: 1.6, k: 'auth', v: 'ok', pop: true }] },
        { ...step(3), focus: ['sl', 'sm'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'sl-sm', label: p('p_creds'), kind: 'secret', reverse: true },
          { t: 'set', at: 1.3, k: 'held', v: 'v1', pop: true }] },
        { ...step(4), focus: ['sl', 'db'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'sl-db', label: p('p_handshake') }, { t: 'set', at: 1.4, k: 'sess', v: 'ok', pop: true }] },
        { ...step(5), focus: ['app', 'sl', 'db'], end: 3.0, fx: [
          { t: 'set', at: 0.2, k: 'conn', v: 'open', pop: true },
          { t: 'packet', at: 0.4, edge: 'app-sl', label: 'SQL' }, { t: 'packet', at: 1.5, edge: 'sl-db', label: 'SQL' }] },
        { ...step(6), focus: ['sm', 'sl', 'db'], end: 3.8, fx: [
          { t: 'set', at: 0.2, k: 'val', v: 'v2', pop: true },
          { t: 'packet', at: 0.8, edge: 'sl-sm', label: 'v2', kind: 'secret', reverse: true }, { t: 'set', at: 1.8, k: 'held', v: 'v2', pop: true },
          { t: 'packet', at: 2.1, edge: 'sl-db', label: p('p_handshake') }, { t: 'set', at: 3.1, k: 'sess', v: 'new', pop: true }] },
        { ...step(7), focus: ['app', 'sl'], end: 0.8, fx: [] },
      ],
    }
  }, [t])
  return <FlowPlayer spec={spec} />
}
