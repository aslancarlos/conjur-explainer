import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AppWindow, Database, FileCode, Terminal, Vault } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from '../../FlowPlayer'

/**
 * Summon (open source CLI): reads secrets.yml, the Secrets Manager provider
 * authenticates with the machine identity already configured on the host,
 * fetches each !var, then execs the child process with the values as
 * environment variables. Nothing is written to disk and the values disappear
 * when the child process exits.
 */
export default function SummonFlow() {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const p = (k: string) => t(`sm_summon.flow.${k}`)
    const step = (n: number) => ({ title: p(`s${n}_title`), desc: p(`s${n}_desc`) })
    const pend = p('st_pending'), idle = p('st_idle'), check = p('st_check')
    return {
      id: 'sm-summon',
      ariaLabel: p('diagram_label'),
      initial: { cfg: 'none', tok: 'none', vals: 'none', authn: 'idle', pol: 'idle', aud: 'idle', env: 'none', db: 'idle' },
      nodes: [
        { id: 'yml', domain: 'neutral', Icon: FileCode, title: 'secrets.yml', sub: p('n_yml_sub'), rows: [
          { label: 'DB_PASSWORD', value: '!var app/db/pass' },
        ] },
        { id: 'summon', domain: 'cp', Icon: Terminal, title: 'Summon', sub: 'provider: summon-conjur', rows: [
          { label: p('r_config'), k: 'cfg', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_read'), tone: 'ok' }] },
          { label: p('r_identity'), k: 'tok', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_token'), tone: 'ok' }] },
          { label: p('r_values'), k: 'vals', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_memory'), tone: 'ok' }, { v: 'gone', text: p('st_discarded'), tone: 'muted' }] },
        ] },
        { id: 'sm', domain: 'idira', Icon: Vault, title: 'IDIRA Secrets Manager', sub: p('n_sm_sub'), rows: [
          { label: p('r_authn'), k: 'authn', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: check, tone: 'warn' }, { v: 'ok', text: p('st_valid'), tone: 'ok' }] },
          { label: 'policy', k: 'pol', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: 'execute', tone: 'ok' }] },
          { label: p('r_audit'), k: 'aud', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_logged'), tone: 'ok' }] },
        ] },
        { id: 'child', domain: 'cp', Icon: AppWindow, title: p('n_child'), sub: 'terraform apply', rows: [
          { label: 'env', k: 'env', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: 'DB_PASSWORD', tone: 'ok' }, { v: 'gone', text: p('st_exited'), tone: 'muted' }] },
          { label: p('r_disk'), value: p('st_nothing'), tone: 'ok' },
        ] },
        { id: 'db', domain: 'svc', Icon: Database, title: p('n_target'), sub: p('n_target_sub'), rows: [
          { label: p('r_session'), k: 'db', states: [{ v: 'idle', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_connected'), tone: 'ok' }] },
        ] },
      ],
      edgeKinds: { 'yml-summon': 'control', 'summon-sm': 'identity', 'summon-child': 'secret', 'child-db': 'access' },
      layouts: {
        wide: {
          w: 980, h: 400,
          boxes: {
            yml: { x: 40, y: 20, w: 230, h: 96 }, summon: { x: 40, y: 184, w: 230, h: 140 },
            sm: { x: 420, y: 14, w: 260, h: 140 }, child: { x: 420, y: 254, w: 260, h: 118 },
            db: { x: 780, y: 266, w: 180, h: 96 },
          },
          zones: [
            { d: 'neutral', x: 28, y: 8, w: 254, h: 120 }, { d: 'idira', x: 408, y: 4, w: 284, h: 160 },
            { d: 'cp', x: 28, y: 174, w: 664, h: 212 }, { d: 'svc', x: 768, y: 254, w: 204, h: 120 },
          ],
          lanes: [{ x: 40, y: 166, text: p('lane_host') }],
          edges: {
            'yml-summon': 'M 230,116 L 230,184', 'summon-sm': 'M 270,214 C 345,214 345,84 420,84',
            'summon-child': 'M 270,300 L 420,300', 'child-db': 'M 680,314 L 780,314',
          },
          labels: [
            { x: 345, y: 150, text: 'HTTPS · REST API', edge: 'summon-sm' },
            { x: 345, y: 340, text: 'exec + env', edge: 'summon-child' },
          ],
        },
        narrow: {
          w: 360, h: 880, title: 14,
          boxes: {
            yml: { x: 50, y: 30, w: 260, h: 96 }, summon: { x: 50, y: 170, w: 260, h: 140 },
            sm: { x: 50, y: 370, w: 260, h: 140 }, child: { x: 50, y: 570, w: 260, h: 118 },
            db: { x: 50, y: 750, w: 260, h: 96 },
          },
          edges: {
            'yml-summon': 'M 180,126 L 180,170', 'summon-sm': 'M 180,310 L 180,370',
            'summon-child': 'M 310,240 C 352,240 352,629 310,629', 'child-db': 'M 180,688 L 180,750',
          },
        },
      },
      steps: [
        { ...step(1), focus: ['yml', 'summon'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'yml-summon', label: p('p_yml') }, { t: 'set', at: 1.3, k: 'cfg', v: 'ok', pop: true }] },
        { ...step(2), focus: ['summon', 'sm'], end: 3.4, fx: [
          { t: 'packet', at: 0.3, edge: 'summon-sm', label: p('p_authn') }, { t: 'set', at: 1.2, k: 'authn', v: 'check' },
          { t: 'set', at: 1.8, k: 'authn', v: 'ok', pop: true },
          { t: 'packet', at: 2.0, edge: 'summon-sm', label: p('p_token'), reverse: true }, { t: 'set', at: 3.0, k: 'tok', v: 'ok', pop: true }] },
        { ...step(3), focus: ['summon', 'sm'], end: 3.6, fx: [
          { t: 'packet', at: 0.3, edge: 'summon-sm', label: p('p_get') }, { t: 'set', at: 1.2, k: 'pol', v: 'ok', pop: true },
          { t: 'set', at: 1.4, k: 'aud', v: 'ok' },
          { t: 'packet', at: 1.7, edge: 'summon-sm', label: p('p_secret'), kind: 'secret', reverse: true }, { t: 'set', at: 2.8, k: 'vals', v: 'ok', pop: true }] },
        { ...step(4), focus: ['summon', 'child'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'summon-child', label: 'DB_PASSWORD' }, { t: 'set', at: 1.4, k: 'env', v: 'ok', pop: true }] },
        { ...step(5), focus: ['child', 'db'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'child-db', label: p('p_login') }, { t: 'set', at: 1.4, k: 'db', v: 'ok', pop: true }] },
        { ...step(6), focus: ['child', 'summon'], end: 1.6, fx: [
          { t: 'set', at: 0.3, k: 'env', v: 'gone', pop: true }, { t: 'set', at: 0.8, k: 'vals', v: 'gone', pop: true }] },
      ],
    }
  }, [t])
  return <FlowPlayer spec={spec} />
}
