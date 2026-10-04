import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../components/PageHeader'
import { GitBranch, KeyRound, Landmark, Server, Users } from 'lucide-react'
import FlowPlayer, { type FlowSpec } from '../components/flow/FlowPlayer'

/**
 * Policy structure walkthrough (FlowPlayer spec, DESIGN.md §10): each
 * !policy opens a branch (control plane), resources and roles live inside
 * it with fully-qualified ids, !permit links a role to a resource and
 * !grant adds a member to a role. The full YAML sits under the player.
 */

type Tag = 'branch' | 'resource' | 'rule'

const YAML: { indent: number; text: string; tag: Tag }[] = [
  { indent: 0,  text: '- !policy',                          tag: 'branch'   },
  { indent: 2,  text: 'id: prod',                           tag: 'branch'   },
  { indent: 2,  text: 'owner: !group prod-admins',          tag: 'branch'   },
  { indent: 2,  text: 'body:',                              tag: 'branch'   },
  { indent: 4,  text: '- !policy',                          tag: 'branch'   },
  { indent: 6,  text: 'id: app1',                           tag: 'branch'   },
  { indent: 6,  text: 'body:',                              tag: 'branch'   },
  { indent: 8,  text: '- !variable db-password',            tag: 'resource' },
  { indent: 8,  text: '- !host    app1-host',               tag: 'resource' },
  { indent: 8,  text: '- !group   admins',                  tag: 'resource' },
  { indent: 8,  text: '- !permit',                          tag: 'rule'     },
  { indent: 10, text: 'role:       !group admins',          tag: 'rule'     },
  { indent: 10, text: 'privileges: [ read, execute ]',      tag: 'rule'     },
  { indent: 10, text: 'resource:   !variable db-password',  tag: 'rule'     },
  { indent: 8,  text: '- !grant',                           tag: 'rule'     },
  { indent: 10, text: 'role:   !group admins',              tag: 'rule'     },
  { indent: 10, text: 'member: !host  app1-host',           tag: 'rule'     },
]

const TAG_CLS: Record<Tag, string> = {
  branch:   'text-domain-cp',
  resource: 'text-domain-idira',
  rule:     'text-tone-accent',
}

