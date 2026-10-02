import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BadgeCheck, FileX2, HardDrive, ScrollText, Vault } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from '../../FlowPlayer'

/**
 * Client certificate authentication (authn-cert), step by step:
 * admin creates the authenticator (CA bundle, optional CRL), the workload is
 * defined with at least one certificate annotation, a CA issues the client
 * certificate, the workload authenticates over mTLS, Secrets Manager (Edge on
 * SaaS) checks chain, CRL/CDP and annotations, returns an access token, and
 * the workload fetches secrets.
 */
export default function CertAuthnFlow() {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const p = (k: string) => t(`authn_cert.flow.${k}`)
    const step = (n: number) => ({ title: p(`s${n}_title`), desc: p(`s${n}_desc`) })
    const pend = t('idflow.st_pending')
    const idle = t('idflow.st_idle')
    const ok = t('idflow.st_ok')
    return {
      id: 'authn-cert',
      ariaLabel: p('diagram_label'),
      initial: { cacert: 'idle', enabled: 'idle', wcert: 'none', wannot: 'none', wtok: 'none', wsec: 'none', tls: 'idle', crl: 'idle', annot: 'idle' },
      nodes: [
        { id: 'ca', domain: 'neutral', Icon: BadgeCheck, title: p('n_ca'), sub: p('n_ca_sub'), rows: [
          { label: p('r_issues'), value: 'X.509' },
        ] },
        { id: 'conf', domain: 'idira', Icon: ScrollText, title: p('n_conf'), sub: 'conjur/authn-cert/acme-vm', rows: [
          { label: 'ca-cert', k: 'cacert', states: [{ v: 'idle', text: pend, tone: 'muted' }, { v: 'ok', text: 'PEM', tone: 'ok' }] },
          { label: 'crl | crl-url', value: p('v_optional') },
          { label: p('r_enabled'), k: 'enabled', states: [{ v: 'idle', text: pend, tone: 'muted' }, { v: 'ok', text: ok, tone: 'ok' }] },
        ] },
        { id: 'wl', domain: 'cp', Icon: HardDrive, title: p('n_wl'), sub: 'host/data/vm-workloads/vm-01', rows: [
          { label: 'cert + key', k: 'wcert', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: ok, tone: 'ok' }] },
          { label: 'annotation', k: 'wannot', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: 'san-uri', tone: 'ok' }] },
          { label: 'access token', k: 'wtok', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: '8 min', tone: 'ok' }] },
          { label: 'secret', k: 'wsec', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: t('idflow.st_memory'), tone: 'ok' }] },
        ] },
        { id: 'sm', domain: 'idira', Icon: Vault, title: p('n_sm'), sub: 'authn-cert · mTLS', rows: [
          { label: 'TLS handshake', k: 'tls', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: t('idflow.st_check'), tone: 'warn' }, { v: 'ok', text: t('idflow.st_valid'), tone: 'ok' }] },
          { label: 'CRL / CDP', k: 'crl', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_not_revoked'), tone: 'ok' }] },
          { label: 'annotations', k: 'annot', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_match'), tone: 'ok' }] },
        ] },
        { id: 'crlnode', domain: 'neutral', Icon: FileX2, title: p('n_crl'), sub: 'cRLDistributionPoints', rows: [
          { label: p('r_protocol'), value: 'http | https' },
        ] },
      ],
      edgeKinds: { 'ca-wl': 'identity', 'conf-sm': 'control', 'wl-sm': 'identity', 'wl-sm2': 'access', 'sm-crl': 'control' },
      layouts: {
        wide: {
          w: 980, h: 500,
          boxes: {
            ca: { x: 16, y: 40, w: 250, h: 96 }, conf: { x: 16, y: 300, w: 220, h: 120 },
            wl: { x: 360, y: 40, w: 240, h: 160 }, sm: { x: 720, y: 40, w: 244, h: 140 },
            crlnode: { x: 720, y: 320, w: 244, h: 96 },
          },
          zones: [
            { d: 'neutral', x: 6, y: 28, w: 270, h: 120 }, { d: 'cp', x: 350, y: 28, w: 260, h: 184 },
            { d: 'idira', x: 710, y: 28, w: 264, h: 164 }, { d: 'idira', x: 6, y: 288, w: 240, h: 144 },
            { d: 'neutral', x: 710, y: 308, w: 264, h: 120 },
          ],
          edges: {
            'ca-wl': 'M 266,88 L 360,88',
            'wl-sm': 'M 600,90 L 720,90',
            'wl-sm2': 'M 600,150 L 720,150',
            'conf-sm': 'M 236,360 C 560,360 780,300 800,180',
            'sm-crl': 'M 900,180 L 900,320',
          },
          labels: [
            { x: 660, y: 66, text: 'mTLS' },
            { x: 480, y: 250, text: 'POST /authn-cert/{name}/{account}/{host}/authenticate' },
            { x: 900, y: 250, text: 'http(s)' },
          ],
        },
        narrow: {
          w: 360, h: 900, title: 14,
          boxes: {
            ca: { x: 55, y: 30, w: 250, h: 96 }, wl: { x: 60, y: 170, w: 240, h: 160 },
            sm: { x: 50, y: 380, w: 260, h: 140 }, crlnode: { x: 70, y: 570, w: 220, h: 96 },
            conf: { x: 70, y: 720, w: 220, h: 120 },
          },
          edges: {
            'ca-wl': 'M 180,126 L 180,170', 'wl-sm': 'M 150,330 L 150,380', 'wl-sm2': 'M 210,330 L 210,380',
            'sm-crl': 'M 180,520 L 180,570', 'conf-sm': 'M 70,780 C 14,780 14,450 50,450',
          },
        },
      },
      steps: [
        { ...step(1), focus: ['wl', 'sm'], end: 0.6, fx: [] },
        { ...step(2), focus: ['conf', 'sm'], end: 2.4, fx: [
          { t: 'set', at: 0.3, k: 'cacert', v: 'ok', pop: true },
          { t: 'packet', at: 0.6, edge: 'conf-sm', label: 'policy load' }, { t: 'set', at: 1.7, k: 'enabled', v: 'ok', pop: true }] },
        { ...step(3), focus: ['wl'], end: 1.2, fx: [{ t: 'set', at: 0.3, k: 'wannot', v: 'ok', pop: true }] },
        { ...step(4), focus: ['ca', 'wl'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'ca-wl', label: p('p_cert') }, { t: 'set', at: 1.3, k: 'wcert', v: 'ok', pop: true }] },
        { ...step(5), focus: ['wl', 'sm'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'wl-sm', label: 'mTLS + POST' }, { t: 'set', at: 1.2, k: 'tls', v: 'check' }, { t: 'set', at: 1.9, k: 'tls', v: 'ok', pop: true }] },
        { ...step(6), focus: ['sm', 'crlnode'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'sm-crl', label: 'CRL' }, { t: 'set', at: 1.4, k: 'crl', v: 'ok', pop: true }] },
        { ...step(7), focus: ['sm', 'wl'], end: 1.4, fx: [{ t: 'set', at: 0.4, k: 'annot', v: 'ok', pop: true }] },
        { ...step(8), focus: ['sm', 'wl'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'wl-sm', label: 'access token', reverse: true }, { t: 'set', at: 1.3, k: 'wtok', v: 'ok', pop: true }] },
        { ...step(9), focus: ['wl', 'sm'], end: 3.2, fx: [
          { t: 'packet', at: 0.3, edge: 'wl-sm2', label: 'GET secret' },
          { t: 'packet', at: 1.5, edge: 'wl-sm2', label: 'secret', reverse: true, kind: 'secret' }, { t: 'set', at: 2.5, k: 'wsec', v: 'ok', pop: true }] },
        { ...step(10), focus: ['sm'], end: 0.8, fx: [] },
      ],
    }
  }, [t])
  return <FlowPlayer spec={spec} />
}
