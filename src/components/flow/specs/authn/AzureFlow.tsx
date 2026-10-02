import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Building2, Database, MonitorCog, Server, Vault } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from '../../FlowPlayer'

/**
 * Azure authenticator (authn-azure): the workload asks the Azure Instance
 * Metadata Service for an Azure AD token, posts it to Secrets Manager, which
 * checks it against the configured provider URI and matches the subscription,
 * resource group and (optional) managed identity annotations on the host.
 */
export default function AzureFlow() {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const p = (k: string) => t(`authn_azure.flow.${k}`)
    const step = (n: number) => ({ title: p(`s${n}_title`), desc: p(`s${n}_desc`) })
    const pend = p('st_pending'), idle = p('st_idle'), check = p('st_check')
    return {
      id: 'authn-azure',
      ariaLabel: p('diagram_label'),
      initial: { aad: 'none', tok: 'none', sec: 'none', perm: 'idle', iss: 'idle', ann: 'idle', pol: 'idle', db: 'idle' },
      nodes: [
        { id: 'imds', domain: 'svc', Icon: MonitorCog, title: 'Azure IMDS', sub: p('n_imds_sub') },
        { id: 'wl', domain: 'cp', Icon: Server, title: p('n_wl'), sub: p('n_wl_sub'), rows: [
          { label: p('r_aad'), k: 'aad', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: 'JWT', tone: 'ok' }] },
          { label: p('r_token'), k: 'tok', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_received'), tone: 'ok' }] },
          { label: p('r_secret'), k: 'sec', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_memory'), tone: 'ok' }] },
        ] },
        { id: 'sm', domain: 'idira', Icon: Vault, title: 'IDIRA Secrets Manager', sub: 'authn-azure/{service-id}', rows: [
          { label: p('r_perm'), k: 'perm', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: check, tone: 'warn' }, { v: 'ok', text: p('st_apps'), tone: 'ok' }] },
          { label: p('r_issuer'), k: 'iss', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: check, tone: 'warn' }, { v: 'ok', text: p('st_valid'), tone: 'ok' }] },
          { label: p('r_annot'), k: 'ann', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: check, tone: 'warn' }, { v: 'ok', text: p('st_match'), tone: 'ok' }] },
          { label: 'policy', k: 'pol', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_allowed'), tone: 'ok' }] },
        ] },
        { id: 'aad', domain: 'svc', Icon: Building2, title: 'Microsoft Entra ID', sub: 'sts.windows.net/{tenant}/', rows: [
          { label: p('r_provider'), value: 'provider-uri' },
        ] },
        { id: 'db', domain: 'svc', Icon: Database, title: p('n_db'), sub: p('n_db_sub'), rows: [
          { label: p('r_session'), k: 'db', states: [{ v: 'idle', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_connected'), tone: 'ok' }] },
        ] },
      ],
      edgeKinds: { 'wl-imds': 'identity', 'wl-sm': 'identity', 'sm-wl': 'identity', 'sm-aad': 'control', 'wl-db': 'access' },
      layouts: {
        wide: {
          w: 980, h: 430,
          boxes: {
            imds: { x: 40, y: 20, w: 240, h: 76 }, wl: { x: 40, y: 160, w: 240, h: 136 },
            sm: { x: 420, y: 140, w: 260, h: 160 }, aad: { x: 760, y: 20, w: 200, h: 96 },
            db: { x: 760, y: 310, w: 200, h: 96 },
          },
          zones: [
            { d: 'svc', x: 28, y: 10, w: 264, h: 96 }, { d: 'cp', x: 28, y: 148, w: 264, h: 160 },
            { d: 'idira', x: 408, y: 128, w: 284, h: 184 }, { d: 'svc', x: 748, y: 10, w: 224, h: 116 },
            { d: 'svc', x: 748, y: 298, w: 224, h: 120 },
          ],
          edges: {
            'wl-imds': 'M 160,160 L 160,96', 'wl-sm': 'M 280,196 L 420,196', 'sm-wl': 'M 420,258 L 280,258',
            'sm-aad': 'M 680,170 C 720,170 720,68 760,68', 'wl-db': 'M 280,282 C 520,370 640,358 760,358',
          },
          labels: [
            { x: 160, y: 128, text: 'IMDS 169.254.169.254' },
            { x: 860, y: 140, text: 'provider-uri (issuer)' },
            { x: 370, y: 400, text: 'POST /api/authn-azure/{service-id}/conjur/{host-id}/authenticate' },
          ],
        },
        narrow: {
          w: 360, h: 920, title: 14,
          boxes: {
            imds: { x: 50, y: 30, w: 260, h: 76 }, wl: { x: 50, y: 150, w: 260, h: 136 },
            sm: { x: 50, y: 360, w: 260, h: 160 }, aad: { x: 50, y: 590, w: 260, h: 96 },
            db: { x: 50, y: 790, w: 260, h: 96 },
          },
          edges: {
            'wl-imds': 'M 180,150 L 180,106', 'wl-sm': 'M 160,286 L 160,360', 'sm-wl': 'M 200,360 L 200,286',
            'sm-aad': 'M 180,520 L 180,590', 'wl-db': 'M 310,218 C 352,218 352,838 310,838',
          },
        },
      },
      steps: [
        { ...step(1), focus: ['wl', 'sm'], end: 0.6, fx: [] },
        { ...step(2), focus: ['wl', 'imds'], end: 3.4, fx: [
          { t: 'packet', at: 0.3, edge: 'wl-imds', label: p('p_ask') },
          { t: 'packet', at: 1.6, edge: 'wl-imds', label: p('p_jwt'), reverse: true }, { t: 'set', at: 2.6, k: 'aad', v: 'ok', pop: true }] },
        { ...step(3), focus: ['wl', 'sm'], end: 2.6, fx: [
          { t: 'packet', at: 0.3, edge: 'wl-sm', label: 'jwt=…' }, { t: 'set', at: 1.3, k: 'perm', v: 'check' }, { t: 'set', at: 2.0, k: 'perm', v: 'ok', pop: true }] },
        { ...step(4), focus: ['sm', 'aad'], end: 2.6, fx: [
          { t: 'set', at: 0.2, k: 'iss', v: 'check' }, { t: 'packet', at: 0.3, edge: 'sm-aad', label: p('p_issuer') },
          { t: 'set', at: 1.8, k: 'iss', v: 'ok', pop: true }] },
        { ...step(5), focus: ['sm'], end: 1.8, fx: [
          { t: 'set', at: 0.2, k: 'ann', v: 'check' }, { t: 'set', at: 1.0, k: 'ann', v: 'ok', pop: true }] },
        { ...step(6), focus: ['sm', 'wl'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'sm-wl', label: p('p_token') }, { t: 'set', at: 1.3, k: 'tok', v: 'ok', pop: true }] },
        { ...step(7), focus: ['wl', 'sm'], end: 3.6, fx: [
          { t: 'packet', at: 0.3, edge: 'wl-sm', label: p('p_get') }, { t: 'set', at: 1.2, k: 'pol', v: 'ok', pop: true },
          { t: 'packet', at: 1.6, edge: 'sm-wl', label: p('p_secret'), kind: 'secret' }, { t: 'set', at: 2.6, k: 'sec', v: 'ok', pop: true }] },
        { ...step(8), focus: ['wl', 'db'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'wl-db', label: p('p_login') }, { t: 'set', at: 1.4, k: 'db', v: 'ok', pop: true }] },
      ],
    }
  }, [t])
  return <FlowPlayer spec={spec} />
}
