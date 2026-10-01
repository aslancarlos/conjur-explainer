import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Database, Globe, HardDrive, KeyRound, ShipWheel, Vault } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from '../FlowPlayer'

/**
 * /csi: the Secrets Store CSI Driver (Conjur provider) mounts dbuser_dual as a
 * read-only tmpfs volume. kubelet mount -> projected ServiceAccount token
 * (aud conjur) -> provider presents it to authn-jwt -> verified against the
 * cluster public keys -> policy -> vault -> files written to tmpfs -> the app
 * serves them; rotation every 2 minutes.
 */
export default function CsiFlow() {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const s = (n: number) => ({ title: t(`csi.s${n}_title`), desc: t(`csi.s${n}_desc`) })
    const st = (k: string) => t(`idflow.${k}`)
    const pend = st('st_pending')
    return {
      id: 'csiflow',
      ariaLabel: t('csi.title'),
      initial: { dtok: 'none', dspc: 'none', afiles: 'none', aver: 'idle', vperm: 'none', vsec: 'idle', brw: 'idle' },
      nodes: [
        { id: 'driver', domain: 'k8s', Icon: ShipWheel, title: 'CSI Driver + provider', sub: 'conjur-k8s-csi-provider', rows: [
          { label: 'SPC', k: 'dspc', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: 'csidriver-secrets', tone: 'ok' }] },
          { label: 'SA token', k: 'dtok', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: 'aud: conjur', tone: 'ok' }] },
        ] },
        { id: 'app', domain: 'k8s', Icon: HardDrive, title: 'csidriver-app', sub: 'Python app + tmpfs volume', rows: [
          { label: 'files', k: 'afiles', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: 'tmpfs ro', tone: 'ok' }] },
          { label: 'rotation', value: '2m0s', tone: 'muted' },
        ] },
        { id: 'kapi', domain: 'k8s', Icon: KeyRound, title: 'Kubernetes API', sub: 'projected SA token · JWKS', rows: [
          { label: 'sub', value: 'sa:csidriver', tone: 'muted' },
        ] },
        { id: 'browser', domain: 'neutral', Icon: Globe, title: 'Browser', sub: 'demo.minha.cloud/csidriver', rows: [
          { label: 'page', k: 'brw', states: [{ v: 'idle', text: st('st_idle'), tone: 'muted' }, { v: 'wait', text: st('st_check'), tone: 'warn' }, { v: 'ok', text: '200 OK', tone: 'ok' }] },
        ] },
        { id: 'authn', domain: 'idira', Icon: Database, title: 'JWT Authenticator', sub: 'authn-jwt/your-cluster', rows: [
          { label: 'JWT', k: 'aver', states: [{ v: 'idle', text: st('st_idle'), tone: 'muted' }, { v: 'check', text: st('st_check'), tone: 'warn' }, { v: 'ok', text: st('st_valid'), tone: 'ok' }] },
          { label: 'aud', value: 'conjur', tone: 'muted' },
        ] },
        { id: 'vault', domain: 'idira', Icon: Vault, title: 'Vault', sub: 'dbuser_dual', rows: [
          { label: 'permit', k: 'vperm', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: 'read/execute', tone: 'ok' }] },
          { label: st('r_secret'), k: 'vsec', states: [{ v: 'idle', text: st('st_idle'), tone: 'muted' }, { v: 'ok', text: st('st_delivered'), tone: 'ok' }] },
        ] },
      ],
      edgeKinds: {
        'br-app': 'access', 'app-drv': 'access', 'k-drv': 'identity', 'drv-authn': 'identity', 'authn-k': 'access', 'k-authn': 'identity',
        'authn-vault': 'control', 'vault-drv': 'secret', 'drv-app': 'secret',
      },
      layouts: {
        wide: {
          w: 980, h: 470,
          boxes: {
            driver: { x: 16, y: 50, w: 210, h: 106 }, app: { x: 16, y: 250, w: 210, h: 106 },
            kapi: { x: 390, y: 24, w: 200, h: 96 }, browser: { x: 390, y: 350, w: 200, h: 96 },
            authn: { x: 754, y: 50, w: 210, h: 106 }, vault: { x: 754, y: 250, w: 210, h: 106 },
          },
          zones: [
            { d: 'k8s', x: 6, y: 36, w: 240, h: 330 }, { d: 'k8s', x: 380, y: 10, w: 220, h: 120 },
            { d: 'neutral', x: 380, y: 336, w: 220, h: 120 }, { d: 'idira', x: 744, y: 36, w: 230, h: 330 },
          ],
          edges: {
            'br-app': 'M 390,398 C 300,398 300,303 226,303',
            'app-drv': 'M 100,250 L 100,156',
            'drv-app': 'M 140,156 L 140,250',
            'k-drv': 'M 390,72 C 320,72 300,80 226,80',
            'drv-authn': 'M 226,130 L 754,130',
            'authn-k': 'M 754,72 C 680,72 660,56 590,56',
            'k-authn': 'M 590,98 C 660,98 680,104 754,104',
            'authn-vault': 'M 859,156 L 859,250',
            'vault-drv': 'M 754,300 C 560,300 400,180 226,100',
          },
        },
        narrow: {
          w: 360, h: 900, title: 14,
          boxes: {
            browser: { x: 70, y: 20, w: 220, h: 96 }, app: { x: 70, y: 160, w: 220, h: 106 },
            driver: { x: 70, y: 316, w: 220, h: 106 }, kapi: { x: 70, y: 472, w: 220, h: 96 },
            authn: { x: 70, y: 614, w: 220, h: 106 }, vault: { x: 70, y: 770, w: 220, h: 106 },
          },
          zones: [
            { d: 'neutral', x: 60, y: 8, w: 240, h: 118 }, { d: 'k8s', x: 60, y: 148, w: 240, h: 284 },
            { d: 'k8s', x: 60, y: 460, w: 240, h: 118 }, { d: 'idira', x: 60, y: 602, w: 240, h: 284 },
          ],
          edges: {
            'br-app': 'M 180,116 L 180,160',
            'app-drv': 'M 160,266 L 160,316',
            'drv-app': 'M 200,316 L 200,266',
            'k-drv': 'M 180,472 L 180,422',
            'drv-authn': 'M 290,370 C 345,370 345,660 290,660',
            'authn-k': 'M 160,614 L 160,568',
            'k-authn': 'M 200,568 L 200,614',
            'authn-vault': 'M 180,720 L 180,770',
            'vault-drv': 'M 70,820 C 15,820 15,370 70,370',
          },
        },
      },
      steps: [
        { ...s(1), focus: ['driver', 'app', 'kapi', 'browser', 'authn', 'vault'], end: 0.6, fx: [] },
        { ...s(2), focus: ['driver', 'authn', 'vault'], end: 1.6, fx: [
          { t: 'set', at: 0.4, k: 'dspc', v: 'ok', pop: true }, { t: 'set', at: 0.9, k: 'vperm', v: 'ok', pop: true }] },
        { ...s(3), focus: ['browser', 'app'], end: 2.2, fx: [
          { t: 'set', at: 0.1, k: 'brw', v: 'wait' }, { t: 'packet', at: 0.3, edge: 'br-app', label: 'GET /csidriver' }] },
        { ...s(4), focus: ['app', 'driver', 'kapi'], end: 3.4, fx: [
          { t: 'packet', at: 0.3, edge: 'app-drv', label: 'mount' }, { t: 'packet', at: 1.4, edge: 'k-drv', label: 'SA token' },
          { t: 'set', at: 2.4, k: 'dtok', v: 'ok', pop: true }] },
        { ...s(5), focus: ['driver', 'authn', 'kapi'], end: 4.0, fx: [
          { t: 'packet', at: 0.3, edge: 'drv-authn', label: 'JWT sa:csidriver' }, { t: 'set', at: 1.2, k: 'aver', v: 'check' },
          { t: 'packet', at: 1.4, edge: 'authn-k', label: 'verify' }, { t: 'packet', at: 2.5, edge: 'k-authn', label: 'public keys' },
          { t: 'set', at: 3.5, k: 'aver', v: 'ok', pop: true }] },
        { ...s(6), focus: ['authn', 'vault'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'authn-vault', label: 'authorize' }, { t: 'set', at: 1.3, k: 'vsec', v: 'ok', pop: true }] },
        { ...s(7), focus: ['vault', 'driver', 'app'], end: 3.4, fx: [
          { t: 'packet', at: 0.3, edge: 'vault-drv', label: 'dbuser_dual' }, { t: 'packet', at: 1.5, edge: 'drv-app', label: 'write tmpfs' },
          { t: 'set', at: 2.5, k: 'afiles', v: 'ok', pop: true }] },
        { ...s(8), focus: ['app', 'browser'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'br-app', label: 'username · ****', reverse: true },
          { t: 'set', at: 1.3, k: 'brw', v: 'ok', pop: true }] },
      ],
    }
  }, [t])
  return <FlowPlayer spec={spec} />
}