export default function PolicyPage() {
  const { t } = useTranslation()
  const spec = useMemo<FlowSpec>(() => {
    const p = (k: string) => t(`policy.${k}`)
    const pend = t('idflow.st_pending')
    const step = (n: number) => ({ title: p(`s${n}_title`), desc: p(`s${n}_desc`) })
    const st = (k: string, label: string, text: string) =>
      ({ label, k, states: [{ v: 'none', text: pend, tone: 'muted' as const }, { v: 'ok', text, tone: 'ok' as const }] })
    return {
      id: 'policytree',
      ariaLabel: p('title'),
      initial: { prod: 'none', app1: 'none', var: 'none', perm: 'none', grp: 'none', mem: 'none', host: 'none', role: 'none' },
      nodes: [
        { id: 'account', domain: 'idira', Icon: Landmark, title: p('n_root'), sub: p('n_root_sub') },
        { id: 'prod', domain: 'idira', Icon: GitBranch, title: p('n_prod'), sub: p('n_prod_sub'), rows: [st('prod', 'owner', '!group prod-admins')] },
        { id: 'app1', domain: 'idira', Icon: GitBranch, title: p('n_app1'), sub: p('n_app1_sub'), rows: [st('app1', 'id', 'prod/app1')] },
        { id: 'var', domain: 'idira', Icon: KeyRound, title: p('n_var'), sub: p('n_var_sub'), rows: [
          st('var', 'id', 'prod/app1/db-password'), st('perm', 'privileges', 'read, execute')] },
        { id: 'group', domain: 'idira', Icon: Users, title: p('n_group'), sub: p('n_group_sub'), rows: [
          st('grp', 'id', 'prod/app1/admins'), st('mem', 'member', 'app1-host')] },
        { id: 'host', domain: 'idira', Icon: Server, title: p('n_host'), sub: p('n_host_sub'), rows: [
          st('host', 'id', 'prod/app1/app1-host'), st('role', 'role', 'admins')] },
      ],
      edgeKinds: {
        'acc-prod': 'control', 'prod-app1': 'control', 'app1-var': 'control', 'app1-grp': 'control', 'app1-host': 'control',
        'permit': 'access', 'grant': 'identity',
      },
      layouts: {
        wide: {
          w: 980, h: 450,
          boxes: {
            account: { x: 16, y: 50, w: 200, h: 96 }, prod: { x: 256, y: 50, w: 200, h: 96 }, app1: { x: 496, y: 50, w: 210, h: 96 },
            var: { x: 226, y: 300, w: 210, h: 116 }, group: { x: 496, y: 300, w: 210, h: 116 }, host: { x: 756, y: 300, w: 210, h: 116 },
          },
          zones: [{ d: 'idira', x: 6, y: 38, w: 710, h: 120 }, { d: 'idira', x: 216, y: 288, w: 760, h: 140 }],
          lanes: [{ x: 16, y: 26, text: p('tree_label') }, { x: 226, y: 276, text: 'prod/app1' }],
          edges: {
            'acc-prod': 'M 216,98 L 256,98',
            'prod-app1': 'M 456,98 L 496,98',
            'app1-var': 'M 560,146 C 560,222 331,222 331,300',
            'app1-grp': 'M 601,146 L 601,300',
            'app1-host': 'M 642,146 C 642,222 861,222 861,300',
            'permit': 'M 496,368 L 436,368',
            'grant': 'M 756,368 L 706,368',
          },
        },
        narrow: {
          w: 360, h: 950, title: 14,
          boxes: {
            account: { x: 70, y: 36, w: 220, h: 84 }, prod: { x: 70, y: 156, w: 220, h: 96 }, app1: { x: 70, y: 290, w: 220, h: 96 },
            var: { x: 50, y: 450, w: 260, h: 116 }, group: { x: 50, y: 630, w: 260, h: 116 }, host: { x: 50, y: 810, w: 260, h: 116 },
          },
          zones: [{ d: 'idira', x: 56, y: 24, w: 248, h: 374 }, { d: 'idira', x: 36, y: 436, w: 288, h: 504 }],
          lanes: [{ x: 16, y: 14, text: p('tree_label') }, { x: 16, y: 426, text: 'prod/app1' }],
          edges: {
            'acc-prod': 'M 180,120 L 180,156',
            'prod-app1': 'M 180,252 L 180,290',
            'app1-var': 'M 180,386 L 180,450',
            'app1-grp': 'M 70,340 C 18,340 18,688 50,688',
            'app1-host': 'M 290,340 C 346,340 346,868 310,868',
            'permit': 'M 180,630 L 180,566',
            'grant': 'M 180,810 L 180,746',
          },
        },
      },
      steps: [
        { ...step(1), focus: ['account'], end: 0.6, fx: [] },
        { ...step(2), focus: ['account', 'prod'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'acc-prod', label: '!policy prod' }, { t: 'set', at: 1.3, k: 'prod', v: 'ok', pop: true }] },
        { ...step(3), focus: ['prod', 'app1'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'prod-app1', label: '!policy app1' }, { t: 'set', at: 1.3, k: 'app1', v: 'ok', pop: true }] },
        { ...step(4), focus: ['app1', 'var'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'app1-var', label: '!variable' }, { t: 'set', at: 1.3, k: 'var', v: 'ok', pop: true }] },
        { ...step(5), focus: ['app1', 'group', 'host'], end: 2.6, fx: [
          { t: 'packet', at: 0.3, edge: 'app1-host', label: '!host' }, { t: 'packet', at: 0.6, edge: 'app1-grp', label: '!group' },
          { t: 'set', at: 1.4, k: 'host', v: 'ok', pop: true }, { t: 'set', at: 1.7, k: 'grp', v: 'ok', pop: true }] },
        { ...step(6), focus: ['group', 'var'], end: 2.2, fx: [
          { t: 'packet', at: 0.3, edge: 'permit', label: '!permit' }, { t: 'set', at: 1.3, k: 'perm', v: 'ok', pop: true }] },
        { ...step(7), focus: ['host', 'group'], end: 2.4, fx: [
          { t: 'packet', at: 0.3, edge: 'grant', label: '!grant' },
          { t: 'set', at: 1.3, k: 'mem', v: 'ok', pop: true }, { t: 'set', at: 1.5, k: 'role', v: 'ok', pop: true }] },
        { ...step(8), focus: ['account', 'prod', 'app1', 'var', 'group', 'host'], end: 0.8, fx: [] },
      ],
    }
  }, [t])

  return (
    <section id="policy" className="py-24 px-6 bg-bg-muted/40">
      <div className="max-w-5xl mx-auto space-y-10">

        <PageHeader badge={t('policy.badge')} title={t('policy.title')} subtitle={t('policy.subtitle')} />

        <FlowPlayer spec={spec} />

        {/* the policy file that builds the tree above */}
        <figure className="space-y-2">
          <pre translate="no" className="code-block text-[13px] leading-6" role="region" tabIndex={0} aria-label="policy.yml">
            {YAML.map((ln, i) => (
              <div key={i} className="flex">
                <span className="w-7 shrink-0 pr-3 text-right text-text-muted select-none">{i + 1}</span>
                <span className={TAG_CLS[ln.tag]} style={{ paddingLeft: `${ln.indent}ch` }}>{ln.text}</span>
              </div>
            ))}
          </pre>
          <figcaption className="text-xs text-text-muted">
            {t('policy.fqid_label')}: <code translate="no" className="font-mono text-domain-idira">prod/app1/db-password</code>
          </figcaption>
        </figure>

        {/* key concept cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="section-card space-y-2">
              <h3 className="text-sm font-semibold text-text">{t(`policy.key${n}_title`)}</h3>
              <p className="text-xs text-text-muted leading-relaxed">{t(`policy.key${n}_desc`)}</p>
            </div>
          ))}
        </div>

        <p className="hidden sm:block text-center text-xs text-text-muted select-none">{t('policy.keyboard_hint')}</p>
      </div>
    </section>
  )
}
