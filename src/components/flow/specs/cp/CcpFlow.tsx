import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AppWindow, Cloud, Database, Network, RefreshCw, Server, Vault } from 'lucide-react'
import FlowPlayer, { type FlowLayout, type FlowSpec } from '../../FlowPlayer'
import type { Platform } from '../../../cp/CpPieces'

/**
 * Central Credential Provider (CCP), from the Credential Providers docs:
 * applications call the CCP web service (AIMWebService on IIS) over HTTPS,
 * with no agent on the application host; the CCP authenticates the
 * application, its Credential Provider for Windows fetches the password from
 * the Vault (PAM Self-Hosted) or Privilege Cloud and keeps a secure cache;
 * the CPM rotates the password and the cache stays in sync.
 */
export default function CcpFlow({ platform }: { platform: Platform }) {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const p = (k: string) => t(`cp_ccp.flow.${k}`)
    const step = (n: number) => ({ title: p(`s${n}_title`), desc: p(`s${n}_desc`) })
    const saas = platform === 'saas'
    const pend = t('idflow.st_pending')
    const idle = t('idflow.st_idle')

    const wide: FlowLayout = saas ? {
      w: 980, h: 480,
      boxes: {
        apps: { x: 16, y: 60, w: 200, h: 110 }, target: { x: 16, y: 330, w: 200, h: 96 },
        lb: { x: 290, y: 74, w: 190, h: 84 }, ccp: { x: 560, y: 40, w: 230, h: 150 },
        cpm: { x: 290, y: 300, w: 190, h: 96 }, vault: { x: 620, y: 300, w: 250, h: 110 },
      },
      zones: [
        { d: 'cp', x: 6, y: 48, w: 220, h: 134 }, { d: 'svc', x: 6, y: 318, w: 220, h: 120 },
        { d: 'neutral', x: 280, y: 28, w: 520, h: 172 }, { d: 'neutral', x: 280, y: 288, w: 210, h: 120 },
        { d: 'idira', x: 610, y: 288, w: 270, h: 134 },
      ],
      lanes: [{ x: 290, y: 20, text: p('lane_customer') }, { x: 620, y: 280, text: p('lane_cloud') }],
      edges: {
        'apps-lb': 'M 216,115 L 290,115', 'lb-ccp': 'M 480,115 L 560,115',
        'ccp-vault': 'M 745,190 L 745,300', 'apps-target': 'M 116,170 L 116,330',
        'cpm-vault': 'M 480,348 L 620,348', 'cpm-target': 'M 290,370 C 252,370 252,378 216,378',
      },
      labels: [
        { x: 385, y: 192, text: 'GET | POST /AIMWebService/api/Accounts' },
        { x: 745, y: 245, text: p('lbl_vault_saas') },
        { x: 116, y: 250, text: p('lbl_connect') },
      ],
    } : {
      w: 980, h: 480,
      boxes: {
        apps: { x: 16, y: 60, w: 200, h: 110 }, target: { x: 16, y: 330, w: 200, h: 96 },
        lb: { x: 290, y: 74, w: 190, h: 84 }, ccp: { x: 560, y: 40, w: 230, h: 150 },
        vault: { x: 560, y: 300, w: 230, h: 110 }, cpm: { x: 830, y: 300, w: 140, h: 96 },
      },
      zones: [
        { d: 'cp', x: 6, y: 48, w: 220, h: 134 }, { d: 'svc', x: 6, y: 318, w: 220, h: 120 },
        { d: 'neutral', x: 280, y: 28, w: 700, h: 394 },
      ],
      lanes: [{ x: 290, y: 20, text: p('lane_dc') }],
      edges: {
        'apps-lb': 'M 216,115 L 290,115', 'lb-ccp': 'M 480,115 L 560,115',
        'ccp-vault': 'M 675,190 L 675,300', 'apps-target': 'M 116,170 L 116,330',
        'cpm-vault': 'M 830,348 L 790,348', 'cpm-target': 'M 900,396 C 900,468 116,468 116,426',
      },
      labels: [
        { x: 385, y: 192, text: 'GET | POST /AIMWebService/api/Accounts' },
        { x: 675, y: 245, text: p('lbl_vault_sh') },
        { x: 116, y: 250, text: p('lbl_connect') },
        { x: 500, y: 455, text: p('lbl_rotate') },
      ],
    }

    const narrow: FlowLayout = {
      w: 360, h: 1060, title: 14,
      boxes: {
        apps: { x: 70, y: 30, w: 220, h: 110 }, lb: { x: 70, y: 190, w: 220, h: 84 },
        ccp: { x: 50, y: 324, w: 260, h: 150 }, vault: { x: 50, y: 524, w: 260, h: 110 },
        cpm: { x: 70, y: 690, w: 220, h: 96 }, target: { x: 70, y: 880, w: 220, h: 96 },
      },
      zones: [
        { d: 'cp', x: 60, y: 20, w: 240, h: 130 },
        { d: saas ? 'neutral' : 'neutral', x: 40, y: 180, w: 280, h: saas ? 304 : 616 },
        ...(saas ? [{ d: 'idira' as const, x: 40, y: 514, w: 280, h: 130 }, { d: 'neutral' as const, x: 60, y: 680, w: 240, h: 116 }] : []),
        { d: 'svc', x: 60, y: 870, w: 240, h: 116 },
      ],
      edges: {
        'apps-lb': 'M 180,140 L 180,190', 'lb-ccp': 'M 180,274 L 180,324',
        'ccp-vault': 'M 180,474 L 180,524', 'cpm-vault': 'M 180,690 L 180,634',
        'cpm-target': 'M 180,786 L 180,880', 'apps-target': 'M 290,85 C 350,85 350,928 290,928',
      },
    }

    return {
      id: saas ? 'cp-ccp-saas' : 'cp-ccp-sh',
      ariaLabel: p(saas ? 'diagram_label_saas' : 'diagram_label_sh'),
      initial: { req: 'none', cred: 'none', auth: 'idle', cache: 'empty', safe: 'idle', session: 'idle', rot: 'v1', lbmode: 'idle' },
      nodes: [
        { id: 'apps', domain: 'cp', Icon: AppWindow, title: p('n_apps'), sub: p('n_apps_sub'), rows: [
          { label: p('r_agent'), value: p('st_none'), tone: 'ok' },
          { label: p('r_cred'), k: 'cred', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_received'), tone: 'ok' }] },
        ] },
        { id: 'lb', domain: 'neutral', Icon: Network, title: p('n_lb'), sub: p('n_lb_sub'), rows: [
          { label: p('r_mode'), k: 'lbmode', states: [{ v: 'idle', text: p('st_optional'), tone: 'muted' }, { v: 'ok', text: p('st_ha'), tone: 'ok' }] },
        ] },
        { id: 'ccp', domain: 'idira', Icon: Server, title: p('n_ccp'), sub: saas ? p('n_ccp_sub_saas') : p('n_ccp_sub_sh'), rows: [
          { label: p('r_request'), k: 'req', states: [{ v: 'none', text: idle, tone: 'muted' }, { v: 'ok', text: 'REST', tone: 'ok' }] },
          { label: p('r_appauth'), k: 'auth', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: t('idflow.st_check'), tone: 'warn' }, { v: 'ok', text: p('st_verified'), tone: 'ok' }] },
          { label: p('r_cache'), k: 'cache', states: [{ v: 'empty', text: p('st_empty'), tone: 'muted' }, { v: 'ok', text: p('st_cached'), tone: 'ok' }, { v: 'sync', text: p('st_synced'), tone: 'ok' }] },
        ] },
        { id: 'vault', domain: 'idira', Icon: saas ? Cloud : Vault, title: saas ? p('n_vault_saas') : p('n_vault_sh'), sub: p('n_vault_sub'), rows: [
          { label: p('r_safe'), k: 'safe', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: t('idflow.st_check'), tone: 'warn' }, { v: 'ok', text: p('st_allowed'), tone: 'ok' }] },
          { label: p('r_password'), k: 'rot', states: [{ v: 'v1', text: 'v1', tone: 'ok' }, { v: 'v2', text: p('st_rotated'), tone: 'ok' }] },
        ] },
        { id: 'cpm', domain: 'idira', Icon: RefreshCw, title: 'CPM', sub: saas ? p('n_cpm_sub_saas') : p('n_cpm_sub_sh') },
        { id: 'target', domain: 'svc', Icon: Database, title: p('n_target'), sub: p('n_target_sub'), rows: [
          { label: p('r_session'), k: 'session', states: [{ v: 'idle', text: pend, tone: 'muted' }, { v: 'ok', text: t('idflow.st_connected'), tone: 'ok' }] },
        ] },
      ],
      edgeKinds: { 'apps-lb': 'access', 'lb-ccp': 'access', 'ccp-vault': 'identity', 'apps-target': 'access', 'cpm-vault': 'secret', 'cpm-target': 'control' },
      layouts: { wide, narrow },
      steps: [
        { ...step(1), focus: ['apps', 'ccp'], end: 0.6, fx: [] },
        { ...step(2), focus: ['apps', 'lb', 'ccp'], end: 3.0, fx: [
          { t: 'packet', at: 0.3, edge: 'apps-lb', label: p('p_get') }, { t: 'set', at: 1.0, k: 'lbmode', v: 'ok' },
          { t: 'packet', at: 1.4, edge: 'lb-ccp', label: 'HTTPS' }, { t: 'set', at: 2.4, k: 'req', v: 'ok', pop: true }] },
        { ...step(3), focus: ['ccp'], end: 1.8, fx: [
          { t: 'set', at: 0.3, k: 'auth', v: 'check' }, { t: 'set', at: 1.1, k: 'auth', v: 'ok', pop: true }] },
        { ...step(4), focus: ['ccp', 'vault'], end: 3.6, fx: [
          { t: 'packet', at: 0.3, edge: 'ccp-vault', label: p('p_query') }, { t: 'set', at: 1.3, k: 'safe', v: 'check' },
          { t: 'set', at: 1.8, k: 'safe', v: 'ok', pop: true },
          { t: 'packet', at: 2.0, edge: 'ccp-vault', label: p('p_password'), kind: 'secret', reverse: true }, { t: 'set', at: 3.0, k: 'cache', v: 'ok', pop: true }] },
        { ...step(5), focus: ['ccp', 'lb', 'apps'], end: 3.0, fx: [
          { t: 'packet', at: 0.3, edge: 'lb-ccp', label: 'JSON · Content', kind: 'secret', reverse: true },
          { t: 'packet', at: 1.4, edge: 'apps-lb', label: 'JSON · Content', kind: 'secret', reverse: true }, { t: 'set', at: 2.4, k: 'cred', v: 'ok', pop: true }] },
        { ...step(6), focus: ['apps', 'target'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'apps-target', label: p('p_login') }, { t: 'set', at: 1.3, k: 'session', v: 'ok', pop: true }] },
        { ...step(7), focus: ['ccp'], end: 0.8, fx: [] },
        { ...step(8), focus: ['cpm', 'vault', 'target', 'ccp'], end: 3.6, fx: [
          { t: 'packet', at: 0.3, edge: 'cpm-target', label: p('p_newpass') },
          { t: 'packet', at: 1.4, edge: 'cpm-vault', label: 'v2' }, { t: 'set', at: 2.4, k: 'rot', v: 'v2', pop: true },
          { t: 'set', at: 2.8, k: 'cache', v: 'sync', pop: true }] },
        { ...step(9), focus: ['lb', 'ccp'], end: 0.8, fx: [] },
      ],
    }
  }, [t, platform])
  return <FlowPlayer key={platform} spec={spec} />
}
