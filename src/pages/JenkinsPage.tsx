import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../components/PageHeader'
import { GitBranch, KeySquare, Puzzle, ShieldCheck, Vault, Workflow } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from '../components/flow/FlowPlayer'

/**
 * Jenkins pipeline fetching a secret (FlowPlayer spec).
 *   git push -> pipeline -> withCredentials -> plugin signs a 120 s JWT ->
 *   authn-jwt/jenkins verifies it against the Jenkins JWKS -> host annotations
 *   and !permit -> vault returns db_password -> injected as a masked env var.
 */
export default function JenkinsPage() {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const f = (k: string) => t(`idflow.${k}`)
    const pend = f('st_pending')
    const step = (n: number) => ({ title: t(`jenkins.s${n}_title`), desc: t(`jenkins.s${n}_desc`) })
    const check = (k: string) => ({ k, states: [
      { v: 'idle', text: f('st_idle'), tone: 'muted' as const }, { v: 'check', text: f('st_check'), tone: 'warn' as const }, { v: 'ok', text: f('st_valid'), tone: 'ok' as const }] })
    return {
      id: 'jenkinsflow',
      ariaLabel: t('jenkins.title'),
      initial: { cfg: 'none', jwt: 'none', env: 'none', build: 'idle', sig: 'idle', ann: 'idle', perm: 'idle', v: 'idle' },
      nodes: [
        { id: 'dev', domain: 'neutral', Icon: GitBranch, title: 'git push', sub: 'Jenkinsfile' },
        { id: 'job', domain: 'cp', Icon: Workflow, title: 'Pipeline', sub: 'Project1/pipeline', rows: [
          { label: 'DB_PASSWORD', k: 'env', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: '****', tone: 'ok' }] },
          { label: 'build', k: 'build', states: [{ v: 'idle', text: f('st_idle'), tone: 'muted' }, { v: 'run', text: 'RUNNING', tone: 'warn' }, { v: 'ok', text: 'SUCCESS', tone: 'ok' }] },
        ] },
        { id: 'plugin', domain: 'cp', Icon: Puzzle, title: 'Credentials Plugin', sub: 'withCredentials', rows: [
          { label: 'service', k: 'cfg', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: 'authn-jwt/jenkins', tone: 'ok' }] },
          { label: 'JWT', k: 'jwt', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: 'exp 120s', tone: 'ok' }] },
        ] },
        { id: 'jwks', domain: 'cp', Icon: KeySquare, title: 'JWKS', sub: '/jwtauth/conjur-jwk-set' },
        { id: 'authn', domain: 'idira', Icon: ShieldCheck, title: 'IDIRA Secrets Manager', sub: 'authn-jwt/jenkins', rows: [
          { label: 'jwks-uri', ...check('sig') },
          { label: 'annotations', ...check('ann') },
          { label: '!permit', ...check('perm') },
        ] },
        { id: 'vault', domain: 'idira', Icon: Vault, title: 'jenkins_secrets', sub: 'vault', rows: [
          { label: 'db_password', k: 'v', states: [{ v: 'idle', text: f('st_idle'), tone: 'muted' }, { v: 'ok', text: f('st_delivered'), tone: 'ok' }] },
        ] },
      ],
      edgeKinds: {
        'dev-job': 'access', 'job-plugin': 'access', 'plugin-job': 'secret',
        'plugin-authn': 'identity', 'authn-jwks': 'access', 'jwks-authn': 'identity',
        'authn-vault': 'control', 'vault-plugin': 'secret',
      },
      layouts: {
        wide: {
          w: 980, h: 420, title: 14,
          boxes: {
            plugin: { x: 16, y: 46, w: 220, h: 112 }, job: { x: 16, y: 246, w: 220, h: 112 },
            jwks: { x: 380, y: 36, w: 220, h: 64 }, dev: { x: 380, y: 330, w: 220, h: 64 },
            authn: { x: 744, y: 40, w: 220, h: 130 }, vault: { x: 744, y: 256, w: 220, h: 92 },
          },
          zones: [
            { d: 'cp', x: 6, y: 30, w: 240, h: 342 }, { d: 'cp', x: 370, y: 24, w: 240, h: 88 },
            { d: 'neutral', x: 370, y: 318, w: 240, h: 88 }, { d: 'idira', x: 734, y: 26, w: 240, h: 334 },
          ],
          edges: {
            'dev-job': 'M 380,362 C 308,362 308,316 236,316',
            'job-plugin': 'M 96,246 L 96,158', 'plugin-job': 'M 156,158 L 156,246',
            'plugin-authn': 'M 236,132 L 744,132',
            'authn-jwks': 'M 744,62 L 600,62', 'jwks-authn': 'M 600,84 L 744,84',
            'authn-vault': 'M 854,170 L 854,256',
            'vault-plugin': 'M 744,302 C 540,302 440,150 236,150',
          },
        },
        narrow: {
          w: 360, h: 880, title: 14,
          boxes: {
            dev: { x: 70, y: 30, w: 220, h: 64 }, job: { x: 70, y: 140, w: 220, h: 112 },
            plugin: { x: 50, y: 300, w: 260, h: 112 }, authn: { x: 50, y: 470, w: 260, h: 130 },
            jwks: { x: 70, y: 650, w: 220, h: 64 }, vault: { x: 70, y: 764, w: 220, h: 92 },
          },
          zones: [
            { d: 'neutral', x: 60, y: 20, w: 240, h: 84 }, { d: 'cp', x: 40, y: 128, w: 280, h: 296 },
            { d: 'idira', x: 40, y: 458, w: 280, h: 154 }, { d: 'cp', x: 60, y: 638, w: 240, h: 88 },
            { d: 'idira', x: 60, y: 752, w: 240, h: 116 },
          ],
          edges: {
            'dev-job': 'M 180,94 L 180,140',
            'job-plugin': 'M 160,252 L 160,300', 'plugin-job': 'M 200,300 L 200,252',
            'plugin-authn': 'M 180,412 L 180,470',
            'authn-jwks': 'M 160,600 L 160,650', 'jwks-authn': 'M 200,650 L 200,600',
            'authn-vault': 'M 310,560 C 350,560 350,810 290,810',
            'vault-plugin': 'M 70,810 C 12,810 12,356 50,356',
          },
        },
      },
      steps: [
        { ...step(1), focus: ['dev', 'job', 'plugin', 'jwks', 'authn', 'vault'], end: 0.6, fx: [] },
        { ...step(2), focus: ['plugin', 'authn', 'jwks'], end: 2.8, fx: [
          { t: 'packet', at: 0.3, edge: 'plugin-authn', label: 'service-id', kind: 'control' },
          { t: 'set', at: 1.3, k: 'cfg', v: 'ok', pop: true },
          { t: 'packet', at: 1.4, edge: 'authn-jwks', label: 'jwks-uri', kind: 'control' }] },
        { ...step(3), focus: ['dev', 'job'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'dev-job', label: 'git push' }, { t: 'set', at: 1.3, k: 'build', v: 'run', pop: true }] },
        { ...step(4), focus: ['job', 'plugin'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'job-plugin', label: 'withCredentials' }, { t: 'set', at: 1.3, k: 'jwt', v: 'ok', pop: true }] },
        { ...step(5), focus: ['plugin', 'authn', 'jwks'], end: 4.0, fx: [
          { t: 'packet', at: 0.3, edge: 'plugin-authn', label: 'POST JWT' }, { t: 'set', at: 1.2, k: 'sig', v: 'check' },
          { t: 'packet', at: 1.4, edge: 'authn-jwks', label: 'GET jwks' },
          { t: 'packet', at: 2.5, edge: 'jwks-authn', label: 'RSA public key' }, { t: 'set', at: 3.4, k: 'sig', v: 'ok', pop: true }] },
        { ...step(6), focus: ['authn', 'vault'], end: 3.0, fx: [
          { t: 'set', at: 0.2, k: 'ann', v: 'check' }, { t: 'set', at: 0.8, k: 'ann', v: 'ok', pop: true },
          { t: 'set', at: 1.0, k: 'perm', v: 'check' }, { t: 'set', at: 1.6, k: 'perm', v: 'ok', pop: true },
          { t: 'packet', at: 1.7, edge: 'authn-vault', label: '!permit' }] },
        { ...step(7), focus: ['vault', 'plugin', 'job'], end: 3.2, fx: [
          { t: 'set', at: 0.2, k: 'v', v: 'ok', pop: true },
          { t: 'packet', at: 0.3, edge: 'vault-plugin', label: 'db_password' },
          { t: 'packet', at: 1.5, edge: 'plugin-job', label: 'DB_PASSWORD' }, { t: 'set', at: 2.5, k: 'env', v: 'ok', pop: true }] },
        { ...step(8), focus: ['job', 'dev'], end: 1.4, fx: [
          { t: 'set', at: 0.4, k: 'build', v: 'ok', pop: true }] },
      ],
    }
  }, [t])

  return (
    <section className="min-h-screen bg-bg-base px-4 py-16 flex flex-col items-center">

      <PageHeader className="max-w-5xl mb-10" badge={t('jenkins.badge')} title={t('jenkins.title')} subtitle={t('jenkins.subtitle')} />

      <div className="w-full max-w-5xl">
        <FlowPlayer spec={spec} />
      </div>

      {/* Concept cards */}
      <div className="w-full max-w-5xl mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(n => (
          <div key={n} className="section-card">
            <p className="text-sm font-semibold text-text mb-2">{t(`jenkins.key${n}_title`)}</p>
            <p className="text-xs text-text-muted leading-relaxed">{t(`jenkins.key${n}_desc`)}</p>
          </div>
        ))}
      </div>

      {/* Architecture reference */}
      <div className="w-full max-w-5xl mt-6 bg-bg-card border border-border rounded-xl p-5">
        <p className="text-xs font-semibold text-text-2 mb-3 uppercase tracking-widest font-mono">
          {t('jenkins.arch_title')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="flex gap-3 items-start">
              <span className="text-domain-idira font-mono text-xs font-bold mt-0.5 shrink-0">
                {String(n).padStart(2, '0')}
              </span>
              <div>
                <p className="text-xs font-semibold text-text">{t(`jenkins.arch${n}_title`)}</p>
                <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{t(`jenkins.arch${n}_desc`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
