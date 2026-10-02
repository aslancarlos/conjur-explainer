import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Container, Database, KeyRound, Server, Vault } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from '../../FlowPlayer'

/**
 * Native Kubernetes authenticator (authn-k8s, certificate-based, Self-Hosted):
 * the authenticator client sends a CSR, the in-cluster Follower verifies the
 * pod against the Kubernetes API and injects the client certificate into the
 * pod through that API (out of band), the client opens mutual TLS and gets a
 * short-lived access token on a shared volume, the app fetches its secret.
 * Source: secrets-manager-sh k8s-k8s-authn, k8s-architecture, k8s-admin-lp.
 */
export default function K8sAuthnFlow() {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const p = (k: string) => t(`authn_k8s.flow.${k}`)
    const step = (n: number) => ({ title: p(`s${n}_title`), desc: p(`s${n}_desc`) })
    const pend = p('st_pending')
    const idle = p('st_idle')
    return {
      id: 'authnk8s',
      ariaLabel: p('diagram_label'),
      initial: { ca: 'none', hostid: 'idle', csr: 'none', mtls: 'none', podchk: 'idle', inject: 'idle', cert: 'none', tok: 'none', sec: 'none', db: 'idle' },
      nodes: [
        { id: 'leader', domain: 'idira', Icon: Server, title: p('n_leader'), sub: p('n_leader_sub') },
        { id: 'fol', domain: 'idira', Icon: Vault, title: p('n_fol'), sub: 'authn-k8s/dev-cluster', rows: [
          { label: 'CA', k: 'ca', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: 'ca/cert · ca/key', tone: 'ok' }] },
          { label: p('r_hostid'), k: 'hostid', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: p('st_check'), tone: 'warn' }, { v: 'ok', text: p('st_allowed'), tone: 'ok' }] },
        ] },
        { id: 'api', domain: 'k8s', Icon: Container, title: p('n_api'), sub: p('n_api_sub'), rows: [
          { label: p('r_podchk'), k: 'podchk', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_verified'), tone: 'ok' }] },
          { label: p('r_inject'), k: 'inject', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_delivered'), tone: 'ok' }] },
        ] },
        { id: 'client', domain: 'k8s', Icon: KeyRound, title: p('n_client'), sub: p('n_client_sub'), rows: [
          { label: 'CSR', k: 'csr', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_sent'), tone: 'ok' }] },
          { label: 'mTLS', k: 'mtls', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_established'), tone: 'ok' }] },
        ] },
        { id: 'pod', domain: 'k8s', Icon: Box, title: p('n_pod'), sub: p('n_pod_sub'), rows: [
          { label: p('r_cert'), k: 'cert', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_injected'), tone: 'ok' }, { v: 'new', text: p('st_renewed'), tone: 'ok' }] },
          { label: p('r_token'), k: 'tok', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_memory'), tone: 'ok' }] },
          { label: 'secret', k: 'sec', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_fetched'), tone: 'ok' }] },
        ] },
        { id: 'db', domain: 'svc', Icon: Database, title: p('n_db'), sub: p('n_db_sub'), rows: [
          { label: p('r_session'), k: 'db', states: [{ v: 'idle', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_connected'), tone: 'ok' }] },
        ] },
      ],
      edgeKinds: { 'ldr-fol': 'control', 'cli-fol': 'identity', 'fol-api': 'control', 'api-pod': 'identity', 'cli-pod': 'access', 'pod-fol': 'secret', 'pod-db': 'access' },
      layouts: {
        wide: {
          w: 980, h: 500,
          boxes: {
            leader: { x: 16, y: 56, w: 190, h: 70 },
            fol: { x: 330, y: 40, w: 250, h: 120 }, api: { x: 690, y: 40, w: 270, h: 120 },
            client: { x: 330, y: 300, w: 250, h: 120 }, pod: { x: 690, y: 286, w: 270, h: 140 },
            db: { x: 16, y: 312, w: 190, h: 96 },
          },
          zones: [
            { d: 'idira', x: 6, y: 44, w: 210, h: 94 },
            { d: 'k8s', x: 318, y: 28, w: 654, h: 410 },
            { d: 'svc', x: 6, y: 300, w: 210, h: 120 },
          ],
          lanes: [{ x: 16, y: 34, text: p('lane_outside') }, { x: 330, y: 20, text: p('lane_cluster') }],
          edges: {
            'ldr-fol': 'M 206,91 L 330,91',
            'cli-fol': 'M 420,300 L 420,160',
            'fol-api': 'M 580,100 L 690,100',
            'api-pod': 'M 825,160 L 825,286',
            'cli-pod': 'M 580,372 L 690,372',
            'pod-fol': 'M 740,286 C 700,230 600,200 540,160',
            'pod-db': 'M 690,410 C 520,476 300,476 111,408',
          },
          labels: [
            { x: 268, y: 74, text: p('l_replication'), edge: 'ldr-fol' },
            { x: 420, y: 230, text: 'CSR · mTLS', edge: 'cli-fol' },
            { x: 635, y: 76, text: 'Kubernetes API', edge: 'fol-api' },
            { x: 825, y: 222, text: 'inject_client_cert', edge: 'api-pod' },
            { x: 635, y: 352, text: p('l_shared'), edge: 'cli-pod' },
            { x: 640, y: 214, text: 'HTTPS · token', edge: 'pod-fol' },
            { x: 400, y: 468, text: p('l_connect'), edge: 'pod-db' },
          ],
        },
        narrow: {
          w: 360, h: 1000, title: 14,
          boxes: {
            leader: { x: 70, y: 30, w: 220, h: 70 }, fol: { x: 50, y: 150, w: 260, h: 120 },
            api: { x: 50, y: 330, w: 260, h: 120 }, client: { x: 50, y: 510, w: 260, h: 120 },
            pod: { x: 50, y: 680, w: 260, h: 140 }, db: { x: 70, y: 880, w: 220, h: 96 },
          },
          zones: [{ d: 'k8s', x: 40, y: 140, w: 280, h: 690 }],
          edges: {
            'ldr-fol': 'M 180,100 L 180,150',
            'cli-fol': 'M 50,560 C 14,560 14,200 50,200',
            'fol-api': 'M 180,270 L 180,330',
            'api-pod': 'M 310,390 C 350,390 350,740 310,740',
            'cli-pod': 'M 180,630 L 180,680',
            'pod-fol': 'M 310,700 C 340,700 340,230 310,230',
            'pod-db': 'M 180,820 L 180,880',
          },
        },
      },
      steps: [
        { ...step(1), focus: ['client', 'pod', 'fol'], end: 0.6, fx: [] },
        { ...step(2), focus: ['fol', 'leader'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'ldr-fol', label: 'policy · CA' }, { t: 'set', at: 1.3, k: 'ca', v: 'ok', pop: true }] },
        { ...step(3), focus: ['client', 'fol'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'cli-fol', label: 'CSR' }, { t: 'set', at: 1.2, k: 'csr', v: 'ok' }, { t: 'set', at: 1.6, k: 'hostid', v: 'check' }] },
        { ...step(4), focus: ['fol', 'api'], end: 2.6, fx: [
          { t: 'packet', at: 0.3, edge: 'fol-api', label: p('p_verify') }, { t: 'set', at: 1.3, k: 'podchk', v: 'ok', pop: true }, { t: 'set', at: 1.8, k: 'hostid', v: 'ok', pop: true }] },
        { ...step(5), focus: ['api', 'pod'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'api-pod', label: p('p_cert') }, { t: 'set', at: 1.2, k: 'inject', v: 'ok' }, { t: 'set', at: 1.4, k: 'cert', v: 'ok', pop: true }] },
        { ...step(6), focus: ['client', 'fol', 'pod'], end: 3.8, fx: [
          { t: 'packet', at: 0.3, edge: 'cli-fol', label: 'mTLS' }, { t: 'set', at: 1.2, k: 'mtls', v: 'ok', pop: true },
          { t: 'packet', at: 1.5, edge: 'cli-fol', label: p('p_token'), reverse: true },
          { t: 'packet', at: 2.6, edge: 'cli-pod', label: p('p_token') }, { t: 'set', at: 3.4, k: 'tok', v: 'ok', pop: true }] },
        { ...step(7), focus: ['pod', 'fol', 'db'], end: 4.0, fx: [
          { t: 'packet', at: 0.3, edge: 'pod-fol', label: 'GET secret' },
          { t: 'packet', at: 1.4, edge: 'pod-fol', label: 'secret', reverse: true }, { t: 'set', at: 2.3, k: 'sec', v: 'ok', pop: true },
          { t: 'packet', at: 2.6, edge: 'pod-db', label: p('l_connect') }, { t: 'set', at: 3.6, k: 'db', v: 'ok', pop: true }] },
        { ...step(8), focus: ['api', 'pod'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'api-pod', label: p('p_newcert') }, { t: 'set', at: 1.4, k: 'cert', v: 'new', pop: true }] },
        { ...step(9), focus: ['fol', 'api', 'client'], end: 0.8, fx: [] },
      ],
    }
  }, [t])
  return <FlowPlayer spec={spec} />
}
