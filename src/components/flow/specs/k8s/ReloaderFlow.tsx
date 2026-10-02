import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Boxes, CalendarClock, Eye, KeyRound, ShieldCheck, Timer, Vault } from 'lucide-react'
import FlowPlayer, { type FlowLayout, type FlowSpec } from '../../FlowPlayer'

export type ReloadMode = 'standalone' | 'job'

/**
 * Automatic application restart with Reloader, from the Secrets Manager docs
 * (k8s-configure-reloader): a secret changes in Secrets Manager, the Secrets
 * Provider (Standalone Deployment on its refresh interval, or a Job rerun by
 * an external trigger such as a CronJob) updates the Kubernetes Secret,
 * Reloader sees the change and rolls the annotated Deployment / StatefulSet.
 */
export default function ReloaderFlow({ mode }: { mode: ReloadMode }) {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const p = (k: string) => t(`k8s_reloader.flow.${k}`)
    const m = (k: string) => t(`k8s_reloader.flow.${mode}_${k}`)
    const step = (n: number) => ({ title: m(`s${n}_title`), desc: m(`s${n}_desc`) })
    const job = mode === 'job'
    const idle = t('idflow.st_idle')

    const wide: FlowLayout = {
      w: 980, h: 460,
      boxes: {
        sm: { x: 16, y: 50, w: 190, h: 130 }, sp: { x: 290, y: 44, w: 230, h: 140 },
        trigger: { x: 640, y: 54, w: 220, h: 110 },
        secret: { x: 260, y: 300, w: 210, h: 110 }, reloader: { x: 510, y: 300, w: 210, h: 110 },
        app: { x: 760, y: 300, w: 204, h: 110 },
      },
      zones: [
        { d: 'idira', x: 6, y: 28, w: 210, h: 164 },
        { d: 'k8s', x: 236, y: 28, w: 738, h: 412 },
      ],
      lanes: [{ x: 16, y: 20, text: 'Secrets Manager' }, { x: 246, y: 20, text: p('lane_cluster') }],
      edges: {
        'sp-sm': 'M 290,115 L 206,115', 'trigger-sp': 'M 640,109 L 520,109',
        'sp-secret': 'M 405,184 C 405,240 365,250 365,300',
        'secret-reloader': 'M 470,355 L 510,355', 'reloader-app': 'M 720,355 L 760,355',
      },
      labels: [
        { x: 248, y: 150, text: '443' },
        { x: 580, y: 140, text: m('lbl_trigger') },
        { x: 490, y: 428, text: 'watch Secret' },
        { x: 740, y: 428, text: 'rolling restart' },
      ],
    }

    const narrow: FlowLayout = {
      w: 360, h: 1020, title: 14,
      boxes: {
        sm: { x: 70, y: 30, w: 220, h: 130 }, sp: { x: 65, y: 210, w: 230, h: 140 },
        trigger: { x: 70, y: 400, w: 220, h: 110 }, secret: { x: 70, y: 560, w: 220, h: 110 },
        reloader: { x: 70, y: 720, w: 220, h: 110 }, app: { x: 70, y: 880, w: 220, h: 110 },
      },
      zones: [
        { d: 'idira', x: 60, y: 20, w: 240, h: 150 },
        { d: 'k8s', x: 40, y: 190, w: 280, h: 816 },
      ],
      edges: {
        'sp-sm': 'M 180,210 L 180,160', 'trigger-sp': 'M 180,400 L 180,350',
        'sp-secret': 'M 295,280 C 348,280 348,615 290,615',
        'secret-reloader': 'M 180,670 L 180,720', 'reloader-app': 'M 180,830 L 180,880',
      },
    }

    return {
      id: `k8s-reloader-${mode}`,
      ariaLabel: m('diagram_label'),
      initial: { val: 'v1', sp: 'idle', trig: 'idle', data: 'v1', watch: 'idle', pods: 'v1' },
      nodes: [
        { id: 'sm', domain: 'idira', Icon: Vault, title: 'Secrets Manager', sub: p('n_sm_sub'), rows: [
          { label: p('r_value'), k: 'val', states: [{ v: 'v1', text: 'v1', tone: 'ok' }, { v: 'v2', text: p('st_changed'), tone: 'warn' }] },
        ] },
        { id: 'sp', domain: 'idira', Icon: ShieldCheck, title: 'Secrets Provider', sub: m('n_sp_sub'), rows: [
          { label: p('r_state'), k: 'sp', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'run', text: p('st_running'), tone: 'warn' }, { v: 'ok', text: p('st_updated'), tone: 'ok' }] },
        ] },
        { id: 'trigger', domain: 'k8s', Icon: job ? CalendarClock : Timer, title: m('n_trigger'), sub: m('n_trigger_sub'), rows: [
          { label: p('r_trigger'), k: 'trig', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_fired'), tone: 'ok' }] },
        ] },
        { id: 'secret', domain: 'k8s', Icon: KeyRound, title: 'Kubernetes Secret', sub: 'db-credentials', rows: [
          { label: 'data', k: 'data', states: [{ v: 'v1', text: 'v1', tone: 'ok' }, { v: 'v2', text: 'v2', tone: 'ok' }] },
        ] },
        { id: 'reloader', domain: 'k8s', Icon: Eye, title: 'Reloader', sub: p('n_reloader_sub'), rows: [
          { label: p('r_watch'), k: 'watch', states: [{ v: 'idle', text: p('st_watching'), tone: 'muted' }, { v: 'ok', text: p('st_detected'), tone: 'warn' }] },
        ] },
        { id: 'app', domain: 'k8s', Icon: Boxes, title: p('n_app'), sub: 'conjur.org/automatic-restart', rows: [
          { label: p('r_pods'), k: 'pods', states: [{ v: 'v1', text: 'v1', tone: 'muted' }, { v: 'roll', text: p('st_rolling'), tone: 'warn' }, { v: 'v2', text: 'v2', tone: 'ok' }] },
        ] },
      ],
      edgeKinds: { 'sp-sm': 'identity', 'trigger-sp': 'control', 'sp-secret': 'secret', 'secret-reloader': 'control', 'reloader-app': 'control' },
      layouts: { wide, narrow },
      steps: [
        { ...step(1), focus: ['sm'], end: 1.2, fx: [{ t: 'set', at: 0.3, k: 'val', v: 'v2', pop: true }] },
        { ...step(2), focus: ['trigger', 'sp'], end: 2.4, fx: [
          { t: 'set', at: 0.3, k: 'trig', v: 'ok', pop: true },
          { t: 'packet', at: 0.6, edge: 'trigger-sp', label: m('p_trigger') }, { t: 'set', at: 1.6, k: 'sp', v: 'run' }] },
        { ...step(3), focus: ['sp', 'sm'], end: 3.0, fx: [
          { t: 'packet', at: 0.3, edge: 'sp-sm', label: 'authn-jwt' },
          { t: 'packet', at: 1.4, edge: 'sp-sm', label: 'v2', kind: 'secret', reverse: true }] },
        { ...step(4), focus: ['sp', 'secret'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'sp-secret', label: 'update', kind: 'secret' },
          { t: 'set', at: 1.3, k: 'data', v: 'v2', pop: true }, { t: 'set', at: 1.6, k: 'sp', v: 'ok' }] },
        { ...step(5), focus: ['secret', 'reloader'], end: 2.0, fx: [
          { t: 'packet', at: 0.3, edge: 'secret-reloader', label: 'watch' }, { t: 'set', at: 1.0, k: 'watch', v: 'ok', pop: true }] },
        { ...step(6), focus: ['reloader', 'app'], end: 2.6, fx: [
          { t: 'packet', at: 0.3, edge: 'reloader-app', label: 'restart' }, { t: 'set', at: 1.0, k: 'pods', v: 'roll', pop: true },
          { t: 'set', at: 2.0, k: 'pods', v: 'v2', pop: true }] },
        { ...step(7), focus: ['app', 'reloader'], end: 0.8, fx: [] },
      ],
    }
  }, [t, mode])
  return <FlowPlayer key={mode} spec={spec} />
}
