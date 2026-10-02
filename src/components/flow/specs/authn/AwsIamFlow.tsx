import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Cloud, Database, KeyRound, Server, Vault } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from '../../FlowPlayer'

/**
 * AWS IAM authenticator (authn-iam): the workload signs an STS
 * GetCallerIdentity request with its IAM role credentials, sends the signed
 * headers to Secrets Manager, which replays them to AWS STS and matches the
 * returned AccountID/Role against the workload ID before issuing a token.
 */
export default function AwsIamFlow() {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const p = (k: string) => t(`authn_aws.flow.${k}`)
    const step = (n: number) => ({ title: p(`s${n}_title`), desc: p(`s${n}_desc`) })
    const pend = p('st_pending'), idle = p('st_idle'), check = p('st_check')
    return {
      id: 'authn-aws',
      ariaLabel: p('diagram_label'),
      initial: { creds: 'none', signed: 'none', tok: 'none', sec: 'none', perm: 'idle', stsm: 'idle', pol: 'idle', caller: 'idle', db: 'idle' },
      nodes: [
        { id: 'creds', domain: 'svc', Icon: KeyRound, title: p('n_creds'), sub: p('n_creds_sub') },
        { id: 'wl', domain: 'cp', Icon: Server, title: p('n_wl'), sub: 'EC2 · ECS · Lambda', rows: [
          { label: p('r_creds'), k: 'creds', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_role'), tone: 'ok' }] },
          { label: p('r_request'), k: 'signed', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: 'SigV4', tone: 'ok' }] },
          { label: p('r_token'), k: 'tok', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_received'), tone: 'ok' }] },
          { label: p('r_secret'), k: 'sec', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_memory'), tone: 'ok' }] },
        ] },
        { id: 'sm', domain: 'idira', Icon: Vault, title: 'IDIRA Secrets Manager', sub: 'authn-iam/{service-id}', rows: [
          { label: p('r_perm'), k: 'perm', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: check, tone: 'warn' }, { v: 'ok', text: p('st_apps'), tone: 'ok' }] },
          { label: p('r_identity'), k: 'stsm', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: check, tone: 'warn' }, { v: 'ok', text: p('st_match'), tone: 'ok' }] },
          { label: 'policy', k: 'pol', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_allowed'), tone: 'ok' }] },
        ] },
        { id: 'sts', domain: 'svc', Icon: Cloud, title: 'AWS STS', sub: 'GetCallerIdentity', rows: [
          { label: p('r_caller'), k: 'caller', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_arn'), tone: 'ok' }] },
        ] },
        { id: 'db', domain: 'svc', Icon: Database, title: p('n_db'), sub: p('n_db_sub'), rows: [
          { label: p('r_session'), k: 'db', states: [{ v: 'idle', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_connected'), tone: 'ok' }] },
        ] },
      ],
      edgeKinds: { 'creds-wl': 'identity', 'wl-sm': 'identity', 'sm-wl': 'identity', 'sm-sts': 'identity', 'wl-db': 'access' },
      layouts: {
        wide: {
          w: 980, h: 420,
          boxes: {
            creds: { x: 40, y: 20, w: 240, h: 76 }, wl: { x: 40, y: 160, w: 240, h: 156 },
            sm: { x: 420, y: 150, w: 260, h: 140 }, sts: { x: 770, y: 20, w: 190, h: 106 },
            db: { x: 770, y: 300, w: 190, h: 96 },
          },
          zones: [
            { d: 'svc', x: 28, y: 10, w: 264, h: 96 }, { d: 'cp', x: 28, y: 148, w: 264, h: 180 },
            { d: 'idira', x: 408, y: 138, w: 284, h: 164 }, { d: 'svc', x: 758, y: 10, w: 214, h: 126 },
            { d: 'svc', x: 758, y: 288, w: 214, h: 120 },
          ],
          edges: {
            'creds-wl': 'M 160,96 L 160,160', 'wl-sm': 'M 280,200 L 420,200', 'sm-wl': 'M 420,262 L 280,262',
            'sm-sts': 'M 680,178 C 725,178 725,73 770,73', 'wl-db': 'M 280,300 C 520,348 640,348 770,348',
          },
          labels: [
            { x: 160, y: 128, text: 'IMDS 169.254.169.254' },
            { x: 866, y: 148, text: 'sts.amazonaws.com · HTTPS' },
            { x: 360, y: 386, text: 'POST /api/authn-iam/{service-id}/conjur/{host-id}/authenticate' },
          ],
        },
        narrow: {
          w: 360, h: 900, title: 14,
          boxes: {
            creds: { x: 50, y: 30, w: 260, h: 76 }, wl: { x: 50, y: 150, w: 260, h: 156 },
            sm: { x: 50, y: 380, w: 260, h: 140 }, sts: { x: 50, y: 590, w: 260, h: 106 },
            db: { x: 50, y: 770, w: 260, h: 96 },
          },
          edges: {
            'creds-wl': 'M 180,106 L 180,150', 'wl-sm': 'M 160,306 L 160,380', 'sm-wl': 'M 200,380 L 200,306',
            'sm-sts': 'M 180,520 L 180,590', 'wl-db': 'M 310,228 C 352,228 352,818 310,818',
          },
        },
      },
      steps: [
        { ...step(1), focus: ['wl', 'sm'], end: 0.6, fx: [] },
        { ...step(2), focus: ['creds', 'wl'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'creds-wl', label: p('p_creds') }, { t: 'set', at: 1.3, k: 'creds', v: 'ok', pop: true }] },
        { ...step(3), focus: ['wl'], end: 1.2, fx: [{ t: 'set', at: 0.3, k: 'signed', v: 'ok', pop: true }] },
        { ...step(4), focus: ['wl', 'sm'], end: 2.6, fx: [
          { t: 'packet', at: 0.3, edge: 'wl-sm', label: p('p_signed') }, { t: 'set', at: 1.3, k: 'perm', v: 'check' }, { t: 'set', at: 2.0, k: 'perm', v: 'ok', pop: true }] },
        { ...step(5), focus: ['sm', 'sts'], end: 3.6, fx: [
          { t: 'set', at: 0.2, k: 'stsm', v: 'check' },
          { t: 'packet', at: 0.3, edge: 'sm-sts', label: 'GetCallerIdentity' }, { t: 'set', at: 1.3, k: 'caller', v: 'ok', pop: true },
          { t: 'packet', at: 1.7, edge: 'sm-sts', label: p('p_arn'), reverse: true }, { t: 'set', at: 2.8, k: 'stsm', v: 'ok', pop: true }] },
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
