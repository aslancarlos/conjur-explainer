import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Database, Plug, RefreshCw, Server, ShieldCheck, Vault } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from '../../FlowPlayer'
import type { Platform } from '../../../cp/CpPieces'

/**
 * Application Server Credential Provider (ASCP), JDBC Driver Proxy model.
 * The data source points at com.cyberark.jdbc.ASCPDriver with dummy user and
 * password; on each new pool connection the driver asks the local Credential
 * Provider (Java Password SDK, default port 18923), which authenticates the
 * application, fetches the account from the Vault (PAM Self-Hosted) or from
 * Privilege Cloud (Vault port 1858 by default), and the driver hands the real
 * credential to the native JDBC driver. Source: credential-providers docs
 * (tomcat-jdbc-proxy-config, weblogic_jdbcdrivemodel, jboss-proxymoduleconfig,
 * configuring-caching, cv_automatic_dual_account, silent-installation-windows).
 */
export default function AscpFlow({ platform }: { platform: Platform }) {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const saas = platform === 'saas'
    const p = (k: string) => t(`cp_ascp.${k}`)
    // platform-specific copy falls back to the shared key
    const px = (k: string) => (saas ? t(`cp_ascp.${k}_saas`, { defaultValue: t(`cp_ascp.${k}`) }) : t(`cp_ascp.${k}`))
    const step = (n: number) => ({ title: px(`s${n}_title`), desc: px(`s${n}_desc`) })
    const pend = t('idflow.st_pending')
    const idle = t('idflow.st_idle')
    const check = t('idflow.st_check')
    return {
      id: saas ? 'cp-ascp-saas' : 'cp-ascp-sh',
      ariaLabel: px('diagram_label'),
      initial: { pool: 'none', req: 'idle', auth: 'idle', cache: 'empty', safe: 'idle', acct: 'v1', audit: 'idle', rot: 'idle', db: 'idle' },
      nodes: [
        { id: 'app', domain: 'cp', Icon: Server, title: p('n_app'), sub: 'Tomcat · WebLogic · JBoss · WebSphere', rows: [
          { label: p('r_driver'), value: 'ASCPDriver', tone: 'ok' },
          { label: p('r_config_pw'), value: p('st_dummy'), tone: 'ok' },
          { label: p('r_pool'), k: 'pool', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'conn', text: p('st_pooled'), tone: 'ok' }] },
        ] },
        { id: 'ascp', domain: 'idira', Icon: Plug, title: 'ASCP JDBC Driver Proxy', sub: 'com.cyberark.jdbc.ASCPDriver', rows: [
          { label: p('r_request'), k: 'req', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'sent', text: p('st_requested'), tone: 'warn' }, { v: 'ok', text: p('st_injected'), tone: 'ok' }] },
        ] },
        { id: 'cp', domain: 'idira', Icon: ShieldCheck, title: p('n_cp'), sub: p('n_cp_sub'), rows: [
          { label: p('r_app_auth'), k: 'auth', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: check, tone: 'warn' }, { v: 'ok', text: t('idflow.st_valid'), tone: 'ok' }] },
          { label: p('r_cache'), k: 'cache', states: [{ v: 'empty', text: p('st_empty'), tone: 'muted' }, { v: 'v1', text: 'v1', tone: 'ok' }, { v: 'v2', text: 'v2', tone: 'ok' }] },
        ] },
        { id: 'vault', domain: 'idira', Icon: Vault, title: saas ? 'Privilege Cloud' : 'Vault', sub: px('n_vault_sub'), rows: [
          { label: p('r_safe'), k: 'safe', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_retrieve'), tone: 'ok' }] },
          { label: p('r_account'), k: 'acct', states: [{ v: 'v1', text: 'v1', tone: 'muted' }, { v: 'v2', text: 'v2', tone: 'ok' }] },
          { label: p('r_audit'), k: 'audit', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_logged'), tone: 'ok' }] },
        ] },
        { id: 'cpm', domain: 'idira', Icon: RefreshCw, title: 'CPM', sub: p('n_cpm_sub'), rows: [
          { label: p('r_rotation'), k: 'rot', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'done', text: p('st_rotated'), tone: 'ok' }] },
        ] },
        { id: 'db', domain: 'svc', Icon: Database, title: p('n_db'), sub: 'Oracle · MSSQL · DB2 · PostgreSQL', rows: [
          { label: p('r_session'), k: 'db', states: [{ v: 'idle', text: pend, tone: 'muted' }, { v: 'ok', text: t('idflow.st_connected'), tone: 'ok' }] },
        ] },
      ],
      edgeKinds: { 'app-ascp': 'access', 'ascp-cp': 'identity', 'cp-vault': 'identity', 'ascp-db': 'access', 'cpm-db': 'control', 'cpm-vault': 'control' },
      layouts: {
        wide: {
          w: 980, h: 590,
          boxes: {
            app: { x: 16, y: 40, w: 252, h: 130 }, ascp: { x: 16, y: 250, w: 252, h: 96 }, cp: { x: 16, y: 430, w: 252, h: 120 },
            db: { x: 440, y: 60, w: 250, h: 96 }, vault: { x: 440, y: 430, w: 250, h: 136 }, cpm: { x: 740, y: 440, w: 224, h: 96 },
          },
          zones: [
            { d: 'cp', x: 6, y: 28, w: 272, h: 534 },
            { d: 'svc', x: 430, y: 48, w: 270, h: 120 },
            { d: 'idira', x: 430, y: 418, w: 544, h: 160 },
          ],
          lanes: [{ x: 16, y: 20, text: p('lane_host') }, { x: 440, y: 40, text: p('lane_target') }, { x: 440, y: 410, text: px('lane_pam') }],
          edges: {
            'app-ascp': 'M 142,170 L 142,250', 'ascp-cp': 'M 142,346 L 142,430', 'cp-vault': 'M 268,490 L 440,490',
            'ascp-db': 'M 268,298 C 360,298 360,108 440,108', 'cpm-db': 'M 852,440 C 852,108 770,108 690,108', 'cpm-vault': 'M 740,488 L 690,488',
          },
          labels: [
            { x: 142, y: 388, text: 'localhost :18923' },
            { x: 354, y: 474, text: 'TCP 1858' },
            { x: 342, y: 203, text: p('lbl_jdbc') },
            { x: 812, y: 150, text: p('lbl_change') },
          ],
        },
        narrow: {
          w: 360, h: 930, title: 14,
          boxes: {
            app: { x: 60, y: 30, w: 240, h: 130 }, ascp: { x: 60, y: 200, w: 240, h: 96 }, cp: { x: 60, y: 336, w: 240, h: 120 },
            vault: { x: 60, y: 500, w: 240, h: 136 }, cpm: { x: 60, y: 676, w: 240, h: 96 }, db: { x: 60, y: 812, w: 240, h: 96 },
          },
          zones: [{ d: 'cp', x: 50, y: 20, w: 260, h: 446 }, { d: 'idira', x: 50, y: 490, w: 260, h: 292 }, { d: 'svc', x: 50, y: 802, w: 260, h: 116 }],
          edges: {
            'app-ascp': 'M 180,160 L 180,200', 'ascp-cp': 'M 180,296 L 180,336', 'cp-vault': 'M 180,456 L 180,500',
            'ascp-db': 'M 300,248 C 350,248 350,860 300,860', 'cpm-db': 'M 180,772 L 180,812', 'cpm-vault': 'M 180,676 L 180,636',
          },
        },
      },
      steps: [
        { ...step(1), focus: ['app', 'ascp', 'cp', 'vault'], end: 0.6, fx: [] },
        { ...step(2), focus: ['app'], end: 0.6, fx: [] },
        { ...step(3), focus: ['app', 'ascp'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'app-ascp', label: 'getConnection()' }, { t: 'set', at: 1.3, k: 'req', v: 'sent', pop: true }] },
        { ...step(4), focus: ['ascp', 'cp'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'ascp-cp', label: p('p_request') }, { t: 'set', at: 1.3, k: 'auth', v: 'check' }] },
        { ...step(5), focus: ['cp'], end: 1.2, fx: [{ t: 'set', at: 0.4, k: 'auth', v: 'ok', pop: true }] },
        { ...step(6), focus: ['cp', 'vault'], end: 3.2, fx: [
          { t: 'packet', at: 0.3, edge: 'cp-vault', label: p('p_get') }, { t: 'set', at: 1.3, k: 'safe', v: 'ok', pop: true },
          { t: 'packet', at: 1.6, edge: 'cp-vault', label: p('p_credential'), kind: 'secret', reverse: true }, { t: 'set', at: 2.6, k: 'cache', v: 'v1', pop: true }] },
        { ...step(7), focus: ['ascp', 'db', 'app'], end: 3.4, fx: [
          { t: 'packet', at: 0.3, edge: 'ascp-cp', label: p('p_credential'), kind: 'secret', reverse: true }, { t: 'set', at: 1.3, k: 'req', v: 'ok', pop: true },
          { t: 'packet', at: 1.6, edge: 'ascp-db', label: p('p_login') }, { t: 'set', at: 2.6, k: 'db', v: 'ok', pop: true },
          { t: 'set', at: 2.8, k: 'pool', v: 'conn', pop: true }] },
        { ...step(8), focus: ['cpm', 'db', 'vault', 'cp'], end: 3.6, fx: [
          { t: 'packet', at: 0.3, edge: 'cpm-db', label: p('p_change') }, { t: 'set', at: 1.3, k: 'rot', v: 'done', pop: true },
          { t: 'packet', at: 1.5, edge: 'cpm-vault', label: 'v2' }, { t: 'set', at: 2.5, k: 'acct', v: 'v2', pop: true },
          { t: 'set', at: 3.0, k: 'cache', v: 'v2', pop: true }] },
        { ...step(9), focus: ['vault', 'cp'], end: 1.0, fx: [{ t: 'set', at: 0.4, k: 'audit', v: 'ok', pop: true }] },
      ],
    }
  }, [t, platform])
  return <FlowPlayer key={platform} spec={spec} />
}
