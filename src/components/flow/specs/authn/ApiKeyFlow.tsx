import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FileKey2, HardDrive, ScrollText, UserX, Vault } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from '../../FlowPlayer'

/**
 * API key (default authn) authentication, step by step:
 * the host is created and gets a random API key, the key is stored with the
 * workload (file or env vars), the workload POSTs it to /authn/.../authenticate,
 * receives an 8-minute access token, fetches a secret under policy,
 * re-authenticates when the token expires; a copied key also authenticates
 * until it is rotated.
 */
export default function ApiKeyFlow() {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const p = (k: string) => t(`authn_apikey.flow.${k}`)
    const step = (n: number) => ({ title: p(`s${n}_title`), desc: p(`s${n}_desc`) })
    const pend = t('idflow.st_pending')
    const idle = t('idflow.st_idle')
    return {
      id: 'authn-apikey',
      ariaLabel: p('diagram_label'),
      initial: { store: 'none', wkey: 'none', wtok: 'none', wsec: 'none', authn: 'idle', pol: 'idle', smtok: 'idle', leak: 'no' },
      nodes: [
        { id: 'admin', domain: 'cp', Icon: ScrollText, title: p('n_admin'), sub: p('n_admin_sub'), rows: [
          { label: 'API key', value: p('v_length') },
        ] },
        { id: 'store', domain: 'neutral', Icon: FileKey2, title: p('n_store'), sub: '/etc/conjur.identity · env', rows: [
          { label: 'API key', k: 'store', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'bad', text: p('st_stored'), tone: 'bad' }, { v: 'new', text: p('st_rotated'), tone: 'ok' }] },
        ] },
        { id: 'wl', domain: 'cp', Icon: HardDrive, title: p('n_wl'), sub: 'host/data/app', rows: [
          { label: 'API key', k: 'wkey', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_read'), tone: 'ok' }] },
          { label: 'access token', k: 'wtok', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: '8 min', tone: 'ok' }, { v: 'exp', text: p('st_expired'), tone: 'warn' }] },
          { label: 'secret', k: 'wsec', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: t('idflow.st_memory'), tone: 'ok' }] },
        ] },
        { id: 'sm', domain: 'idira', Icon: Vault, title: 'IDIRA Secrets Manager', sub: p('n_sm_sub'), rows: [
          { label: 'authn', k: 'authn', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: t('idflow.st_check'), tone: 'warn' }, { v: 'ok', text: t('idflow.st_valid'), tone: 'ok' }] },
          { label: 'policy', k: 'pol', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_allowed'), tone: 'ok' }] },
          { label: 'token', k: 'smtok', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: 'RSA 2048 · 8 min', tone: 'ok' }] },
        ] },
        { id: 'leak', domain: 'neutral', Icon: UserX, title: p('n_leak'), sub: p('n_leak_sub'), rows: [
          { label: 'authenticate', k: 'leak', states: [{ v: 'no', text: p('st_no'), tone: 'muted' }, { v: 'yes', text: p('st_yes'), tone: 'bad' }, { v: 'blocked', text: p('st_rejected'), tone: 'ok' }] },
        ] },
      ],
      edgeKinds: { 'admin-store': 'secret', 'store-wl': 'secret', 'wl-sm': 'identity', 'wl-sm2': 'access', 'store-leak': 'leak', 'leak-sm': 'leak' },
      layouts: {
        wide: {
          w: 980, h: 470,
          boxes: {
            admin: { x: 16, y: 40, w: 210, h: 96 }, store: { x: 16, y: 280, w: 210, h: 96 },
            wl: { x: 350, y: 250, w: 230, h: 140 }, sm: { x: 700, y: 40, w: 264, h: 140 },
            leak: { x: 350, y: 40, w: 230, h: 96 },
          },
          zones: [
            { d: 'cp', x: 6, y: 28, w: 230, h: 120 }, { d: 'neutral', x: 6, y: 268, w: 230, h: 120 },
            { d: 'cp', x: 340, y: 238, w: 250, h: 164 }, { d: 'idira', x: 690, y: 28, w: 284, h: 164 },
          ],
          edges: {
            'admin-store': 'M 121,136 L 121,280',
            'store-wl': 'M 226,330 L 350,330',
            'wl-sm': 'M 580,290 C 660,290 660,150 700,150',
            'wl-sm2': 'M 580,360 C 720,360 780,240 790,180',
            'store-leak': 'M 226,300 C 290,300 290,88 350,88',
            'leak-sm': 'M 580,88 L 700,88',
          },
          labels: [
            { x: 640, y: 222, text: 'POST /authn/{account}/{login}/authenticate' },
            { x: 790, y: 420, text: 'Authorization: Token token="..."' },
            { x: 640, y: 66, text: 'HTTPS 443' },
          ],
        },
        narrow: {
          w: 360, h: 830, title: 14,
          boxes: {
            admin: { x: 70, y: 30, w: 220, h: 96 }, store: { x: 70, y: 170, w: 220, h: 96 },
            wl: { x: 60, y: 310, w: 240, h: 140 }, sm: { x: 50, y: 500, w: 260, h: 140 },
            leak: { x: 70, y: 700, w: 220, h: 96 },
          },
          edges: {
            'admin-store': 'M 180,126 L 180,170', 'store-wl': 'M 180,266 L 180,310',
            'wl-sm': 'M 150,450 L 150,500', 'wl-sm2': 'M 210,450 L 210,500',
            'store-leak': 'M 290,218 C 350,218 350,748 290,748', 'leak-sm': 'M 70,748 C 14,748 14,570 50,570',
          },
        },
      },
      steps: [
        { ...step(1), focus: ['sm', 'wl'], end: 0.6, fx: [] },
        { ...step(2), focus: ['admin', 'store'], end: 2.0, fx: [{ t: 'packet', at: 0.3, edge: 'admin-store', label: 'API key' }] },
        { ...step(3), focus: ['store'], end: 1.2, fx: [{ t: 'set', at: 0.3, k: 'store', v: 'bad', pop: true }] },
        { ...step(4), focus: ['store', 'wl'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'store-wl', label: 'CONJUR_AUTHN_API_KEY' }, { t: 'set', at: 1.3, k: 'wkey', v: 'ok', pop: true }] },
        { ...step(5), focus: ['wl', 'sm'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'wl-sm', label: 'POST authenticate' }, { t: 'set', at: 1.2, k: 'authn', v: 'check' }, { t: 'set', at: 1.9, k: 'authn', v: 'ok', pop: true }] },
        { ...step(6), focus: ['sm', 'wl'], end: 2.2, fx: [
          { t: 'set', at: 0.2, k: 'smtok', v: 'ok', pop: true },
          { t: 'packet', at: 0.4, edge: 'wl-sm', label: 'access token', reverse: true }, { t: 'set', at: 1.4, k: 'wtok', v: 'ok', pop: true }] },
        { ...step(7), focus: ['wl', 'sm'], end: 3.4, fx: [
          { t: 'packet', at: 0.3, edge: 'wl-sm2', label: 'GET secret' }, { t: 'set', at: 1.2, k: 'pol', v: 'ok', pop: true },
          { t: 'packet', at: 1.6, edge: 'wl-sm2', label: 'secret', reverse: true, kind: 'secret' }, { t: 'set', at: 2.6, k: 'wsec', v: 'ok', pop: true }] },
        { ...step(8), focus: ['wl', 'sm'], end: 2.4, fx: [
          { t: 'set', at: 0.2, k: 'wtok', v: 'exp' },
          { t: 'packet', at: 0.6, edge: 'wl-sm', label: 'POST authenticate' }, { t: 'set', at: 1.8, k: 'wtok', v: 'ok', pop: true }] },
        { ...step(9), focus: ['store', 'leak', 'sm'], end: 3.0, fx: [
          { t: 'packet', at: 0.3, edge: 'store-leak', label: p('p_copy') }, { t: 'set', at: 1.3, k: 'leak', v: 'yes', pop: true },
          { t: 'packet', at: 1.6, edge: 'leak-sm', label: 'API key' }] },
        { ...step(10), focus: ['admin', 'store', 'leak'], end: 2.6, fx: [
          { t: 'packet', at: 0.3, edge: 'admin-store', label: p('p_newkey') }, { t: 'set', at: 1.3, k: 'store', v: 'new', pop: true },
          { t: 'set', at: 1.6, k: 'leak', v: 'blocked', pop: true }] },
      ],
    }
  }, [t])
  return <FlowPlayer spec={spec} />
}
