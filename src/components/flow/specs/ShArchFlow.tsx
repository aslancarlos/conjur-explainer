import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Boxes, Container, Copy, CopyCheck, Crown, DatabaseBackup, HeartPulse, KeySquare, Landmark, Network, Radar, Server, UserCog } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from '../FlowPlayer'

/**
 * Concepts: IDIRA Secrets Manager Self-Hosted architecture (docs:
 * secrets-manager-sh "Secrets Manager architecture and deployment reference").
 * One Leader writes; a synchronous and an asynchronous Standby replicate it
 * (PostgreSQL streaming, 5432) and form the auto-failover cluster (etcd +
 * Raft); a DR Standby sits in another region; Followers replicate through the
 * cluster load balancer, serve reads near the apps behind their own load
 * balancer and stream audit back to the Leader (1999), which exports it to a
 * SIEM. PAM Self-Hosted feeds the Leader through Vault Synchronizer and the
 * server keys are protected by a master key in AWS KMS or an HSM.
 */
export default function ShArchFlow() {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const p = (k: string) => t(`sharch.${k}`)
    const step = (n: number) => ({ title: p(`s${n}_title`), desc: p(`s${n}_desc`) })
    const data = (k: string) => ({ label: p('r_data'), k, states: [{ v: 'v1', text: 'v1', tone: 'muted' as const }, { v: 'v2', text: 'v2', tone: 'ok' as const }] })
    return {
      id: 'sharch',
      ariaLabel: p('diagram_label'),
      initial: {
        lRole: 'active', lPol: 'none', lData: 'v1', sData: 'v1', sRole: 'standby', aData: 'v1', dData: 'v1', dRole: 'standby',
        f1Data: 'v1', f2Data: 'v1', pamSync: 'idle', siem: 'idle', target: 'leader', raft: 'ok', wl: 'none',
      },
      nodes: [
        { id: 'admin', domain: 'cp', Icon: UserCog, title: p('n_admin'), sub: p('n_admin_sub') },
        { id: 'pam', domain: 'neutral', Icon: Landmark, title: 'PAM Self-Hosted', sub: p('n_pam_sub'), rows: [
          { label: 'sync', k: 'pamSync', states: [{ v: 'idle', text: p('st_idle'), tone: 'muted' }, { v: 'ok', text: p('st_synced'), tone: 'ok' }] },
        ] },
        { id: 'kms', domain: 'neutral', Icon: KeySquare, title: 'AWS KMS / HSM', sub: p('n_kms_sub'), rows: [
          { label: p('r_keys'), value: p('st_encrypted'), tone: 'ok' },
        ] },
        { id: 'clb', domain: 'neutral', Icon: Network, title: p('n_clb'), sub: 'TLS passthrough · /health :444', rows: [
          { label: p('r_target'), k: 'target', states: [{ v: 'leader', text: 'Leader', tone: 'ok' }, { v: 'sync', text: 'Sync Standby', tone: 'ok' }] },
        ] },
        { id: 'raft', domain: 'idira', Icon: HeartPulse, title: 'etcd · Raft', sub: 'auto-failover', rows: [
          { label: 'TTL', k: 'raft', states: [{ v: 'ok', text: 'ok', tone: 'ok' }, { v: 'exp', text: p('st_expired'), tone: 'warn' }, { v: 'elected', text: p('st_elected'), tone: 'ok' }] },
        ] },
        { id: 'leader', domain: 'idira', Icon: Crown, title: 'Leader', sub: p('n_leader_sub'), rows: [
          { label: p('r_role'), k: 'lRole', states: [{ v: 'active', text: p('st_active'), tone: 'ok' }, { v: 'down', text: p('st_down'), tone: 'warn' }] },
          { label: 'policy', k: 'lPol', states: [{ v: 'none', text: p('st_idle'), tone: 'muted' }, { v: 'ok', text: p('st_loaded'), tone: 'ok' }] },
          data('lData'),
        ] },
        { id: 'sync', domain: 'idira', Icon: CopyCheck, title: 'Sync Standby', sub: p('n_sync_sub'), rows: [
          data('sData'),
          { label: p('r_role'), k: 'sRole', states: [{ v: 'standby', text: 'standby', tone: 'muted' }, { v: 'leader', text: 'Leader', tone: 'ok' }] },
        ] },
        { id: 'async', domain: 'idira', Icon: Copy, title: 'Async Standby', sub: p('n_async_sub'), rows: [
          data('aData'),
          { label: p('r_role'), value: 'standby', tone: 'muted' },
        ] },
        { id: 'dr', domain: 'idira', Icon: DatabaseBackup, title: 'DR Standby', sub: p('n_dr_sub'), rows: [
          data('dData'),
          { label: p('r_role'), k: 'dRole', states: [{ v: 'standby', text: 'standby', tone: 'muted' }, { v: 'manual', text: p('st_manual'), tone: 'warn' }] },
        ] },
        { id: 'siem', domain: 'neutral', Icon: Radar, title: 'SIEM', sub: 'audit.json · audit.log', rows: [
          { label: 'audit', k: 'siem', states: [{ v: 'idle', text: p('st_idle'), tone: 'muted' }, { v: 'ok', text: p('st_received'), tone: 'ok' }] },
        ] },
        { id: 'f1', domain: 'idira', Icon: Server, title: 'Follower', sub: p('n_f1_sub'), rows: [
          data('f1Data'),
          { label: p('r_write'), value: p('st_error'), tone: 'warn' },
        ] },
        { id: 'f2', domain: 'idira', Icon: Container, title: 'K8s Follower', sub: p('n_f2_sub'), rows: [data('f2Data')] },
        { id: 'flb', domain: 'neutral', Icon: Network, title: p('n_flb'), sub: 'TLS passthrough · X-Forwarded-For' },
        { id: 'wl', domain: 'cp', Icon: Boxes, title: p('n_wl'), sub: p('n_wl_sub'), rows: [
          { label: p('r_secret'), k: 'wl', states: [{ v: 'none', text: p('st_pending'), tone: 'muted' }, { v: 'ok', text: p('st_received_v2'), tone: 'ok' }] },
        ] },
      ],
      edgeKinds: {
        'adm-clb': 'control', 'pam-clb': 'secret', 'clb-ldr': 'control', 'clb-sync': 'control', 'raft-sync': 'control',
        'kms-ldr': 'secret', 'ldr-sync': 'secret', 'ldr-async': 'secret', 'ldr-dr': 'secret', 'ldr-siem': 'access',
        'clb-f1': 'secret', 'clb-f2': 'secret', 'flb-f1': 'access', 'flb-f2': 'access', 'wl-flb': 'identity',
      },
      layouts: {
        wide: {
          w: 980, h: 760,
          boxes: {
            kms: { x: 16, y: 30, w: 190, h: 104 }, admin: { x: 230, y: 30, w: 200, h: 60 }, pam: { x: 450, y: 30, w: 230, h: 104 },
            clb: { x: 150, y: 176, w: 220, h: 104 }, raft: { x: 404, y: 176, w: 136, h: 84 },
            leader: { x: 20, y: 340, w: 160, h: 124 }, sync: { x: 200, y: 340, w: 160, h: 104 }, async: { x: 380, y: 340, w: 160, h: 104 },
            siem: { x: 20, y: 600, w: 204, h: 104 }, dr: { x: 270, y: 610, w: 250, h: 104 },
            f1: { x: 586, y: 186, w: 180, h: 104 }, f2: { x: 784, y: 186, w: 180, h: 84 },
            flb: { x: 640, y: 420, w: 250, h: 60 }, wl: { x: 640, y: 600, w: 250, h: 84 },
          },
          zones: [
            { d: 'neutral', x: 6, y: 18, w: 210, h: 128 }, { d: 'neutral', x: 440, y: 18, w: 250, h: 128 },
            { d: 'idira', x: 6, y: 162, w: 548, h: 368 },
            { d: 'neutral', x: 10, y: 588, w: 224, h: 128 }, { d: 'idira', x: 256, y: 598, w: 278, h: 128 },
            { d: 'cp', x: 570, y: 162, w: 404, h: 538 },
          ],
          lanes: [{ x: 76, y: 156, text: p('lane_primary') }, { x: 580, y: 156, text: p('lane_app') }, { x: 266, y: 592, text: p('lane_dr') }],
          edges: {
            'adm-clb': 'M 330,90 L 330,176',
            'pam-clb': 'M 520,134 C 520,160 360,150 360,176',
            'clb-ldr': 'M 200,280 C 200,310 100,310 100,340',
            'clb-sync': 'M 290,280 L 290,340',
            'raft-sync': 'M 472,260 C 472,300 340,300 340,340',
            'kms-ldr': 'M 60,134 L 60,340',
            'ldr-sync': 'M 90,464 C 90,505 270,505 270,444',
            'ldr-async': 'M 125,464 C 125,522 460,522 460,444',
            'ldr-dr': 'M 160,464 C 160,560 395,560 395,610',
            'ldr-siem': 'M 40,464 L 40,600',
            'clb-f1': 'M 370,270 C 480,300 520,300 586,262',
            'clb-f2': 'M 370,276 C 520,334 800,334 800,270',
            'flb-f1': 'M 665,420 L 665,290',
            'flb-f2': 'M 880,420 L 880,270',
            'wl-flb': 'M 765,600 L 765,480',
          },
        },
        narrow: {
          w: 360, h: 2070, title: 14,
          boxes: {
            admin: { x: 50, y: 30, w: 260, h: 60 }, pam: { x: 50, y: 140, w: 260, h: 104 },
            clb: { x: 50, y: 300, w: 260, h: 104 }, leader: { x: 50, y: 460, w: 260, h: 124 },
            sync: { x: 50, y: 640, w: 260, h: 104 }, async: { x: 50, y: 800, w: 260, h: 104 }, raft: { x: 50, y: 960, w: 260, h: 84 },
            dr: { x: 50, y: 1110, w: 260, h: 104 }, kms: { x: 50, y: 1280, w: 260, h: 104 }, siem: { x: 50, y: 1440, w: 260, h: 104 },
            f1: { x: 20, y: 1630, w: 155, h: 104 }, f2: { x: 185, y: 1630, w: 155, h: 84 },
            flb: { x: 50, y: 1800, w: 260, h: 60 }, wl: { x: 50, y: 1930, w: 260, h: 84 },
          },
          zones: [
            { d: 'neutral', x: 40, y: 128, w: 280, h: 128 },
            { d: 'idira', x: 40, y: 288, w: 280, h: 768 },
            { d: 'idira', x: 40, y: 1098, w: 280, h: 128 },
            { d: 'neutral', x: 40, y: 1268, w: 280, h: 288 },
            { d: 'cp', x: 10, y: 1618, w: 340, h: 410 },
          ],
          lanes: [{ x: 16, y: 282, text: p('lane_primary_short') }, { x: 16, y: 1092, text: p('lane_dr') }, { x: 16, y: 1612, text: p('lane_app') }],
          edges: {
            'adm-clb': 'M 50,60 C 22,60 22,352 50,352',
            'pam-clb': 'M 180,244 L 180,300',
            'clb-ldr': 'M 160,404 L 160,460',
            'clb-sync': 'M 310,352 C 336,352 336,692 310,692',
            'raft-sync': 'M 50,1002 C 34,1002 34,700 50,700',
            'kms-ldr': 'M 50,1332 C 12,1332 12,560 50,560',
            'ldr-sync': 'M 200,584 L 200,640',
            'ldr-async': 'M 50,522 C 24,522 24,852 50,852',
            'ldr-dr': 'M 310,530 C 346,530 346,1162 310,1162',
            'ldr-siem': 'M 310,566 C 354,566 354,1492 310,1492',
            'clb-f1': 'M 50,384 C 4,384 4,1660 20,1660',
            'clb-f2': 'M 310,392 C 342,392 342,1660 340,1660',
            'flb-f1': 'M 97,1800 L 97,1734',
            'flb-f2': 'M 262,1800 L 262,1714',
            'wl-flb': 'M 180,1930 L 180,1860',
          },
        },
      },
      steps: [
        { ...step(1), focus: ['leader', 'f1', 'f2'], end: 0.6, fx: [] },
        { ...step(2), focus: ['admin', 'clb', 'leader'], end: 2.6, fx: [
          { t: 'packet', at: 0.3, edge: 'adm-clb', label: 'policy · 443' },
          { t: 'packet', at: 1.2, edge: 'clb-ldr', label: 'policy' },
          { t: 'set', at: 2.1, k: 'lPol', v: 'ok', pop: true }] },
        { ...step(3), focus: ['pam', 'clb', 'leader'], end: 2.8, fx: [
          { t: 'set', at: 0.2, k: 'pamSync', v: 'ok', pop: true },
          { t: 'packet', at: 0.4, edge: 'pam-clb', label: p('p_safe') },
          { t: 'packet', at: 1.3, edge: 'clb-ldr', label: 'secrets', kind: 'secret' },
          { t: 'set', at: 2.2, k: 'lData', v: 'v2', pop: true }] },
        { ...step(4), focus: ['leader', 'sync', 'async'], end: 3.2, fx: [
          { t: 'packet', at: 0.3, edge: 'ldr-sync', label: '5432 · sync' },
          { t: 'set', at: 1.2, k: 'sData', v: 'v2', pop: true },
          { t: 'packet', at: 1.6, edge: 'ldr-async', label: '5432 · async' },
          { t: 'set', at: 2.6, k: 'aData', v: 'v2', pop: true }] },
        { ...step(5), focus: ['leader', 'dr'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'ldr-dr', label: '5432 · async' },
          { t: 'set', at: 1.3, k: 'dData', v: 'v2', pop: true }] },
        { ...step(6), focus: ['leader', 'clb', 'f1', 'f2'], end: 3.0, fx: [
          { t: 'packet', at: 0.3, edge: 'clb-ldr', label: '5432', kind: 'secret', reverse: true },
          { t: 'packet', at: 1.3, edge: 'clb-f1', label: '5432' },
          { t: 'packet', at: 1.3, edge: 'clb-f2', label: '5432' },
          { t: 'set', at: 2.3, k: 'f1Data', v: 'v2', pop: true },
          { t: 'set', at: 2.3, k: 'f2Data', v: 'v2', pop: true }] },
        { ...step(7), focus: ['wl', 'flb', 'f1'], end: 4.2, fx: [
          { t: 'packet', at: 0.3, edge: 'wl-flb', label: 'authn · 443' },
          { t: 'packet', at: 1.2, edge: 'flb-f1', label: 'authn · GET', kind: 'identity' },
          { t: 'packet', at: 2.1, edge: 'flb-f1', label: 'secret v2', kind: 'secret', reverse: true },
          { t: 'packet', at: 3.0, edge: 'wl-flb', label: 'secret v2', kind: 'secret', reverse: true },
          { t: 'set', at: 3.8, k: 'wl', v: 'ok', pop: true }] },
        { ...step(8), focus: ['f1', 'clb', 'leader', 'siem'], end: 3.6, fx: [
          { t: 'packet', at: 0.3, edge: 'clb-f1', label: 'audit · 1999', kind: 'access', reverse: true },
          { t: 'packet', at: 1.2, edge: 'clb-ldr', label: 'audit', kind: 'access' },
          { t: 'packet', at: 2.1, edge: 'ldr-siem', label: p('p_export') },
          { t: 'set', at: 3.0, k: 'siem', v: 'ok', pop: true }] },
        { ...step(9), focus: ['kms', 'leader'], end: 1.6, fx: [
          { t: 'packet', at: 0.3, edge: 'kms-ldr', label: 'master key' }] },
        { ...step(10), focus: ['leader', 'raft', 'sync', 'clb', 'f1', 'f2'], end: 5.4, fx: [
          { t: 'set', at: 0.2, k: 'lRole', v: 'down', pop: true },
          { t: 'set', at: 1.0, k: 'raft', v: 'exp', pop: true },
          { t: 'set', at: 1.9, k: 'raft', v: 'elected', pop: true },
          { t: 'packet', at: 2.0, edge: 'raft-sync', label: p('p_promote') },
          { t: 'set', at: 2.9, k: 'sRole', v: 'leader', pop: true },
          { t: 'packet', at: 3.1, edge: 'clb-sync', label: '/health :444' },
          { t: 'set', at: 3.9, k: 'target', v: 'sync', pop: true },
          { t: 'packet', at: 4.0, edge: 'clb-f1', label: 'rebase', kind: 'control' },
          { t: 'packet', at: 4.0, edge: 'clb-f2', label: 'rebase', kind: 'control' }] },
        { ...step(11), focus: ['dr'], end: 1.2, fx: [
          { t: 'set', at: 0.3, k: 'dRole', v: 'manual', pop: true }] },
      ],
    }
  }, [t])
  return <FlowPlayer spec={spec} />
}
