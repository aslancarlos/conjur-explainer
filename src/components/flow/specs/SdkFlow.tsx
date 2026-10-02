import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Container, Database, HardDrive, Vault } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from '../FlowPlayer'

/**
 * /spring-boot, SDK use case: the application holds the integration itself.
 * Projected ServiceAccount JWT -> POST authn-jwt/eks-latam -> API token ->
 * GET username / password / address -> 5-minute in-memory TTL cache ->
 * JDBC to MySQL -> on expiry, authenticate again and refresh.
 */
export default function SdkFlow() {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const f = (k: string) => t(`springboot.flow.${k}`)
    const st = (k: string) => t(`idflow.${k}`)
    const pend = st('st_pending')
    const step = (n: number) => ({ title: f(`s${n}_title`), desc: f(`s${n}_desc`) })
    return {
      id: 'sdkflow',
      ariaLabel: f('diagram_label'),
      initial: { appId: 'none', appTok: 'none', cache: 'none', appSec: 'none', authn: 'idle', policy: 'idle', vault: 'idle', db: 'idle' },
      nodes: [
        { id: 'k8s', domain: 'k8s', Icon: Container, title: 'Kubernetes', sub: 'ServiceAccount JWT' },
        { id: 'app', domain: 'k8s', Icon: HardDrive, title: f('n_app'), sub: 'Spring Boot · Java SDK', rows: [
          { label: st('r_identity'), k: 'appId', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: 'JWT', tone: 'ok' }] },
          { label: st('r_token'), k: 'appTok', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: st('st_ok'), tone: 'ok' }] },
          { label: st('r_secret'), k: 'appSec', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: st('st_memory'), tone: 'ok' }] },
          { label: f('r_cache'), k: 'cache', states: [
            { v: 'none', text: pend, tone: 'muted' }, { v: 'ttl', text: 'TTL 5 min', tone: 'ok' },
            { v: 'exp', text: f('st_expired'), tone: 'warn' }, { v: 'new', text: f('st_renewed'), tone: 'ok' }] },
        ] },
        { id: 'sm', domain: 'idira', Icon: Vault, title: 'IDIRA Secrets Manager', sub: 'authn-jwt/eks-latam', rows: [
          { label: 'authn-jwt', k: 'authn', states: [{ v: 'idle', text: st('st_idle'), tone: 'muted' }, { v: 'check', text: st('st_check'), tone: 'warn' }, { v: 'ok', text: st('st_valid'), tone: 'ok' }] },
          { label: 'policy', k: 'policy', states: [{ v: 'idle', text: st('st_idle'), tone: 'muted' }, { v: 'check', text: st('st_check'), tone: 'warn' }, { v: 'ok', text: 'read', tone: 'ok' }] },
          { label: 'vault', k: 'vault', states: [{ v: 'idle', text: st('st_idle'), tone: 'muted' }, { v: 'ok', text: st('st_delivered'), tone: 'ok' }] },
        ] },
        { id: 'db', domain: 'svc', Icon: Database, title: 'MySQL', sub: 'userdb · JDBC', rows: [
          { label: st('r_session'), k: 'db', states: [{ v: 'idle', text: pend, tone: 'muted' }, { v: 'ok', text: st('st_connected'), tone: 'ok' }] },
        ] },
      ],
      edgeKinds: { 'k-a': 'identity', 'a-sm': 'identity', 'sm-a': 'identity', 'a-db': 'access' },
      layouts: {
        wide: {
          w: 980, h: 410,
          boxes: {
            k8s: { x: 16, y: 60, w: 176, h: 84 }, app: { x: 268, y: 40, w: 230, h: 144 },
            sm: { x: 650, y: 40, w: 250, h: 126 }, db: { x: 650, y: 290, w: 250, h: 84 },
          },
          zones: [
            { d: 'k8s', x: 6, y: 28, w: 502, h: 166 }, { d: 'idira', x: 640, y: 28, w: 270, h: 148 }, { d: 'svc', x: 640, y: 278, w: 270, h: 108 },
          ],
          edges: {
            'k-a': 'M 192,102 L 268,102', 'a-sm': 'M 498,88 L 650,88', 'sm-a': 'M 650,128 L 498,128',
            'a-db': 'M 383,184 C 383,332 520,332 650,332',
          },
        },
        narrow: {
          w: 360, h: 650, title: 14,
          boxes: {
            k8s: { x: 70, y: 30, w: 220, h: 84 }, app: { x: 70, y: 162, w: 220, h: 144 },
            sm: { x: 50, y: 356, w: 260, h: 126 }, db: { x: 70, y: 546, w: 220, h: 84 },
          },
          zones: [
            { d: 'k8s', x: 56, y: 20, w: 248, h: 296 }, { d: 'idira', x: 40, y: 344, w: 280, h: 150 }, { d: 'svc', x: 60, y: 534, w: 240, h: 108 },
          ],
          edges: {
            'k-a': 'M 180,114 L 180,162', 'a-sm': 'M 160,306 L 160,356', 'sm-a': 'M 200,356 L 200,306',
            'a-db': 'M 290,234 C 348,234 348,588 290,588',
          },
        },
      },
      steps: [
        { ...step(1), focus: ['app', 'db'], end: 0.6, fx: [] },
        { ...step(2), focus: ['k8s', 'app'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'k-a', label: 'SA JWT' }, { t: 'set', at: 1.3, k: 'appId', v: 'ok', pop: true }] },
        { ...step(3), focus: ['app', 'sm'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'a-sm', label: 'POST JWT' }, { t: 'set', at: 1.2, k: 'authn', v: 'check' }, { t: 'set', at: 1.9, k: 'authn', v: 'ok', pop: true }] },
        { ...step(4), focus: ['sm', 'app'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'sm-a', label: 'API token' }, { t: 'set', at: 1.3, k: 'appTok', v: 'ok', pop: true }] },
        { ...step(5), focus: ['app', 'sm'], end: 3.9, fx: [
          { t: 'packet', at: 0.3, edge: 'a-sm', label: 'GET ×3' }, { t: 'set', at: 1.2, k: 'policy', v: 'check' },
          { t: 'set', at: 1.8, k: 'policy', v: 'ok', pop: true }, { t: 'set', at: 2.0, k: 'vault', v: 'ok', pop: true },
          { t: 'packet', at: 2.2, edge: 'sm-a', label: f('p_secrets'), kind: 'secret' },
          { t: 'set', at: 3.2, k: 'appSec', v: 'ok', pop: true }, { t: 'set', at: 3.3, k: 'cache', v: 'ttl', pop: true }] },
        { ...step(6), focus: ['app', 'db'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'a-db', label: 'JDBC login' }, { t: 'set', at: 1.4, k: 'db', v: 'ok', pop: true }] },
        { ...step(7), focus: ['app'], end: 0.8, fx: [] },
        { ...step(8), focus: ['app', 'sm'], end: 5.4, fx: [
          { t: 'set', at: 0.2, k: 'cache', v: 'exp', pop: true },
          { t: 'packet', at: 0.6, edge: 'a-sm', label: 'POST JWT' },
          { t: 'packet', at: 1.8, edge: 'sm-a', label: 'API token' },
          { t: 'packet', at: 3.0, edge: 'a-sm', label: 'GET ×3' },
          { t: 'packet', at: 4.1, edge: 'sm-a', label: f('p_secrets'), kind: 'secret' },
          { t: 'set', at: 5.0, k: 'cache', v: 'new', pop: true }] },
      ],
    }
  }, [t])
  return <FlowPlayer spec={spec} />
}
