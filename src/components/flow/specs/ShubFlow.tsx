import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarClock, Cloud, Combine, Globe, HardDrive, KeySquare, Network, Vault } from 'lucide-react'
import FlowPlayer, { type FlowEffect, type FlowLayout, type FlowNode, type FlowRow, type FlowSpec, type FlowStep } from '../FlowPlayer'

/**
 * Secrets Hub, two scenarios (DESIGN.md §10). Facts from the Secrets Hub docs
 * (secrets-hub-privilege-cloud, secrets-hub-pam-sh):
 *   saas   Privilege Cloud Safe (CPM/SRS rotates, SecretsHub user is a member)
 *          -> Secrets Hub (SaaS) -> AWS SM (IAM role), Azure KV (app registration,
 *          federated identity), GCP SM (Workload Identity Federation) directly, and
 *          HashiCorp Vault always through a connector (outbound MQTT, JWT/OIDC role).
 *   pamsh  PAM Self-Hosted Vault + PVWA in the data center, reached through a
 *          connector pool (mTLS to the cloud, ad hoc HTTPS to PVWA); same targets.
 * Workloads read with each store's native SDK.
 */
export type ShubEnv = 'saas' | 'pamsh'

export function useShubSpec(env: ShubEnv): FlowSpec {
  const { t } = useTranslation()
  return useMemo<FlowSpec>((): FlowSpec => {
    const s = (k: string) => t(`secretshub.${k}`)
    const pend = s('st.pending')
    const ver = (k: string): FlowRow => ({ label: s('r.secret'), k, states: [
      { v: 'none', text: pend, tone: 'muted' }, { v: 'v1', text: 'v1', tone: 'ok' }, { v: 'v2', text: 'v2', tone: 'ok' }] })
    const trust = (k: string): FlowRow => ({ label: s('r.trust'), k, states: [
      { v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: s('st.valid'), tone: 'ok' }] })
    const status: FlowRow = { label: s('r.status'), k: 'conn', states: [
      { v: 'off', text: pend, tone: 'muted' }, { v: 'on', text: s('st.online'), tone: 'ok' }] }
    const safeRows: FlowRow[] = [
      { label: 'db/password', k: 'sv', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'v1', text: 'v1', tone: 'ok' }, { v: 'v2', text: 'v2', tone: 'ok' }] },
      { label: s('r.member'), k: 'mem', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: 'SecretsHub', tone: 'ok' }] },
    ]
    const step = (n: number, focus: string[], end: number, fx: FlowEffect[]): FlowStep =>
      ({ title: s(`${env}.s${n}_title`), desc: s(`${env}.s${n}_desc`), focus, end, fx })
    const pkt = (at: number, edge: string, label: string, extra: Partial<Extract<FlowEffect, { t: 'packet' }>> = {}): FlowEffect =>
      ({ t: 'packet', at, edge, label, ...extra })
    const set = (at: number, k: string, v: string, pop = true): FlowEffect => ({ t: 'set', at, k, v, pop })

    // shared nodes
    const scanRow: FlowRow = { label: s('r.scan'), k: 'scan', states: [{ v: 'idle', text: pend, tone: 'muted' }, { v: 'check', text: s('st.scanning'), tone: 'warn' }, { v: 'ok', text: s('st.found'), tone: 'ok' }] }
    const hubRows: FlowRow[] = [
      { label: s('r.policy'), k: 'pol', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: s('st.active'), tone: 'ok' }] },
      ...(env === 'saas' ? [scanRow] : []),
      { label: s('r.sync'), k: 'sync', states: [{ v: 'idle', text: s('st.idle'), tone: 'muted' }, { v: 'check', text: s('st.syncing'), tone: 'warn' }, { v: 'ok', text: s('st.done'), tone: 'ok' }] },
    ]
    const hub: FlowNode = { id: 'hub', domain: 'idira', Icon: Combine, title: 'Secrets Hub', sub: s('n.hub_sub'), rows: hubRows }
    const targets: FlowNode[] = [
      { id: 'aws', domain: 'svc', Icon: Cloud, title: 'AWS Secrets Manager', sub: s('n.aws_sub'), rows: [trust('awsT'), ver('aws')] },
      { id: 'az', domain: 'svc', Icon: KeySquare, title: 'Azure Key Vault', sub: s('n.az_sub'), rows: [trust('azT'), ver('az')] },
      { id: 'gcp', domain: 'svc', Icon: Globe, title: 'GCP Secret Manager', sub: s('n.gcp_sub'), rows: [trust('gcpT'), ver('gcp')] },
      { id: 'hcv', domain: 'svc', Icon: Vault, title: 'HashiCorp Vault', sub: s('n.hcv_sub'), rows: [trust('hcvT'), { label: s('r.engine'), value: 'KV v2' }, ver('hcv')] },
    ]
    const wl: FlowNode = { id: 'wl', domain: 'cp', Icon: HardDrive, title: s('n.wl'), sub: s('n.wl_sub'), rows: [ver('wl')] }
    const conNode = (rows: FlowRow[]): FlowNode => ({ id: 'con', domain: 'idira', Icon: Network, title: s('n.con'), sub: s('n.con_sub'), rows })

    // shared targets geometry (wide)
    const wideTargets = {
      aws: { x: 556, y: 48, w: 210, h: 106 }, az: { x: 556, y: 168, w: 210, h: 106 }, gcp: { x: 556, y: 288, w: 210, h: 106 },
      wl: { x: 800, y: 170, w: 170, h: 86 },
    }
    const wideTargetEdges = {
      'aws-wl': 'M 766,101 C 783,101 783,195 800,195', 'az-wl': 'M 766,221 L 800,221', 'gcp-wl': 'M 766,341 C 783,341 783,245 800,245',
    }
    const initialCommon = { sv: 'none', mem: 'none', pol: 'none', scan: 'idle', sync: 'idle', conn: 'off',
      awsT: 'none', azT: 'none', gcpT: 'none', hcvT: 'none', aws: 'none', az: 'none', gcp: 'none', hcv: 'none', wl: 'none' }
    const cloudTrust = (at: number): FlowEffect[] => [
      pkt(at, 'hub-aws', 'IAM role', { kind: 'identity' }), pkt(at, 'hub-az', 'federated', { kind: 'identity' }), pkt(at, 'hub-gcp', 'WIF', { kind: 'identity' }),
      set(at + 1.0, 'awsT', 'ok'), set(at + 1.1, 'azT', 'ok'), set(at + 1.2, 'gcpT', 'ok')]
    const pushClouds = (at: number, v: string): FlowEffect[] => [
      pkt(at, 'hub-aws', v), pkt(at, 'hub-az', v), pkt(at, 'hub-gcp', v),
      set(at + 1.0, 'aws', v), set(at + 1.1, 'az', v), set(at + 1.2, 'gcp', v)]
    const pushHcv = (at: number, v: string): FlowEffect[] => [
      pkt(at, 'con-hub', v, { reverse: true, kind: 'secret' }), pkt(at + 1.0, 'con-hcv', v, { kind: 'secret' }), set(at + 2.0, 'hcv', v)]
    const consume: FlowEffect[] = [
      pkt(0.3, 'aws-wl', 'GetSecretValue'), pkt(0.7, 'az-wl', 'getSecret'), pkt(1.1, 'gcp-wl', 'accessSecretVersion'), pkt(1.5, 'hcv-wl', 'kv get'),
      set(2.6, 'wl', 'v2')]
    const all = ['hub', 'aws', 'az', 'gcp', 'hcv', 'con', 'wl']

    if (env === 'saas') {
      const wide: FlowLayout = {
        w: 980, h: 640, title: 14,
        boxes: {
          pc: { x: 16, y: 56, w: 200, h: 106 }, cpm: { x: 16, y: 222, w: 200, h: 60 }, hub: { x: 270, y: 110, w: 200, h: 126 },
          ...wideTargets,
          con: { x: 270, y: 470, w: 200, h: 126 }, hcv: { x: 556, y: 470, w: 210, h: 126 },
        },
        zones: [
          { d: 'idira', x: 6, y: 28, w: 474, h: 270 }, { d: 'svc', x: 546, y: 28, w: 230, h: 376 },
          { d: 'cp', x: 790, y: 160, w: 184, h: 106 }, { d: 'neutral', x: 6, y: 440, w: 968, h: 176 },
        ],
        lanes: [{ x: 16, y: 20, text: s('n.lane_cloud') }, { x: 556, y: 20, text: s('n.lane_targets') }, { x: 16, y: 432, text: s('n.lane_net') }],
        edges: {
          'cpm-pc': 'M 116,222 L 116,162',
          'pc-hub': 'M 216,90 C 243,90 243,135 270,135', 'hub-pc': 'M 270,215 C 243,215 243,150 216,150',
          'hub-aws': 'M 470,140 C 513,140 513,101 556,101', 'hub-az': 'M 470,175 C 513,175 513,221 556,221', 'hub-gcp': 'M 470,210 C 513,210 513,341 556,341',
          'con-hub': 'M 370,470 L 370,236', 'con-hcv': 'M 470,533 L 556,533',
          ...wideTargetEdges, 'hcv-wl': 'M 766,533 C 885,533 885,300 885,256',
        },
      }
      const narrow: FlowLayout = {
        w: 360, h: 1440, title: 14,
        boxes: {
          cpm: { x: 70, y: 30, w: 220, h: 60 }, pc: { x: 50, y: 140, w: 260, h: 106 }, hub: { x: 50, y: 296, w: 260, h: 126 },
          con: { x: 50, y: 484, w: 260, h: 126 }, hcv: { x: 50, y: 660, w: 260, h: 126 },
          aws: { x: 50, y: 848, w: 260, h: 106 }, az: { x: 50, y: 1004, w: 260, h: 106 }, gcp: { x: 50, y: 1160, w: 260, h: 106 },
          wl: { x: 70, y: 1328, w: 220, h: 86 },
        },
        zones: [
          { d: 'idira', x: 40, y: 20, w: 280, h: 412 }, { d: 'neutral', x: 40, y: 474, w: 280, h: 322 },
          { d: 'svc', x: 40, y: 838, w: 280, h: 438 }, { d: 'cp', x: 60, y: 1318, w: 240, h: 106 },
        ],
        lanes: [{ x: 16, y: 14, text: s('n.lane_cloud') }, { x: 16, y: 468, text: s('n.lane_net') }, { x: 16, y: 832, text: s('n.lane_targets') }, { x: 16, y: 1312, text: s('n.lane_apps') }],
        edges: {
          'cpm-pc': 'M 180,90 L 180,140',
          'pc-hub': 'M 160,246 L 160,296', 'hub-pc': 'M 200,296 L 200,246',
          'con-hub': 'M 180,484 L 180,422', 'con-hcv': 'M 180,610 L 180,660',
          'hub-aws': 'M 50,330 C 26,330 26,901 50,901', 'hub-az': 'M 50,380 C 10,380 10,1057 50,1057', 'hub-gcp': 'M 310,400 C 356,400 356,1213 310,1213',
          'aws-wl': 'M 310,901 C 336,901 336,1350 290,1350', 'az-wl': 'M 310,1057 C 326,1057 326,1365 290,1365',
          'gcp-wl': 'M 180,1266 L 180,1328', 'hcv-wl': 'M 310,723 C 346,723 346,1395 290,1395',
        },
      }
      return {
        id: 'shub-saas',
        ariaLabel: s('saas.diagram_label'),
        initial: initialCommon,
        nodes: [
          { id: 'pc', domain: 'idira', Icon: Vault, title: 'Privilege Cloud', sub: s('n.pc_sub'), rows: safeRows },
          { id: 'cpm', domain: 'idira', Icon: CalendarClock, title: 'CPM / SRS', sub: s('n.cpm_sub') },
          hub, ...targets, wl,
          conNode([{ label: s('r.cloud'), value: 'MQTT · TLS' }, { label: s('r.ports'), value: s('st.none') }, status]),
        ],
        edgeKinds: {
          'cpm-pc': 'secret', 'pc-hub': 'secret', 'hub-pc': 'control',
          'hub-aws': 'secret', 'hub-az': 'secret', 'hub-gcp': 'secret',
          'con-hub': 'control', 'con-hcv': 'secret',
          'aws-wl': 'secret', 'az-wl': 'secret', 'gcp-wl': 'secret', 'hcv-wl': 'secret',
        },
        layouts: { wide, narrow },
        steps: [
          step(1, ['pc', 'cpm', ...all], 0.6, []),
          step(2, ['cpm', 'pc'], 2.2, [pkt(0.3, 'cpm-pc', 'db/password'), set(1.3, 'sv', 'v1')]),
          step(3, ['hub', 'pc'], 2.2, [pkt(0.3, 'hub-pc', s('p.member')), set(1.3, 'mem', 'ok')]),
          step(4, ['hub', 'aws', 'az', 'gcp'], 2.6, cloudTrust(0.3)),
          step(5, ['con', 'hub', 'hcv'], 3.4, [
            pkt(0.3, 'con-hub', 'MQTT', { kind: 'control' }), set(1.3, 'conn', 'on'),
            pkt(1.6, 'con-hcv', 'JWT/OIDC', { kind: 'identity' }), set(2.6, 'hcvT', 'ok')]),
          step(6, ['hub', 'aws', 'az', 'gcp', 'hcv', 'con'], 3.2, [
            set(0.2, 'scan', 'check', false),
            pkt(0.3, 'hub-aws', s('p.scan'), { kind: 'access' }), pkt(0.3, 'hub-az', s('p.scan'), { kind: 'access' }), pkt(0.3, 'hub-gcp', s('p.scan'), { kind: 'access' }),
            pkt(0.3, 'con-hub', s('p.scan'), { kind: 'access', reverse: true }), pkt(1.3, 'con-hcv', s('p.scan'), { kind: 'access' }),
            set(2.6, 'scan', 'ok')]),
          step(7, ['pc', 'hub', 'aws', 'az', 'gcp', 'hcv', 'con'], 4.6, [
            set(0.2, 'pol', 'ok'), set(0.4, 'sync', 'check', false),
            pkt(0.4, 'pc-hub', 'v1'), ...pushClouds(1.5, 'v1'), ...pushHcv(1.5, 'v1'), set(3.9, 'sync', 'ok')]),
          step(8, ['cpm', 'pc', 'hub', 'aws', 'az', 'gcp', 'hcv', 'con'], 5.6, [
            set(0.1, 'sync', 'idle', false),
            pkt(0.3, 'cpm-pc', 'v2'), set(1.3, 'sv', 'v2'), set(1.5, 'sync', 'check', false),
            pkt(1.5, 'pc-hub', 'v2'), ...pushClouds(2.6, 'v2'), ...pushHcv(2.6, 'v2'), set(4.9, 'sync', 'ok')]),
          step(9, ['aws', 'az', 'gcp', 'hcv', 'wl'], 3.4, consume),
        ],
      }
    }

    // PAM Self-Hosted
    const wide: FlowLayout = {
      w: 980, h: 640, title: 14,
      boxes: {
        hub: { x: 270, y: 96, w: 200, h: 106 },
        ...wideTargets,
        pvwa: { x: 16, y: 330, w: 200, h: 106 }, vault: { x: 16, y: 486, w: 200, h: 106 },
        con: { x: 270, y: 330, w: 200, h: 126 }, cpm: { x: 270, y: 530, w: 200, h: 60 },
        hcv: { x: 556, y: 434, w: 210, h: 126 },
      },
      zones: [
        { d: 'idira', x: 260, y: 86, w: 220, h: 126 }, { d: 'svc', x: 546, y: 28, w: 230, h: 376 },
        { d: 'cp', x: 790, y: 160, w: 184, h: 106 },
        { d: 'neutral', x: 6, y: 300, w: 474, h: 316 }, { d: 'neutral', x: 546, y: 424, w: 230, h: 146 },
      ],
      lanes: [{ x: 270, y: 78, text: s('n.lane_cloud') }, { x: 556, y: 20, text: s('n.lane_targets') }, { x: 16, y: 292, text: s('n.lane_dc') }, { x: 556, y: 416, text: s('n.lane_net') }],
      edges: {
        'cpm-vault': 'M 270,560 L 216,560', 'vault-pvwa': 'M 116,486 L 116,436',
        'con-pvwa': 'M 270,383 L 216,383', 'con-hub': 'M 370,330 L 370,202',
        'hub-aws': 'M 470,122 C 513,122 513,101 556,101', 'hub-az': 'M 470,150 C 513,150 513,221 556,221', 'hub-gcp': 'M 470,178 C 513,178 513,341 556,341',
        'con-hcv': 'M 470,420 C 513,420 513,497 556,497',
        ...wideTargetEdges, 'hcv-wl': 'M 766,497 C 885,497 885,300 885,256',
      },
    }
    const narrow: FlowLayout = {
      w: 360, h: 1596, title: 14,
      boxes: {
        hub: { x: 50, y: 30, w: 260, h: 106 },
        con: { x: 50, y: 218, w: 260, h: 126 }, pvwa: { x: 50, y: 394, w: 260, h: 106 }, vault: { x: 50, y: 550, w: 260, h: 106 },
        cpm: { x: 70, y: 706, w: 220, h: 60 }, hcv: { x: 50, y: 816, w: 260, h: 126 },
        aws: { x: 50, y: 1004, w: 260, h: 106 }, az: { x: 50, y: 1160, w: 260, h: 106 }, gcp: { x: 50, y: 1316, w: 260, h: 106 },
        wl: { x: 70, y: 1484, w: 220, h: 86 },
      },
      zones: [
        { d: 'idira', x: 40, y: 20, w: 280, h: 146 }, { d: 'neutral', x: 40, y: 208, w: 280, h: 744 },
        { d: 'svc', x: 40, y: 994, w: 280, h: 438 }, { d: 'cp', x: 60, y: 1474, w: 240, h: 106 },
      ],
      lanes: [{ x: 16, y: 14, text: s('n.lane_cloud') }, { x: 16, y: 202, text: s('n.lane_dc') }, { x: 16, y: 988, text: s('n.lane_targets') }, { x: 16, y: 1468, text: s('n.lane_apps') }],
      edges: {
        'con-hub': 'M 180,218 L 180,136', 'con-pvwa': 'M 180,344 L 180,394',
        'vault-pvwa': 'M 180,550 L 180,500', 'cpm-vault': 'M 180,706 L 180,656',
        'con-hcv': 'M 310,290 C 346,290 346,879 310,879',
        'hub-aws': 'M 50,80 C 26,80 26,1057 50,1057', 'hub-az': 'M 50,120 C 10,120 10,1213 50,1213', 'hub-gcp': 'M 310,110 C 356,110 356,1369 310,1369',
        'hcv-wl': 'M 310,920 C 336,920 336,1520 290,1520', 'aws-wl': 'M 310,1057 C 330,1057 330,1505 290,1505',
        'az-wl': 'M 310,1213 C 322,1213 322,1535 290,1535', 'gcp-wl': 'M 180,1422 L 180,1484',
      },
    }
    // read path: Secrets Hub -> connector -> PVWA -> Vault, value comes back the same way
    const readPath = (at: number, v: string): FlowEffect[] => [
      pkt(at, 'con-hub', 'GET', { reverse: true, kind: 'access' }), pkt(at + 1.0, 'con-pvwa', 'HTTPS', { kind: 'access' }),
      pkt(at + 2.0, 'vault-pvwa', v, { kind: 'secret' }), pkt(at + 3.0, 'con-pvwa', v, { reverse: true, kind: 'secret' }),
      pkt(at + 4.0, 'con-hub', v, { kind: 'secret' })]
    return {
      id: 'shub-pamsh',
      ariaLabel: s('pamsh.diagram_label'),
      initial: { ...initialCommon, scan: 'ok' },
      nodes: [
        { id: 'vault', domain: 'idira', Icon: Vault, title: s('n.vault'), sub: s('n.vault_sub'), rows: safeRows },
        { id: 'pvwa', domain: 'idira', Icon: Globe, title: 'PVWA', sub: s('n.pvwa_sub'), rows: [
          { label: 'URL', value: 'HTTPS' }, { label: s('r.lb'), value: s('st.one_lb'), tone: 'warn' }] },
        { id: 'cpm', domain: 'idira', Icon: CalendarClock, title: 'CPM', sub: s('n.cpm_sub') },
        hub, ...targets, wl,
        conNode([{ label: s('r.cloud'), value: 'mTLS' }, { label: 'PVWA', value: 'HTTPS' }, status]),
      ],
      edgeKinds: {
        'cpm-vault': 'secret', 'vault-pvwa': 'secret', 'con-pvwa': 'access', 'con-hub': 'control',
        'hub-aws': 'secret', 'hub-az': 'secret', 'hub-gcp': 'secret', 'con-hcv': 'secret',
        'aws-wl': 'secret', 'az-wl': 'secret', 'gcp-wl': 'secret', 'hcv-wl': 'secret',
      },
      layouts: { wide, narrow },
      steps: [
        step(1, ['vault', 'pvwa', 'cpm', ...all], 0.6, []),
        step(2, ['cpm', 'vault'], 2.2, [pkt(0.3, 'cpm-vault', 'db/password'), set(1.3, 'sv', 'v1')]),
        step(3, ['con', 'hub', 'pvwa'], 2.4, [pkt(0.3, 'con-hub', 'mTLS', { kind: 'control' }), set(1.3, 'conn', 'on')]),
        step(4, ['con', 'pvwa', 'vault'], 3.2, [
          pkt(0.3, 'con-pvwa', 'SecretsHub', { kind: 'control' }), pkt(1.3, 'vault-pvwa', s('p.member'), { reverse: true, kind: 'control' }),
          set(2.3, 'mem', 'ok')]),
        step(5, ['hub', 'aws', 'az', 'gcp'], 2.6, cloudTrust(0.3)),
        step(6, ['con', 'hcv'], 2.4, [pkt(0.3, 'con-hcv', 'JWT/OIDC', { kind: 'identity' }), set(1.3, 'hcvT', 'ok')]),
        step(7, ['hub', 'con', 'pvwa', 'vault', 'aws', 'az', 'gcp', 'hcv'], 8.4, [
          set(0.2, 'pol', 'ok'), set(0.4, 'sync', 'check', false),
          ...readPath(0.4, 'v1'), ...pushClouds(5.5, 'v1'), pkt(5.5, 'con-hcv', 'v1'), set(6.5, 'hcv', 'v1'), set(7.6, 'sync', 'ok')]),
        step(8, ['cpm', 'vault', 'pvwa', 'con', 'hub', 'aws', 'az', 'gcp', 'hcv'], 9.6, [
          set(0.1, 'sync', 'idle', false), pkt(0.3, 'cpm-vault', 'v2'), set(1.3, 'sv', 'v2'), set(1.5, 'sync', 'check', false),
          ...readPath(1.5, 'v2'), ...pushClouds(6.6, 'v2'), pkt(6.6, 'con-hcv', 'v2'), set(7.6, 'hcv', 'v2'), set(8.8, 'sync', 'ok')]),
        step(9, ['aws', 'az', 'gcp', 'hcv', 'wl'], 3.4, consume),
      ],
    }
  }, [t, env])
}

/** FlowPlayer for the chosen scenario; keyed so the timeline rebuilds cleanly on switch. */
export default function ShubFlow({ env }: { env: ShubEnv }) {
  const spec = useShubSpec(env)
  return <FlowPlayer key={env} spec={spec} />
}
