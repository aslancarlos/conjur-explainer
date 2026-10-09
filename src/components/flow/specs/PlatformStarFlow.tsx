import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarClock, ClipboardList, CloudCog, Combine, Database, Globe, HardDrive, Network, Vault } from 'lucide-react'
import FlowPlayer, { type FlowEffect, type FlowLayout, type FlowNode, type FlowRow, type FlowSpec, type FlowStep } from '../FlowPlayer'

/**
 * Platform overview: a star with the PAM Vault in the center and every way a
 * workload consumes the same account around it (DESIGN.md §10). Facts from the
 * docs already cited on the product pages:
 *   - CPM rotates the account in the Safe (Privilege Cloud or PAM Self-Hosted).
 *   - Secrets Manager SaaS syncs Safes through the Conjur Sync user
 *     (cl_addaccount); Secrets Manager Self-Hosted through the Vault
 *     Synchronizer LOB user (cv_overview). Both expose data/vault/<safe>/...
 *   - Secrets Hub pushes the account to AWS, Azure, GCP and HashiCorp Vault.
 *   - Credential Provider (agent + cache), ASCP (application server data
 *     sources, on top of the local Credential Provider) and CCP (REST
 *     AIMWebService) retrieve it at run time.
 * Sync-based products sit on the left, run-time retrieval on the right.
 */
const SPOKES = ['smsaas', 'smsh', 'shub', 'cp', 'ascp', 'ccp'] as const

