import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AppWindow, Database, RefreshCw, Server, UserCog, Vault } from 'lucide-react'
import FlowPlayer, { type FlowSpec, type FlowLayout } from '../../FlowPlayer'
import type { Platform } from '../../../cp/CpPieces'

/**
 * Credential Provider (agent on the application host), step by step:
 * installation creates the provider user (Prov_<host>) and the AppProviderConf /
 * AppProviderCacheSafe Safes; the admin defines the application (AppID +
 * authentication methods) and adds the provider and the application as Safe
 * members; the app asks the local CP through an Application Password SDK; the
 * CP authenticates the app, fetches the password from the Vault with its
 * provider user (Vault protocol, default port 1858), caches it encrypted and
 * refreshes it in the background; CPM rotations reach the cache; every request
 * is audited (Vault log, or the local APPAudit.log for cache hits).
 * Self-Hosted: PVWA + on-prem Vault + CPM. Privilege Cloud: Idira user portal +
 * SaaS Vault, CPM on the Privilege Cloud Connector in your network.
 */
export default function CredentialProviderFlow({ platform }: { platform: Platform }) {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const p = (k: string) => t(`cp_cp.flow.${k}`)
    const step = (n: number) => ({ title: p(`s${n}_title`), desc: p(`s${n}_desc_${platform}`) })
    const saas = platform === 'saas'
    const idle = t('idflow.st_idle')
    const pend = t('idflow.st_pending')
    const check = t('idflow.st_check')

    const zonesWide: FlowLayout['zones'] = [
      { d: 'neutral', x: 6, y: 28, w: 230, h: 108 },
      { d: 'cp', x: 6, y: 184, w: 584, h: 170 },
      { d: 'svc', x: 320, y: 408, w: 270, h: 108 },
      ...(saas
        ? [{ d: 'idira' as const, x: 670, y: 28, w: 304, h: 172 }, { d: 'neutral' as const, x: 670, y: 288, w: 304, h: 108 }]
        : [{ d: 'idira' as const, x: 670, y: 28, w: 304, h: 368 }]),
    ]
    const zonesNarrow: FlowLayout['zones'] = [
      { d: 'neutral', x: 60, y: 20, w: 240, h: 104 },
      { d: 'cp', x: 40, y: 160, w: 280, h: 330 },
      { d: 'svc', x: 60, y: 520, w: 240, h: 108 },
      ...(saas
        ? [{ d: 'idira' as const, x: 40, y: 660, w: 280, h: 172 }, { d: 'neutral' as const, x: 40, y: 860, w: 280, h: 108 }]
        : [{ d: 'idira' as const, x: 40, y: 660, w: 280, h: 308 }]),
    ]

    return {
      id: `cp-cp-${platform}`,
      ariaLabel: p('diagram_label'),
      initial: { apw: 'none', auth: 'idle', cache: 'empty', laudit: 'idle', app: 'idle', safe: 'idle', pw: 'v1', vaudit: 'idle', tgt: 'idle' },
      nodes: [
        { id: 'admin', domain: 'neutral', Icon: UserCog, title: p('n_admin'), sub: saas ? p('n_admin_sub_saas') : 'PVWA' },
        { id: 'app', domain: 'cp', Icon: AppWindow, title: p('n_app'), sub: 'Java · .NET · C · CLI SDK', rows: [
          { label: 'AppID', value: 'BillingApp' },
          { label: 'password', k: 'apw', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_received'), tone: 'ok' }, { v: 'v2', text: p('st_new'), tone: 'ok' }] },
        ] },
        { id: 'cp', domain: 'idira', Icon: Server, title: 'Credential Provider', sub: p('n_cp_sub'), rows: [
          { label: p('r_appauth'), k: 'auth', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: check, tone: 'warn' }, { v: 'ok', text: p('st_valid'), tone: 'ok' }] },
          { label: 'cache', k: 'cache', states: [{ v: 'empty', text: p('st_empty'), tone: 'muted' }, { v: 'ok', text: p('st_encrypted'), tone: 'ok' }, { v: 'ref', text: p('st_refreshed'), tone: 'ok' }] },
          { label: 'APPAudit.log', k: 'laudit', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_logged'), tone: 'ok' }] },
        ] },
        { id: 'vault', domain: 'idira', Icon: Vault, title: saas ? 'Privilege Cloud' : p('n_vault_sh'), sub: saas ? p('n_vault_saas_sub') : p('n_vault_sh_sub'), rows: [
          { label: p('r_app'), k: 'app', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_defined'), tone: 'ok' }] },
          { label: 'Safe', k: 'safe', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_allowed'), tone: 'ok' }] },
          { label: 'password', k: 'pw', states: [{ v: 'v1', text: 'v1', tone: 'muted' }, { v: 'v2', text: p('st_rotated'), tone: 'ok' }] },
          { label: 'audit', k: 'vaudit', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_logged'), tone: 'ok' }] },
        ] },
        { id: 'cpm', domain: 'idira', Icon: RefreshCw, title: saas ? p('n_cpm_saas') : 'CPM', sub: saas ? p('n_cpm_saas_sub') : p('n_cpm_sh_sub') },
        { id: 'target', domain: 'svc', Icon: Database, title: p('n_target'), sub: p('n_target_sub'), rows: [
          { label: p('r_session'), k: 'tgt', states: [{ v: 'idle', text: pend, tone: 'muted' }, { v: 'ok', text: t('idflow.st_connected'), tone: 'ok' }] },
        ] },
      ],
      edgeKinds: {
        'adm-vault': 'control', 'app-cp': 'identity', 'cp-vault': 'identity',
        'cpm-vault': 'control', 'cpm-target': 'control', 'app-target': 'access',
      },
      layouts: {
        wide: {
          w: 980, h: 530, title: 14,
          boxes: {
            admin: { x: 16, y: 40, w: 210, h: 84 },
            app: { x: 16, y: 212, w: 210, h: 116 }, cp: { x: 330, y: 196, w: 250, h: 148 },
            vault: { x: 680, y: 40, w: 284, h: 150 }, cpm: { x: 680, y: 300, w: 284, h: 84 },
            target: { x: 330, y: 420, w: 250, h: 84 },
          },
          zones: zonesWide,
          lanes: [{ x: 16, y: 176, text: p('lane_host') }, { x: 680, y: 20, text: saas ? p('lane_cloud') : p('lane_pam') }]
            .concat(saas ? [{ x: 680, y: 280, text: p('lane_net') }] : []),
          edges: {
            'adm-vault': 'M 226,82 L 680,82', 'app-cp': 'M 226,262 L 330,262',
            'cp-vault': 'M 580,240 C 640,240 640,170 680,170', 'cpm-vault': 'M 822,300 L 822,190',
            'cpm-target': 'M 680,342 C 630,342 630,462 580,462', 'app-target': 'M 120,328 C 120,462 250,462 330,462',
          },
          labels: [
            { x: 450, y: 66, text: saas ? p('lbl_portal') : 'PVWA' },
            { x: 278, y: 244, text: 'SDK' },
            { x: 630, y: 208, text: 'TCP 1858' },
            { x: 892, y: 245, text: p('lbl_rotate') },
            { x: 650, y: 410, text: p('lbl_change') },
          ],
        },
        narrow: {
          w: 360, h: 1000, title: 14,
          boxes: {
            admin: { x: 70, y: 30, w: 220, h: 84 },
            app: { x: 70, y: 170, w: 220, h: 116 }, cp: { x: 50, y: 330, w: 260, h: 148 },
            target: { x: 70, y: 530, w: 220, h: 84 },
            vault: { x: 50, y: 672, w: 260, h: 150 }, cpm: { x: 50, y: 872, w: 260, h: 84 },
          },
          zones: zonesNarrow,
          lanes: [{ x: 16, y: 152, text: p('lane_host') }],
          edges: {
            'adm-vault': 'M 290,72 C 352,72 352,700 310,700', 'app-cp': 'M 180,286 L 180,330',
            'cp-vault': 'M 50,404 C 12,404 12,746 50,746', 'cpm-vault': 'M 180,872 L 180,822',
            'cpm-target': 'M 310,914 C 352,914 352,572 290,572', 'app-target': 'M 70,228 C 24,228 24,572 70,572',
          },
        },
      },
      steps: [
        { ...step(1), focus: ['admin', 'cp', 'vault'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'adm-vault', label: 'AppProviderConf' },
          { t: 'packet', at: 1.3, edge: 'cp-vault', label: 'Prov_<host>' }] },
        { ...step(2), focus: ['admin', 'vault'], end: 2.0, fx: [
          { t: 'packet', at: 0.3, edge: 'adm-vault', label: p('p_appdef') }, { t: 'set', at: 1.3, k: 'app', v: 'ok', pop: true }] },
        { ...step(3), focus: ['app', 'cp'], end: 2.0, fx: [
          { t: 'packet', at: 0.3, edge: 'app-cp', label: p('p_request') }, { t: 'set', at: 1.3, k: 'auth', v: 'check' }] },
        { ...step(4), focus: ['cp'], end: 1.2, fx: [{ t: 'set', at: 0.3, k: 'auth', v: 'ok', pop: true }] },
        { ...step(5), focus: ['cp', 'vault'], end: 3.6, fx: [
          { t: 'packet', at: 0.3, edge: 'cp-vault', label: 'Prov_<host>' }, { t: 'set', at: 1.3, k: 'safe', v: 'ok', pop: true },
          { t: 'packet', at: 1.7, edge: 'cp-vault', label: 'password', kind: 'secret', reverse: true },
          { t: 'set', at: 2.7, k: 'cache', v: 'ok', pop: true }] },
        { ...step(6), focus: ['cp', 'app', 'target'], end: 3.2, fx: [
          { t: 'packet', at: 0.3, edge: 'app-cp', label: 'password', kind: 'secret', reverse: true }, { t: 'set', at: 1.3, k: 'apw', v: 'ok', pop: true },
          { t: 'packet', at: 1.6, edge: 'app-target', label: p('p_login') }, { t: 'set', at: 2.6, k: 'tgt', v: 'ok', pop: true }] },
        { ...step(7), focus: ['cp'], end: 1.2, fx: [{ t: 'set', at: 0.3, k: 'cache', v: 'ref', pop: true }] },
        { ...step(8), focus: ['cpm', 'vault', 'target', 'cp'], end: 4.0, fx: [
          { t: 'packet', at: 0.3, edge: 'cpm-target', label: p('p_change') },
          { t: 'packet', at: 0.3, edge: 'cpm-vault', label: p('p_newpw') }, { t: 'set', at: 1.3, k: 'pw', v: 'v2', pop: true },
          { t: 'packet', at: 1.8, edge: 'cp-vault', label: 'v2', kind: 'secret', reverse: true },
          { t: 'set', at: 2.8, k: 'apw', v: 'v2', pop: true }] },
        { ...step(9), focus: ['vault', 'cp'], end: 1.4, fx: [
          { t: 'set', at: 0.3, k: 'vaudit', v: 'ok', pop: true }, { t: 'set', at: 0.6, k: 'laudit', v: 'ok', pop: true }] },
      ],
    }
  }, [t, platform])
  return <FlowPlayer key={platform} spec={spec} />
}
