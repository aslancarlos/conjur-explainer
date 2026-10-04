import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BadgeCheck, Laptop, Server, UserCog, Vault } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from '../../FlowPlayer'

/**
 * Certificate Manager issuer (issue request): an authenticated workload in the
 * issuer's executors group asks Secrets Manager for a certificate; Secrets
 * Manager builds the CSR, Certificate Manager, SaaS signs it through the
 * zone's issuing template and the workload receives certificate, chain and
 * private key.
 */
export default function CertificateFlow() {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const p = (k: string) => t(`sm_certs.flow.${k}`)
    const step = (n: number) => ({ title: p(`s${n}_title`), desc: p(`s${n}_desc`) })
    const pend = p('st_pending'), idle = p('st_idle'), check = p('st_check')
    return {
      id: 'sm-certs',
      ariaLabel: p('diagram_label'),
      initial: { tok: 'none', cert: 'none', key: 'none', conn: 'idle', perm: 'idle', csr: 'idle', tpl: 'idle', peer: 'idle' },
      nodes: [
        { id: 'svc', domain: 'neutral', Icon: UserCog, title: p('n_svcuser'), sub: 'identity-sa-cert-man' },
        { id: 'wl', domain: 'cp', Icon: Server, title: p('n_wl'), sub: p('n_wl_sub'), rows: [
          { label: p('r_token'), k: 'tok', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_received'), tone: 'ok' }] },
          { label: p('r_cert'), k: 'cert', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: 'P3M', tone: 'ok' }] },
          { label: p('r_key'), k: 'key', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: 'RSA_2048', tone: 'ok' }] },
        ] },
        { id: 'sm', domain: 'idira', Icon: Vault, title: 'IDIRA Secrets Manager', sub: 'issuer · pki_cert_mgr_saas', rows: [
          { label: p('r_conn'), k: 'conn', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_ready'), tone: 'ok' }] },
          { label: p('r_perm'), k: 'perm', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: check, tone: 'warn' }, { v: 'ok', text: 'executors', tone: 'ok' }] },
          { label: 'CSR', k: 'csr', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_generated'), tone: 'ok' }] },
        ] },
        { id: 'cm', domain: 'svc', Icon: BadgeCheck, title: 'Certificate Manager', sub: 'SaaS · app\\template', rows: [
          { label: p('r_template'), k: 'tpl', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: check, tone: 'warn' }, { v: 'ok', text: p('st_signed'), tone: 'ok' }] },
        ] },
        { id: 'peer', domain: 'neutral', Icon: Laptop, title: p('n_peer'), sub: 'TLS · mTLS', rows: [
          { label: p('r_handshake'), k: 'peer', states: [{ v: 'idle', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_trusted'), tone: 'ok' }] },
        ] },
      ],
      edgeKinds: { 'svc-sm': 'control', 'wl-sm': 'identity', 'sm-wl': 'identity', 'sm-cm': 'identity', 'wl-peer': 'access' },
      layouts: {
        wide: {
          w: 980, h: 430,
          boxes: {
            svc: { x: 420, y: 20, w: 260, h: 76 }, wl: { x: 40, y: 150, w: 240, h: 136 },
            sm: { x: 420, y: 150, w: 260, h: 140 }, cm: { x: 740, y: 20, w: 220, h: 106 },
            peer: { x: 740, y: 300, w: 220, h: 96 },
          },
          zones: [
            { d: 'neutral', x: 408, y: 10, w: 284, h: 96 }, { d: 'cp', x: 28, y: 138, w: 264, h: 160 },
            { d: 'idira', x: 408, y: 138, w: 284, h: 164 }, { d: 'svc', x: 728, y: 10, w: 244, h: 126 },
            { d: 'neutral', x: 728, y: 288, w: 244, h: 120 },
          ],
          edges: {
            'svc-sm': 'M 550,96 L 550,150', 'wl-sm': 'M 280,190 L 420,190', 'sm-wl': 'M 420,256 L 280,256',
            'sm-cm': 'M 680,178 C 710,178 710,73 740,73', 'wl-peer': 'M 160,286 C 160,348 520,348 740,348',
          },
          labels: [
            { x: 850, y: 148, text: 'api.venafi.cloud · OAuth' },
            { x: 420, y: 400, text: 'POST /api/issuers/{issuer}/issue' },
          ],
        },
        narrow: {
          w: 360, h: 900, title: 14,
          boxes: {
            svc: { x: 50, y: 30, w: 260, h: 76 }, sm: { x: 50, y: 160, w: 260, h: 140 },
            wl: { x: 50, y: 380, w: 260, h: 136 }, cm: { x: 50, y: 580, w: 260, h: 106 },
            peer: { x: 50, y: 770, w: 260, h: 96 },
          },
          edges: {
            'svc-sm': 'M 180,106 L 180,160', 'wl-sm': 'M 160,380 L 160,300', 'sm-wl': 'M 200,300 L 200,380',
            'sm-cm': 'M 310,230 C 352,230 352,633 310,633', 'wl-peer': 'M 50,448 C 8,448 8,818 50,818',
          },
        },
      },
      steps: [
        { ...step(1), focus: ['wl', 'sm', 'cm'], end: 0.6, fx: [] },
        { ...step(2), focus: ['svc', 'sm'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'svc-sm', label: p('p_creds') }, { t: 'set', at: 1.3, k: 'conn', v: 'ok', pop: true }] },
        { ...step(3), focus: ['wl', 'sm'], end: 2.6, fx: [
          { t: 'packet', at: 0.3, edge: 'wl-sm', label: p('p_authn') },
          { t: 'packet', at: 1.3, edge: 'sm-wl', label: p('p_token') }, { t: 'set', at: 2.2, k: 'tok', v: 'ok', pop: true }] },
        { ...step(4), focus: ['wl', 'sm'], end: 2.6, fx: [
          { t: 'packet', at: 0.3, edge: 'wl-sm', label: 'common_name · ttl · zone' }, { t: 'set', at: 1.3, k: 'perm', v: 'check' },
          { t: 'set', at: 2.0, k: 'perm', v: 'ok', pop: true }] },
        { ...step(5), focus: ['sm', 'cm'], end: 2.8, fx: [
          { t: 'set', at: 0.3, k: 'csr', v: 'ok', pop: true },
          { t: 'packet', at: 0.8, edge: 'sm-cm', label: 'CSR + zone' }, { t: 'set', at: 1.9, k: 'tpl', v: 'check' }] },
        { ...step(6), focus: ['cm', 'sm'], end: 2.4, fx: [
          { t: 'set', at: 0.3, k: 'tpl', v: 'ok', pop: true },
          { t: 'packet', at: 0.6, edge: 'sm-cm', label: p('p_signed'), reverse: true, kind: 'secret' }] },
        { ...step(7), focus: ['sm', 'wl'], end: 2.6, fx: [
          { t: 'packet', at: 0.3, edge: 'sm-wl', label: 'certificate · chain · private_key', kind: 'secret' },
          { t: 'set', at: 1.3, k: 'cert', v: 'ok', pop: true }, { t: 'set', at: 1.6, k: 'key', v: 'ok', pop: true }] },
        { ...step(8), focus: ['wl', 'peer'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'wl-peer', label: p('p_tls') }, { t: 'set', at: 1.5, k: 'peer', v: 'ok', pop: true }] },
      ],
    }
  }, [t])
  return <FlowPlayer spec={spec} />
}
