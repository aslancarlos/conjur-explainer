import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Boxes, FileCode2, FolderOpen, KeyRound, Server, ShieldCheck, Vault } from 'lucide-react'
import FlowPlayer, { type FlowLayout, type FlowSpec } from '../../FlowPlayer'

export type SpMode = 'k8s' | 'p2f'

/**
 * Secrets Provider for Kubernetes as an init container / sidecar, from the
 * Secrets Manager docs (cjr-k8s-jwt-sp-ic, cjr-k8s-jwt-sp-ic-p2f): the
 * provider authenticates with the Pod's identity, fetches the mapped
 * variables and writes them either into a Kubernetes Secret (via the API
 * server, conjur-map) or into files on a shared volume (Push-to-File, driven
 * by Pod annotations). As a sidecar it refreshes on an interval, comparing
 * SHA-256 checksums.
 */
export default function SecretsProviderModesFlow({ mode }: { mode: SpMode }) {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const p = (k: string) => t(`k8s_spmodes.flow.${k}`)
    const m = (k: string) => t(`k8s_spmodes.flow.${mode}_${k}`)
    const step = (n: number) => ({ title: m(`s${n}_title`), desc: m(`s${n}_desc`) })
    const file = mode === 'p2f'
    const pend = t('idflow.st_pending')
    const idle = t('idflow.st_idle')

    const wide: FlowLayout = {
      w: 980, h: 440,
      boxes: {
        cfg: { x: 16, y: 50, w: 200, h: 110 }, sp: { x: 340, y: 40, w: 240, h: 150 },
        sm: { x: 744, y: 50, w: 220, h: 130 },
        app: { x: 16, y: 300, w: 200, h: 110 }, store: { x: 340, y: 300, w: 240, h: 110 },
      },
      zones: [
        { d: 'k8s', x: 6, y: 28, w: 594, h: 400 },
        { d: 'idira', x: 734, y: 28, w: 240, h: 164 },
      ],
      lanes: [{ x: 16, y: 20, text: p('lane_ns') }, { x: 744, y: 20, text: p('lane_sm') }],
      edges: {
        'sp-cfg': 'M 340,105 L 216,105', 'sp-sm': 'M 580,115 L 744,115',
        'sp-store': 'M 460,190 L 460,300', 'store-app': 'M 340,355 L 216,355',
      },
      labels: [
        { x: 278, y: 140, text: m('lbl_cfg') },
        { x: 662, y: 150, text: 'HTTPS 443' },
        { x: 530, y: 245, text: m('lbl_write') },
        { x: 278, y: 390, text: m('lbl_consume') },
      ],
    }

    const narrow: FlowLayout = {
      w: 360, h: 940, title: 14,
      boxes: {
        sm: { x: 70, y: 30, w: 220, h: 130 }, sp: { x: 60, y: 220, w: 240, h: 150 },
        store: { x: 60, y: 440, w: 240, h: 110 }, app: { x: 70, y: 620, w: 220, h: 110 },
        cfg: { x: 70, y: 800, w: 220, h: 110 },
      },
      zones: [
        { d: 'idira', x: 60, y: 20, w: 240, h: 150 },
        { d: 'k8s', x: 40, y: 200, w: 280, h: 724 },
      ],
      edges: {
        'sp-sm': 'M 180,220 L 180,160', 'sp-store': 'M 180,370 L 180,440',
        'store-app': 'M 180,550 L 180,620', 'sp-cfg': 'M 300,295 C 350,295 350,855 290,855',
      },
    }

    return {
      id: `k8s-spmodes-${mode}`,
      ariaLabel: m('diagram_label'),
      initial: { read: 'idle', auth: 'idle', host: 'idle', val: 'v1', data: 'empty', app: 'wait', refresh: 'idle' },
      nodes: [
        { id: 'cfg', domain: 'k8s', Icon: file ? FileCode2 : Server, title: m('n_cfg'), sub: m('n_cfg_sub'), rows: [
          { label: m('r_cfg'), k: 'read', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: t('idflow.st_read'), tone: 'ok' }] },
        ] },
        { id: 'sp', domain: 'idira', Icon: ShieldCheck, title: 'Secrets Provider', sub: p('n_sp_sub'), rows: [
          { label: p('r_auth'), k: 'auth', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: t('idflow.st_check'), tone: 'warn' }, { v: 'ok', text: p('st_token'), tone: 'ok' }] },
          { label: p('r_refresh'), k: 'refresh', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: 'SHA-256', tone: 'warn' }, { v: 'ok', text: p('st_changed'), tone: 'ok' }] },
        ] },
        { id: 'sm', domain: 'idira', Icon: Vault, title: 'Secrets Manager', sub: p('n_sm_sub'), rows: [
          { label: p('r_host'), k: 'host', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: t('idflow.st_check'), tone: 'warn' }, { v: 'ok', text: t('idflow.st_valid'), tone: 'ok' }] },
          { label: p('r_value'), k: 'val', states: [{ v: 'v1', text: 'v1', tone: 'ok' }, { v: 'v2', text: p('st_rotated'), tone: 'ok' }] },
        ] },
        { id: 'store', domain: 'k8s', Icon: file ? FolderOpen : KeyRound, title: m('n_store'), sub: m('n_store_sub'), rows: [
          { label: m('r_store'), k: 'data', states: [{ v: 'empty', text: p('st_empty'), tone: 'muted' }, { v: 'v1', text: 'v1', tone: 'ok' }, { v: 'v2', text: 'v2', tone: 'ok' }] },
        ] },
        { id: 'app', domain: 'k8s', Icon: Boxes, title: p('n_app'), sub: m('n_app_sub'), rows: [
          { label: p('r_app'), k: 'app', states: [{ v: 'wait', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_running'), tone: 'ok' }] },
        ] },
      ],
      edgeKinds: { 'sp-cfg': 'control', 'sp-sm': 'identity', 'sp-store': 'secret', 'store-app': 'secret' },
      layouts: { wide, narrow },
      steps: [
        { ...step(1), focus: ['sp', 'cfg'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'sp-cfg', label: m('p_read') }, { t: 'set', at: 1.3, k: 'read', v: 'ok', pop: true }] },
        { ...step(2), focus: ['sp', 'sm'], end: 3.0, fx: [
          { t: 'set', at: 0.2, k: 'auth', v: 'check' },
          { t: 'packet', at: 0.4, edge: 'sp-sm', label: 'authn-jwt' }, { t: 'set', at: 1.4, k: 'host', v: 'check' },
          { t: 'set', at: 1.9, k: 'host', v: 'ok', pop: true }, { t: 'set', at: 2.3, k: 'auth', v: 'ok', pop: true }] },
        { ...step(3), focus: ['sp', 'sm'], end: 2.0, fx: [
          { t: 'packet', at: 0.3, edge: 'sp-sm', label: p('p_values'), kind: 'secret', reverse: true }] },
        { ...step(4), focus: ['sp', 'store'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'sp-store', label: m('p_write'), kind: 'secret' }, { t: 'set', at: 1.3, k: 'data', v: 'v1', pop: true }] },
        { ...step(5), focus: ['store', 'app'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'store-app', label: m('p_consume'), kind: 'secret' }, { t: 'set', at: 1.3, k: 'app', v: 'ok', pop: true }] },
        { ...step(6), focus: ['sp', 'sm', 'store'], end: 4.2, fx: [
          { t: 'set', at: 0.2, k: 'val', v: 'v2', pop: true }, { t: 'set', at: 0.8, k: 'refresh', v: 'check' },
          { t: 'packet', at: 1.0, edge: 'sp-sm', label: p('p_values'), kind: 'secret', reverse: true },
          { t: 'set', at: 2.0, k: 'refresh', v: 'ok', pop: true },
          { t: 'packet', at: 2.3, edge: 'sp-store', label: 'v2', kind: 'secret' }, { t: 'set', at: 3.3, k: 'data', v: 'v2', pop: true }] },
        { ...step(7), focus: ['store', 'app'], end: 0.8, fx: [] },
      ],
    }
  }, [t, mode])
  return <FlowPlayer key={mode} spec={spec} />
}
