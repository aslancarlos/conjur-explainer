import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Boxes, Database, Package, Terminal, Vault } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from '../../FlowPlayer'

/**
 * Cloud Foundry / Tanzu Application Service: the Service Broker turns a
 * service instance into org/space groups and every bind into a host identity
 * in Secrets Manager. The Conjur Buildpack runs Summon at app start: it reads
 * secrets.yml, authenticates with the bound identity and injects the values
 * into the process environment only.
 */
export default function CloudFoundryFlow() {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const p = (k: string) => t(`pf_cf.flow.${k}`)
    const step = (n: number) => ({ title: p(`s${n}_title`), desc: p(`s${n}_desc`) })
    const pend = p('st_pending'), idle = p('st_idle'), check = p('st_check')
    return {
      id: 'pf-cf',
      ariaLabel: p('diagram_label'),
      initial: { inst: 'none', bind: 'none', appId: 'none', summon: 'none', sec: 'none', grp: 'idle', host: 'idle', pol: 'idle', db: 'idle' },
      nodes: [
        { id: 'cli', domain: 'neutral', Icon: Terminal, title: 'cf CLI', sub: p('n_cli_sub') },
        { id: 'broker', domain: 'cp', Icon: Boxes, title: p('n_broker'), sub: 'cyberark-conjur · community', rows: [
          { label: p('r_instance'), k: 'inst', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_space'), tone: 'ok' }] },
          { label: p('r_binding'), k: 'bind', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: 'binding ID', tone: 'ok' }] },
        ] },
        { id: 'app', domain: 'cp', Icon: Package, title: p('n_app'), sub: 'conjur_buildpack · Summon', rows: [
          { label: p('r_identity'), k: 'appId', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: 'VCAP_SERVICES', tone: 'ok' }] },
          { label: p('r_summon'), k: 'summon', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: 'secrets.yml', tone: 'ok' }] },
          { label: p('r_secret'), k: 'sec', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_env'), tone: 'ok' }] },
        ] },
        { id: 'sm', domain: 'idira', Icon: Vault, title: 'IDIRA Secrets Manager', sub: p('n_sm_sub'), rows: [
          { label: p('r_groups'), k: 'grp', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: 'org · space', tone: 'ok' }] },
          { label: 'host', k: 'host', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_created'), tone: 'ok' }] },
          { label: 'policy', k: 'pol', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: check, tone: 'warn' }, { v: 'ok', text: p('st_allowed'), tone: 'ok' }] },
        ] },
        { id: 'db', domain: 'svc', Icon: Database, title: p('n_db'), sub: p('n_db_sub'), rows: [
          { label: p('r_session'), k: 'db', states: [{ v: 'idle', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_connected'), tone: 'ok' }] },
        ] },
      ],
      edgeKinds: { 'cli-broker': 'control', 'broker-sm': 'identity', 'broker-app': 'identity', 'app-sm': 'identity', 'app-db': 'access' },
      layouts: {
        wide: {
          w: 980, h: 420,
          boxes: {
            cli: { x: 40, y: 20, w: 210, h: 76 }, broker: { x: 40, y: 190, w: 210, h: 116 },
            app: { x: 340, y: 250, w: 250, h: 136 }, sm: { x: 700, y: 20, w: 250, h: 136 },
            db: { x: 700, y: 290, w: 250, h: 96 },
          },
          zones: [
            { d: 'neutral', x: 28, y: 10, w: 234, h: 96 }, { d: 'cp', x: 28, y: 178, w: 574, h: 220 },
            { d: 'idira', x: 688, y: 10, w: 274, h: 156 }, { d: 'svc', x: 688, y: 278, w: 274, h: 120 },
          ],
          edges: {
            'cli-broker': 'M 145,96 L 145,190', 'broker-sm': 'M 250,214 C 470,214 560,72 700,72',
            'broker-app': 'M 250,290 L 340,290', 'app-sm': 'M 590,276 C 650,276 650,128 700,128',
            'app-db': 'M 590,338 L 700,338',
          },
          labels: [
            { x: 145, y: 143, text: 'Service Broker API' },
            { x: 470, y: 132, text: p('l_leader') },
            { x: 646, y: 214, text: p('l_follower') },
          ],
        },
        narrow: {
          w: 360, h: 900, title: 14,
          boxes: {
            cli: { x: 50, y: 30, w: 260, h: 76 }, broker: { x: 50, y: 150, w: 260, h: 116 },
            app: { x: 50, y: 340, w: 260, h: 136 }, sm: { x: 50, y: 560, w: 260, h: 136 },
            db: { x: 50, y: 780, w: 260, h: 96 },
          },
          edges: {
            'cli-broker': 'M 180,106 L 180,150', 'broker-sm': 'M 310,190 C 352,190 352,600 310,600',
            'broker-app': 'M 180,266 L 180,340', 'app-sm': 'M 180,476 L 180,560',
            'app-db': 'M 50,420 C 8,420 8,828 50,828',
          },
        },
      },
      steps: [
        { ...step(1), focus: ['broker', 'app', 'sm'], end: 0.6, fx: [] },
        { ...step(2), focus: ['cli', 'broker', 'sm'], end: 3.6, fx: [
          { t: 'packet', at: 0.3, edge: 'cli-broker', label: 'cf create-service' }, { t: 'set', at: 1.3, k: 'inst', v: 'ok', pop: true },
          { t: 'packet', at: 1.6, edge: 'broker-sm', label: p('p_groups') }, { t: 'set', at: 2.6, k: 'grp', v: 'ok', pop: true }] },
        { ...step(3), focus: ['cli', 'broker', 'sm'], end: 3.6, fx: [
          { t: 'packet', at: 0.3, edge: 'cli-broker', label: 'cf push · bind' }, { t: 'set', at: 1.3, k: 'bind', v: 'ok', pop: true },
          { t: 'packet', at: 1.6, edge: 'broker-sm', label: p('p_host') }, { t: 'set', at: 2.6, k: 'host', v: 'ok', pop: true }] },
        { ...step(4), focus: ['broker', 'app'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'broker-app', label: p('p_vcap') }, { t: 'set', at: 1.3, k: 'appId', v: 'ok', pop: true }] },
        { ...step(5), focus: ['app', 'sm'], end: 2.8, fx: [
          { t: 'set', at: 0.3, k: 'summon', v: 'ok', pop: true },
          { t: 'packet', at: 0.8, edge: 'app-sm', label: p('p_auth') }, { t: 'set', at: 1.8, k: 'pol', v: 'check' }] },
        { ...step(6), focus: ['sm', 'app'], end: 2.6, fx: [
          { t: 'set', at: 0.3, k: 'pol', v: 'ok', pop: true },
          { t: 'packet', at: 0.6, edge: 'app-sm', label: p('p_secret'), kind: 'secret', reverse: true }, { t: 'set', at: 1.6, k: 'sec', v: 'ok', pop: true }] },
        { ...step(7), focus: ['app', 'db'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'app-db', label: p('p_login') }, { t: 'set', at: 1.4, k: 'db', v: 'ok', pop: true }] },
      ],
    }
  }, [t])
  return <FlowPlayer spec={spec} />
}
