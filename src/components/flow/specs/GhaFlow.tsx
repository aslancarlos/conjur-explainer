import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Database, GitBranch, Github, Server, Vault } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from '../FlowPlayer'

/**
 * /github-actions: OIDC, zero stored credentials.
 * Workflow (id-token: write) -> self-hosted runner + Secrets Manager action ->
 * GitHub OIDC JWT -> authn-jwt/github -> JWKS signature check -> host
 * annotations repository + workflow -> scoped secrets as masked env vars ->
 * MySQL.
 */
export default function GhaFlow() {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const f = (k: string) => t(`gha.flow.${k}`)
    const st = (k: string) => t(`idflow.${k}`)
    const s = (n: number) => ({ title: f(`s${n}_title`), desc: f(`s${n}_desc`) })
    const pend = st('st_pending')
    return {
      id: 'ghaflow',
      ariaLabel: f('diagram_label'),
      initial: { job: 'idle', runId: 'none', runTok: 'none', runSec: 'none', authn: 'idle', annot: 'idle', vault: 'idle', db: 'idle' },
      nodes: [
        { id: 'wf', domain: 'cp', Icon: GitBranch, title: 'Workflow', sub: 'permissions: id-token: write', rows: [
          { label: 'job', k: 'job', states: [{ v: 'idle', text: st('st_idle'), tone: 'muted' }, { v: 'run', text: f('st_running'), tone: 'warn' }, { v: 'ok', text: f('st_success'), tone: 'ok' }] },
        ] },
        { id: 'runner', domain: 'cp', Icon: Server, title: f('n_runner'), sub: 'aslancarlos/workshop-action', rows: [
          { label: st('r_identity'), k: 'runId', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: 'OIDC JWT', tone: 'ok' }] },
          { label: st('r_token'), k: 'runTok', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: st('st_ok'), tone: 'ok' }] },
          { label: st('r_secret'), k: 'runSec', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: f('st_masked'), tone: 'ok' }] },
        ] },
        { id: 'oidc', domain: 'neutral', Icon: Github, title: 'GitHub OIDC', sub: 'OIDC issuer · JWKS', rows: [
          { label: 'claims', value: 'repository · workflow' },
        ] },
        { id: 'sm', domain: 'idira', Icon: Vault, title: 'Secrets Manager', sub: 'IDIRA · authn-jwt/github', rows: [
          { label: 'JWT', k: 'authn', states: [{ v: 'idle', text: st('st_idle'), tone: 'muted' }, { v: 'check', text: st('st_check'), tone: 'warn' }, { v: 'ok', text: st('st_valid'), tone: 'ok' }] },
          { label: 'annotations', k: 'annot', states: [{ v: 'idle', text: st('st_idle'), tone: 'muted' }, { v: 'check', text: st('st_check'), tone: 'warn' }, { v: 'ok', text: f('st_match'), tone: 'ok' }] },
          { label: f('r_other'), value: f('st_denied'), tone: 'warn' },
          { label: 'vault', k: 'vault', states: [{ v: 'idle', text: st('st_idle'), tone: 'muted' }, { v: 'ok', text: st('st_delivered'), tone: 'ok' }] },
        ] },
        { id: 'db', domain: 'svc', Icon: Database, title: 'MySQL', sub: 'userdb', rows: [
          { label: st('r_session'), k: 'db', states: [{ v: 'idle', text: pend, tone: 'muted' }, { v: 'ok', text: st('st_connected'), tone: 'ok' }] },
        ] },
      ],
      edgeKinds: {
        'wf-run': 'access', 'run-oidc': 'identity', 'run-sm': 'identity', 'sm-run': 'secret', 'sm-oidc': 'access', 'run-db': 'access',
      },
      layouts: {
        wide: {
          w: 980, h: 500,
          boxes: {
            wf: { x: 16, y: 60, w: 210, h: 84 }, runner: { x: 16, y: 270, w: 220, h: 126 },
            oidc: { x: 390, y: 30, w: 230, h: 84 }, sm: { x: 740, y: 200, w: 224, h: 150 },
            db: { x: 390, y: 396, w: 230, h: 84 },
          },
          zones: [
            { d: 'cp', x: 6, y: 50, w: 240, h: 356 },
            { d: 'neutral', x: 380, y: 20, w: 250, h: 104 },
            { d: 'idira', x: 730, y: 190, w: 244, h: 170 },
            { d: 'svc', x: 380, y: 386, w: 250, h: 104 },
          ],
          edges: {
            'wf-run': 'M 116,144 L 116,270',
            'run-oidc': 'M 196,270 C 196,180 300,72 390,72',
            'run-sm': 'M 236,300 L 740,300',
            'sm-run': 'M 740,340 L 236,340',
            'sm-oidc': 'M 852,200 C 852,100 720,60 620,60',
            'run-db': 'M 126,396 C 126,438 300,438 390,438',
          },
        },
        narrow: {
          w: 360, h: 830, title: 14,
          boxes: {
            wf: { x: 65, y: 20, w: 230, h: 84 }, runner: { x: 65, y: 160, w: 230, h: 126 },
            oidc: { x: 65, y: 350, w: 230, h: 84 }, sm: { x: 65, y: 500, w: 230, h: 150 },
            db: { x: 65, y: 720, w: 230, h: 84 },
          },
          zones: [
            { d: 'cp', x: 55, y: 10, w: 250, h: 286 },
            { d: 'neutral', x: 55, y: 340, w: 250, h: 104 },
            { d: 'idira', x: 55, y: 490, w: 250, h: 170 },
            { d: 'svc', x: 55, y: 710, w: 250, h: 104 },
          ],
          edges: {
            'wf-run': 'M 180,104 L 180,160',
            'run-oidc': 'M 180,286 L 180,350',
            'run-sm': 'M 295,206 C 348,206 348,560 295,560',
            'sm-run': 'M 65,600 C 14,600 14,246 65,246',
            'sm-oidc': 'M 180,500 L 180,434',
            'run-db': 'M 295,262 C 356,262 356,762 295,762',
          },
        },
      },
      steps: [
        { ...s(1), focus: ['wf', 'runner', 'oidc', 'sm', 'db'], end: 0.6, fx: [] },
        { ...s(2), focus: ['wf', 'runner'], end: 2.2, fx: [
          { t: 'set', at: 0.1, k: 'job', v: 'run' }, { t: 'packet', at: 0.3, edge: 'wf-run', label: 'run job' }] },
        { ...s(3), focus: ['runner', 'oidc'], end: 3.4, fx: [
          { t: 'packet', at: 0.3, edge: 'run-oidc', label: f('p_request'), kind: 'access' },
          { t: 'packet', at: 1.5, edge: 'run-oidc', label: 'OIDC JWT', reverse: true }, { t: 'set', at: 2.5, k: 'runId', v: 'ok', pop: true }] },
        { ...s(4), focus: ['runner', 'sm'], end: 2.0, fx: [
          { t: 'packet', at: 0.3, edge: 'run-sm', label: 'POST JWT' }, { t: 'set', at: 1.3, k: 'authn', v: 'check' }] },
        { ...s(5), focus: ['sm', 'oidc'], end: 3.4, fx: [
          { t: 'packet', at: 0.3, edge: 'sm-oidc', label: 'GET JWKS' },
          { t: 'packet', at: 1.4, edge: 'sm-oidc', label: 'public keys', kind: 'identity', reverse: true },
          { t: 'set', at: 2.6, k: 'authn', v: 'ok', pop: true }] },
        { ...s(6), focus: ['sm', 'runner'], end: 3.2, fx: [
          { t: 'set', at: 0.3, k: 'annot', v: 'check' }, { t: 'set', at: 1.0, k: 'annot', v: 'ok', pop: true },
          { t: 'packet', at: 1.3, edge: 'run-sm', label: 'API token', reverse: true }, { t: 'set', at: 2.3, k: 'runTok', v: 'ok', pop: true }] },
        { ...s(7), focus: ['runner', 'sm'], end: 3.4, fx: [
          { t: 'packet', at: 0.3, edge: 'run-sm', label: 'GET secrets' }, { t: 'set', at: 1.2, k: 'vault', v: 'ok', pop: true },
          { t: 'packet', at: 1.4, edge: 'sm-run', label: 'DB_USER · DB_PASS' }, { t: 'set', at: 2.4, k: 'runSec', v: 'ok', pop: true }] },
        { ...s(8), focus: ['runner', 'db', 'wf'], end: 2.6, fx: [
          { t: 'packet', at: 0.3, edge: 'run-db', label: 'mysql' }, { t: 'set', at: 1.4, k: 'db', v: 'ok', pop: true },
          { t: 'set', at: 1.8, k: 'job', v: 'ok', pop: true }] },
      ],
    }
  }, [t])
  return <FlowPlayer spec={spec} />
}
