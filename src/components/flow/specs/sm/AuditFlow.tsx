import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart3, FileText, Network, Server, ServerCog, ScrollText, Vault } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from '../../FlowPlayer'
import type { Platform } from '../../../cp/CpPieces'

/**
 * Secrets Manager audit trail.
 * Self-Hosted: every node emits RFC 5424 events; syslog-ng on each Follower
 * keeps a local copy and forwards over mTLS (port 1999) to the Leader, which
 * stores them in the audit database (UI search) and in audit.log/audit.json
 * for the SIEM (logrotate: daily, 30 days).
 * SaaS: events go to the platform Audit service (Activities, CSV reports,
 * Global auditor role); a SIEM pulls them with an OAuth2 service user through
 * the SIEM integration API (last 7 days) or the Splunk add-on. Edge audits stay
 * on the Edge machine.
 */
export default function AuditFlow({ platform }: { platform: Platform }) {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const p = (k: string) => t(`sm_audit.flow.${k}`)
    const pend = p('st_pending'), idle = p('st_idle')

    if (platform === 'saas') {
      const step = (n: number) => ({ title: p(`saas_s${n}_title`), desc: p(`saas_s${n}_desc`) })
      const saasSpec: FlowSpec = {
        id: 'sm-audit-saas',
        ariaLabel: p('diagram_label_saas'),
        initial: { wl: 'none', evt: 'idle', src: 'idle', act: 'idle', rep: 'idle', role: 'idle', stok: 'idle', sev: 'idle', edge: 'idle' },
        nodes: [
          { id: 'wl', domain: 'cp', Icon: Server, title: p('n_wl'), sub: p('n_wl_sub'), rows: [
            { label: p('r_request'), k: 'wl', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_fetched'), tone: 'ok' }] },
          ] },
          { id: 'edge', domain: 'cp', Icon: Network, title: 'Edge', sub: p('n_edge_sub'), rows: [
            { label: p('r_forward'), k: 'edge', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_forwarded'), tone: 'ok' }] },
            { label: p('r_edge_logs'), value: p('st_local'), tone: 'warn' },
          ] },
          { id: 'sm', domain: 'idira', Icon: Vault, title: 'IDIRA Secrets Manager', sub: 'SaaS', rows: [
            { label: p('r_event'), k: 'evt', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: 'fetch-fetch', tone: 'ok' }] },
            { label: p('r_source'), k: 'src', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_workload'), tone: 'ok' }, { v: 'edge', text: 'Edge', tone: 'ok' }] },
          ] },
          { id: 'audit', domain: 'idira', Icon: ScrollText, title: p('n_audit'), sub: p('n_audit_sub'), rows: [
            { label: p('r_activities'), k: 'act', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_listed'), tone: 'ok' }] },
            { label: p('r_role'), k: 'role', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: 'Global auditor', tone: 'ok' }] },
            { label: p('r_report'), k: 'rep', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: 'CSV', tone: 'ok' }] },
          ] },
          { id: 'siem', domain: 'svc', Icon: BarChart3, title: 'SIEM', sub: 'Splunk · QRadar · Sentinel', rows: [
            { label: p('r_stoken'), k: 'stok', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: 'OAuth2', tone: 'ok' }] },
            { label: p('r_sevents'), k: 'sev', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_ingested'), tone: 'ok' }] },
          ] },
        ],
        edgeKinds: { 'wl-sm': 'identity', 'edge-sm': 'identity', 'sm-audit': 'control', 'siem-audit': 'access' },
        layouts: {
          wide: {
            w: 980, h: 440,
            boxes: {
              wl: { x: 30, y: 40, w: 200, h: 96 }, edge: { x: 30, y: 290, w: 200, h: 118 },
              sm: { x: 330, y: 130, w: 250, h: 118 }, audit: { x: 670, y: 40, w: 280, h: 140 },
              siem: { x: 670, y: 290, w: 280, h: 118 },
            },
            zones: [
              { d: 'cp', x: 18, y: 28, w: 224, h: 392 }, { d: 'idira', x: 318, y: 28, w: 644, h: 232 },
              { d: 'svc', x: 658, y: 278, w: 304, h: 142 },
            ],
            lanes: [{ x: 30, y: 20, text: p('lane_network') }, { x: 330, y: 20, text: p('lane_cloud') }],
            edges: {
              'wl-sm': 'M 230,88 C 280,88 280,170 330,170', 'edge-sm': 'M 230,349 C 280,349 280,214 330,214',
              'sm-audit': 'M 580,170 C 625,170 625,110 670,110', 'siem-audit': 'M 810,290 L 810,180',
            },
            labels: [{ x: 810, y: 235, text: p('lbl_siem_api'), edge: 'siem-audit' }],
          },
          narrow: {
            w: 360, h: 860, title: 14,
            boxes: {
              wl: { x: 50, y: 30, w: 260, h: 96 }, edge: { x: 50, y: 170, w: 260, h: 118 },
              sm: { x: 50, y: 340, w: 260, h: 118 }, audit: { x: 50, y: 510, w: 260, h: 140 },
              siem: { x: 50, y: 700, w: 260, h: 118 },
            },
            edges: {
              'wl-sm': 'M 50,78 C 8,78 8,399 50,399', 'edge-sm': 'M 180,288 L 180,340',
              'sm-audit': 'M 180,458 L 180,510', 'siem-audit': 'M 180,700 L 180,650',
            },
          },
        },
        steps: [
          { ...step(1), focus: ['wl', 'sm'], end: 2.6, fx: [
            { t: 'packet', at: 0.3, edge: 'wl-sm', label: p('p_fetch') }, { t: 'set', at: 1.3, k: 'wl', v: 'ok' },
            { t: 'set', at: 1.5, k: 'evt', v: 'ok', pop: true }, { t: 'set', at: 1.9, k: 'src', v: 'ok' }] },
          { ...step(2), focus: ['sm', 'audit'], end: 2.4, fx: [
            { t: 'packet', at: 0.3, edge: 'sm-audit', label: p('p_event') }, { t: 'set', at: 1.4, k: 'act', v: 'ok', pop: true }] },
          { ...step(3), focus: ['audit'], end: 1.6, fx: [
            { t: 'set', at: 0.3, k: 'role', v: 'ok', pop: true }, { t: 'set', at: 0.9, k: 'rep', v: 'ok', pop: true }] },
          { ...step(4), focus: ['siem', 'audit'], end: 3.6, fx: [
            { t: 'set', at: 0.3, k: 'stok', v: 'ok', pop: true },
            { t: 'packet', at: 0.6, edge: 'siem-audit', label: p('p_query') },
            { t: 'packet', at: 1.8, edge: 'siem-audit', label: p('p_events'), reverse: true }, { t: 'set', at: 2.9, k: 'sev', v: 'ok', pop: true }] },
          { ...step(5), focus: ['edge', 'sm'], end: 2.6, fx: [
            { t: 'set', at: 0.2, k: 'edge', v: 'ok' },
            { t: 'packet', at: 0.4, edge: 'edge-sm', label: p('p_forwarded') }, { t: 'set', at: 1.5, k: 'src', v: 'edge', pop: true }] },
        ],
      }
      return saasSpec
    }

    const step = (n: number) => ({ title: p(`sh_s${n}_title`), desc: p(`sh_s${n}_desc`) })
    const shSpec: FlowSpec = {
      id: 'sm-audit-sh',
      ariaLabel: p('diagram_label_sh'),
      initial: { wl: 'none', fevt: 'idle', fcopy: 'idle', lagg: 'idle', ldb: 'idle', files: 'idle', rot: 'idle', idx: 'idle', alert: 'idle' },
      nodes: [
        { id: 'wl', domain: 'cp', Icon: Server, title: p('n_wl'), sub: p('n_wl_sub'), rows: [
          { label: p('r_request'), k: 'wl', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_fetched'), tone: 'ok' }, { v: 'denied', text: p('st_denied'), tone: 'bad' }] },
        ] },
        { id: 'follower', domain: 'idira', Icon: ServerCog, title: 'Follower', sub: p('n_follower_sub'), rows: [
          { label: p('r_event'), k: 'fevt', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: 'Fetch Secret', tone: 'ok' }] },
          { label: p('r_copy'), k: 'fcopy', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_kept'), tone: 'ok' }] },
        ] },
        { id: 'leader', domain: 'idira', Icon: Vault, title: 'Leader', sub: p('n_leader_sub'), rows: [
          { label: p('r_agg'), k: 'lagg', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_received'), tone: 'ok' }] },
          { label: p('r_db'), k: 'ldb', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_searchable'), tone: 'ok' }] },
        ] },
        { id: 'files', domain: 'neutral', Icon: FileText, title: 'audit.json · audit.log', sub: '/var/log/conjur', rows: [
          { label: p('r_written'), k: 'files', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_line'), tone: 'ok' }] },
          { label: 'logrotate', k: 'rot', states: [{ v: 'idle', text: p('st_daily'), tone: 'muted' }, { v: 'ok', text: p('st_30d'), tone: 'warn' }] },
        ] },
        { id: 'siem', domain: 'svc', Icon: BarChart3, title: 'SIEM', sub: p('n_siem_sub_sh'), rows: [
          { label: p('r_indexed'), k: 'idx', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: '_json', tone: 'ok' }] },
          { label: p('r_alert'), k: 'alert', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'fired', text: p('st_fired'), tone: 'bad' }] },
        ] },
      ],
      edgeKinds: { 'wl-follower': 'identity', 'follower-leader': 'control', 'leader-files': 'control', 'files-siem': 'access' },
      layouts: {
        wide: {
          w: 980, h: 440,
          boxes: {
            wl: { x: 30, y: 40, w: 200, h: 96 }, follower: { x: 330, y: 40, w: 250, h: 118 },
            leader: { x: 330, y: 290, w: 250, h: 118 }, files: { x: 690, y: 290, w: 270, h: 118 },
            siem: { x: 690, y: 40, w: 270, h: 118 },
          },
          zones: [
            { d: 'cp', x: 18, y: 28, w: 224, h: 120 }, { d: 'idira', x: 318, y: 28, w: 274, h: 392 },
            { d: 'neutral', x: 678, y: 278, w: 294, h: 142 }, { d: 'svc', x: 678, y: 28, w: 294, h: 142 },
          ],
          lanes: [{ x: 330, y: 20, text: p('lane_cluster') }],
          edges: {
            'wl-follower': 'M 230,88 L 330,88', 'follower-leader': 'M 455,158 L 455,290',
            'leader-files': 'M 580,349 L 690,349', 'files-siem': 'M 825,290 L 825,158',
          },
          labels: [
            { x: 455, y: 224, text: 'syslog-ng · mTLS 1999', edge: 'follower-leader' },
            { x: 825, y: 224, text: p('lbl_forwarder'), edge: 'files-siem' },
          ],
        },
        narrow: {
          w: 360, h: 860, title: 14,
          boxes: {
            wl: { x: 50, y: 30, w: 260, h: 96 }, follower: { x: 50, y: 170, w: 260, h: 118 },
            leader: { x: 50, y: 340, w: 260, h: 118 }, files: { x: 50, y: 510, w: 260, h: 118 },
            siem: { x: 50, y: 680, w: 260, h: 118 },
          },
          edges: {
            'wl-follower': 'M 180,126 L 180,170', 'follower-leader': 'M 180,288 L 180,340',
            'leader-files': 'M 180,458 L 180,510', 'files-siem': 'M 180,628 L 180,680',
          },
        },
      },
      steps: [
        { ...step(1), focus: ['wl', 'follower'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'wl-follower', label: p('p_fetch') }, { t: 'set', at: 1.3, k: 'wl', v: 'ok' },
          { t: 'set', at: 1.5, k: 'fevt', v: 'ok', pop: true }] },
        { ...step(2), focus: ['follower'], end: 1.2, fx: [{ t: 'set', at: 0.3, k: 'fcopy', v: 'ok', pop: true }] },
        { ...step(3), focus: ['follower', 'leader'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'follower-leader', label: 'RFC 5424' }, { t: 'set', at: 1.4, k: 'lagg', v: 'ok', pop: true }] },
        { ...step(4), focus: ['leader'], end: 1.2, fx: [{ t: 'set', at: 0.3, k: 'ldb', v: 'ok', pop: true }] },
        { ...step(5), focus: ['leader', 'files'], end: 2.8, fx: [
          { t: 'packet', at: 0.3, edge: 'leader-files', label: p('p_write') }, { t: 'set', at: 1.3, k: 'files', v: 'ok', pop: true },
          { t: 'set', at: 2.0, k: 'rot', v: 'ok' }] },
        { ...step(6), focus: ['files', 'siem'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'files-siem', label: 'audit.json' }, { t: 'set', at: 1.4, k: 'idx', v: 'ok', pop: true }] },
        { ...step(7), focus: ['wl', 'follower', 'siem'], end: 3.4, fx: [
          { t: 'packet', at: 0.3, edge: 'wl-follower', label: p('p_denied'), kind: 'leak' }, { t: 'set', at: 1.3, k: 'wl', v: 'denied', pop: true },
          { t: 'packet', at: 1.5, edge: 'files-siem', label: p('p_failure') }, { t: 'set', at: 2.6, k: 'alert', v: 'fired', pop: true }] },
      ],
    }
    return shSpec
  }, [t, platform])
  return <FlowPlayer key={platform} spec={spec} />
}
