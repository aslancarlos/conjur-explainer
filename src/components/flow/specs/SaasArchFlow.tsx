import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Building2, Cloud, FileText, Fingerprint, Network, Radio, RefreshCw, Router, Server, ServerCog, Vault } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from '../FlowPlayer'

/**
 * Concepts: IDIRA Secrets Manager SaaS reference architecture (docs:
 * cl_conjurcloudoverview, edge/ccl-edge-ovw, ccl-edge-install,
 * ccl-edge-support, ccl-edge-siem-int, cl_addaccount).
 *   ISPSS cloud: Identity (SSO/MFA, users, central audit), the Secrets Manager
 *   SaaS tenant, Privilege Cloud (Safes, CPM, Conjur Sync user).
 *   Customer network: PAM Self-Hosted + Vault Synchronizer, explicit forward
 *   proxy, two Edges (persistent cache) behind a Layer 4 load balancer,
 *   workloads, SIEM. Outbound only: 443 to the tenant and the AWS IoT endpoint.
 *   A cloud workload talks to the tenant directly.
 */
export default function SaasArchFlow() {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const p = (k: string) => t(`saasarch.flow.${k}`)
    const step = (n: number) => ({ title: p(`s${n}_title`), desc: p(`s${n}_desc`) })
    const pend = p('st_pending')
    const edgeRows = (n: 1 | 2) => [
      { label: 'sync', k: `e${n}sync`, states: [
        { v: 'idle', text: pend, tone: 'muted' as const }, { v: 'on', text: p('st_online'), tone: 'ok' as const }, { v: 'off', text: p('st_offline'), tone: 'warn' as const }] },
      { label: 'cache', k: `e${n}cache`, states: [
        { v: 'empty', text: p('st_empty'), tone: 'muted' as const }, { v: 'ok', text: p('st_replicated'), tone: 'ok' as const }] },
      { label: 'authn', k: `e${n}authn`, states: [
        { v: 'idle', text: p('st_idle'), tone: 'muted' as const }, { v: 'ok', text: p('st_local'), tone: 'ok' as const }] },
    ]
    return {
      id: 'saasarch',
      ariaLabel: p('diagram_label'),
      initial: {
        idLogin: 'idle', tsrc: 'none', tedges: 'none', tfwd: 'idle', pcCpm: 'v1', vsLink: 'idle',
        e1sync: 'idle', e1cache: 'empty', e1authn: 'idle', e2sync: 'idle', e2cache: 'empty', e2authn: 'idle',
        wlsec: 'none', siem: 'idle', cwsec: 'none',
      },
      nodes: [
        { id: 'identity', domain: 'idira', Icon: Fingerprint, title: 'Identity', sub: p('n_identity_sub'), rows: [
          { label: 'login', k: 'idLogin', states: [{ v: 'idle', text: p('st_idle'), tone: 'muted' }, { v: 'ok', text: 'SSO + MFA', tone: 'ok' }] },
          { label: 'audit', value: p('st_central') },
        ] },
        { id: 'tenant', domain: 'idira', Icon: Vault, title: 'Secrets Manager SaaS', sub: '*.secretsmgr.cyberark.cloud', rows: [
          { label: p('r_region'), value: 'AWS' },
          { label: p('r_sources'), k: 'tsrc', states: [
            { v: 'none', text: pend, tone: 'muted' }, { v: 'pc', text: 'Privilege Cloud', tone: 'ok' }, { v: 'both', text: p('st_both_sources'), tone: 'ok' }] },
          { label: 'Edges', k: 'tedges', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'two', text: p('st_two_online'), tone: 'ok' }, { v: 'lost', text: p('st_unreachable'), tone: 'warn' }] },
          { label: p('r_forwarded'), k: 'tfwd', states: [{ v: 'idle', text: p('st_idle'), tone: 'muted' }, { v: 'ok', text: p('st_dyn_cert'), tone: 'ok' }] },
          { label: 'audit', value: 'ISPSS' },
        ] },
        { id: 'pcloud', domain: 'idira', Icon: Building2, title: 'Privilege Cloud', sub: 'Safes · CPM · Conjur Sync', rows: [
          { label: 'CPM', k: 'pcCpm', states: [{ v: 'v1', text: 'v1', tone: 'muted' }, { v: 'v2', text: p('st_rotated'), tone: 'ok' }] },
          { label: 'Safe', value: p('st_synced_safe') },
        ] },
        { id: 'cloudwl', domain: 'svc', Icon: Cloud, title: p('n_cloudwl'), sub: p('n_cloudwl_sub'), rows: [
          { label: 'secret', k: 'cwsec', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_received'), tone: 'ok' }] },
        ] },
        { id: 'iot', domain: 'neutral', Icon: Radio, title: 'AWS IoT endpoint', sub: '*.iot.<region>.amazonaws.com' },
        { id: 'proxy', domain: 'neutral', Icon: Router, title: p('n_proxy'), sub: p('n_proxy_sub') },
        { id: 'vsync', domain: 'idira', Icon: RefreshCw, title: 'Vault Synchronizer', sub: p('n_vsync_sub'), rows: [
          { label: 'link', k: 'vsLink', states: [{ v: 'idle', text: p('st_idle'), tone: 'muted' }, { v: 'ok', text: 'mTLS', tone: 'ok' }] },
        ] },
        { id: 'pam', domain: 'idira', Icon: ServerCog, title: 'PAM Self-Hosted', sub: 'Safes · CPM · ConjurSync' },
        { id: 'edge1', domain: 'idira', Icon: Server, title: 'Edge 1', sub: p('n_edge_sub'), rows: edgeRows(1) },
        { id: 'edge2', domain: 'idira', Icon: Server, title: 'Edge 2', sub: p('n_edge_sub'), rows: edgeRows(2) },
        { id: 'siem', domain: 'neutral', Icon: FileText, title: 'SIEM', sub: 'audit.json · edge.log', rows: [
          { label: 'audit', k: 'siem', states: [{ v: 'idle', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_received'), tone: 'ok' }] },
        ] },
        { id: 'lb', domain: 'neutral', Icon: Network, title: p('n_lb'), sub: 'health /health · 443 | 444' },
        { id: 'wl', domain: 'cp', Icon: Server, title: p('n_wl'), sub: 'API key · JWT · GCP · cert · Azure', rows: [
          { label: 'secret', k: 'wlsec', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_received'), tone: 'ok' }] },
        ] },
      ],
      edgeKinds: {
        'id-t': 'identity', 'pc-t': 'secret', 'pam-vs': 'secret', 'vs-t': 'secret', 'cw-t': 'identity',
        'px-t': 'secret', 'px-iot': 'control', 'e1-px': 'secret', 'e2-px': 'secret',
        'wl-lb': 'identity', 'lb-e1': 'identity', 'lb-e2': 'identity', 'e1-siem': 'control',
      },
      layouts: {
        wide: {
          w: 980, h: 780,
          boxes: {
            identity: { x: 16, y: 50, w: 180, h: 112 }, tenant: { x: 330, y: 44, w: 250, h: 230 },
            pcloud: { x: 714, y: 50, w: 250, h: 112 }, cloudwl: { x: 714, y: 200, w: 250, h: 92 },
            iot: { x: 16, y: 200, w: 210, h: 80 },
            proxy: { x: 330, y: 340, w: 220, h: 84 }, vsync: { x: 714, y: 340, w: 250, h: 92 },
            edge1: { x: 260, y: 480, w: 200, h: 126 }, edge2: { x: 480, y: 480, w: 200, h: 126 },
            pam: { x: 734, y: 488, w: 230, h: 80 }, siem: { x: 16, y: 640, w: 190, h: 92 },
            lb: { x: 360, y: 660, w: 220, h: 84 }, wl: { x: 700, y: 652, w: 264, h: 100 },
          },
          zones: [
            { d: 'idira', x: 6, y: 40, w: 200, h: 132 }, { d: 'idira', x: 320, y: 34, w: 270, h: 250 },
            { d: 'idira', x: 704, y: 40, w: 270, h: 132 }, { d: 'svc', x: 704, y: 190, w: 270, h: 112 },
            { d: 'neutral', x: 6, y: 312, w: 968, h: 460 },
          ],
          lanes: [{ x: 16, y: 22, text: p('lane_cloud') }, { x: 16, y: 334, text: p('lane_customer') }],
          edges: {
            'id-t': 'M 196,106 L 330,106', 'pc-t': 'M 714,106 L 580,106', 'cw-t': 'M 714,246 L 580,246',
            'vs-t': 'M 714,386 C 600,386 560,330 560,274', 'pam-vs': 'M 849,488 L 849,432',
            'px-t': 'M 440,340 L 440,274', 'px-iot': 'M 330,360 L 280,360 L 280,240 L 226,240',
            'e1-px': 'M 360,480 C 360,452 400,452 400,424', 'e2-px': 'M 580,480 C 580,452 500,452 500,424',
            'wl-lb': 'M 700,702 L 580,702',
            'lb-e1': 'M 420,660 C 420,634 360,634 360,606', 'lb-e2': 'M 520,660 C 520,634 580,634 580,606',
            'e1-siem': 'M 260,560 L 111,560 L 111,640',
          },
          // Ports and protocols (docs: ccl-edge-support firewall rules, ccl-edge-install
          // load balancing / proxy, cl_conjurcloudoverview integration architecture)
          labels: [
            { x: 263, y: 106, text: 'HTTPS', edge: 'id-t' },
            { x: 647, y: 106, text: 'ISPSS sync', edge: 'pc-t' },
            { x: 647, y: 246, text: 'HTTPS 443', edge: 'cw-t' },
            { x: 624, y: 372, text: 'HTTPS 443 · mTLS', edge: 'vs-t' },
            { x: 849, y: 460, text: 'LOB user', edge: 'pam-vs' },
            { x: 440, y: 307, text: 'HTTPS 443 outbound', edge: 'px-t' },
            { x: 275, y: 300, text: '443 outbound', edge: 'px-iot' },
            { x: 372, y: 452, text: '443 via proxy', edge: 'e1-px' },
            { x: 548, y: 452, text: '443 via proxy', edge: 'e2-px' },
            { x: 380, y: 633, text: 'HTTPS 443', edge: 'lb-e1' },
            { x: 560, y: 633, text: 'HTTPS 443', edge: 'lb-e2' },
            { x: 640, y: 702, text: 'HTTPS 443', edge: 'wl-lb' },
            { x: 185, y: 560, text: 'forwarder', edge: 'e1-siem' },
          ],
        },
        narrow: {
          w: 360, h: 1856, title: 14,
          boxes: {
            identity: { x: 70, y: 40, w: 220, h: 112 }, pcloud: { x: 70, y: 196, w: 220, h: 112 },
            tenant: { x: 50, y: 356, w: 260, h: 230 }, cloudwl: { x: 70, y: 630, w: 220, h: 92 },
            iot: { x: 70, y: 760, w: 220, h: 80 },
            vsync: { x: 70, y: 900, w: 220, h: 92 }, pam: { x: 70, y: 1036, w: 220, h: 80 },
            proxy: { x: 70, y: 1160, w: 220, h: 84 },
            edge1: { x: 30, y: 1290, w: 145, h: 126 }, edge2: { x: 190, y: 1290, w: 145, h: 126 },
            lb: { x: 70, y: 1470, w: 220, h: 84 }, wl: { x: 50, y: 1600, w: 260, h: 100 },
            siem: { x: 70, y: 1750, w: 220, h: 92 },
          },
          zones: [
            { d: 'idira', x: 60, y: 30, w: 240, h: 132 }, { d: 'idira', x: 60, y: 186, w: 240, h: 132 },
            { d: 'idira', x: 40, y: 346, w: 280, h: 250 }, { d: 'svc', x: 60, y: 620, w: 240, h: 112 },
            { d: 'neutral', x: 4, y: 880, w: 352, h: 970 },
          ],
          lanes: [{ x: 16, y: 20, text: p('lane_cloud') }, { x: 16, y: 872, text: p('lane_customer') }],
          edges: {
            'id-t': 'M 290,96 L 342,96 L 342,410 L 310,410', 'pc-t': 'M 180,308 L 180,356', 'cw-t': 'M 180,630 L 180,586',
            'vs-t': 'M 70,946 L 20,946 L 20,560 L 50,560', 'pam-vs': 'M 180,1036 L 180,992',
            'px-t': 'M 290,1202 L 350,1202 L 350,520 L 310,520', 'px-iot': 'M 70,1202 L 36,1202 L 36,800 L 70,800',
            'e1-px': 'M 102,1290 C 102,1266 140,1266 140,1244', 'e2-px': 'M 262,1290 C 262,1266 220,1266 220,1244',
            'lb-e1': 'M 140,1470 C 140,1442 102,1442 102,1416', 'lb-e2': 'M 220,1470 C 220,1442 262,1442 262,1416',
            'wl-lb': 'M 180,1600 L 180,1554',
            'e1-siem': 'M 30,1354 L 14,1354 L 14,1796 L 70,1796',
          },
          labels: [
            { x: 310, y: 170, text: 'HTTPS', edge: 'id-t' },
            { x: 180, y: 332, text: 'ISPSS sync', edge: 'pc-t' },
            { x: 180, y: 608, text: 'HTTPS 443', edge: 'cw-t' },
            { x: 70, y: 608, text: 'HTTPS 443 · mTLS', edge: 'vs-t' },
            { x: 180, y: 1014, text: 'LOB user', edge: 'pam-vs' },
            { x: 280, y: 1138, text: 'HTTPS 443 outbound', edge: 'px-t' },
            { x: 80, y: 1138, text: '443 outbound', edge: 'px-iot' },
            { x: 110, y: 1267, text: '443 via proxy', edge: 'e1-px' },
            { x: 250, y: 1267, text: '443 via proxy', edge: 'e2-px' },
            { x: 115, y: 1443, text: 'HTTPS 443', edge: 'lb-e1' },
            { x: 245, y: 1443, text: 'HTTPS 443', edge: 'lb-e2' },
            { x: 180, y: 1577, text: 'HTTPS 443', edge: 'wl-lb' },
            { x: 60, y: 1725, text: 'forwarder', edge: 'e1-siem' },
          ],
        },
      },
      steps: [
        { ...step(1), focus: ['identity', 'tenant', 'pcloud', 'edge1', 'edge2'], end: 0.6, fx: [] },
        { ...step(2), focus: ['identity', 'tenant'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'id-t', label: 'SSO + MFA' }, { t: 'set', at: 1.3, k: 'idLogin', v: 'ok', pop: true }] },
        { ...step(3), focus: ['pcloud', 'tenant'], end: 3.8, fx: [
          { t: 'packet', at: 0.3, edge: 'pc-t', label: p('p_safe_sync') }, { t: 'set', at: 1.3, k: 'tsrc', v: 'pc', pop: true },
          { t: 'set', at: 1.9, k: 'pcCpm', v: 'v2', pop: true },
          { t: 'packet', at: 2.3, edge: 'pc-t', label: p('p_rotated') }] },
        { ...step(4), focus: ['pam', 'vsync', 'tenant'], end: 3.4, fx: [
          { t: 'packet', at: 0.3, edge: 'pam-vs', label: 'ConjurSync' }, { t: 'set', at: 1.2, k: 'vsLink', v: 'ok', pop: true },
          { t: 'packet', at: 1.6, edge: 'vs-t', label: 'API key + mTLS' }, { t: 'set', at: 2.7, k: 'tsrc', v: 'both', pop: true }] },
        { ...step(5), focus: ['edge1', 'edge2', 'proxy', 'tenant'], end: 4.6, fx: [
          { t: 'packet', at: 0.3, edge: 'e1-px', label: '443', kind: 'control' },
          { t: 'packet', at: 0.3, edge: 'e2-px', label: '443', kind: 'control' },
          { t: 'packet', at: 1.4, edge: 'px-t', label: p('p_outbound'), kind: 'control' },
          { t: 'set', at: 2.3, k: 'tedges', v: 'two', pop: true },
          { t: 'packet', at: 2.5, edge: 'px-t', label: p('p_replica'), reverse: true },
          { t: 'packet', at: 3.4, edge: 'e1-px', label: p('p_replica'), reverse: true },
          { t: 'packet', at: 3.4, edge: 'e2-px', label: p('p_replica'), reverse: true },
          { t: 'set', at: 4.2, k: 'e1sync', v: 'on' }, { t: 'set', at: 4.2, k: 'e1cache', v: 'ok', pop: true },
          { t: 'set', at: 4.2, k: 'e2sync', v: 'on' }, { t: 'set', at: 4.2, k: 'e2cache', v: 'ok', pop: true }] },
        { ...step(6), focus: ['proxy', 'iot', 'edge1', 'edge2'], end: 3.6, fx: [
          { t: 'packet', at: 0.3, edge: 'px-iot', label: '443' },
          { t: 'packet', at: 1.5, edge: 'px-t', label: p('p_update'), reverse: true },
          { t: 'packet', at: 2.5, edge: 'e1-px', label: p('p_update'), reverse: true },
          { t: 'packet', at: 2.5, edge: 'e2-px', label: p('p_update'), reverse: true }] },
        { ...step(7), focus: ['wl', 'lb', 'edge1'], end: 4.8, fx: [
          { t: 'packet', at: 0.3, edge: 'wl-lb', label: 'JWT' },
          { t: 'packet', at: 1.3, edge: 'lb-e1', label: 'JWT' }, { t: 'set', at: 2.2, k: 'e1authn', v: 'ok', pop: true },
          { t: 'packet', at: 2.5, edge: 'lb-e1', label: 'secret', kind: 'secret', reverse: true },
          { t: 'packet', at: 3.5, edge: 'wl-lb', label: 'secret', kind: 'secret', reverse: true },
          { t: 'set', at: 4.4, k: 'wlsec', v: 'ok', pop: true }] },
        { ...step(8), focus: ['edge1', 'proxy', 'tenant'], end: 3.4, fx: [
          { t: 'packet', at: 0.3, edge: 'e1-px', label: p('p_forward'), kind: 'access' },
          { t: 'packet', at: 1.4, edge: 'px-t', label: p('p_forward'), kind: 'access' },
          { t: 'set', at: 2.4, k: 'tfwd', v: 'ok', pop: true }] },
        { ...step(9), focus: ['edge1', 'edge2', 'lb', 'wl'], end: 4.4, fx: [
          { t: 'set', at: 0.2, k: 'e1sync', v: 'off', pop: true }, { t: 'set', at: 0.2, k: 'e2sync', v: 'off', pop: true }, { t: 'set', at: 0.2, k: 'tedges', v: 'lost' },
          { t: 'packet', at: 0.8, edge: 'wl-lb', label: 'JWT' },
          { t: 'packet', at: 1.8, edge: 'lb-e2', label: 'JWT' }, { t: 'set', at: 2.7, k: 'e2authn', v: 'ok', pop: true },
          { t: 'packet', at: 3.0, edge: 'lb-e2', label: p('p_from_cache'), kind: 'secret', reverse: true }] },
        { ...step(10), focus: ['edge1', 'siem'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'e1-siem', label: 'audit.json' }, { t: 'set', at: 1.3, k: 'siem', v: 'ok', pop: true }] },
        { ...step(11), focus: ['cloudwl', 'tenant'], end: 3.6, fx: [
          { t: 'set', at: 0.2, k: 'e1sync', v: 'on' }, { t: 'set', at: 0.2, k: 'e2sync', v: 'on' }, { t: 'set', at: 0.2, k: 'tedges', v: 'two' },
          { t: 'packet', at: 0.4, edge: 'cw-t', label: p('p_authn') },
          { t: 'packet', at: 1.7, edge: 'cw-t', label: 'secret', kind: 'secret', reverse: true },
          { t: 'set', at: 2.7, k: 'cwsec', v: 'ok', pop: true }] },
      ],
    }
  }, [t])
  return <FlowPlayer spec={spec} />
}
