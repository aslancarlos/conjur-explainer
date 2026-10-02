import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BadgeCheck, Boxes, Cog, Database, Eye, FileCode2, KeyRound, Vault } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from '../FlowPlayer'

/**
 * /eso-shop: the External Secrets Operator use case.
 * ExternalSecret CR -> ESO controller (ClusterSecretStore conjur-store) ->
 * springboot-app ServiceAccount JWT -> authn-jwt/eks-latam -> policy -> vault ->
 * Kubernetes Secret eso-shop-db-creds -> app pods (envFrom) -> MySQL; on
 * rotation ESO updates the Secret and a Python operator rolls the pods.
 */
export default function EsoFlow() {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const f = (k: string) => t(`esoshop.flow.${k}`)
    const st = (k: string) => t(`idflow.${k}`)
    const s = (n: number) => ({ title: f(`s${n}_title`), desc: f(`s${n}_desc`) })
    const pend = st('st_pending')
    return {
      id: 'esoflow',
      ariaLabel: f('diagram_label'),
      initial: { esoId: 'none', esoTok: 'none', sync: 'idle', authn: 'idle', policy: 'idle', vault: 'idle', secData: 'none', appEnv: 'none', pods: 'none', db: 'idle', watch: 'idle' },
      nodes: [
        { id: 'es', domain: 'k8s', Icon: FileCode2, title: 'ExternalSecret', sub: 'eso-shop-db-creds', rows: [
          { label: 'refresh', value: '1m' },
          { label: 'DB_*', value: 'USER · PASS · HOST' },
        ] },
        { id: 'sa', domain: 'k8s', Icon: BadgeCheck, title: 'ServiceAccount', sub: 'springboot-app · aud conjur' },
        { id: 'eso', domain: 'k8s', Icon: Cog, title: f('n_eso'), sub: 'ClusterSecretStore conjur-store', rows: [
          { label: st('r_identity'), k: 'esoId', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: 'JWT', tone: 'ok' }] },
          { label: st('r_token'), k: 'esoTok', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: st('st_ok'), tone: 'ok' }] },
          { label: 'sync', k: 'sync', states: [{ v: 'idle', text: st('st_idle'), tone: 'muted' }, { v: 'v1', text: 'v1', tone: 'ok' }, { v: 'v2', text: 'v2', tone: 'ok' }] },
        ] },
        { id: 'sm', domain: 'idira', Icon: Vault, title: 'Secrets Manager', sub: 'IDIRA · authn-jwt/eks-latam', rows: [
          { label: 'authn-jwt', k: 'authn', states: [{ v: 'idle', text: st('st_idle'), tone: 'muted' }, { v: 'check', text: st('st_check'), tone: 'warn' }, { v: 'ok', text: st('st_valid'), tone: 'ok' }] },
          { label: 'policy', k: 'policy', states: [{ v: 'idle', text: st('st_idle'), tone: 'muted' }, { v: 'check', text: st('st_check'), tone: 'warn' }, { v: 'ok', text: 'read', tone: 'ok' }] },
          { label: 'vault', k: 'vault', states: [{ v: 'idle', text: st('st_idle'), tone: 'muted' }, { v: 'ok', text: st('st_delivered'), tone: 'ok' }] },
        ] },
        { id: 'secret', domain: 'k8s', Icon: KeyRound, title: 'Kubernetes Secret', sub: 'eso-shop-db-creds', rows: [
          { label: 'data', k: 'secData', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'v1', text: 'v1', tone: 'ok' }, { v: 'v2', text: 'v2', tone: 'ok' }] },
        ] },
        { id: 'op', domain: 'k8s', Icon: Eye, title: f('n_op'), sub: 'Kubernetes Watch API', rows: [
          { label: 'watch', k: 'watch', states: [{ v: 'idle', text: st('st_idle'), tone: 'muted' }, { v: 'change', text: f('st_change'), tone: 'warn' }, { v: 'ok', text: f('st_restarted'), tone: 'ok' }] },
        ] },
        { id: 'app', domain: 'k8s', Icon: Boxes, title: f('n_app'), sub: f('n_app_sub'), rows: [
          { label: 'env', k: 'appEnv', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: f('st_loaded'), tone: 'ok' }] },
          { label: 'pods', k: 'pods', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ready', text: '3/3 Ready', tone: 'ok' }, { v: 'roll', text: f('st_rolling'), tone: 'warn' }, { v: 'ready2', text: '3/3 Ready', tone: 'ok' }] },
        ] },
        { id: 'db', domain: 'svc', Icon: Database, title: 'MySQL', sub: f('n_db_sub'), rows: [
          { label: st('r_session'), k: 'db', states: [{ v: 'idle', text: pend, tone: 'muted' }, { v: 'ok', text: st('st_connected'), tone: 'ok' }] },
        ] },
      ],
      edgeKinds: {
        'es-eso': 'control', 'sa-eso': 'identity', 'eso-sm': 'identity', 'sm-eso': 'secret',
        'eso-sec': 'secret', 'sec-app': 'secret', 'app-db': 'access', 'sec-op': 'control', 'op-app': 'control',
      },
      layouts: {
        wide: {
          w: 980, h: 540,
          boxes: {
            es: { x: 16, y: 40, w: 196, h: 98 }, eso: { x: 330, y: 30, w: 220, h: 126 }, sm: { x: 780, y: 30, w: 190, h: 130 },
            sa: { x: 16, y: 216, w: 196, h: 60 }, secret: { x: 330, y: 250, w: 220, h: 84 },
            op: { x: 16, y: 410, w: 196, h: 84 }, app: { x: 330, y: 420, w: 220, h: 100 }, db: { x: 780, y: 420, w: 190, h: 84 },
          },
          zones: [
            { d: 'k8s', x: 6, y: 20, w: 554, h: 510 },
            { d: 'idira', x: 770, y: 20, w: 206, h: 150 },
            { d: 'svc', x: 770, y: 410, w: 206, h: 104 },
          ],
          edges: {
            'es-eso': 'M 212,82 L 330,82',
            'sa-eso': 'M 212,246 C 300,246 380,232 380,156',
            'eso-sm': 'M 550,70 L 780,70',
            'sm-eso': 'M 780,124 L 550,124',
            'eso-sec': 'M 470,156 L 470,250',
            'sec-app': 'M 440,334 L 440,420',
            'app-db': 'M 550,462 L 780,462',
            'sec-op': 'M 330,314 C 200,314 114,350 114,410',
            'op-app': 'M 212,456 L 330,456',
          },
        },
        narrow: {
          w: 360, h: 1218, title: 14,
          boxes: {
            es: { x: 65, y: 20, w: 230, h: 98 }, sa: { x: 65, y: 166, w: 230, h: 60 },
            eso: { x: 65, y: 280, w: 230, h: 126 }, sm: { x: 65, y: 460, w: 230, h: 130 },
            secret: { x: 65, y: 650, w: 230, h: 84 }, op: { x: 65, y: 790, w: 230, h: 84 },
            app: { x: 65, y: 930, w: 230, h: 100 }, db: { x: 65, y: 1094, w: 230, h: 84 },
          },
          zones: [
            { d: 'k8s', x: 55, y: 10, w: 250, h: 406 },
            { d: 'idira', x: 55, y: 450, w: 250, h: 150 },
            { d: 'k8s', x: 55, y: 640, w: 250, h: 400 },
            { d: 'svc', x: 55, y: 1084, w: 250, h: 104 },
          ],
          edges: {
            'es-eso': 'M 65,70 C 14,70 14,330 65,330',
            'sa-eso': 'M 180,226 L 180,280',
            'eso-sm': 'M 160,406 L 160,460',
            'sm-eso': 'M 200,460 L 200,406',
            'eso-sec': 'M 295,360 C 350,360 350,692 295,692',
            'sec-op': 'M 180,734 L 180,790',
            'op-app': 'M 180,874 L 180,930',
            'sec-app': 'M 65,700 C 12,700 12,980 65,980',
            'app-db': 'M 180,1030 L 180,1094',
          },
        },
      },
      steps: [
        { ...s(1), focus: ['es', 'eso', 'secret', 'app', 'op'], end: 0.6, fx: [] },
        { ...s(2), focus: ['es', 'eso'], end: 2.0, fx: [
          { t: 'packet', at: 0.3, edge: 'es-eso', label: 'ExternalSecret' }] },
        { ...s(3), focus: ['sa', 'eso'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'sa-eso', label: 'SA JWT' }, { t: 'set', at: 1.3, k: 'esoId', v: 'ok', pop: true }] },
        { ...s(4), focus: ['eso', 'sm'], end: 3.8, fx: [
          { t: 'packet', at: 0.3, edge: 'eso-sm', label: 'POST JWT' }, { t: 'set', at: 1.2, k: 'authn', v: 'check' },
          { t: 'set', at: 1.9, k: 'authn', v: 'ok', pop: true },
          { t: 'packet', at: 2.2, edge: 'eso-sm', label: 'API token', reverse: true }, { t: 'set', at: 3.2, k: 'esoTok', v: 'ok', pop: true }] },
        { ...s(5), focus: ['eso', 'sm'], end: 3.6, fx: [
          { t: 'packet', at: 0.3, edge: 'eso-sm', label: 'GET secrets' }, { t: 'set', at: 1.2, k: 'policy', v: 'check' },
          { t: 'set', at: 1.8, k: 'policy', v: 'ok', pop: true }, { t: 'set', at: 2.0, k: 'vault', v: 'ok', pop: true },
          { t: 'packet', at: 2.2, edge: 'sm-eso', label: 'DB_USER · DB_PASS' }] },
        { ...s(6), focus: ['eso', 'secret'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'eso-sec', label: 'eso-shop-db-creds' },
          { t: 'set', at: 1.2, k: 'sync', v: 'v1', pop: true }, { t: 'set', at: 1.4, k: 'secData', v: 'v1', pop: true }] },
        { ...s(7), focus: ['secret', 'app', 'db'], end: 3.6, fx: [
          { t: 'packet', at: 0.3, edge: 'sec-app', label: 'envFrom' }, { t: 'set', at: 1.3, k: 'appEnv', v: 'ok', pop: true },
          { t: 'set', at: 1.4, k: 'pods', v: 'ready', pop: true },
          { t: 'packet', at: 1.8, edge: 'app-db', label: 'connect' }, { t: 'set', at: 2.9, k: 'db', v: 'ok', pop: true }] },
        { ...s(8), focus: ['sm', 'eso', 'secret'], end: 3.4, fx: [
          { t: 'packet', at: 0.3, edge: 'sm-eso', label: 'v2' }, { t: 'set', at: 1.3, k: 'sync', v: 'v2', pop: true },
          { t: 'packet', at: 1.6, edge: 'eso-sec', label: 'v2' }, { t: 'set', at: 2.6, k: 'secData', v: 'v2', pop: true }] },
        { ...s(9), focus: ['secret', 'op', 'app'], end: 4.6, fx: [
          { t: 'packet', at: 0.3, edge: 'sec-op', label: 'watch event' }, { t: 'set', at: 1.3, k: 'watch', v: 'change' },
          { t: 'packet', at: 1.6, edge: 'op-app', label: 'restart' }, { t: 'set', at: 2.6, k: 'pods', v: 'roll' },
          { t: 'set', at: 3.6, k: 'pods', v: 'ready2', pop: true }, { t: 'set', at: 3.8, k: 'watch', v: 'ok', pop: true }] },
      ],
    }
  }, [t])
  return <FlowPlayer spec={spec} />
}
