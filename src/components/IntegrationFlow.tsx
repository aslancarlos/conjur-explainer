import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Container, Database, Github, Leaf, Server, ShoppingCart, Vault } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from './flow/FlowPlayer'

/**
 * /flow: how Secrets Manager authenticates the four integration patterns
 * (FlowPlayer spec, DESIGN.md §10). Spring Boot, .NET (sidecar), ESO and
 * GitHub Actions (OIDC) each present their own token; Secrets Manager checks
 * Kubernetes tokens with the API server, the vault releases the credential
 * and the app connects to MySQL. Steps: flow.s1..s9.
 */
export default function IntegrationFlow() {
  const { t } = useTranslation()

  const spec = useMemo<FlowSpec>(() => {
    const s = (k: string) => t(`idflow.${k}`)
    const pend = s('st_pending')
    const step = (n: number) => ({ title: t(`flow.s${n}_title`), desc: t(`flow.s${n}_desc`) })
    const tokenRow = (k: string) => ({
      label: s('r_token'), k,
      states: [{ v: 'none', text: pend, tone: 'muted' as const }, { v: 'ok', text: s('st_ok'), tone: 'ok' as const }],
    })
    const auth = (n: number, edge: string, tok: string, label: string) => [
      { t: 'packet' as const, at: 0.3, edge, label },
      { t: 'set' as const, at: 1.2, k: 'authn', v: 'check' },
      { t: 'set' as const, at: 1.7, k: 'authn', v: 'ok', pop: true },
      { t: 'set' as const, at: 1.8, k: 'n', v: String(n), pop: true },
      { t: 'packet' as const, at: 2.0, edge, label: 'API token', reverse: true },
      { t: 'set' as const, at: 3.0, k: tok, v: 'ok', pop: true },
    ]
    return {
      id: 'intflow',
      ariaLabel: t('flow.aria_label'),
      initial: { sp: 'none', dn: 'none', es: 'none', gh: 'none', authn: 'idle', n: '0', vault: 'idle', k8s: 'idle', db: 'idle' },
      nodes: [
        { id: 'spring', domain: 'k8s', Icon: Leaf, title: 'Spring Boot', sub: 'authn-jwt/eks-latam', rows: [tokenRow('sp')] },
        { id: 'dotnet', domain: 'k8s', Icon: Container, title: '.NET 8', sub: 'Secrets Provider', rows: [tokenRow('dn')] },
        { id: 'eso', domain: 'k8s', Icon: ShoppingCart, title: 'ESO Shop', sub: 'eso-shop-sa', rows: [tokenRow('es')] },
        { id: 'gha', domain: 'neutral', Icon: Github, title: 'GitHub Actions', sub: 'OIDC JWT', rows: [tokenRow('gh')] },
        { id: 'conjur', domain: 'idira', Icon: Box, title: 'IDIRA Secrets Manager', sub: 'authn-jwt · policy', rows: [
          { label: 'authn-jwt', k: 'authn', states: [{ v: 'idle', text: s('st_idle'), tone: 'muted' }, { v: 'check', text: s('st_check'), tone: 'warn' }, { v: 'ok', text: s('st_valid'), tone: 'ok' }] },
          { label: 'workloads', k: 'n', states: ['0', '1', '2', '3', '4'].map(v => ({ v, text: `${v}/4`, tone: v === '0' ? 'muted' as const : 'ok' as const })) },
          { label: 'vault', k: 'vault', states: [{ v: 'idle', text: s('st_idle'), tone: 'muted' }, { v: 'ok', text: s('st_delivered'), tone: 'ok' }] },
        ] },
        { id: 'vault', domain: 'idira', Icon: Vault, title: t('architecture.nodes.secrets'), sub: 'data/vault/dev-demo-aslan' },
        { id: 'k8sapi', domain: 'k8s', Icon: Server, title: 'K8s API Server', sub: 'TokenReview', rows: [
          { label: 'JWT', k: 'k8s', states: [{ v: 'idle', text: s('st_idle'), tone: 'muted' }, { v: 'check', text: s('st_check'), tone: 'warn' }, { v: 'ok', text: s('st_valid'), tone: 'ok' }] },
        ] },
        { id: 'db', domain: 'svc', Icon: Database, title: 'MySQL', sub: 'mysql.demo.local', rows: [
          { label: s('r_session'), k: 'db', states: [{ v: 'idle', text: pend, tone: 'muted' }, { v: 'ok', text: s('st_connected'), tone: 'ok' }] },
        ] },
      ],
      edgeKinds: {
        'sp-cj': 'identity', 'dn-cj': 'identity', 'es-cj': 'identity', 'gh-cj': 'identity',
        'cj-k8': 'identity', 'vt-cj': 'secret', 'app-db': 'access',
      },
      layouts: {
        wide: {
          w: 980, h: 480,
          boxes: {
            spring: { x: 16, y: 56, w: 180, h: 84 },
            dotnet: { x: 16, y: 156, w: 180, h: 84 },
            eso: { x: 16, y: 256, w: 180, h: 84 },
            gha: { x: 16, y: 380, w: 180, h: 84 },
            conjur: { x: 390, y: 170, w: 220, h: 140 },
            vault: { x: 390, y: 370, w: 220, h: 60 },
            db: { x: 720, y: 60, w: 190, h: 84 },
            k8sapi: { x: 720, y: 370, w: 190, h: 84 },
          },
          zones: [
            { d: 'k8s', x: 6, y: 42, w: 200, h: 308 },
            { d: 'idira', x: 380, y: 156, w: 240, h: 308 },
            { d: 'svc', x: 710, y: 46, w: 210, h: 108 },
            { d: 'k8s', x: 710, y: 356, w: 210, h: 108 },
          ],
          edges: {
            'sp-cj': 'M 196,98 C 300,98 300,200 390,200',
            'dn-cj': 'M 196,198 C 300,198 300,225 390,225',
            'es-cj': 'M 196,298 C 300,298 300,255 390,255',
            'gh-cj': 'M 196,422 C 320,422 320,282 390,282',
            'cj-k8': 'M 610,260 C 670,260 660,412 720,412',
            'vt-cj': 'M 500,370 L 500,310',
            'app-db': 'M 106,56 C 106,18 815,18 815,60',
          },
        },
        narrow: {
          w: 360, h: 1040, title: 14,
          boxes: {
            spring: { x: 16, y: 40, w: 190, h: 84 },
            dotnet: { x: 16, y: 140, w: 190, h: 84 },
            eso: { x: 16, y: 240, w: 190, h: 84 },
            gha: { x: 16, y: 360, w: 190, h: 84 },
            conjur: { x: 40, y: 500, w: 260, h: 140 },
            vault: { x: 70, y: 660, w: 220, h: 60 },
            k8sapi: { x: 70, y: 800, w: 220, h: 84 },
            db: { x: 70, y: 930, w: 220, h: 84 },
          },
          zones: [
            { d: 'k8s', x: 6, y: 26, w: 210, h: 308 },
            { d: 'idira', x: 30, y: 486, w: 280, h: 268 },
            { d: 'k8s', x: 60, y: 786, w: 240, h: 108 },
            { d: 'svc', x: 60, y: 916, w: 240, h: 108 },
          ],
          edges: {
            'sp-cj': 'M 206,82 C 300,82 285,440 285,500',
            'dn-cj': 'M 206,182 C 270,182 262,440 262,500',
            'es-cj': 'M 206,282 C 245,282 239,440 239,500',
            'gh-cj': 'M 206,402 C 220,402 216,440 216,500',
            'cj-k8': 'M 40,610 C 12,610 12,842 70,842',
            'vt-cj': 'M 180,660 L 180,640',
            'app-db': 'M 206,62 C 356,62 356,972 290,972',
          },
        },
      },
      steps: [
        { ...step(1), focus: ['spring', 'dotnet', 'eso', 'gha'], end: 0.8, fx: [] },
        { ...step(2), focus: ['conjur'], end: 0.8, fx: [] },
        { ...step(3), focus: ['conjur', 'k8sapi'], end: 3.0, fx: [
          { t: 'packet', at: 0.3, edge: 'cj-k8', label: 'TokenReview' },
          { t: 'set', at: 1.2, k: 'k8s', v: 'check' },
          { t: 'set', at: 1.7, k: 'k8s', v: 'ok', pop: true },
          { t: 'packet', at: 1.9, edge: 'cj-k8', label: 'ok', reverse: true },
        ] },
        { ...step(4), focus: ['spring', 'conjur'], end: 3.6, fx: auth(1, 'sp-cj', 'sp', 'SA JWT') },
        { ...step(5), focus: ['dotnet', 'conjur'], end: 3.6, fx: auth(2, 'dn-cj', 'dn', 'SA JWT') },
        { ...step(6), focus: ['gha', 'conjur'], end: 3.6, fx: auth(3, 'gh-cj', 'gh', 'OIDC JWT') },
        { ...step(7), focus: ['eso', 'conjur'], end: 3.6, fx: auth(4, 'es-cj', 'es', 'SA JWT') },
        { ...step(8), focus: ['vault', 'conjur'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'vt-cj', label: 'DB_USER · DB_PASS' },
          { t: 'set', at: 1.3, k: 'vault', v: 'ok', pop: true },
        ] },
        { ...step(9), focus: ['spring', 'db'], end: 3.6, fx: [
          { t: 'packet', at: 0.3, edge: 'sp-cj', label: 'DB_PASS', kind: 'secret', reverse: true },
          { t: 'packet', at: 1.6, edge: 'app-db', label: 'connect' },
          { t: 'set', at: 2.7, k: 'db', v: 'ok', pop: true },
        ] },
      ],
    }
  }, [t])

  return (
    <section id="flow" className="py-24 px-6 bg-bg-muted/40">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <span className="badge bg-idira-blue/10 text-tone-accent border border-idira-blue/20">
            {t('flow.badge')}
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold">{t('flow.title')}</h2>
          <p className="text-text-muted max-w-2xl mx-auto text-sm">{t('flow.subtitle')}</p>
        </div>
        <FlowPlayer spec={spec} />
      </div>
    </section>
  )
}
