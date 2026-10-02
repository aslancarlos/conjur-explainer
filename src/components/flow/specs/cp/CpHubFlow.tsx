import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AppWindow, Boxes, Globe, RefreshCw, Server, Terminal, Vault } from 'lucide-react'
import FlowPlayer, { type FlowSpec, type FlowLayout } from '../../FlowPlayer'
import type { Platform } from '../../../cp/CpPieces'

/**
 * Credential Providers overview: three ways an application gets a privileged
 * account password from the Vault without hardcoding it.
 *   CP   app + Application Password SDK -> local Credential Provider
 *   ASCP application server data source -> ASCP (on top of the local CP)
 *   CCP  remote app / script -> REST (AIMWebService on IIS) -> CCP
 * Every provider authenticates to the Vault with its provider user (Vault
 * protocol, default port 1858), checks the application and Safe permissions,
 * caches the password, and picks up CPM rotations on the next refresh.
 * Self-Hosted: Vault and CPM on premises. Privilege Cloud: the Vault is the
 * SaaS Vault and the CPM runs on the Privilege Cloud Connector in your network.
 */
export default function CpHubFlow({ platform }: { platform: Platform }) {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const p = (k: string) => t(`cphub.flow.${k}`)
    const step = (n: number) => ({ title: p(`s${n}_title`), desc: p(`s${n}_desc_${platform}`) })
    const saas = platform === 'saas'
    const idle = t('idflow.st_idle')
    const empty = p('st_empty')
    const cached = p('st_cached')

    const wideZones: FlowLayout['zones'] = saas
      ? [{ d: 'cp', x: 6, y: 28, w: 534, h: 418 }, { d: 'idira', x: 690, y: 138, w: 284, h: 154 }, { d: 'neutral', x: 690, y: 368, w: 284, h: 108 }]
      : [{ d: 'cp', x: 6, y: 28, w: 534, h: 418 }, { d: 'idira', x: 690, y: 138, w: 284, h: 338 }]
    const narrowZones: FlowLayout['zones'] = saas
      ? [{ d: 'cp', x: 40, y: 20, w: 280, h: 762 }, { d: 'idira', x: 40, y: 808, w: 280, h: 150 }, { d: 'neutral', x: 40, y: 994, w: 280, h: 106 }]
      : [{ d: 'cp', x: 40, y: 20, w: 280, h: 762 }, { d: 'idira', x: 40, y: 808, w: 280, h: 292 }]

    return {
      id: `cphub-${platform}`,
      ariaLabel: p('diagram_label'),
      initial: { cpc: 'empty', asc: 'empty', ccc: 'empty', appauth: 'idle', safe: 'idle', pw: 'v1' },
      nodes: [
        { id: 'appA', domain: 'cp', Icon: AppWindow, title: p('n_appA'), sub: p('n_appA_sub') },
        { id: 'cp', domain: 'idira', Icon: Server, title: 'Credential Provider', sub: p('n_cp_sub'), rows: [
          { label: 'cache', k: 'cpc', states: [{ v: 'empty', text: empty, tone: 'muted' }, { v: 'ok', text: cached, tone: 'ok' }] },
        ] },
        { id: 'appB', domain: 'cp', Icon: Boxes, title: p('n_appB'), sub: p('n_appB_sub') },
        { id: 'ascp', domain: 'idira', Icon: Server, title: 'ASCP', sub: p('n_ascp_sub'), rows: [
          { label: 'cache', k: 'asc', states: [{ v: 'empty', text: empty, tone: 'muted' }, { v: 'ok', text: cached, tone: 'ok' }] },
        ] },
        { id: 'remote', domain: 'cp', Icon: Terminal, title: p('n_remote'), sub: p('n_remote_sub') },
        { id: 'ccp', domain: 'idira', Icon: Globe, title: 'Central Credential Provider', sub: 'IIS · AIMWebService', rows: [
          { label: 'cache', k: 'ccc', states: [{ v: 'empty', text: empty, tone: 'muted' }, { v: 'ok', text: cached, tone: 'ok' }] },
        ] },
        { id: 'vault', domain: 'idira', Icon: Vault, title: saas ? 'Privilege Cloud' : p('n_vault_sh'), sub: saas ? p('n_vault_saas_sub') : p('n_vault_sh_sub'), rows: [
          { label: p('r_appauth'), k: 'appauth', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_valid'), tone: 'ok' }] },
          { label: p('r_safe'), k: 'safe', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_allowed'), tone: 'ok' }] },
          { label: 'password', k: 'pw', states: [{ v: 'v1', text: 'v1', tone: 'muted' }, { v: 'v2', text: p('st_rotated'), tone: 'ok' }] },
        ] },
        { id: 'cpm', domain: 'idira', Icon: RefreshCw, title: saas ? p('n_cpm_saas') : 'CPM', sub: saas ? p('n_cpm_saas_sub') : p('n_cpm_sh_sub') },
      ],
      edgeKinds: {
        'appA-cp': 'identity', 'appB-ascp': 'identity', 'remote-ccp': 'identity',
        'cp-vault': 'identity', 'ascp-vault': 'identity', 'ccp-vault': 'identity', 'cpm-vault': 'control',
      },
      layouts: {
        wide: {
          w: 980, h: 490, title: 14,
          boxes: {
            appA: { x: 16, y: 40, w: 190, h: 96 }, cp: { x: 290, y: 40, w: 240, h: 96 },
            appB: { x: 16, y: 190, w: 190, h: 96 }, ascp: { x: 290, y: 190, w: 240, h: 96 },
            remote: { x: 16, y: 340, w: 190, h: 96 }, ccp: { x: 290, y: 340, w: 240, h: 96 },
            vault: { x: 700, y: 150, w: 264, h: 130 }, cpm: { x: 700, y: 380, w: 264, h: 84 },
          },
          zones: wideZones,
          lanes: [{ x: 16, y: 20, text: p('lane_apps') }, { x: 700, y: 130, text: saas ? p('lane_cloud') : p('lane_pam') }]
            .concat(saas ? [{ x: 700, y: 360, text: p('lane_net') }] : []),
          edges: {
            'appA-cp': 'M 206,88 L 290,88', 'appB-ascp': 'M 206,238 L 290,238', 'remote-ccp': 'M 206,388 L 290,388',
            'cp-vault': 'M 530,88 C 620,88 630,190 700,190', 'ascp-vault': 'M 530,238 L 700,238',
            'ccp-vault': 'M 530,388 C 620,388 630,262 700,262', 'cpm-vault': 'M 832,380 L 832,280',
          },
          labels: [
            { x: 248, y: 70, text: 'SDK' }, { x: 248, y: 220, text: 'JDBC' }, { x: 248, y: 370, text: 'REST' },
            { x: 615, y: 222, text: 'TCP 1858' },
            { x: 900, y: 330, text: p('lbl_rotate') },
          ],
        },
        narrow: {
          w: 360, h: 1120, title: 14,
          boxes: {
            appA: { x: 70, y: 30, w: 220, h: 84 }, cp: { x: 50, y: 150, w: 260, h: 96 },
            appB: { x: 70, y: 290, w: 220, h: 84 }, ascp: { x: 50, y: 410, w: 260, h: 96 },
            remote: { x: 70, y: 550, w: 220, h: 84 }, ccp: { x: 50, y: 670, w: 260, h: 96 },
            vault: { x: 50, y: 820, w: 260, h: 130 }, cpm: { x: 50, y: 1006, w: 260, h: 84 },
          },
          zones: narrowZones,
          lanes: [{ x: 16, y: 14, text: p('lane_apps') }],
          edges: {
            'appA-cp': 'M 180,114 L 180,150', 'appB-ascp': 'M 180,374 L 180,410', 'remote-ccp': 'M 180,634 L 180,670',
            'cp-vault': 'M 310,198 C 352,198 352,850 310,850', 'ascp-vault': 'M 310,458 C 344,458 344,880 310,880',
            'ccp-vault': 'M 50,718 C 14,718 14,880 50,880', 'cpm-vault': 'M 180,1006 L 180,950',
          },
        },
      },
      steps: [
        { ...step(1), focus: ['appA', 'appB', 'remote'], end: 0.6, fx: [] },
        { ...step(2), focus: ['appA', 'cp', 'vault'], end: 3.4, fx: [
          { t: 'packet', at: 0.3, edge: 'appA-cp', label: p('p_appid') },
          { t: 'packet', at: 1.3, edge: 'cp-vault', label: p('p_provuser') },
          { t: 'packet', at: 2.3, edge: 'cp-vault', label: 'password', kind: 'secret', reverse: true },
          { t: 'set', at: 3.0, k: 'cpc', v: 'ok', pop: true }] },
        { ...step(3), focus: ['appB', 'ascp', 'vault'], end: 3.4, fx: [
          { t: 'packet', at: 0.3, edge: 'appB-ascp', label: p('p_datasource') },
          { t: 'packet', at: 1.3, edge: 'ascp-vault', label: p('p_provuser') },
          { t: 'packet', at: 2.3, edge: 'ascp-vault', label: 'password', kind: 'secret', reverse: true },
          { t: 'set', at: 3.0, k: 'asc', v: 'ok', pop: true }] },
        { ...step(4), focus: ['remote', 'ccp', 'vault'], end: 3.4, fx: [
          { t: 'packet', at: 0.3, edge: 'remote-ccp', label: 'GET /AIMWebService/api/Accounts' },
          { t: 'packet', at: 1.3, edge: 'ccp-vault', label: p('p_provuser') },
          { t: 'packet', at: 2.3, edge: 'ccp-vault', label: 'password', kind: 'secret', reverse: true },
          { t: 'set', at: 3.0, k: 'ccc', v: 'ok', pop: true }] },
        { ...step(5), focus: ['vault'], end: 1.6, fx: [
          { t: 'set', at: 0.3, k: 'appauth', v: 'ok', pop: true }, { t: 'set', at: 0.9, k: 'safe', v: 'ok', pop: true }] },
        { ...step(6), focus: ['cpm', 'vault', 'cp', 'ascp', 'ccp'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'cpm-vault', label: p('p_newpw') }, { t: 'set', at: 1.3, k: 'pw', v: 'v2', pop: true }] },
        { ...step(7), focus: ['cp', 'ascp', 'ccp', 'vault'], end: 0.8, fx: [] },
      ],
    }
  }, [t, platform])
  return <FlowPlayer key={platform} spec={spec} />
}
