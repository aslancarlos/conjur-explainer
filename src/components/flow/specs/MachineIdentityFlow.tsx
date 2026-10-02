import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Container, Database, HardDrive, ShieldCheck, UserX } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from '../FlowPlayer'

/**
 * Concepts / What is a machine identity: the platform issues a short-lived,
 * signed identity to the workload; IDIRA verifies the issuer signature and the
 * claims against policy every time; access is granted; the identity expires
 * and renews by itself; a stolen copy is rejected. No password in the code.
 */
export default function MachineIdentityFlow() {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const p = (k: string) => t(`idconcept.${k}`)
    const step = (n: number) => ({ title: p(`s${n}_title`), desc: p(`s${n}_desc`) })
    const pend = t('idflow.st_pending')
    const idle = t('idflow.st_idle')
    const check = t('idflow.st_check')
    return {
      id: 'machineid',
      ariaLabel: p('diagram_label'),
      initial: { wid: 'none', iss: 'idle', claims: 'idle', pol: 'idle', svc: 'idle', stolen: 'none' },
      nodes: [
        { id: 'plat', domain: 'k8s', Icon: Container, title: p('n_plat'), sub: p('n_plat_sub'), rows: [
          { label: p('r_signs'), value: p('st_privkey') },
        ] },
        { id: 'wl', domain: 'k8s', Icon: HardDrive, title: p('n_wl'), sub: 'orders-api', rows: [
          { label: p('r_identity'), k: 'wid', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_jwt'), tone: 'ok' }, { v: 'new', text: p('st_renewed'), tone: 'ok' }] },
          { label: p('r_password'), value: p('st_none'), tone: 'ok' },
        ] },
        { id: 'idira', domain: 'idira', Icon: ShieldCheck, title: p('n_idira'), sub: p('n_idira_sub'), rows: [
          { label: p('r_issuer'), k: 'iss', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'check', text: check, tone: 'warn' }, { v: 'ok', text: p('st_trusted'), tone: 'ok' }] },
          { label: p('r_claims'), k: 'claims', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: 'ns=orders sa=api', tone: 'ok' }] },
          { label: 'policy', k: 'pol', states: [{ v: 'idle', text: idle, tone: 'muted' }, { v: 'ok', text: p('st_allowed'), tone: 'ok' }] },
        ] },
        { id: 'svc', domain: 'svc', Icon: Database, title: p('n_svc'), sub: p('n_svc_sub'), rows: [
          { label: p('r_session'), k: 'svc', states: [{ v: 'idle', text: pend, tone: 'muted' }, { v: 'ok', text: t('idflow.st_connected'), tone: 'ok' }] },
        ] },
        { id: 'thief', domain: 'neutral', Icon: UserX, title: p('n_thief'), sub: p('n_thief_sub'), rows: [
          { label: p('r_result'), k: 'stolen', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'denied', text: p('st_denied'), tone: 'ok' }] },
        ] },
      ],
      edgeKinds: { 'plat-wl': 'identity', 'wl-idira': 'identity', 'idira-plat': 'identity', 'wl-svc': 'access', 'thief-idira': 'leak' },
      layouts: {
        wide: {
          w: 980, h: 430,
          boxes: {
            plat: { x: 16, y: 60, w: 200, h: 96 }, wl: { x: 300, y: 44, w: 220, h: 116 },
            idira: { x: 640, y: 40, w: 220, h: 140 },
            svc: { x: 640, y: 300, w: 220, h: 96 }, thief: { x: 300, y: 300, w: 220, h: 96 },
          },
          zones: [
            { d: 'k8s', x: 6, y: 32, w: 524, h: 138 }, { d: 'idira', x: 630, y: 28, w: 240, h: 164 },
            { d: 'svc', x: 630, y: 288, w: 240, h: 120 }, { d: 'neutral', x: 290, y: 288, w: 240, h: 120 },
          ],
          edges: {
            'plat-wl': 'M 216,108 L 300,108', 'wl-idira': 'M 520,100 L 640,100',
            'idira-plat': 'M 680,40 C 640,6 160,6 116,60',
            'wl-svc': 'M 520,146 C 600,146 620,240 700,300',
            'thief-idira': 'M 520,348 C 590,348 600,232 680,180',
          },
        },
        narrow: {
          w: 360, h: 850, title: 14,
          boxes: {
            plat: { x: 70, y: 30, w: 220, h: 96 }, wl: { x: 50, y: 180, w: 260, h: 116 },
            idira: { x: 50, y: 360, w: 260, h: 140 }, svc: { x: 70, y: 570, w: 220, h: 96 }, thief: { x: 70, y: 730, w: 220, h: 96 },
          },
          zones: [
            { d: 'k8s', x: 40, y: 20, w: 280, h: 286 }, { d: 'idira', x: 40, y: 350, w: 280, h: 160 },
            { d: 'svc', x: 60, y: 560, w: 240, h: 116 }, { d: 'neutral', x: 60, y: 720, w: 240, h: 116 },
          ],
          edges: {
            'plat-wl': 'M 180,126 L 180,180', 'wl-idira': 'M 180,296 L 180,360',
            'idira-plat': 'M 310,420 C 352,420 352,78 290,78',
            'wl-svc': 'M 50,250 C 12,250 12,618 70,618',
            'thief-idira': 'M 290,778 C 352,778 352,470 310,470',
          },
        },
      },
      steps: [
        { ...step(1), focus: ['wl'], end: 0.6, fx: [] },
        { ...step(2), focus: ['plat', 'wl'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'plat-wl', label: p('p_signed') }, { t: 'set', at: 1.3, k: 'wid', v: 'ok', pop: true }] },
        { ...step(3), focus: ['wl', 'idira'], end: 2.0, fx: [
          { t: 'packet', at: 0.3, edge: 'wl-idira', label: 'JWT' }, { t: 'set', at: 1.3, k: 'iss', v: 'check' }] },
        { ...step(4), focus: ['idira', 'plat'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'idira-plat', label: p('p_pubkeys'), reverse: true }, { t: 'set', at: 1.4, k: 'iss', v: 'ok', pop: true }] },
        { ...step(5), focus: ['idira'], end: 1.6, fx: [
          { t: 'set', at: 0.3, k: 'claims', v: 'ok', pop: true }, { t: 'set', at: 0.9, k: 'pol', v: 'ok', pop: true }] },
        { ...step(6), focus: ['idira', 'wl', 'svc'], end: 3.4, fx: [
          { t: 'packet', at: 0.3, edge: 'wl-idira', label: p('p_access'), reverse: true, kind: 'secret' },
          { t: 'packet', at: 1.6, edge: 'wl-svc', label: p('p_connect') }, { t: 'set', at: 2.6, k: 'svc', v: 'ok', pop: true }] },
        { ...step(7), focus: ['plat', 'wl'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'plat-wl', label: p('p_newjwt') }, { t: 'set', at: 1.3, k: 'wid', v: 'new', pop: true }] },
        { ...step(8), focus: ['thief', 'idira'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'thief-idira', label: p('p_oldjwt') }, { t: 'set', at: 1.4, k: 'stolen', v: 'denied', pop: true }] },
        { ...step(9), focus: ['plat', 'wl', 'idira'], end: 0.8, fx: [] },
      ],
    }
  }, [t])
  return <FlowPlayer spec={spec} />
}
