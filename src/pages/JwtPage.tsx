import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Container, HardDrive, ScrollText, ShieldCheck, Vault } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from '../components/flow/FlowPlayer'

/**
 * JWT authentication walkthrough (FlowPlayer spec, DESIGN.md §10):
 * K8s projects a ServiceAccount JWT -> workload POSTs it to authn-jwt ->
 * Secrets Manager fetches JWKS -> verifies signature and claims -> resolves
 * the host via annotations -> issues a short-lived API token -> vault
 * returns the secret.
 */
export default function JwtPage() {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const j = (k: string) => t(`jwt.${k}`)
    const pend = t('idflow.st_pending')
    const step = (n: number) => ({ title: j(`s${n}_title`), desc: j(`s${n}_desc`) })
    return {
      id: 'jwtflow',
      ariaLabel: j('title'),
      initial: { podJwt: 'none', podTok: 'none', podSec: 'none', jwks: 'idle', sig: 'idle', ns: 'idle', sa: 'idle', vault: 'idle' },
      nodes: [
        { id: 'k8s', domain: 'k8s', Icon: Container, title: j('node_k8s'), sub: j('node_k8s_sub') },
        { id: 'pod', domain: 'k8s', Icon: HardDrive, title: j('node_pod'), sub: j('node_pod_sub'), rows: [
          { label: 'JWT', k: 'podJwt', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: t('idflow.st_ok'), tone: 'ok' }] },
          { label: 'api-token', k: 'podTok', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: t('idflow.st_ok'), tone: 'ok' }] },
          { label: 'secret', k: 'podSec', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: t('idflow.st_memory'), tone: 'ok' }] },
        ] },
        { id: 'validator', domain: 'idira', Icon: ShieldCheck, title: j('node_validator'), sub: j('node_validator_sub'), rows: [
          { label: 'JWKS', k: 'jwks', states: [{ v: 'idle', text: t('idflow.st_idle'), tone: 'muted' }, { v: 'ok', text: t('idflow.st_ok'), tone: 'ok' }] },
          { label: 'exp iss aud sig', k: 'sig', states: [{ v: 'idle', text: t('idflow.st_idle'), tone: 'muted' }, { v: 'check', text: t('idflow.st_check'), tone: 'warn' }, { v: 'ok', text: t('idflow.st_valid'), tone: 'ok' }] },
          { label: 'alg', value: 'RS256' },
        ] },
        { id: 'policy', domain: 'idira', Icon: ScrollText, title: j('node_policy'), sub: j('node_policy_sub'), rows: [
          { label: 'namespace', k: 'ns', states: [{ v: 'idle', text: pend, tone: 'muted' }, { v: 'ok', text: 'conjur', tone: 'ok' }] },
          { label: 'service-account', k: 'sa', states: [{ v: 'idle', text: pend, tone: 'muted' }, { v: 'ok', text: 'springboot-app', tone: 'ok' }] },
        ] },
        { id: 'vault', domain: 'idira', Icon: Vault, title: j('node_vault'), sub: j('node_vault_sub'), rows: [
          { label: 'secret', k: 'vault', states: [{ v: 'idle', text: t('idflow.st_idle'), tone: 'muted' }, { v: 'ok', text: t('idflow.st_delivered'), tone: 'ok' }] },
        ] },
      ],
      edgeKinds: {
        'k8s-pod': 'identity', 'pod-auth': 'identity', 'auth-k8s': 'access', 'k8s-auth': 'identity',
        'val-pol': 'access', 'pol-pod': 'identity', 'pol-vault': 'access', 'vault-pod': 'secret',
      },
      layouts: {
        wide: {
          w: 980, h: 430,
          boxes: {
            k8s: { x: 16, y: 40, w: 200, h: 96 }, pod: { x: 16, y: 250, w: 200, h: 120 },
            validator: { x: 400, y: 40, w: 240, h: 120 }, policy: { x: 400, y: 210, w: 240, h: 120 },
            vault: { x: 780, y: 210, w: 184, h: 96 },
          },
          zones: [{ d: 'k8s', x: 6, y: 28, w: 220, h: 352 }, { d: 'idira', x: 390, y: 28, w: 584, h: 312 }],
          lanes: [{ x: 16, y: 18, text: 'Kubernetes' }, { x: 400, y: 18, text: `${j('node_conjur')} · authn-jwt` }],
          edges: {
            'k8s-pod': 'M 116,136 L 116,250',
            'pod-auth': 'M 216,270 C 310,270 310,140 400,140',
            'auth-k8s': 'M 400,62 L 216,62',
            'k8s-auth': 'M 216,96 L 400,96',
            'val-pol': 'M 520,160 L 520,210',
            'pol-pod': 'M 400,320 L 216,320',
            'pol-vault': 'M 640,258 L 780,258',
            'vault-pod': 'M 872,306 C 872,405 116,405 116,370',
          },
        },
        narrow: {
          w: 360, h: 880, title: 14,
          boxes: {
            k8s: { x: 70, y: 30, w: 220, h: 84 }, pod: { x: 70, y: 170, w: 220, h: 120 },
            validator: { x: 50, y: 370, w: 260, h: 120 }, policy: { x: 50, y: 560, w: 260, h: 120 },
            vault: { x: 70, y: 760, w: 220, h: 84 },
          },
          zones: [{ d: 'k8s', x: 56, y: 18, w: 248, h: 284 }, { d: 'idira', x: 40, y: 356, w: 280, h: 500 }],
          lanes: [{ x: 16, y: 12, text: 'Kubernetes' }, { x: 16, y: 350, text: j('node_conjur') }],
          edges: {
            'k8s-pod': 'M 180,114 L 180,170',
            'pod-auth': 'M 160,290 L 160,370',
            'auth-k8s': 'M 50,400 C 12,400 12,72 70,72',
            'k8s-auth': 'M 290,92 C 336,92 336,420 310,420',
            'val-pol': 'M 180,490 L 180,560',
            'pol-pod': 'M 50,620 C 30,620 30,250 70,250',
            'pol-vault': 'M 180,680 L 180,760',
            'vault-pod': 'M 290,800 C 352,800 352,270 290,270',
          },
        },
      },
      steps: [
        { ...step(1), focus: ['pod', 'k8s', 'validator', 'policy', 'vault'], end: 0.6, fx: [] },
        { ...step(2), focus: ['k8s', 'pod'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'k8s-pod', label: 'JWT' }, { t: 'set', at: 1.3, k: 'podJwt', v: 'ok', pop: true }] },
        { ...step(3), focus: ['pod', 'validator'], end: 1.6, fx: [
          { t: 'packet', at: 0.3, edge: 'pod-auth', label: 'POST jwt' }] },
        { ...step(4), focus: ['validator', 'k8s'], end: 2.8, fx: [
          { t: 'packet', at: 0.3, edge: 'auth-k8s', label: 'JWKS req' },
          { t: 'packet', at: 1.4, edge: 'k8s-auth', label: 'pub keys' }, { t: 'set', at: 2.3, k: 'jwks', v: 'ok', pop: true }] },
        { ...step(5), focus: ['validator'], end: 1.8, fx: [
          { t: 'set', at: 0.3, k: 'sig', v: 'check' }, { t: 'set', at: 1.2, k: 'sig', v: 'ok', pop: true }] },
        { ...step(6), focus: ['validator', 'policy'], end: 2.6, fx: [
          { t: 'packet', at: 0.3, edge: 'val-pol', label: 'claims' },
          { t: 'set', at: 1.3, k: 'ns', v: 'ok', pop: true }, { t: 'set', at: 1.8, k: 'sa', v: 'ok', pop: true }] },
        { ...step(7), focus: ['policy', 'pod'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'pol-pod', label: 'api-token' }, { t: 'set', at: 1.3, k: 'podTok', v: 'ok', pop: true }] },
        { ...step(8), focus: ['policy', 'vault', 'pod'], end: 3.4, fx: [
          { t: 'packet', at: 0.3, edge: 'pol-vault', label: 'authorize' }, { t: 'set', at: 1.2, k: 'vault', v: 'ok', pop: true },
          { t: 'packet', at: 1.4, edge: 'vault-pod', label: 'secret' }, { t: 'set', at: 2.5, k: 'podSec', v: 'ok', pop: true }] },
      ],
    }
  }, [t])

  return (
    <section id="jwt" className="py-24 px-6 bg-bg-muted/40">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* header */}
        <div className="text-center space-y-3">
          <span className="badge bg-gh/10 text-blue-400 border border-gh/30">
            {t('jwt.badge')}
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold">{t('jwt.title')}</h1>
          <p className="text-text-muted max-w-2xl mx-auto text-sm">{t('jwt.subtitle')}</p>
        </div>

        <FlowPlayer spec={spec} />

        {/* key concept cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="section-card space-y-2">
              <h3 className="text-sm font-semibold text-text">{t(`jwt.key${n}_title`)}</h3>
              <p className="text-xs text-text-muted leading-relaxed">{t(`jwt.key${n}_desc`)}</p>
            </div>
          ))}
        </div>

        <p className="hidden sm:block text-center text-xs text-text-muted select-none">{t('jwt.keyboard_hint')}</p>
      </div>
    </section>
  )
}
