import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Cloud, Code, KeyRound, Vault } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from '../../FlowPlayer'

/**
 * Python AWS IAM client (conjur-authn-iam-client-python): the script reads the
 * EC2 role credentials, builds a signed STS header (create_conjur_iam_api_key),
 * exchanges it for an access token (get_conjur_iam_session_token) and gets a
 * ready Python client. The client never refreshes its token, so after 5 to 8
 * minutes the script must create a new one.
 */
export default function PythonAwsFlow() {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const p = (k: string) => t(`pf_python.flow.${k}`)
    const step = (n: number) => ({ title: p(`s${n}_title`), desc: p(`s${n}_desc`) })
    const pend = p('st_pending'), idle = p('st_idle'), check = p('st_check')
    return {
      id: 'pf-python',
      ariaLabel: p('diagram_label'),
      initial: { creds: 'none', signed: 'none', tok: 'none', cli: 'none', sec: 'none', perm: 'idle', pol: 'idle', caller: 'idle' },
      nodes: [
        { id: 'creds', domain: 'svc', Icon: KeyRound, title: p('n_creds'), sub: p('n_creds_sub') },
        { id: 'app', domain: 'cp', Icon: Code, title: p('n_app'), sub: 'conjur_iam_client', rows: [
          { label: p('r_creds'), k: 'creds', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_role'), tone: 'ok' }] },
          { label: p('r_header'), k: 'signed', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: 'SigV4', tone: 'ok' }] },
          { label: p('r_token'), k: 'tok', states: [
            { v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_minutes'), tone: 'ok' },
            { v: 'exp', text: p('st_expired'), tone: 'warn' }, { v: 'new', text: p('st_new'), tone: 'ok' }] },
          { label: p('r_client'), k: 'cli', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: 'Client', tone: 'ok' }] },
          { label: p('r_secret'), k: 'sec', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_memory'), tone: 'ok' }] },
        ] },
        { id: 'sm', domain: 'idira', Icon: Vault, title: 'IDIRA Secrets Manager', sub: 'authn-iam/{service-id}', rows: [
          { label: p('r_identity'), k: 'perm', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: check, tone: 'warn' }, { v: 'ok', text: p('st_match'), tone: 'ok' }] },
          { label: 'policy', k: 'pol', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_allowed'), tone: 'ok' }] },
        ] },
        { id: 'sts', domain: 'svc', Icon: Cloud, title: 'AWS STS', sub: 'GetCallerIdentity', rows: [
          { label: p('r_caller'), k: 'caller', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_arn'), tone: 'ok' }] },
        ] },
      ],
      edgeKinds: { 'creds-app': 'identity', 'app-sm': 'identity', 'sm-app': 'identity', 'sm-sts': 'identity' },
      layouts: {
        wide: {
          w: 980, h: 410,
          boxes: {
            creds: { x: 40, y: 20, w: 250, h: 76 }, app: { x: 40, y: 150, w: 250, h: 176 },
            sm: { x: 430, y: 160, w: 260, h: 116 }, sts: { x: 770, y: 20, w: 190, h: 96 },
          },
          zones: [
            { d: 'svc', x: 28, y: 10, w: 274, h: 96 }, { d: 'cp', x: 28, y: 138, w: 274, h: 200 },
            { d: 'idira', x: 418, y: 148, w: 284, h: 140 }, { d: 'svc', x: 758, y: 10, w: 214, h: 116 },
          ],
          edges: {
            'creds-app': 'M 165,96 L 165,150', 'app-sm': 'M 290,196 L 430,196', 'sm-app': 'M 430,252 L 290,252',
            'sm-sts': 'M 690,190 C 730,190 730,68 770,68',
          },
          labels: [
            { x: 165, y: 123, text: 'IMDS 169.254.169.254' },
            { x: 865, y: 140, text: 'sts.amazonaws.com · HTTPS' },
            { x: 500, y: 370, text: 'POST /authn-iam/{service-id}/conjur/{host-id}/authenticate' },
          ],
        },
        narrow: {
          w: 360, h: 780, title: 14,
          boxes: {
            creds: { x: 50, y: 30, w: 260, h: 76 }, app: { x: 50, y: 150, w: 260, h: 176 },
            sm: { x: 50, y: 400, w: 260, h: 116 }, sts: { x: 50, y: 600, w: 260, h: 96 },
          },
          edges: {
            'creds-app': 'M 180,106 L 180,150', 'app-sm': 'M 160,326 L 160,400', 'sm-app': 'M 200,400 L 200,326',
            'sm-sts': 'M 180,516 L 180,600',
          },
        },
      },
      steps: [
        { ...step(1), focus: ['app', 'sm'], end: 0.6, fx: [] },
        { ...step(2), focus: ['creds', 'app'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'creds-app', label: p('p_creds') }, { t: 'set', at: 1.3, k: 'creds', v: 'ok', pop: true }] },
        { ...step(3), focus: ['app'], end: 1.2, fx: [{ t: 'set', at: 0.3, k: 'signed', v: 'ok', pop: true }] },
        { ...step(4), focus: ['app', 'sm', 'sts'], end: 4.0, fx: [
          { t: 'packet', at: 0.3, edge: 'app-sm', label: p('p_signed') }, { t: 'set', at: 1.3, k: 'perm', v: 'check' },
          { t: 'packet', at: 1.5, edge: 'sm-sts', label: 'GetCallerIdentity' }, { t: 'set', at: 2.5, k: 'caller', v: 'ok', pop: true },
          { t: 'packet', at: 2.7, edge: 'sm-sts', label: p('p_arn'), reverse: true }, { t: 'set', at: 3.7, k: 'perm', v: 'ok', pop: true }] },
        { ...step(5), focus: ['sm', 'app'], end: 2.6, fx: [
          { t: 'packet', at: 0.3, edge: 'sm-app', label: p('p_token') }, { t: 'set', at: 1.3, k: 'tok', v: 'ok', pop: true },
          { t: 'set', at: 1.9, k: 'cli', v: 'ok', pop: true }] },
        { ...step(6), focus: ['app', 'sm'], end: 3.6, fx: [
          { t: 'packet', at: 0.3, edge: 'app-sm', label: 'client.get(id)' }, { t: 'set', at: 1.2, k: 'pol', v: 'ok', pop: true },
          { t: 'packet', at: 1.6, edge: 'sm-app', label: p('p_secret'), kind: 'secret' }, { t: 'set', at: 2.6, k: 'sec', v: 'ok', pop: true }] },
        { ...step(7), focus: ['app', 'sm'], end: 4.0, fx: [
          { t: 'set', at: 0.3, k: 'tok', v: 'exp', pop: true },
          { t: 'packet', at: 1.0, edge: 'app-sm', label: p('p_signed') },
          { t: 'packet', at: 2.2, edge: 'sm-app', label: p('p_token') }, { t: 'set', at: 3.2, k: 'tok', v: 'new', pop: true }] },
      ],
    }
  }, [t])
  return <FlowPlayer spec={spec} />
}
