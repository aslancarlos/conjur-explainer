import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Cloud, Container, Database, HardDrive, ShieldCheck, Vault } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from './flow/FlowPlayer'

/**
 * Home "See it live": two ways a workload reaches a service (FlowPlayer spec).
 *   Path 1  Kubernetes ServiceAccount JWT -> IDIRA Secrets Manager authn-jwt ->
 *           access token -> policy -> vault -> DB password -> MySQL
 *   Path 2  IDIRA SWA SVID -> AWS STS AssumeRoleWithWebIdentity -> temporary
 *           credentials -> Amazon S3, with no secret at all
 */
export default function IdentityFlows() {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const p = (k: string) => t(`idflow.${k}`)
    const pend = p('st_pending')
    const step = (n: number) => ({ title: p(`s${n}_title`), desc: p(`s${n}_desc`) })
    return {
      id: 'idflow',
      ariaLabel: p('diagram_label'),
      initial: { appId: 'none', appTok: 'none', appSec: 'none', db: 'idle', authn: 'idle', policy: 'idle', vault: 'idle', wlId: 'none', wlCred: 'none', sts: 'idle', s3: 'idle' },
      nodes: [
        { id: 'issA', domain: 'k8s', Icon: Container, title: 'Kubernetes', sub: p('n_k8s_sub') },
        { id: 'app', domain: 'k8s', Icon: HardDrive, title: p('n_app'), sub: p('n_app_sub'), rows: [
          { label: p('r_identity'), k: 'appId', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: 'JWT', tone: 'ok' }] },
          { label: p('r_token'), k: 'appTok', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_ok'), tone: 'ok' }] },
          { label: p('r_secret'), k: 'appSec', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_memory'), tone: 'ok' }] },
        ] },
        { id: 'idira', domain: 'idira', Icon: Vault, title: 'IDIRA Secrets Manager', sub: p('n_idira_sub'), rows: [
          { label: 'authn-jwt', k: 'authn', states: [{ v: 'idle', text: p('st_idle'), tone: 'muted' }, { v: 'check', text: p('st_check'), tone: 'warn' }, { v: 'ok', text: p('st_valid'), tone: 'ok' }] },
          { label: 'policy', k: 'policy', states: [{ v: 'idle', text: p('st_idle'), tone: 'muted' }, { v: 'check', text: p('st_check'), tone: 'warn' }, { v: 'ok', text: p('st_fetcher'), tone: 'ok' }] },
          { label: 'vault', k: 'vault', states: [{ v: 'idle', text: p('st_idle'), tone: 'muted' }, { v: 'ok', text: p('st_delivered'), tone: 'ok' }] },
        ] },
        { id: 'db', domain: 'svc', Icon: Database, title: 'MySQL', sub: p('n_db_sub'), rows: [
          { label: p('r_session'), k: 'db', states: [{ v: 'idle', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_connected'), tone: 'ok' }] },
        ] },
        { id: 'swa', domain: 'idira', Icon: ShieldCheck, title: 'IDIRA SWA', sub: p('n_swa_sub') },
        { id: 'wl', domain: 'k8s', Icon: HardDrive, title: p('n_wl'), sub: p('n_wl_sub'), rows: [
          { label: p('r_identity'), k: 'wlId', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: 'SVID', tone: 'ok' }] },
          { label: p('r_creds'), k: 'wlCred', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_temp'), tone: 'ok' }] },
          { label: p('r_secret'), value: p('st_none') },
        ] },
        { id: 'sts', domain: 'svc', Icon: Cloud, title: 'AWS STS', sub: 'AssumeRoleWithWebIdentity', rows: [
          { label: p('r_trust'), k: 'sts', states: [{ v: 'idle', text: p('st_idle'), tone: 'muted' }, { v: 'check', text: p('st_check'), tone: 'warn' }, { v: 'ok', text: p('st_valid'), tone: 'ok' }] },
        ] },
        { id: 's3', domain: 'svc', Icon: Database, title: 'Amazon S3', sub: p('n_s3_sub'), rows: [
          { label: p('r_access'), k: 's3', states: [{ v: 'idle', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_read'), tone: 'ok' }] },
        ] },
      ],
      edgeKinds: {
        'a-iss': 'identity', 'a-req': 'identity', 'a-res': 'identity', 'a-svc': 'access',
        'b-iss': 'identity', 'b-req': 'identity', 'b-res': 'secret', 'b-svc': 'access',
      },
      layouts: {
        wide: {
          w: 980, h: 470,
          boxes: {
            issA: { x: 16, y: 56, w: 170, h: 96 }, app: { x: 248, y: 44, w: 176, h: 120 },
            idira: { x: 560, y: 36, w: 210, h: 150 }, db: { x: 818, y: 56, w: 150, h: 96 },
            swa: { x: 16, y: 286, w: 170, h: 96 }, wl: { x: 248, y: 274, w: 176, h: 120 },
            sts: { x: 560, y: 280, w: 210, h: 108 }, s3: { x: 818, y: 286, w: 150, h: 96 },
          },
          zones: [
            { d: 'k8s', x: 6, y: 28, w: 428, h: 150 }, { d: 'idira', x: 550, y: 26, w: 230, h: 170 }, { d: 'svc', x: 808, y: 44, w: 166, h: 120 },
            { d: 'idira', x: 6, y: 272, w: 190, h: 122 }, { d: 'k8s', x: 238, y: 262, w: 196, h: 144 }, { d: 'svc', x: 550, y: 266, w: 424, h: 134 },
          ],
          lanes: [{ x: 16, y: 22, text: p('lane_a') }, { x: 16, y: 252, text: p('lane_b') }],
          edges: {
            'a-iss': 'M 186,104 L 248,104', 'a-req': 'M 424,92 L 560,92', 'a-res': 'M 560,128 L 424,128',
            'a-svc': 'M 336,164 C 336,218 895,218 895,152',
            'b-iss': 'M 186,334 L 248,334', 'b-req': 'M 424,320 L 560,320', 'b-res': 'M 560,352 L 424,352',
            'b-svc': 'M 336,394 C 336,448 895,448 895,382',
          },
        },
        narrow: {
          w: 360, h: 1268, title: 14,
          boxes: {
            issA: { x: 70, y: 30, w: 220, h: 84 }, app: { x: 70, y: 162, w: 220, h: 120 },
            idira: { x: 50, y: 332, w: 260, h: 150 }, db: { x: 70, y: 544, w: 220, h: 84 },
            swa: { x: 70, y: 700, w: 220, h: 84 }, wl: { x: 70, y: 832, w: 220, h: 120 },
            sts: { x: 50, y: 1002, w: 260, h: 108 }, s3: { x: 70, y: 1168, w: 220, h: 84 },
          },
          zones: [
            { d: 'k8s', x: 56, y: 20, w: 248, h: 272 }, { d: 'idira', x: 40, y: 318, w: 280, h: 174 }, { d: 'svc', x: 60, y: 530, w: 240, h: 108 },
            { d: 'idira', x: 60, y: 690, w: 240, h: 104 }, { d: 'k8s', x: 60, y: 820, w: 240, h: 142 }, { d: 'svc', x: 40, y: 990, w: 280, h: 272 },
          ],
          lanes: [{ x: 16, y: 14, text: p('lane_a_short') }, { x: 16, y: 682, text: p('lane_b_short') }],
          edges: {
            'a-iss': 'M 180,114 L 180,162', 'a-req': 'M 160,282 L 160,332', 'a-res': 'M 200,332 L 200,282',
            'a-svc': 'M 290,222 C 348,222 348,586 290,586',
            'b-iss': 'M 180,784 L 180,832', 'b-req': 'M 160,952 L 160,1002', 'b-res': 'M 200,1002 L 200,952',
            'b-svc': 'M 290,892 C 348,892 348,1210 290,1210',
          },
        },
      },
      steps: [
        { ...step(1), focus: ['app', 'wl'], end: 0.6, fx: [] },
        { ...step(2), focus: ['issA', 'app'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'a-iss', label: p('p_sajwt') }, { t: 'set', at: 1.3, k: 'appId', v: 'ok', pop: true }] },
        { ...step(3), focus: ['app', 'idira'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'a-req', label: p('p_jwt') }, { t: 'set', at: 1.2, k: 'authn', v: 'check' }, { t: 'set', at: 1.9, k: 'authn', v: 'ok', pop: true }] },
        { ...step(4), focus: ['idira', 'app'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'a-res', label: p('p_token') }, { t: 'set', at: 1.3, k: 'appTok', v: 'ok', pop: true }] },
        { ...step(5), focus: ['app', 'idira'], end: 3.8, fx: [
          { t: 'packet', at: 0.3, edge: 'a-req', label: p('p_get') }, { t: 'set', at: 1.2, k: 'policy', v: 'check' },
          { t: 'set', at: 1.8, k: 'policy', v: 'ok', pop: true }, { t: 'set', at: 2.0, k: 'vault', v: 'ok', pop: true },
          { t: 'packet', at: 2.2, edge: 'a-res', label: p('p_dbpass'), kind: 'secret' }, { t: 'set', at: 3.2, k: 'appSec', v: 'ok', pop: true }] },
        { ...step(6), focus: ['app', 'db'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'a-svc', label: p('p_login') }, { t: 'set', at: 1.4, k: 'db', v: 'ok', pop: true }] },
        { ...step(7), focus: ['swa', 'wl'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'b-iss', label: p('p_svid') }, { t: 'set', at: 1.3, k: 'wlId', v: 'ok', pop: true }] },
        { ...step(8), focus: ['wl', 'sts'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'b-req', label: p('p_jwtsvid') }, { t: 'set', at: 1.2, k: 'sts', v: 'check' }, { t: 'set', at: 1.9, k: 'sts', v: 'ok', pop: true }] },
        { ...step(9), focus: ['sts', 'wl'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'b-res', label: p('p_tempcreds') }, { t: 'set', at: 1.3, k: 'wlCred', v: 'ok', pop: true }] },
        { ...step(10), focus: ['wl', 's3'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'b-svc', label: p('p_s3read') }, { t: 'set', at: 1.4, k: 's3', v: 'ok', pop: true }] },
        { ...step(11), focus: ['app', 'db', 'wl', 's3'], end: 0.8, fx: [] },
      ],
    }
  }, [t])
  return <FlowPlayer spec={spec} />
}
