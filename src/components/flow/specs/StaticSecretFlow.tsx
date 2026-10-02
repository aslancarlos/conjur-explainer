import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Container, Database, FileCode2, Server, UserRound, UserX } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from '../FlowPlayer'

/**
 * Concepts / What is a secret: an app with a static, hardcoded secret.
 * The password is typed into the code, lands in git history and in the image,
 * works in production, and leaks to anyone who can read the repo or image.
 * Rotation means edit, rebuild and redeploy. Problems are marked in red.
 */
export default function StaticSecretFlow() {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const p = (k: string) => t(`secretflow.${k}`)
    const step = (n: number) => ({ title: p(`s${n}_title`), desc: p(`s${n}_desc`) })
    const pend = t('idflow.st_pending')
    return {
      id: 'staticsecret',
      ariaLabel: p('diagram_label'),
      initial: { code: 'none', hist: 'none', img: 'none', conn: 'none', rot: 'none', db: 'idle', reach: 'no' },
      nodes: [
        { id: 'dev', domain: 'cp', Icon: UserRound, title: p('n_dev'), sub: p('n_dev_sub') },
        { id: 'repo', domain: 'cp', Icon: FileCode2, title: p('n_repo'), sub: 'config.yml · git', rows: [
          { label: 'db.password', k: 'code', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'hard', text: 'HARDCODE', tone: 'bad' }] },
          { label: p('r_history'), k: 'hist', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'bad', text: p('st_forever'), tone: 'bad' }] },
        ] },
        { id: 'image', domain: 'cp', Icon: Container, title: p('n_image'), sub: p('n_image_sub'), rows: [
          { label: 'secret', k: 'img', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'bad', text: p('st_baked'), tone: 'bad' }] },
        ] },
        { id: 'app', domain: 'cp', Icon: Server, title: p('n_app'), sub: p('n_app_sub'), rows: [
          { label: p('r_conn'), k: 'conn', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: p('st_works'), tone: 'ok' }] },
          { label: p('r_rotation'), k: 'rot', states: [{ v: 'none', text: pend, tone: 'muted' }, { v: 'pain', text: p('st_redeploy'), tone: 'warn' }] },
        ] },
        { id: 'db', domain: 'svc', Icon: Database, title: p('n_db'), sub: p('n_db_sub'), rows: [
          { label: p('r_session'), k: 'db', states: [{ v: 'idle', text: pend, tone: 'muted' }, { v: 'ok', text: t('idflow.st_connected'), tone: 'ok' }] },
        ] },
        { id: 'leak', domain: 'neutral', Icon: UserX, title: p('n_leak'), sub: p('n_leak_sub'), rows: [
          { label: p('r_dbaccess'), k: 'reach', states: [{ v: 'no', text: p('st_no'), tone: 'muted' }, { v: 'yes', text: p('st_yes'), tone: 'bad' }] },
        ] },
      ],
      edgeKinds: { 'dev-repo': 'leak', 'repo-image': 'leak', 'image-app': 'access', 'app-db': 'access', 'repo-leak': 'leak', 'leak-db': 'leak' },
      layouts: {
        wide: {
          w: 980, h: 450,
          boxes: {
            dev: { x: 16, y: 74, w: 150, h: 76 }, repo: { x: 300, y: 40, w: 240, h: 120 },
            image: { x: 610, y: 40, w: 190, h: 96 }, app: { x: 560, y: 262, w: 220, h: 116 },
            db: { x: 818, y: 262, w: 152, h: 96 }, leak: { x: 300, y: 262, w: 200, h: 96 },
          },
          zones: [
            { d: 'cp', x: 6, y: 28, w: 796, h: 362 }, { d: 'svc', x: 808, y: 250, w: 168, h: 120 },
          ],
          lanes: [{ x: 16, y: 20, text: p('lane_code') }],
          edges: {
            'dev-repo': 'M 166,112 L 300,112', 'repo-image': 'M 540,88 L 610,88',
            'image-app': 'M 705,136 L 705,262', 'app-db': 'M 780,310 L 818,310',
            'repo-leak': 'M 400,160 L 400,262', 'leak-db': 'M 400,358 C 400,430 894,430 894,358',
          },
        },
        narrow: {
          w: 360, h: 1000, title: 14,
          boxes: {
            dev: { x: 70, y: 30, w: 220, h: 76 }, repo: { x: 50, y: 160, w: 260, h: 120 },
            image: { x: 70, y: 340, w: 220, h: 96 }, app: { x: 50, y: 500, w: 260, h: 116 },
            db: { x: 70, y: 680, w: 220, h: 96 }, leak: { x: 70, y: 860, w: 220, h: 96 },
          },
          zones: [{ d: 'cp', x: 40, y: 20, w: 280, h: 606 }, { d: 'svc', x: 60, y: 670, w: 240, h: 116 }],
          lanes: [{ x: 16, y: 14, text: p('lane_code') }],
          edges: {
            'dev-repo': 'M 180,106 L 180,160', 'repo-image': 'M 180,280 L 180,340',
            'image-app': 'M 180,436 L 180,500', 'app-db': 'M 180,616 L 180,680',
            'repo-leak': 'M 310,220 C 352,220 352,908 290,908', 'leak-db': 'M 70,908 C 16,908 16,728 70,728',
          },
        },
      },
      steps: [
        { ...step(1), focus: ['db'], end: 0.6, fx: [] },
        { ...step(2), focus: ['dev', 'repo'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'dev-repo', label: p('p_plain') }, { t: 'set', at: 1.3, k: 'code', v: 'hard', pop: true }] },
        { ...step(3), focus: ['repo'], end: 1.2, fx: [{ t: 'set', at: 0.3, k: 'hist', v: 'bad', pop: true }] },
        { ...step(4), focus: ['repo', 'image'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'repo-image', label: 'docker build' }, { t: 'set', at: 1.3, k: 'img', v: 'bad', pop: true }] },
        { ...step(5), focus: ['image', 'app', 'db'], end: 3.6, fx: [
          { t: 'packet', at: 0.3, edge: 'image-app', label: 'deploy' }, { t: 'set', at: 1.3, k: 'conn', v: 'ok', pop: true },
          { t: 'packet', at: 1.7, edge: 'app-db', label: 'login' }, { t: 'set', at: 2.7, k: 'db', v: 'ok', pop: true }] },
        { ...step(6), focus: ['repo', 'leak', 'db'], end: 3.4, fx: [
          { t: 'packet', at: 0.3, edge: 'repo-leak', label: p('p_copy') }, { t: 'set', at: 1.3, k: 'reach', v: 'yes', pop: true },
          { t: 'packet', at: 1.7, edge: 'leak-db', label: p('p_plain') }] },
        { ...step(7), focus: ['repo', 'image', 'app'], end: 1.4, fx: [{ t: 'set', at: 0.3, k: 'rot', v: 'pain', pop: true }] },
        { ...step(8), focus: ['repo', 'image', 'app', 'leak'], end: 0.8, fx: [] },
      ],
    }
  }, [t])
  return <FlowPlayer spec={spec} />
}
