import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Database, LockKeyhole, Server, Vault } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from '../../FlowPlayer'

/**
 * Recommended rotation: the PAM CPM changes the password on the target, the
 * Vault keeps the new value and the synchronizer pushes it to Secrets
 * Manager. A workload that cached the old value fails; one that reads the
 * secret again on reconnect keeps working.
 */
export default function RotationFlow() {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const p = (k: string) => t(`sm_rotation.flow.${k}`)
    const step = (n: number) => ({ title: p(`s${n}_title`), desc: p(`s${n}_desc`) })
    const idle = p('st_idle'), check = p('st_check')
    const ver = (k: string, label: string, start: 'v1' | 'none' = 'v1') => ({
      label, k, states: [
        ...(start === 'none' ? [{ v: 'none', text: idle, tone: 'muted' as const }] : []),
        { v: 'v1', text: 'v1', tone: 'muted' as const }, { v: 'v2', text: p('st_v2'), tone: 'ok' as const },
      ],
    })
    return {
      id: 'sm-rotation',
      ariaLabel: p('diagram_label'),
      initial: { cpm: 'idle', vpw: 'v1', dbpw: 'v1', smv: 'v1', wlv: 'v1', sess: 'ok' },
      nodes: [
        { id: 'pam', domain: 'neutral', Icon: LockKeyhole, title: p('n_pam'), sub: 'PAM · Privilege Cloud', rows: [
          { label: 'CPM', k: 'cpm', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'run', text: check, tone: 'warn' }, { v: 'ok', text: p('st_changed'), tone: 'ok' }] },
          ver('vpw', p('r_password')),
        ] },
        { id: 'db', domain: 'svc', Icon: Database, title: p('n_db'), sub: 'PostgreSQL · Oracle · AD', rows: [
          ver('dbpw', p('r_password')),
        ] },
        { id: 'sm', domain: 'idira', Icon: Vault, title: 'IDIRA Secrets Manager', sub: 'data/vault/{safe}/{account}', rows: [
          ver('smv', p('r_value')),
        ] },
        { id: 'wl', domain: 'cp', Icon: Server, title: p('n_wl'), sub: p('n_wl_sub'), rows: [
          ver('wlv', p('r_cached')),
          { label: p('r_session'), k: 'sess', states: [{ v: 'ok', text: p('st_connected'), tone: 'ok' }, { v: 'bad', text: p('st_denied'), tone: 'bad' }] },
        ] },
      ],
      edgeKinds: { 'pam-db': 'control', 'pam-sm': 'secret', 'wl-sm': 'identity', 'wl-db': 'access' },
      layouts: {
        wide: {
          w: 980, h: 420,
          boxes: {
            pam: { x: 40, y: 20, w: 240, h: 116 }, db: { x: 740, y: 20, w: 220, h: 96 },
            sm: { x: 400, y: 180, w: 260, h: 96 }, wl: { x: 40, y: 260, w: 240, h: 116 },
          },
          zones: [
            { d: 'neutral', x: 28, y: 10, w: 264, h: 136 }, { d: 'svc', x: 728, y: 10, w: 244, h: 116 },
            { d: 'idira', x: 388, y: 168, w: 284, h: 120 }, { d: 'cp', x: 28, y: 248, w: 264, h: 140 },
          ],
          edges: {
            'pam-db': 'M 280,60 L 740,60', 'pam-sm': 'M 220,136 C 220,206 300,214 400,214',
            'wl-sm': 'M 280,300 C 330,300 350,254 400,254', 'wl-db': 'M 280,350 C 620,370 850,300 850,116',
          },
          labels: [
            { x: 510, y: 46, text: p('l_cpm') },
            { x: 530, y: 150, text: p('l_sync') },
          ],
        },
        narrow: {
          w: 360, h: 760, title: 14,
          boxes: {
            pam: { x: 50, y: 30, w: 260, h: 116 }, db: { x: 50, y: 210, w: 260, h: 96 },
            sm: { x: 50, y: 380, w: 260, h: 96 }, wl: { x: 50, y: 560, w: 260, h: 116 },
          },
          edges: {
            'pam-db': 'M 180,146 L 180,210', 'pam-sm': 'M 310,100 C 352,100 352,428 310,428',
            'wl-sm': 'M 180,560 L 180,476', 'wl-db': 'M 50,618 C 8,618 8,258 50,258',
          },
        },
      },
      steps: [
        { ...step(1), focus: ['pam', 'db', 'wl'], end: 0.6, fx: [] },
        { ...step(2), focus: ['pam', 'db'], end: 2.8, fx: [
          { t: 'set', at: 0.2, k: 'cpm', v: 'run' },
          { t: 'packet', at: 0.5, edge: 'pam-db', label: p('p_change'), kind: 'control' },
          { t: 'set', at: 1.6, k: 'dbpw', v: 'v2', pop: true }, { t: 'set', at: 2.0, k: 'cpm', v: 'ok', pop: true },
          { t: 'set', at: 2.2, k: 'vpw', v: 'v2', pop: true }] },
        { ...step(3), focus: ['pam', 'sm'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'pam-sm', label: p('p_sync'), kind: 'secret' }, { t: 'set', at: 1.4, k: 'smv', v: 'v2', pop: true }] },
        { ...step(4), focus: ['wl', 'db'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'wl-db', label: p('p_old'), kind: 'leak' }, { t: 'set', at: 1.6, k: 'sess', v: 'bad', pop: true }] },
        { ...step(5), focus: ['wl', 'sm'], end: 2.8, fx: [
          { t: 'packet', at: 0.3, edge: 'wl-sm', label: p('p_get') },
          { t: 'packet', at: 1.2, edge: 'wl-sm', label: p('p_new'), reverse: true, kind: 'secret' }, { t: 'set', at: 2.2, k: 'wlv', v: 'v2', pop: true }] },
        { ...step(6), focus: ['wl', 'db'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'wl-db', label: p('p_login') }, { t: 'set', at: 1.5, k: 'sess', v: 'ok', pop: true }] },
      ],
    }
  }, [t])
  return <FlowPlayer spec={spec} />
}