export function usePlatformStarSpec(): FlowSpec {
  const { t } = useTranslation()
  return useMemo<FlowSpec>((): FlowSpec => {
    const p = (k: string) => t(`platform.${k}`)
    const pend = p('st.pending')
    const ver = (k: string, label = p('r.secret')): FlowRow => ({ label, k, states: [
      { v: 'none', text: pend, tone: 'muted' }, { v: 'v1', text: 'v1', tone: 'ok' }, { v: 'v2', text: 'v2', tone: 'ok' }] })
    const how = (value: string): FlowRow => ({ label: p('r.how'), value })
    const pkt = (at: number, edge: string, label: string, extra: Partial<Extract<FlowEffect, { t: 'packet' }>> = {}): FlowEffect =>
      ({ t: 'packet', at, edge, label, ...extra })
    const set = (at: number, k: string, v: string, pop = true): FlowEffect => ({ t: 'set', at, k, v, pop })
    const step = (n: number, focus: string[], end: number, fx: FlowEffect[]): FlowStep =>
      ({ title: p(`s${n}_title`), desc: p(`s${n}_desc`), focus, end, fx })

    const nodes: FlowNode[] = [
      { id: 'vault', domain: 'idira', Icon: Vault, logo: '/icons/tech/pam.svg', title: p('n.vault'), sub: p('n.vault_sub'), rows: [
        { label: 'db/password', k: 'vault', states: [
          { v: 'none', text: pend, tone: 'muted' }, { v: 'v1', text: 'v1', tone: 'ok' }, { v: 'v2', text: 'v2', tone: 'ok' }] },
        { label: p('r.consumers'), k: 'cons', states: [
          { v: '0', text: '0', tone: 'muted' }, { v: '3', text: '3', tone: 'ok' }, { v: '6', text: '6', tone: 'ok' }] },
      ] },
      { id: 'cpm', domain: 'idira', Icon: CalendarClock, logo: '/icons/nav/rotation.svg', title: 'CPM', sub: p('n.cpm_sub') },
      { id: 'smsaas', href: '/concepts/saas-architecture', domain: 'idira', Icon: CloudCog, logo: '/icons/nav/c_saas.svg', title: 'Secrets Manager SaaS', sub: p('n.smsaas_sub'), rows: [how('Conjur Sync'), ver('smsaas')] },
      { id: 'smsh', href: '/concepts/self-hosted-architecture', domain: 'idira', Icon: Network, logo: '/icons/nav/c_sh.svg', title: 'Secrets Manager Self-Hosted', sub: p('n.smsh_sub'), rows: [how('Vault Synchronizer'), ver('smsh')] },
      { id: 'shub', href: '/secretshub', domain: 'svc', Icon: Combine, logo: '/icons/nav/g_shub.svg', title: 'Secrets Hub', sub: p('n.shub_sub'), rows: [how('AWS · Azure · GCP · HashiCorp'), ver('shub')] },
      { id: 'cp', href: '/cp/credential-provider', domain: 'cp', Icon: HardDrive, logo: '/icons/nav/cp_cp.svg', title: 'Credential Provider', sub: p('n.cp_sub'), rows: [how(p('n.cp_how')), ver('cp')] },
      { id: 'ascp', href: '/cp/ascp', domain: 'cp', Icon: Database, logo: '/icons/tech/op_appservers.svg', title: p('n.ascp'), sub: p('n.ascp_sub'), rows: [how('JDBC'), ver('ascp')] },
      { id: 'ccp', href: '/cp/ccp', domain: 'cp', Icon: Globe, logo: '/icons/nav/ccp.svg', title: p('n.ccp'), sub: p('n.ccp_sub'), rows: [how('REST · AIMWebService'), ver('ccp')] },
      { id: 'audit', domain: 'neutral', Icon: ClipboardList, logo: '/icons/nav/audit.svg', title: p('n.audit'), sub: p('n.audit_sub'), rows: [
        { label: p('r.rotations'), k: 'rot', states: [
          { v: '0', text: '0', tone: 'muted' }, { v: '1', text: '1', tone: 'ok' }, { v: '2', text: '2', tone: 'ok' }] },
      ] },
    ]

    // ── wide (980): left column = sync, right column = run-time retrieval ──
    // Spokes are 300 wide so full product names fit on one line at 14 px.
    const W = 300, H = 112
    const L = 20, R = 980 - 20 - W
    const ys = [52, 232, 412]
    const vault = { x: 380, y: 224, w: 220, h: 128 }
    const wide: FlowLayout = {
      w: 980, h: 548, title: 14,
      boxes: {
        vault, cpm: { x: 355, y: 52, w: 270, h: 64 }, audit: { x: 390, y: 432, w: 200, h: 96 },
        smsaas: { x: L, y: ys[0], w: W, h: H }, smsh: { x: L, y: ys[1], w: W, h: H }, shub: { x: L, y: ys[2], w: W, h: H },
        cp: { x: R, y: ys[0], w: W, h: H }, ascp: { x: R, y: ys[1], w: W, h: H }, ccp: { x: R, y: ys[2], w: W, h: H },
      },
      zones: [
        { d: 'idira', x: 345, y: 40, w: 290, h: 324 },
        { d: 'neutral', x: 10, y: 40, w: W + 20, h: 496 },
        { d: 'cp', x: R - 10, y: 40, w: W + 20, h: 496 },
      ],
      lanes: [
        { x: 355, y: 32, text: p('lane_vault') },
        { x: L, y: 32, text: p('lane_sync') },
        { x: R, y: 32, text: p('lane_runtime') },
      ],
      edges: {
        'cpm-vault': 'M 490,116 L 490,224',
        'vault-smsaas': `M 380,246 C 350,246 350,${ys[0] + H / 2} ${L + W},${ys[0] + H / 2}`,
        'vault-smsh': `M 380,288 L ${L + W},288`,
        'vault-shub': `M 380,330 C 350,330 350,${ys[2] + H / 2} ${L + W},${ys[2] + H / 2}`,
        'vault-cp': `M 600,246 C 630,246 630,${ys[0] + H / 2} ${R},${ys[0] + H / 2}`,
        'vault-ascp': `M 600,288 L ${R},288`,
        'vault-ccp': `M 600,330 C 630,330 630,${ys[2] + H / 2} ${R},${ys[2] + H / 2}`,
        'vault-audit': 'M 490,352 L 490,432',
      },
    }

    // ── narrow (360): vertical list, spokes branch off a trunk on the left ──
    const nW = 300, nX = 50
    const nY = (i: number) => 420 + i * 150
    const narrow: FlowLayout = {
      w: 360, h: 420 + SPOKES.length * 150 + 150, title: 14,
      boxes: {
        cpm: { x: 50, y: 30, w: 300, h: 64 },
        vault: { x: 50, y: 150, w: 300, h: 128 },
        ...Object.fromEntries(SPOKES.map((id, i) => [id, { x: nX, y: nY(i), w: nW, h: H }])),
        audit: { x: 80, y: nY(SPOKES.length), w: 240, h: 96 },
      },
      zones: [{ d: 'idira', x: 40, y: 20, w: 320, h: 268 }],
      edges: {
        'cpm-vault': 'M 200,94 L 200,150',
        ...Object.fromEntries(SPOKES.map((id, i) => [`vault-${id}`,
          `M 50,${214 + i * 6} C ${30 - i * 4},${214 + i * 6} ${30 - i * 4},${nY(i) + H / 2} ${nX},${nY(i) + H / 2}`])),
        'vault-audit': `M 350,214 C 358,214 358,${nY(SPOKES.length) + 48} 320,${nY(SPOKES.length) + 48}`,
      },
    }

    const sync = (at: number, v: string): FlowEffect[] => [
      pkt(at, 'vault-smsaas', v), pkt(at + 0.2, 'vault-smsh', v), pkt(at + 0.4, 'vault-shub', v),
      set(at + 1.0, 'smsaas', v), set(at + 1.2, 'smsh', v), set(at + 1.4, 'shub', v)]
    const fetch = (at: number, v: string): FlowEffect[] => [
      pkt(at, 'vault-cp', v), pkt(at + 0.2, 'vault-ascp', v), pkt(at + 0.4, 'vault-ccp', v),
      set(at + 1.0, 'cp', v), set(at + 1.2, 'ascp', v), set(at + 1.4, 'ccp', v)]

    return {
      id: 'platform-star',
      ariaLabel: p('diagram_label'),
      initial: { vault: 'none', cons: '0', rot: '0', smsaas: 'none', smsh: 'none', shub: 'none', cp: 'none', ascp: 'none', ccp: 'none' },
      nodes,
      edgeKinds: {
        'cpm-vault': 'control',
        'vault-smsaas': 'secret', 'vault-smsh': 'secret', 'vault-shub': 'secret',
        'vault-cp': 'secret', 'vault-ascp': 'secret', 'vault-ccp': 'secret',
        'vault-audit': 'control',
      },
      layouts: { wide, narrow },
      steps: [
        step(1, ['vault', 'cpm', 'audit', ...SPOKES], 0.6, []),
        step(2, ['cpm', 'vault', 'audit'], 2.6, [
          pkt(0.3, 'cpm-vault', 'db/password'), set(1.3, 'vault', 'v1'),
          pkt(1.4, 'vault-audit', p('p.logged')), set(2.4, 'rot', '1')]),
        step(3, ['vault', 'smsaas', 'smsh', 'shub'], 2.8, [...sync(0.3, 'v1'), set(2.0, 'cons', '3', false)]),
        step(4, ['vault', 'cp', 'ascp', 'ccp'], 2.8, [...fetch(0.3, 'v1'), set(2.0, 'cons', '6', false)]),
        step(5, ['cpm', 'vault', 'audit'], 2.6, [
          pkt(0.3, 'cpm-vault', p('p.rotate')), set(1.3, 'vault', 'v2'),
          pkt(1.4, 'vault-audit', p('p.logged')), set(2.4, 'rot', '2')]),
        step(6, ['vault', ...SPOKES], 3.0, [...sync(0.3, 'v2'), ...fetch(0.3, 'v2')]),
        step(7, ['vault', 'audit', ...SPOKES], 0.6, []),
      ],
    }
  }, [t])
}

export default function PlatformStarFlow() {
  const spec = usePlatformStarSpec()
  return <FlowPlayer spec={spec} />
}
