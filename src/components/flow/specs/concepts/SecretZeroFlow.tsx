import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FileCode2, Fingerprint, KeyRound, Server, UserX, Vault } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from '../../FlowPlayer'

/**
 * Concepts / Secret zero, in two acts on one canvas.
 * Act 1: to ask Secrets Manager for the database password the app needs a
 * first credential (an API key) stored in config, env or the image. That key
 * is itself a static secret: protecting it needs yet another key, it can leak
 * and anyone holding it gets in. Problems are marked in red.
 * Act 2: the platform attests the workload (Kubernetes service account JWT,
 * cloud IAM, CI OIDC token or a SPIFFE SVID), Secrets Manager checks the
 * signature with the platform's public keys and returns a short-lived token.
 * Nothing static is stored.
 */
export default function SecretZeroFlow() {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const p = (k: string) => t(`c_secretzero.flow.${k}`)
    const step = (n: number) => ({ title: p(`s${n}_title`), desc: p(`s${n}_desc`) })
    const pend = t('idflow.st_pending')
    return {
      id: 'secretzero',
      ariaLabel: p('diagram_label'),
      initial: { key: 'none', loop: 'none', rot: 'none', boot: 'none', db: 'none', authn: 'idle', tok: 'none', reach: 'no', doc: 'none' },
      nodes: [
        { id: 'cfg', domain: 'cp', Icon: FileCode2, title: p('n_cfg'), sub: p('n_cfg_sub'), rows: [
          { label: 'api key', k: 'key', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'hard', text: 'HARDCODE', tone: 'bad' }, { v: 'gone', text: p('st_gone'), tone: 'ok' }] },
          { label: p('r_protect'), k: 'loop', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'loop', text: p('st_loop'), tone: 'bad' }] },
          { label: p('r_rotation'), k: 'rot', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'pain', text: p('st_manual'), tone: 'warn' }] },
        ] },
        { id: 'app', domain: 'cp', Icon: Server, title: p('n_app'), sub: p('n_app_sub'), rows: [
          { label: p('r_boot'), k: 'boot', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'static', text: p('st_static'), tone: 'bad' }, { v: 'attested', text: p('st_attested'), tone: 'ok' }] },
          { label: 'db.password', k: 'db', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_delivered'), tone: 'ok' }] },
        ] },
        { id: 'sm', domain: 'idira', Icon: Vault, title: p('n_sm'), sub: p('n_sm_sub'), rows: [
          { label: p('r_authn'), k: 'authn', states: [{ v: 'idle', text: pend, tone: 'muted' }, { v: 'apikey', text: p('st_apikey'), tone: 'warn' }, { v: 'verified', text: p('st_verified'), tone: 'ok' }] },
          { label: 'token', k: 'tok', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'short', text: p('st_short'), tone: 'ok' }] },
        ] },
        { id: 'leak', domain: 'neutral', Icon: UserX, title: p('n_leak'), sub: p('n_leak_sub'), rows: [
          { label: p('r_access'), k: 'reach', states: [{ v: 'no', text: p('st_no'), tone: 'muted' }, { v: 'yes', text: p('st_yes'), tone: 'bad' }] },
        ] },
        { id: 'plat', domain: 'k8s', Icon: Fingerprint, title: p('n_plat'), sub: p('n_plat_sub'), rows: [
          { label: p('r_doc'), k: 'doc', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'issued', text: p('st_signed'), tone: 'ok' }] },
        ] },
        { id: 'keys', domain: 'neutral', Icon: KeyRound, title: p('n_keys'), sub: p('n_keys_sub') },
      ],
      edgeKinds: {
        'cfg-app': 'leak', 'app-sm': 'identity', 'sm-app': 'secret', 'cfg-leak': 'leak', 'leak-sm': 'leak',
        'plat-app': 'identity', 'sm-keys': 'control', 'plat-keys': 'control',
      },
      layouts: {
        wide: {
          w: 980, h: 540,
          boxes: {
            cfg: { x: 40, y: 40, w: 250, h: 136 }, leak: { x: 690, y: 40, w: 250, h: 116 },
            app: { x: 40, y: 220, w: 250, h: 116 }, sm: { x: 400, y: 220, w: 250, h: 116 },
            plat: { x: 40, y: 400, w: 250, h: 116 }, keys: { x: 400, y: 400, w: 250, h: 96 },
          },
          lanes: [{ x: 40, y: 24, text: p('lane_problem') }, { x: 690, y: 386, text: p('lane_solution') }],
          edges: {
            'cfg-app': 'M 165,176 L 165,220', 'app-sm': 'M 290,262 L 400,262', 'sm-app': 'M 400,300 L 290,300',
            'cfg-leak': 'M 290,98 L 690,98', 'leak-sm': 'M 815,156 C 815,236 720,250 650,250',
            'plat-app': 'M 165,400 L 165,336', 'sm-keys': 'M 525,336 L 525,400', 'plat-keys': 'M 290,448 L 400,448',
          },
          labels: [
            { x: 345, y: 281, text: 'HTTPS 443' },
            { x: 600, y: 368, text: 'OIDC / JWKS' },
          ],
        },
        narrow: {
          w: 360, h: 1030, title: 14,
          boxes: {
            cfg: { x: 50, y: 30, w: 260, h: 136 }, app: { x: 50, y: 220, w: 260, h: 116 },
            sm: { x: 50, y: 390, w: 260, h: 116 }, keys: { x: 50, y: 560, w: 260, h: 96 },
            plat: { x: 50, y: 710, w: 260, h: 116 }, leak: { x: 50, y: 880, w: 260, h: 116 },
          },
          lanes: [{ x: 16, y: 16, text: p('lane_problem') }],
          edges: {
            'cfg-app': 'M 180,166 L 180,220', 'app-sm': 'M 160,336 L 160,390', 'sm-app': 'M 200,390 L 200,336',
            'cfg-leak': 'M 50,98 C 12,98 12,938 50,938', 'leak-sm': 'M 310,960 C 356,960 356,470 310,470',
            'plat-app': 'M 310,768 C 336,768 336,290 310,290', 'sm-keys': 'M 180,506 L 180,560', 'plat-keys': 'M 180,710 L 180,656',
          },
        },
      },
      steps: [
        { ...step(1), focus: ['app', 'sm'], end: 0.6, fx: [] },
        { ...step(2), focus: ['cfg', 'app'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'cfg-app', label: 'api key' }, { t: 'set', at: 1.3, k: 'key', v: 'hard', pop: true },
          { t: 'set', at: 1.5, k: 'boot', v: 'static', pop: true }] },
        { ...step(3), focus: ['app', 'sm'], end: 3.4, fx: [
          { t: 'packet', at: 0.3, edge: 'app-sm', label: 'api key' }, { t: 'set', at: 1.3, k: 'authn', v: 'apikey', pop: true },
          { t: 'set', at: 1.6, k: 'tok', v: 'short', pop: true },
          { t: 'packet', at: 1.9, edge: 'sm-app', label: 'secret' }, { t: 'set', at: 2.9, k: 'db', v: 'ok', pop: true }] },
        { ...step(4), focus: ['cfg'], end: 1.6, fx: [
          { t: 'set', at: 0.3, k: 'loop', v: 'loop', pop: true }, { t: 'set', at: 0.9, k: 'rot', v: 'pain', pop: true }] },
        { ...step(5), focus: ['cfg', 'leak', 'sm'], end: 3.2, fx: [
          { t: 'packet', at: 0.3, edge: 'cfg-leak', label: p('p_copy') }, { t: 'set', at: 1.3, k: 'reach', v: 'yes', pop: true },
          { t: 'packet', at: 1.7, edge: 'leak-sm', label: 'api key' }] },
        { ...step(6), focus: ['plat', 'app', 'cfg'], end: 2.6, fx: [
          { t: 'set', at: 0.2, k: 'key', v: 'gone' }, { t: 'set', at: 0.2, k: 'loop', v: 'none' }, { t: 'set', at: 0.2, k: 'rot', v: 'none' },
          { t: 'set', at: 0.2, k: 'reach', v: 'no' }, { t: 'set', at: 0.2, k: 'authn', v: 'idle' }, { t: 'set', at: 0.2, k: 'tok', v: 'none' },
          { t: 'set', at: 0.2, k: 'db', v: 'none' }, { t: 'set', at: 0.2, k: 'boot', v: 'none' },
          { t: 'set', at: 0.6, k: 'doc', v: 'issued', pop: true },
          { t: 'packet', at: 0.9, edge: 'plat-app', label: 'JWT / SVID' }] },
        { ...step(7), focus: ['app', 'sm', 'keys', 'plat'], end: 3.4, fx: [
          { t: 'packet', at: 0.3, edge: 'app-sm', label: 'JWT / SVID' },
          { t: 'packet', at: 1.2, edge: 'plat-keys', label: p('p_publish') },
          { t: 'packet', at: 1.6, edge: 'sm-keys', label: 'JWKS' }, { t: 'set', at: 2.6, k: 'authn', v: 'verified', pop: true }] },
        { ...step(8), focus: ['sm', 'app'], end: 2.4, fx: [
          { t: 'set', at: 0.3, k: 'tok', v: 'short', pop: true },
          { t: 'packet', at: 0.6, edge: 'sm-app', label: 'secret' }, { t: 'set', at: 1.6, k: 'db', v: 'ok', pop: true },
          { t: 'set', at: 1.8, k: 'boot', v: 'attested', pop: true }] },
        { ...step(9), focus: ['cfg', 'app', 'sm', 'plat', 'keys', 'leak'], end: 0.8, fx: [] },
      ],
    }
  }, [t])
  return <FlowPlayer spec={spec} />
}
