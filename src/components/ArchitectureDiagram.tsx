import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Database, FileKey, HardDrive, Server, Vault } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from './flow/FlowPlayer'

/**
 * "How Secrets Manager fits in Kubernetes" (FlowPlayer spec, DESIGN.md §10).
 * Kubernetes projects a ServiceAccount JWT into the pod, the app authenticates
 * to Secrets Manager (authn-jwt), Secrets Manager verifies the token with the
 * Kubernetes API and returns an API token, the vault surfaces the secret, the
 * app reads it and connects to MySQL. Steps: architecture.step_titles / flow.
 */
export default function ArchitectureDiagram() {
  const { t } = useTranslation()

  const spec = useMemo<FlowSpec>(() => {
    const titles = t('architecture.step_titles', { returnObjects: true }) as string[]
    const descs = t('architecture.flow', { returnObjects: true }) as string[]
    const step = (i: number) => ({ title: titles[i] ?? '', desc: descs[i] ?? '' })
    const s = (k: string) => t(`idflow.${k}`)
    const pend = s('st_pending')
    return {
      id: 'k8sarch',
      ariaLabel: t('architecture.title'),
      initial: { appId: 'none', appTok: 'none', appSec: 'none', authn: 'idle', smTok: 'idle', k8s: 'idle', vault: 'idle', db: 'idle' },
      nodes: [
        { id: 'container', domain: 'k8s', Icon: HardDrive, title: t('architecture.nodes.app'), sub: 'Spring Boot · .NET · ESO', rows: [
          { label: s('r_identity'), k: 'appId', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: 'JWT', tone: 'ok' }] },
          { label: s('r_token'), k: 'appTok', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: s('st_ok'), tone: 'ok' }] },
          { label: s('r_secret'), k: 'appSec', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: s('st_memory'), tone: 'ok' }] },
        ] },
        { id: 'jwt', domain: 'k8s', Icon: FileKey, title: t('architecture.nodes.jwt'), sub: '/var/run/secrets/tokens/jwt' },
        { id: 'k8sapi', domain: 'k8s', Icon: Server, title: 'K8s API Server', sub: 'TokenReview', rows: [
          { label: 'JWT', k: 'k8s', states: [{ v: 'idle', text: s('st_idle'), tone: 'muted' }, { v: 'check', text: s('st_check'), tone: 'warn' }, { v: 'ok', text: s('st_valid'), tone: 'ok' }] },
        ] },
        { id: 'sm', domain: 'idira', Icon: Box, title: t('architecture.nodes.conjur'), sub: 'authn-jwt · policy', rows: [
          { label: t('architecture.nodes.authn'), k: 'authn', states: [{ v: 'idle', text: s('st_idle'), tone: 'muted' }, { v: 'check', text: s('st_check'), tone: 'warn' }, { v: 'ok', text: s('st_valid'), tone: 'ok' }] },
          { label: s('r_token'), k: 'smTok', states: [{ v: 'idle', text: s('st_idle'), tone: 'muted' }, { v: 'ok', text: s('st_delivered'), tone: 'ok' }] },
        ] },
        { id: 'vault', domain: 'idira', Icon: Vault, title: t('architecture.nodes.secrets'), sub: 'data/vault/dev-demo-aslan/...', rows: [
          { label: s('r_secret'), k: 'vault', states: [{ v: 'idle', text: s('st_idle'), tone: 'muted' }, { v: 'ok', text: s('st_delivered'), tone: 'ok' }] },
        ] },
        { id: 'mysql', domain: 'svc', Icon: Database, title: t('architecture.nodes.db'), sub: 'mysql.demo.local', rows: [
          { label: s('r_session'), k: 'db', states: [{ v: 'idle', text: pend, tone: 'muted' }, { v: 'ok', text: s('st_connected'), tone: 'ok' }] },
        ] },
      ],
      edgeKinds: {
        'jwt-proj': 'identity', 'auth-sm': 'identity', 'sm-k8': 'identity',
        'sm-vt': 'secret', 'app-vt': 'secret', 'app-db': 'access',
      },
      layouts: {
        wide: {
          w: 980, h: 470,
          boxes: {
            jwt: { x: 16, y: 210, w: 216, h: 60 },
            container: { x: 262, y: 180, w: 210, h: 120 },
            k8sapi: { x: 500, y: 36, w: 190, h: 84 },
            mysql: { x: 272, y: 376, w: 190, h: 84 },
            sm: { x: 730, y: 40, w: 234, h: 120 },
            vault: { x: 730, y: 230, w: 234, h: 84 },
          },
          zones: [
            { d: 'k8s', x: 6, y: 24, w: 694, h: 290 },
            { d: 'svc', x: 262, y: 364, w: 210, h: 104 },
            { d: 'idira', x: 720, y: 28, w: 254, h: 298 },
          ],
          edges: {
            'jwt-proj': 'M 232,240 L 262,240',
            'auth-sm': 'M 472,210 C 640,210 680,140 730,140',
            'sm-k8': 'M 730,78 L 690,78',
            'sm-vt': 'M 847,230 L 847,160',
            'app-vt': 'M 472,272 L 730,272',
            'app-db': 'M 367,300 L 367,376',
          },
        },
        narrow: {
          w: 360, h: 900, title: 14,
          boxes: {
            container: { x: 70, y: 30, w: 220, h: 120 },
            jwt: { x: 70, y: 196, w: 220, h: 60 },
            k8sapi: { x: 70, y: 330, w: 220, h: 84 },
            sm: { x: 50, y: 470, w: 260, h: 120 },
            vault: { x: 50, y: 640, w: 260, h: 84 },
            mysql: { x: 70, y: 790, w: 220, h: 84 },
          },
          zones: [
            { d: 'k8s', x: 60, y: 18, w: 240, h: 406 },
            { d: 'idira', x: 40, y: 456, w: 280, h: 278 },
            { d: 'svc', x: 60, y: 778, w: 240, h: 106 },
          ],
          edges: {
            'jwt-proj': 'M 180,196 L 180,150',
            'auth-sm': 'M 290,70 C 346,70 346,510 310,510',
            'sm-k8': 'M 180,470 L 180,414',
            'sm-vt': 'M 180,640 L 180,590',
            'app-vt': 'M 70,110 C 26,110 26,682 50,682',
            'app-db': 'M 70,90 C 8,90 8,832 70,832',
          },
        },
      },
      steps: [
        { ...step(0), focus: ['container', 'jwt'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'jwt-proj', label: 'SA JWT' },
          { t: 'set', at: 1.3, k: 'appId', v: 'ok', pop: true },
        ] },
        { ...step(1), focus: ['container', 'sm'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'auth-sm', label: 'JWT' },
          { t: 'set', at: 1.3, k: 'authn', v: 'check' },
        ] },
        { ...step(2), focus: ['sm', 'k8sapi', 'container'], end: 5.0, fx: [
          { t: 'packet', at: 0.3, edge: 'sm-k8', label: 'TokenReview' },
          { t: 'set', at: 1.2, k: 'k8s', v: 'check' },
          { t: 'set', at: 1.7, k: 'k8s', v: 'ok', pop: true },
          { t: 'packet', at: 1.9, edge: 'sm-k8', label: 'ok', reverse: true },
          { t: 'set', at: 2.8, k: 'authn', v: 'ok', pop: true },
          { t: 'set', at: 2.9, k: 'smTok', v: 'ok' },
          { t: 'packet', at: 3.1, edge: 'auth-sm', label: 'API token', reverse: true },
          { t: 'set', at: 4.1, k: 'appTok', v: 'ok', pop: true },
        ] },
        { ...step(3), focus: ['vault', 'sm'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'sm-vt', label: 'secrets' },
          { t: 'set', at: 1.3, k: 'vault', v: 'ok', pop: true },
        ] },
        { ...step(4), focus: ['container', 'vault'], end: 3.4, fx: [
          { t: 'packet', at: 0.3, edge: 'app-vt', label: 'read', kind: 'access' },
          { t: 'packet', at: 1.4, edge: 'app-vt', label: 'DB_USER · DB_PASS', kind: 'secret', reverse: true },
          { t: 'set', at: 2.4, k: 'appSec', v: 'ok', pop: true },
        ] },
        { ...step(5), focus: ['container', 'mysql'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'app-db', label: 'connect' },
          { t: 'set', at: 1.4, k: 'db', v: 'ok', pop: true },
        ] },
        { ...step(6), focus: ['container', 'jwt', 'k8sapi', 'sm', 'vault', 'mysql'], end: 0.8, fx: [] },
      ],
    }
  }, [t])

  return (
    <section id="architecture" className="py-24 px-6 bg-bg-muted/40">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <span className="badge bg-idira-blue/10 text-tone-accent border border-idira-blue/20">
            {t('architecture.badge')}
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold">{t('architecture.title')}</h2>
        </div>
        <FlowPlayer spec={spec} />
      </div>
    </section>
  )
}
