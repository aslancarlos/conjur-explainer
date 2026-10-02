import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Cloud, HardDrive, KeyRound, Server, Vault } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from '../../FlowPlayer'

/**
 * AWS dynamic secret: the issuer holds a reference to IAM user keys stored in
 * Secrets Manager. When an authorized workload reads a variable under
 * data/dynamic, Secrets Manager calls AWS STS (AssumeRole or
 * GetFederationToken) and returns short-lived credentials that expire on
 * their own when the TTL ends.
 */
export default function DynamicSecretFlow() {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const p = (k: string) => t(`sm_dynamic.flow.${k}`)
    const step = (n: number) => ({ title: p(`s${n}_title`), desc: p(`s${n}_desc`) })
    const pend = p('st_pending'), idle = p('st_idle'), check = p('st_check')
    return {
      id: 'sm-dynamic',
      ariaLabel: p('diagram_label'),
      initial: { tok: 'none', dyn: 'none', iss: 'idle', perm: 'idle', ttl: 'idle', sts: 'idle', s3: 'idle' },
      nodes: [
        { id: 'keys', domain: 'neutral', Icon: KeyRound, title: p('n_keys'), sub: 'data/vault/safe/aws-access-keys' },
        { id: 'wl', domain: 'cp', Icon: Server, title: p('n_wl'), sub: 'host · read + execute', rows: [
          { label: p('r_token'), k: 'tok', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_received'), tone: 'ok' }] },
          { label: p('r_creds'), k: 'dyn', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_valid'), tone: 'ok' }, { v: 'exp', text: p('st_expired'), tone: 'bad' }] },
        ] },
        { id: 'sm', domain: 'idira', Icon: Vault, title: 'IDIRA Secrets Manager', sub: 'data/dynamic/my-aws-dynamic-secret', rows: [
          { label: p('r_issuer'), k: 'iss', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: 'my-aws-issuer', tone: 'ok' }] },
          { label: p('r_perm'), k: 'perm', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: check, tone: 'warn' }, { v: 'ok', text: 'execute', tone: 'ok' }] },
          { label: 'TTL', k: 'ttl', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: '1200 s', tone: 'ok' }] },
        ] },
        { id: 'sts', domain: 'svc', Icon: Cloud, title: 'AWS STS', sub: 'AssumeRole · GetFederationToken', rows: [
          { label: p('r_session'), k: 'sts', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_issued'), tone: 'ok' }] },
        ] },
        { id: 's3', domain: 'svc', Icon: HardDrive, title: p('n_target'), sub: p('n_target_sub'), rows: [
          { label: p('r_access'), k: 's3', states: [{ v: 'idle', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_allowed'), tone: 'ok' }, { v: 'denied', text: p('st_denied'), tone: 'bad' }] },
        ] },
      ],
      edgeKinds: { 'keys-sm': 'control', 'wl-sm': 'identity', 'sm-wl': 'identity', 'sm-sts': 'identity', 'wl-s3': 'access' },
      layouts: {
        wide: {
          w: 980, h: 430,
          boxes: {
            keys: { x: 420, y: 20, w: 260, h: 76 }, wl: { x: 40, y: 170, w: 240, h: 116 },
            sm: { x: 420, y: 150, w: 260, h: 140 }, sts: { x: 740, y: 20, w: 220, h: 106 },
            s3: { x: 740, y: 300, w: 220, h: 96 },
          },
          zones: [
            { d: 'neutral', x: 408, y: 10, w: 284, h: 96 }, { d: 'cp', x: 28, y: 158, w: 264, h: 140 },
            { d: 'idira', x: 408, y: 138, w: 284, h: 164 }, { d: 'svc', x: 728, y: 10, w: 244, h: 126 },
            { d: 'svc', x: 728, y: 288, w: 244, h: 120 },
          ],
          edges: {
            'keys-sm': 'M 550,96 L 550,150', 'wl-sm': 'M 280,200 L 420,200', 'sm-wl': 'M 420,262 L 280,262',
            'sm-sts': 'M 680,178 C 710,178 710,73 740,73', 'wl-s3': 'M 160,286 C 160,348 520,348 740,348',
          },
          labels: [
            { x: 850, y: 148, text: 'sts.amazonaws.com · HTTPS' },
            { x: 420, y: 400, text: 'GET /secrets/{account}/variable/data/dynamic/{id}' },
          ],
        },
        narrow: {
          w: 360, h: 900, title: 14,
          boxes: {
            keys: { x: 50, y: 30, w: 260, h: 76 }, sm: { x: 50, y: 160, w: 260, h: 140 },
            wl: { x: 50, y: 380, w: 260, h: 116 }, sts: { x: 50, y: 570, w: 260, h: 106 },
            s3: { x: 50, y: 760, w: 260, h: 96 },
          },
          edges: {
            'keys-sm': 'M 180,106 L 180,160', 'wl-sm': 'M 160,380 L 160,300', 'sm-wl': 'M 200,300 L 200,380',
            'sm-sts': 'M 310,230 C 352,230 352,623 310,623', 'wl-s3': 'M 50,438 C 8,438 8,808 50,808',
          },
        },
      },
      steps: [
        { ...step(1), focus: ['wl', 'sm'], end: 0.6, fx: [] },
        { ...step(2), focus: ['keys', 'sm'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'keys-sm', label: p('p_ref') }, { t: 'set', at: 1.3, k: 'iss', v: 'ok', pop: true }] },
        { ...step(3), focus: ['wl', 'sm'], end: 2.6, fx: [
          { t: 'packet', at: 0.3, edge: 'wl-sm', label: p('p_authn') },
          { t: 'packet', at: 1.3, edge: 'sm-wl', label: p('p_token') }, { t: 'set', at: 2.2, k: 'tok', v: 'ok', pop: true }] },
        { ...step(4), focus: ['wl', 'sm'], end: 2.6, fx: [
          { t: 'packet', at: 0.3, edge: 'wl-sm', label: p('p_get') }, { t: 'set', at: 1.3, k: 'perm', v: 'check' },
          { t: 'set', at: 2.0, k: 'perm', v: 'ok', pop: true }] },
        { ...step(5), focus: ['sm', 'sts'], end: 3.4, fx: [
          { t: 'set', at: 0.2, k: 'ttl', v: 'ok', pop: true },
          { t: 'packet', at: 0.4, edge: 'sm-sts', label: 'sts:AssumeRole' }, { t: 'set', at: 1.4, k: 'sts', v: 'ok', pop: true },
          { t: 'packet', at: 1.8, edge: 'sm-sts', label: p('p_temp'), reverse: true, kind: 'secret' }] },
        { ...step(6), focus: ['sm', 'wl'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'sm-wl', label: p('p_creds'), kind: 'secret' }, { t: 'set', at: 1.3, k: 'dyn', v: 'ok', pop: true }] },
        { ...step(7), focus: ['wl', 's3'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'wl-s3', label: p('p_call') }, { t: 'set', at: 1.5, k: 's3', v: 'ok', pop: true }] },
        { ...step(8), focus: ['wl', 's3'], end: 2.6, fx: [
          { t: 'set', at: 0.3, k: 'dyn', v: 'exp', pop: true },
          { t: 'packet', at: 0.8, edge: 'wl-s3', label: p('p_old'), kind: 'leak' }, { t: 'set', at: 2.0, k: 's3', v: 'denied', pop: true }] },
      ],
    }
  }, [t])
  return <FlowPlayer spec={spec} />
}
