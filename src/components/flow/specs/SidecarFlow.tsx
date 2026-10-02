import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Database, HardDrive, Server, ShieldCheck, Vault } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from '../FlowPlayer'

/**
 * /dotnet, Sidecar use case: the IDIRA Secrets Provider for Kubernetes runs
 * next to the application in the same pod. It authenticates with the pod's
 * ServiceAccount JWT (authn-jwt), fetches db_user / db_password / db_host,
 * writes the Kubernetes Secret db-dotnet, and the application only reads
 * DB_* environment variables (secretKeyRef) to reach MySQL.
 */
export default function SidecarFlow() {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const f = (k: string) => t(`dotnet.flow.${k}`)
    const st = (k: string) => t(`idflow.${k}`)
    const pend = st('st_pending')
    const step = (n: number) => ({ title: f(`s${n}_title`), desc: f(`s${n}_desc`) })
    return {
      id: 'sidecarflow',
      ariaLabel: f('diagram_label'),
      initial: { scId: 'none', scTok: 'none', scSec: 'none', apiSec: 'none', appEnv: 'none', authn: 'idle', policy: 'idle', vault: 'idle', db: 'idle' },
      nodes: [
        { id: 'api', domain: 'k8s', Icon: Server, title: 'Kubernetes API', sub: 'ServiceAccount · Secret', rows: [
          { label: 'db-dotnet', k: 'apiSec', states: [
            { v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: f('st_written'), tone: 'ok' }, { v: 'sync', text: f('st_synced'), tone: 'ok' }] },
        ] },
        { id: 'sidecar', domain: 'idira', Icon: ShieldCheck, title: 'Secrets Provider', sub: f('n_sidecar_sub'), rows: [
          { label: st('r_identity'), k: 'scId', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: 'JWT', tone: 'ok' }] },
          { label: st('r_token'), k: 'scTok', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: st('st_ok'), tone: 'ok' }] },
          { label: st('r_secret'), k: 'scSec', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: st('st_ok'), tone: 'ok' }] },
        ] },
        { id: 'app', domain: 'k8s', Icon: HardDrive, title: f('n_app'), sub: f('n_app_sub'), rows: [
          { label: 'env', k: 'appEnv', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: 'DB_*', tone: 'ok' }] },
          { label: 'SDK', value: st('st_none') },
        ] },
        { id: 'sm', domain: 'idira', Icon: Vault, title: 'IDIRA Secrets Manager', sub: 'authn-jwt', rows: [
          { label: 'authn-jwt', k: 'authn', states: [{ v: 'idle', text: st('st_idle'), tone: 'muted' }, { v: 'check', text: st('st_check'), tone: 'warn' }, { v: 'ok', text: st('st_valid'), tone: 'ok' }] },
          { label: 'policy', k: 'policy', states: [{ v: 'idle', text: st('st_idle'), tone: 'muted' }, { v: 'check', text: st('st_check'), tone: 'warn' }, { v: 'ok', text: 'read', tone: 'ok' }] },
          { label: 'vault', k: 'vault', states: [{ v: 'idle', text: st('st_idle'), tone: 'muted' }, { v: 'ok', text: st('st_delivered'), tone: 'ok' }] },
        ] },
        { id: 'db', domain: 'svc', Icon: Database, title: 'MySQL', sub: 'DB_HOST', rows: [
          { label: st('r_session'), k: 'db', states: [{ v: 'idle', text: pend, tone: 'muted' }, { v: 'ok', text: st('st_connected'), tone: 'ok' }] },
        ] },
      ],
      edgeKinds: { 'api-sc': 'identity', 'sc-sm': 'identity', 'sm-sc': 'identity', 'sc-api': 'control', 'api-app': 'secret', 'app-db': 'access' },
      layouts: {
        wide: {
          w: 980, h: 390,
          boxes: {
            api: { x: 16, y: 40, w: 190, h: 92 }, sidecar: { x: 350, y: 40, w: 230, h: 126 }, app: { x: 350, y: 262, w: 230, h: 104 },
            sm: { x: 724, y: 40, w: 240, h: 126 }, db: { x: 724, y: 272, w: 240, h: 84 },
          },
          zones: [
            { d: 'k8s', x: 6, y: 28, w: 210, h: 116 }, { d: 'k8s', x: 340, y: 28, w: 250, h: 348 },
            { d: 'idira', x: 714, y: 28, w: 260, h: 150 }, { d: 'svc', x: 714, y: 260, w: 260, h: 108 },
          ],
          lanes: [{ x: 350, y: 18, text: f('lane_pod') }],
          edges: {
            'api-sc': 'M 206,74 L 350,74', 'sc-api': 'M 350,112 L 206,112',
            'sc-sm': 'M 580,84 L 724,84', 'sm-sc': 'M 724,124 L 580,124',
            'api-app': 'M 111,132 C 111,314 230,314 350,314', 'app-db': 'M 580,314 L 724,314',
          },
        },
        narrow: {
          w: 360, h: 790, title: 14,
          boxes: {
            sm: { x: 50, y: 30, w: 260, h: 126 }, sidecar: { x: 70, y: 206, w: 220, h: 126 }, api: { x: 70, y: 382, w: 220, h: 92 },
            app: { x: 70, y: 524, w: 220, h: 104 }, db: { x: 70, y: 690, w: 220, h: 84 },
          },
          zones: [
            { d: 'idira', x: 40, y: 18, w: 280, h: 150 }, { d: 'k8s', x: 56, y: 194, w: 248, h: 444 }, { d: 'svc', x: 60, y: 678, w: 240, h: 108 },
          ],
          edges: {
            'sc-sm': 'M 160,206 L 160,156', 'sm-sc': 'M 200,156 L 200,206',
            'api-sc': 'M 160,382 L 160,332', 'sc-api': 'M 200,332 L 200,382',
            'api-app': 'M 180,474 L 180,524', 'app-db': 'M 180,628 L 180,690',
          },
        },
      },
      steps: [
        { ...step(1), focus: ['sidecar', 'app'], end: 0.6, fx: [] },
        { ...step(2), focus: ['api', 'sidecar'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'api-sc', label: 'SA JWT' }, { t: 'set', at: 1.3, k: 'scId', v: 'ok', pop: true }] },
        { ...step(3), focus: ['sidecar', 'sm'], end: 3.6, fx: [
          { t: 'packet', at: 0.3, edge: 'sc-sm', label: 'POST JWT' }, { t: 'set', at: 1.2, k: 'authn', v: 'check' }, { t: 'set', at: 1.9, k: 'authn', v: 'ok', pop: true },
          { t: 'packet', at: 2.2, edge: 'sm-sc', label: 'API token' }, { t: 'set', at: 3.2, k: 'scTok', v: 'ok', pop: true }] },
        { ...step(4), focus: ['sidecar', 'sm'], end: 3.9, fx: [
          { t: 'packet', at: 0.3, edge: 'sc-sm', label: 'GET ×3' }, { t: 'set', at: 1.2, k: 'policy', v: 'check' },
          { t: 'set', at: 1.8, k: 'policy', v: 'ok', pop: true }, { t: 'set', at: 2.0, k: 'vault', v: 'ok', pop: true },
          { t: 'packet', at: 2.2, edge: 'sm-sc', label: f('p_secrets'), kind: 'secret' }, { t: 'set', at: 3.2, k: 'scSec', v: 'ok', pop: true }] },
        { ...step(5), focus: ['sidecar', 'api'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'sc-api', label: 'PATCH Secret' }, { t: 'set', at: 1.4, k: 'apiSec', v: 'ok', pop: true }] },
        { ...step(6), focus: ['api', 'app'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'api-app', label: 'secretKeyRef' }, { t: 'set', at: 1.4, k: 'appEnv', v: 'ok', pop: true }] },
        { ...step(7), focus: ['app', 'db'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'app-db', label: 'login' }, { t: 'set', at: 1.4, k: 'db', v: 'ok', pop: true }] },
        { ...step(8), focus: ['sidecar', 'sm', 'api'], end: 4.1, fx: [
          { t: 'packet', at: 0.3, edge: 'sc-sm', label: 'GET ×3' },
          { t: 'packet', at: 1.5, edge: 'sm-sc', label: f('p_secrets'), kind: 'secret' },
          { t: 'packet', at: 2.7, edge: 'sc-api', label: 'PATCH Secret' },
          { t: 'set', at: 3.7, k: 'apiSec', v: 'sync', pop: true }] },
      ],
    }
  }, [t])
  return <FlowPlayer spec={spec} />
}
