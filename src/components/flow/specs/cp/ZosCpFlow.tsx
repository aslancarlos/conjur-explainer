import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Cpu, Database, Landmark, RefreshCw, Server, Vault } from 'lucide-react'
import FlowPlayer, { type FlowLayout, type FlowSpec } from '../../FlowPlayer'
import type { Platform } from '../../../cp/CpPieces'

/**
 * Credential Provider for z/OS, from the Credential Providers docs: a batch
 * job calls the Java (clipasswordsdk.jar) or C SDK, which talks to the z/OS
 * Credential Provider STC on the same LPAR (port 18923). The provider
 * authenticates the application (allowed machines + OS user), serves from its
 * persistent cache and refreshes it through the Central Credential Provider
 * (Windows IIS, HTTPS + optional client certificate), which reaches the Vault
 * or Privilege Cloud. The CPM rotates and marks passwords so the cache syncs.
 */
export default function ZosCpFlow({ platform }: { platform: Platform }) {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const p = (k: string) => t(`cp_zos.flow.${k}`)
    const step = (n: number) => ({ title: p(`s${n}_title`), desc: p(`s${n}_desc`) })
    const saas = platform === 'saas'
    const pend = p('st_pending'), idle = p('st_idle'), check = p('st_check')

    const boxes = {
      job: { x: 30, y: 40, w: 210, h: 118 }, target: { x: 370, y: 52, w: 220, h: 96 }, cpm: { x: 720, y: 40, w: 240, h: 118 },
      zcp: { x: 30, y: 260, w: 210, h: 140 }, ccp: { x: 370, y: 270, w: 220, h: 118 }, vault: { x: 720, y: 270, w: 240, h: 118 },
    }
    const edges = {
      'job-zcp': 'M 135,158 L 135,260', 'job-target': 'M 240,100 L 370,100', 'cpm-target': 'M 720,100 L 590,100',
      'zcp-ccp': 'M 240,329 L 370,329', 'ccp-vault': 'M 590,329 L 720,329', 'cpm-vault': 'M 840,158 L 840,270',
    }
    const labels = [
      { x: 135, y: 209, text: 'SDK · TCP 18923', edge: 'job-zcp' },
      { x: 305, y: 305, text: 'HTTPS + mTLS', edge: 'zcp-ccp' },
      { x: 655, y: 305, text: 'TCP 1858', edge: 'ccp-vault' },
    ]
    const wide: FlowLayout = saas ? {
      w: 980, h: 430, boxes, edges, labels,
      zones: [
        { d: 'cp', x: 18, y: 28, w: 234, h: 384 }, { d: 'neutral', x: 358, y: 28, w: 614, h: 142 },
        { d: 'neutral', x: 358, y: 258, w: 244, h: 142 }, { d: 'idira', x: 708, y: 258, w: 264, h: 142 },
      ],
      lanes: [{ x: 30, y: 20, text: p('lane_lpar') }, { x: 370, y: 20, text: p('lane_network') }, { x: 720, y: 250, text: 'Privilege Cloud' }],
    } : {
      w: 980, h: 430, boxes, edges, labels,
      zones: [{ d: 'cp', x: 18, y: 28, w: 234, h: 384 }, { d: 'neutral', x: 358, y: 28, w: 614, h: 384 }],
      lanes: [{ x: 30, y: 20, text: p('lane_lpar') }, { x: 370, y: 20, text: p('lane_dc') }],
    }

    const narrow: FlowLayout = {
      w: 360, h: 1030, title: 14,
      boxes: {
        job: { x: 50, y: 30, w: 260, h: 118 }, zcp: { x: 50, y: 200, w: 260, h: 140 }, ccp: { x: 50, y: 390, w: 260, h: 118 },
        vault: { x: 50, y: 560, w: 260, h: 118 }, cpm: { x: 50, y: 730, w: 260, h: 118 }, target: { x: 50, y: 900, w: 260, h: 96 },
      },
      edges: {
        'job-zcp': 'M 180,148 L 180,200', 'zcp-ccp': 'M 180,340 L 180,390', 'ccp-vault': 'M 180,508 L 180,560',
        'cpm-vault': 'M 180,730 L 180,678', 'cpm-target': 'M 180,848 L 180,900', 'job-target': 'M 310,89 C 352,89 352,948 310,948',
      },
    }

    return {
      id: `cp-zos-${platform}`,
      ariaLabel: p(saas ? 'diagram_label_saas' : 'diagram_label_sh'),
      initial: { req: 'none', pwd: 'none', auth: 'idle', cache: 'empty', zlog: 'idle', tls: 'idle', fwd: 'idle', perm: 'idle', vlog: 'idle', rot: 'idle', mark: 'idle', session: 'idle' },
      nodes: [
        { id: 'job', domain: 'cp', Icon: Cpu, title: p('n_job'), sub: 'clipasswordsdk.jar · JZOS', rows: [
          { label: 'SYSIN', k: 'req', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: 'AppID + Query', tone: 'ok' }] },
          { label: 'CREDOUT', k: 'pwd', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_password'), tone: 'ok' }] },
        ] },
        { id: 'zcp', domain: 'cp', Icon: Server, title: 'z/OS CP', sub: p('n_zcp_sub'), rows: [
          { label: p('r_auth'), k: 'auth', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: check, tone: 'warn' }, { v: 'ok', text: p('st_machine_user'), tone: 'ok' }] },
          { label: p('r_cache'), k: 'cache', states: [{ v: 'empty', text: p('st_empty'), tone: 'muted' }, { v: 'ok', text: p('st_persistent'), tone: 'ok' }, { v: 'sync', text: p('st_refresh'), tone: 'warn' }] },
          { label: p('r_log'), k: 'zlog', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_logged'), tone: 'ok' }] },
        ] },
        { id: 'ccp', domain: 'neutral', Icon: Landmark, title: p('n_ccp'), sub: 'Windows IIS · AIMWebService', rows: [
          { label: 'TLS', k: 'tls', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_client_cert'), tone: 'ok' }] },
          { label: p('r_fwd'), k: 'fwd', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_forwarded'), tone: 'ok' }] },
        ] },
        { id: 'vault', domain: 'idira', Icon: Vault, title: saas ? 'Privilege Cloud' : 'Digital Vault', sub: saas ? 'SaaS' : 'PAM Self-Hosted', rows: [
          { label: 'Safe', k: 'perm', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: check, tone: 'warn' }, { v: 'ok', text: p('st_allowed'), tone: 'ok' }] },
          { label: p('r_log'), k: 'vlog', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_logged'), tone: 'ok' }] },
        ] },
        { id: 'cpm', domain: saas ? 'neutral' : 'idira', Icon: RefreshCw, title: 'CPM', sub: p(saas ? 'n_cpm_sub_saas' : 'n_cpm_sub_sh'), rows: [
          { label: p('r_rotate'), k: 'rot', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_changed'), tone: 'ok' }] },
          { label: p('r_mark'), k: 'mark', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_marked'), tone: 'warn' }] },
        ] },
        { id: 'target', domain: 'svc', Icon: Database, title: p('n_target'), sub: p('n_target_sub'), rows: [
          { label: p('r_session'), k: 'session', states: [{ v: 'idle', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_connected'), tone: 'ok' }] },
        ] },
      ],
      edgeKinds: { 'job-zcp': 'identity', 'zcp-ccp': 'identity', 'ccp-vault': 'identity', 'job-target': 'access', 'cpm-target': 'control', 'cpm-vault': 'control' },
      layouts: { wide, narrow },
      steps: [
        { ...step(1), focus: ['job', 'zcp'], end: 0.6, fx: [] },
        { ...step(2), focus: ['job', 'zcp'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'job-zcp', label: p('p_request') }, { t: 'set', at: 0.2, k: 'req', v: 'ok', pop: true }] },
        { ...step(3), focus: ['zcp'], end: 1.6, fx: [
          { t: 'set', at: 0.3, k: 'auth', v: 'check' }, { t: 'set', at: 1.0, k: 'auth', v: 'ok', pop: true }] },
        { ...step(4), focus: ['zcp', 'ccp'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'zcp-ccp', label: p('p_refresh') }, { t: 'set', at: 1.4, k: 'tls', v: 'ok', pop: true }] },
        { ...step(5), focus: ['ccp', 'vault', 'zcp'], end: 4.4, fx: [
          { t: 'packet', at: 0.3, edge: 'ccp-vault', label: p('p_get') }, { t: 'set', at: 1.2, k: 'perm', v: 'check' },
          { t: 'set', at: 1.7, k: 'perm', v: 'ok', pop: true }, { t: 'set', at: 1.9, k: 'vlog', v: 'ok' },
          { t: 'packet', at: 2.0, edge: 'ccp-vault', label: p('p_secret'), kind: 'secret', reverse: true }, { t: 'set', at: 3.0, k: 'fwd', v: 'ok' },
          { t: 'packet', at: 3.1, edge: 'zcp-ccp', label: p('p_secret'), kind: 'secret', reverse: true }, { t: 'set', at: 4.1, k: 'cache', v: 'ok', pop: true }] },
        { ...step(6), focus: ['zcp', 'job'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'job-zcp', label: p('p_password'), kind: 'secret', reverse: true },
          { t: 'set', at: 1.3, k: 'pwd', v: 'ok', pop: true }, { t: 'set', at: 1.5, k: 'zlog', v: 'ok' }] },
        { ...step(7), focus: ['job', 'target'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'job-target', label: p('p_login') }, { t: 'set', at: 1.4, k: 'session', v: 'ok', pop: true }] },
        { ...step(8), focus: ['cpm', 'target', 'vault', 'zcp'], end: 4.2, fx: [
          { t: 'set', at: 0.2, k: 'mark', v: 'ok', pop: true },
          { t: 'packet', at: 0.5, edge: 'cpm-target', label: p('p_rotate') }, { t: 'set', at: 1.5, k: 'rot', v: 'ok', pop: true },
          { t: 'packet', at: 1.7, edge: 'cpm-vault', label: p('p_store') },
          { t: 'set', at: 2.8, k: 'cache', v: 'sync', pop: true }, { t: 'set', at: 3.8, k: 'cache', v: 'ok', pop: true }] },
      ],
    }
  }, [t, platform])
  return <FlowPlayer key={platform} spec={spec} />
}
