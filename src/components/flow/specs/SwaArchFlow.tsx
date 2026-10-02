import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Boxes, Cloud, Globe, HardDrive, Network, Server, ShieldCheck, Workflow } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from '../FlowPlayer'

/**
 * Concepts / Secure Workload Access architecture (docs: ccl-swa-overview,
 * install-helm, helm-values, loadbalancer, node attestation, oidc, jwt, aws,
 * azure, gcp, cjr-authn-jwt-swa). Standard Agent-based flow: control plane in
 * Secrets Manager SaaS, SWA Server and Agents in your infrastructure, SVIDs via
 * the Workload API, mTLS, cloud federation and secret exchange.
 */
export default function SwaArchFlow() {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const p = (k: string) => t(`swaarch.flow.${k}`)
    const step = (n: number) => ({ title: p(`s${n}_title`), desc: p(`s${n}_desc`) })
    const pend = t('idflow.st_pending')
    const idle = t('idflow.st_idle')
    const check = t('idflow.st_check')
    return {
      id: 'swaarch',
      ariaLabel: p('diagram_label'),
      initial: {
        cfg: 'idle', inv: 'none', authn: 'idle', aud: 'idle', jwks: 'idle', aws: 'idle',
        att: 'idle', svid: 'idle', node: 'none', wlatt: 'none', vmnode: 'none',
        x509: 'none', jwt: 'none', sec: 'none', peer: 'none', cl: 'none',
      },
      nodes: [
        { id: 'sm', domain: 'idira', Icon: ShieldCheck, title: 'Secrets Manager SaaS', sub: p('n_sm_sub'), rows: [
          { label: 'config', k: 'cfg', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_served'), tone: 'ok' }] },
          { label: p('r_inventory'), k: 'inv', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_added'), tone: 'ok' }] },
          { label: 'authn-jwt', k: 'authn', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: check, tone: 'warn' }, { v: 'ok', text: t('idflow.st_valid'), tone: 'ok' }] },
          { label: 'audit', k: 'aud', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_logged'), tone: 'ok' }] },
        ] },
        { id: 'oidc', domain: 'idira', Icon: Globe, title: 'OIDC / JWKS', sub: p('n_oidc_sub'), rows: [
          { label: 'jwks', k: 'jwks', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_published'), tone: 'ok' }] },
        ] },
        { id: 'cloud', domain: 'svc', Icon: Cloud, title: p('n_cloud'), sub: p('n_cloud_sub'), rows: [
          { label: 'AWS STS', k: 'aws', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_tempcreds'), tone: 'ok' }] },
          { label: 'Azure Entra', value: p('st_federated') },
          { label: 'GCP STS', value: p('st_federated') },
        ] },
        { id: 'server', domain: 'idira', Icon: Server, title: 'SWA Server', sub: 'Helm · swa-system', rows: [
          { label: p('r_attest'), k: 'att', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: check, tone: 'warn' }, { v: 'ok', text: p('st_nodeok'), tone: 'ok' }] },
          { label: 'SVIDs', k: 'svid', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_issued'), tone: 'ok' }] },
          { label: p('r_keys'), value: p('st_onserver') },
        ] },
        { id: 'lb', domain: 'neutral', Icon: Network, title: 'Load balancer', sub: 'Service · TCP 8443' },
        { id: 'agent', domain: 'idira', Icon: Boxes, title: 'SWA Agent', sub: 'DaemonSet · k8s_psat', rows: [
          { label: p('r_node'), k: 'node', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_attested'), tone: 'ok' }] },
          { label: 'workload', k: 'wlatt', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: 'ns + sa ok', tone: 'ok' }] },
        ] },
        { id: 'vm', domain: 'idira', Icon: HardDrive, title: 'SWA Agent (VM)', sub: 'x509pop · AWS IID', rows: [
          { label: p('r_node'), k: 'vmnode', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_attested'), tone: 'ok' }] },
          { label: 'workload', value: 'unix' },
        ] },
        { id: 'wl', domain: 'cp', Icon: Workflow, title: 'orders-api', sub: p('n_wl_sub'), rows: [
          { label: 'X.509-SVID', k: 'x509', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: t('idflow.st_valid'), tone: 'ok' }, { v: 'new', text: p('st_renewed'), tone: 'ok' }] },
          { label: 'JWT-SVID', k: 'jwt', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_issued'), tone: 'ok' }] },
          { label: 'secret', k: 'sec', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: t('idflow.st_delivered'), tone: 'ok' }] },
        ] },
        { id: 'wl2', domain: 'cp', Icon: Workflow, title: 'payments-api', sub: p('n_wl_sub'), rows: [
          { label: 'peer', k: 'peer', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: 'mTLS ok', tone: 'ok' }] },
          { label: p('r_cloud'), k: 'cl', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_tempcreds'), tone: 'ok' }] },
        ] },
      ],
      edgeKinds: {
        'srv-sm': 'control', 'sm-oidc': 'control', 'agent-srv': 'identity', 'lb-srv': 'identity', 'vm-lb': 'identity',
        'agent-wl': 'identity', 'agent-wl2': 'identity', 'wl-wl2': 'identity', 'wl2-cloud': 'identity',
        'cloud-oidc': 'identity', 'wl-sm': 'identity',
      },
      layouts: {
        wide: {
          w: 980, h: 870,
          boxes: {
            sm: { x: 16, y: 44, w: 270, h: 146 }, oidc: { x: 330, y: 44, w: 210, h: 96 },
            cloud: { x: 780, y: 44, w: 186, h: 130 },
            server: { x: 280, y: 270, w: 220, h: 126 }, lb: { x: 560, y: 280, w: 176, h: 76 },
            agent: { x: 280, y: 480, w: 220, h: 116 }, vm: { x: 768, y: 500, w: 196, h: 116 },
            wl: { x: 60, y: 700, w: 230, h: 126 }, wl2: { x: 430, y: 700, w: 230, h: 116 },
          },
          zones: [
            { d: 'idira', x: 6, y: 32, w: 744, h: 168 }, { d: 'svc', x: 770, y: 32, w: 204, h: 154 },
            { d: 'k8s', x: 6, y: 254, w: 744, h: 590 }, { d: 'neutral', x: 758, y: 488, w: 216, h: 140 },
          ],
          lanes: [
            { x: 16, y: 26, text: p('lane_idira') }, { x: 780, y: 26, text: p('lane_cloud') },
            { x: 16, y: 248, text: p('lane_k8s') }, { x: 768, y: 482, text: p('lane_vm') },
          ],
          edges: {
            'srv-sm': 'M 330,270 C 330,225 150,235 150,190',
            'sm-oidc': 'M 286,92 L 330,92',
            'agent-srv': 'M 390,480 L 390,396',
            'lb-srv': 'M 560,318 L 500,318',
            'vm-lb': 'M 768,558 C 690,558 648,440 648,356',
            'agent-wl': 'M 330,596 C 330,650 175,650 175,700',
            'agent-wl2': 'M 450,596 C 450,650 545,650 545,700',
            'wl-wl2': 'M 290,760 L 430,760',
            'wl2-cloud': 'M 660,740 C 752,740 752,300 873,174',
            'cloud-oidc': 'M 820,44 C 820,10 440,10 435,44',
            'wl-sm': 'M 60,740 C 10,740 10,200 60,190',
          },
          labels: [
            { x: 240, y: 230, text: 'HTTPS', edge: 'srv-sm' },
            { x: 390, y: 438, text: 'TCP 8443', edge: 'agent-srv' },
            { x: 530, y: 300, text: '8443', edge: 'lb-srv' },
            { x: 700, y: 470, text: 'TCP 8443', edge: 'vm-lb' },
            { x: 230, y: 652, text: 'Workload API (UDS)', edge: 'agent-wl' },
            { x: 520, y: 652, text: 'UDS', edge: 'agent-wl2' },
            { x: 360, y: 742, text: 'mTLS', edge: 'wl-wl2' },
            { x: 748, y: 420, text: 'OIDC federation', edge: 'wl2-cloud' },
            { x: 630, y: 16, text: 'JWKS · HTTPS', edge: 'cloud-oidc' },
            { x: 122, y: 470, text: 'JWT-SVID · authn-jwt', edge: 'wl-sm' },
          ],
        },
        narrow: {
          w: 360, h: 1610, title: 14,
          boxes: {
            sm: { x: 50, y: 30, w: 260, h: 146 }, oidc: { x: 50, y: 230, w: 260, h: 96 },
            lb: { x: 70, y: 380, w: 220, h: 76 }, server: { x: 50, y: 510, w: 260, h: 126 },
            agent: { x: 50, y: 690, w: 260, h: 116 }, wl: { x: 50, y: 870, w: 260, h: 126 },
            wl2: { x: 50, y: 1060, w: 260, h: 116 }, cloud: { x: 50, y: 1250, w: 260, h: 130 },
            vm: { x: 50, y: 1460, w: 260, h: 116 },
          },
          zones: [
            { d: 'idira', x: 40, y: 20, w: 280, h: 316 }, { d: 'k8s', x: 40, y: 370, w: 280, h: 816 },
            { d: 'svc', x: 40, y: 1240, w: 280, h: 150 }, { d: 'neutral', x: 40, y: 1450, w: 280, h: 136 },
          ],
          lanes: [
            { x: 16, y: 14, text: p('lane_idira') }, { x: 16, y: 364, text: p('lane_k8s') },
            { x: 16, y: 1234, text: p('lane_cloud') }, { x: 16, y: 1444, text: p('lane_vm') },
          ],
          edges: {
            'sm-oidc': 'M 180,176 L 180,230',
            'lb-srv': 'M 180,456 L 180,510',
            'agent-srv': 'M 180,690 L 180,636',
            'srv-sm': 'M 310,570 C 338,570 338,100 310,100',
            'agent-wl': 'M 180,806 L 180,870',
            'wl-wl2': 'M 180,996 L 180,1060',
            'wl2-cloud': 'M 180,1176 L 180,1250',
            'cloud-oidc': 'M 310,1310 C 356,1310 356,278 310,278',
            'wl-sm': 'M 50,930 C 22,930 22,130 50,130',
            'vm-lb': 'M 50,1518 C 8,1518 8,418 70,418',
          },
          labels: [
            { x: 220, y: 483, text: '8443', edge: 'lb-srv' },
            { x: 240, y: 663, text: 'TCP 8443', edge: 'agent-srv' },
            { x: 100, y: 663, text: 'JWT-SVID · authn-jwt', edge: 'wl-sm' },
            { x: 330, y: 470, text: 'HTTPS', edge: 'srv-sm' },
            { x: 252, y: 838, text: 'Workload API (UDS)', edge: 'agent-wl' },
            { x: 220, y: 1028, text: 'mTLS', edge: 'wl-wl2' },
            { x: 250, y: 1213, text: 'OIDC federation', edge: 'wl2-cloud' },
            { x: 300, y: 353, text: 'JWKS · HTTPS', edge: 'cloud-oidc' },
            { x: 64, y: 1218, text: 'TCP 8443', edge: 'vm-lb' },
          ],
        },
      },
      steps: [
        { ...step(1), focus: ['sm', 'server', 'agent'], end: 0.6, fx: [] },
        { ...step(2), focus: ['sm', 'server'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'srv-sm', label: 'config', reverse: true }, { t: 'set', at: 1.3, k: 'cfg', v: 'ok', pop: true }] },
        { ...step(3), focus: ['sm', 'oidc'], end: 2.0, fx: [
          { t: 'packet', at: 0.3, edge: 'sm-oidc', label: 'JWKS' }, { t: 'set', at: 1.3, k: 'jwks', v: 'ok', pop: true }] },
        { ...step(4), focus: ['agent', 'server'], end: 2.6, fx: [
          { t: 'packet', at: 0.3, edge: 'agent-srv', label: 'PSAT' }, { t: 'set', at: 1.2, k: 'att', v: 'check' },
          { t: 'set', at: 1.9, k: 'att', v: 'ok', pop: true }, { t: 'set', at: 2.0, k: 'node', v: 'ok', pop: true }] },
        { ...step(5), focus: ['vm', 'lb', 'server'], end: 3.2, fx: [
          { t: 'packet', at: 0.3, edge: 'vm-lb', label: 'x509pop' }, { t: 'packet', at: 1.5, edge: 'lb-srv', label: 'x509pop' },
          { t: 'set', at: 2.6, k: 'vmnode', v: 'ok', pop: true }] },
        { ...step(6), focus: ['wl', 'agent'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'agent-wl', label: p('p_fetch'), reverse: true }, { t: 'set', at: 1.3, k: 'wlatt', v: 'ok', pop: true }] },
        { ...step(7), focus: ['agent', 'server', 'wl', 'sm'], end: 3.6, fx: [
          { t: 'packet', at: 0.2, edge: 'agent-srv', label: 'SVID', reverse: true }, { t: 'set', at: 1.1, k: 'svid', v: 'ok', pop: true },
          { t: 'packet', at: 1.3, edge: 'agent-wl', label: 'X.509 + JWT' },
          { t: 'set', at: 2.3, k: 'x509', v: 'ok', pop: true }, { t: 'set', at: 2.4, k: 'jwt', v: 'ok', pop: true },
          { t: 'packet', at: 2.4, edge: 'srv-sm', label: p('p_inventory') }, { t: 'set', at: 3.3, k: 'inv', v: 'ok', pop: true }] },
        { ...step(8), focus: ['wl', 'wl2'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'wl-wl2', label: 'X.509-SVID' }, { t: 'set', at: 1.3, k: 'peer', v: 'ok', pop: true }] },
        { ...step(9), focus: ['wl2', 'cloud', 'oidc'], end: 4.4, fx: [
          { t: 'packet', at: 0.2, edge: 'agent-wl2', label: 'JWT-SVID' },
          { t: 'packet', at: 1.3, edge: 'wl2-cloud', label: 'JWT-SVID' },
          { t: 'packet', at: 2.4, edge: 'cloud-oidc', label: 'GET jwks' }, { t: 'set', at: 3.4, k: 'aws', v: 'ok', pop: true },
          { t: 'set', at: 3.6, k: 'cl', v: 'ok', pop: true }] },
        { ...step(10), focus: ['wl', 'sm'], end: 3.6, fx: [
          { t: 'packet', at: 0.3, edge: 'wl-sm', label: 'JWT-SVID' }, { t: 'set', at: 1.2, k: 'authn', v: 'check' },
          { t: 'set', at: 1.8, k: 'authn', v: 'ok', pop: true },
          { t: 'packet', at: 2.0, edge: 'wl-sm', label: 'secret', reverse: true, kind: 'secret' }, { t: 'set', at: 3.0, k: 'sec', v: 'ok', pop: true }] },
        { ...step(11), focus: ['wl', 'agent', 'sm'], end: 1.8, fx: [
          { t: 'set', at: 0.3, k: 'x509', v: 'new', pop: true }, { t: 'set', at: 0.9, k: 'aud', v: 'ok', pop: true }] },
      ],
    }
  }, [t])
  return <FlowPlayer spec={spec} />
}
