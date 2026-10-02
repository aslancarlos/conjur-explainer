import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight, Check, Compass, Copy, Eraser, Info, Mail, TriangleAlert,
  ShipWheel, Monitor, CloudUpload, RadioTower, Network,
  Server, GitBranch, Infinity as InfinityIcon, Github, GitPullRequest, CircleDot, Rocket, Boxes, Blocks, Cog,
  Cloud, Vault, KeyRound,
  Leaf, Hexagon, Code, Workflow, Layers, AppWindow, Cpu, Database, Users,
  Bot, Plug, CircleHelp,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { NAV } from '../lib/nav'

/**
 * /finder: the visitor ticks what their environment has and a live panel
 * recommends products and pages. Product colours and icons come from the
 * sidebar groups (lib/nav.ts). Selection lives in the URL (?have=a,b,c) so a
 * result can be shared. Every recommendation points to a page whose copy is
 * the source of the one-line reason.
 */
type Prod = 'sm' | 'swa' | 'cp' | 'shub'

const PRODUCTS: Array<{ key: Prod; navKey: string }> = [
  { key: 'sm', navKey: 'secretsmanager' },
  { key: 'swa', navKey: 'swa' },
  { key: 'cp', navKey: 'cp' },
  { key: 'shub', navKey: 'secretshub' },
]

/** Recommendation targets: one page each, reason in finder.reason.<id>. */
const RECS: Record<string, { to: string; product: Prod }> = {
  k8sArch: { to: '/concepts/kubernetes', product: 'sm' },
  sdk: { to: '/spring-boot', product: 'sm' },
  sidecar: { to: '/dotnet', product: 'sm' },
  eso: { to: '/eso-shop', product: 'sm' },
  csi: { to: '/csi', product: 'sm' },
  spmodes: { to: '/k8s/secrets-provider-modes', product: 'sm' },
  reloader: { to: '/k8s/reloader', product: 'sm' },
  secretless: { to: '/k8s/secretless', product: 'sm' },
  jenkins: { to: '/jenkins', product: 'sm' },
  gitlab: { to: '/cicd/gitlab', product: 'sm' },
  azdo: { to: '/cicd/azure-devops', product: 'sm' },
  gha: { to: '/github-actions', product: 'sm' },
  bitbucket: { to: '/cicd/bitbucket', product: 'sm' },
  circleci: { to: '/cicd/circleci', product: 'sm' },
  octopus: { to: '/cicd/octopus', product: 'sm' },
  ansible: { to: '/ansible', product: 'sm' },
  terraform: { to: '/cicd/terraform', product: 'sm' },
  puppet: { to: '/platforms/puppet', product: 'sm' },
  cf: { to: '/platforms/cloud-foundry', product: 'sm' },
  mulesoft: { to: '/platforms/mulesoft', product: 'sm' },
  python: { to: '/platforms/python-aws', product: 'sm' },
  awsIam: { to: '/authn/aws-iam', product: 'sm' },
  azureMi: { to: '/authn/azure', product: 'sm' },
  gcpId: { to: '/authn/gcp', product: 'sm' },
  dynamic: { to: '/sm/dynamic-secrets', product: 'sm' },
  apiKey: { to: '/authn/api-key', product: 'sm' },
  cert: { to: '/authn/certificate', product: 'sm' },
  summon: { to: '/sm/summon', product: 'sm' },
  rotation: { to: '/sm/rotation', product: 'sm' },
  mcp: { to: '/ai/mcp-server', product: 'sm' },
  users: { to: '/authn/users', product: 'sm' },
  swaArch: { to: '/concepts/swa-architecture', product: 'swa' },
  svid: { to: '/svid', product: 'swa' },
  swaS3: { to: '/swa-s3', product: 'swa' },
  swaAi: { to: '/ai/swa-agents', product: 'swa' },
  cpAgent: { to: '/cp/credential-provider', product: 'cp' },
  ascp: { to: '/cp/ascp', product: 'cp' },
  ccp: { to: '/cp/ccp', product: 'cp' },
  zos: { to: '/cp/zos', product: 'cp' },
  dual: { to: '/dualaccounts', product: 'cp' },
  shubPc: { to: '/secretshub', product: 'shub' },
  shubSh: { to: '/secretshub?env=pamsh', product: 'shub' },
}
/** Labels that need more context than the sidebar label gives. */
const LABEL_OVERRIDE = new Set(['swaArch', 'shubPc', 'shubSh'])

interface Tile { id: string; Icon: LucideIcon; recs: string[]; sub?: boolean; note?: 'iot' | 'stores' | 'other' }
const GROUPS: Array<{ key: string; tiles: Tile[] }> = [
  { key: 'platforms', tiles: [
    { id: 'k8s', Icon: ShipWheel, recs: ['k8sArch', 'sdk', 'sidecar', 'eso', 'csi', 'spmodes', 'reloader', 'swaArch'] },
    { id: 'vm', Icon: Monitor, recs: ['apiKey', 'cert', 'summon', 'cpAgent'] },
    { id: 'cf', Icon: CloudUpload, recs: ['cf'] },
    { id: 'mtls', Icon: Network, recs: ['swaArch', 'svid', 'cert'] },
    { id: 'iot', Icon: RadioTower, recs: ['cert', 'apiKey'], note: 'iot' },
  ] },
  { key: 'cicd', tiles: [
    { id: 'jenkins', Icon: Server, recs: ['jenkins'] },
    { id: 'gitlab', Icon: GitBranch, recs: ['gitlab'] },
    { id: 'azdo', Icon: InfinityIcon, recs: ['azdo'] },
    { id: 'gha', Icon: Github, recs: ['gha'] },
    { id: 'bitbucket', Icon: GitPullRequest, recs: ['bitbucket'] },
    { id: 'circleci', Icon: CircleDot, recs: ['circleci'] },
    { id: 'octopus', Icon: Rocket, recs: ['octopus'] },
    { id: 'ansible', Icon: Boxes, recs: ['ansible'] },
    { id: 'terraform', Icon: Blocks, recs: ['terraform'] },
    { id: 'puppet', Icon: Cog, recs: ['puppet'] },
  ] },
  { key: 'cloud', tiles: [
    { id: 'aws', Icon: Cloud, recs: ['awsIam', 'dynamic', 'swaS3', 'shubPc', 'shubSh'] },
    { id: 'azure', Icon: Cloud, recs: ['azureMi', 'shubPc', 'shubSh'] },
    { id: 'gcp', Icon: Cloud, recs: ['gcpId', 'dynamic', 'shubPc', 'shubSh'] },
    { id: 'awssm', Icon: KeyRound, recs: ['shubPc', 'shubSh'], note: 'stores' },
    { id: 'akv', Icon: KeyRound, recs: ['shubPc', 'shubSh'], note: 'stores' },
    { id: 'gsm', Icon: KeyRound, recs: ['shubPc', 'shubSh'], note: 'stores' },
    { id: 'hcv', Icon: Vault, recs: ['shubPc', 'shubSh'], note: 'stores' },
  ] },
  { key: 'apps', tiles: [
    { id: 'java', Icon: Leaf, recs: ['sdk'] },
    { id: 'dotnet', Icon: Hexagon, recs: ['sidecar'] },
    { id: 'python', Icon: Code, recs: ['python'] },
    { id: 'mulesoft', Icon: Workflow, recs: ['mulesoft'] },
    { id: 'appservers', Icon: Layers, recs: ['ascp'], sub: true },
    { id: 'windows', Icon: AppWindow, recs: ['cpAgent', 'ccp'] },
    { id: 'mainframe', Icon: Cpu, recs: ['zos'] },
    { id: 'databases', Icon: Database, recs: ['secretless', 'dynamic', 'dual', 'rotation'] },
    { id: 'humans', Icon: Users, recs: ['users'] },
  ] },
  { key: 'ai', tiles: [
    { id: 'aiagent', Icon: Bot, recs: ['swaAi', 'mcp'] },
    { id: 'mcpserver', Icon: Plug, recs: ['mcp'] },
  ] },
  { key: 'other', tiles: [
    { id: 'other', Icon: CircleHelp, recs: [], note: 'other' },
  ] },
]
const ALL_TILES = GROUPS.flatMap(g => g.tiles)
const TILE = Object.fromEntries(ALL_TILES.map(t => [t.id, t]))

const CONTACT = 'asramos@paloaltonetworks.com'
const NAV_ITEMS = NAV.flatMap(g => g.items)
const GROUP = (navKey: string) => NAV.find(g => g.key === navKey)

export default function SolutionFinderPage() {
  const { t, i18n } = useTranslation()
  const f = (k: string, o?: Record<string, unknown>) => t(`finder.${k}`, o) as string
  const [params, setParams] = useSearchParams()
  const [copied, setCopied] = useState(false)

  const ORDER = ALL_TILES.map(x => x.id)
  const read = (ps: URLSearchParams) => (ps.get('have') ?? '').split(',').filter(id => TILE[id])
  // Selection lives in React state (functional updates never drop fast clicks)
  // and is mirrored to ?have= so a result can be shared. URL order is stable.
  const [selected, setSelected] = useState<string[]>(() => read(params))
  const isOn = (id: string) => selected.includes(id)
  const write = (ids: string[]) => setSelected(ids)
  const toggle = (id: string) => setSelected(ids => (ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]))
  useEffect(() => {
    const value = ORDER.filter(x => selected.includes(x)).join(',')
    if ((params.get('have') ?? '') === value) return
    const next = new URLSearchParams(params)
    if (value) next.set('have', value); else next.delete('have')
    setParams(next, { replace: true, preventScrollReset: true })
  }, [selected]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (!copied) return; const h = setTimeout(() => setCopied(false), 2000); return () => clearTimeout(h) }, [copied])
  const copyLink = async () => { try { await navigator.clipboard.writeText(window.location.href); setCopied(true) } catch { /* clipboard blocked */ } }

  // recId -> tiles that asked for it
  const byRec = new Map<string, string[]>()
  selected.forEach(id => TILE[id].recs.forEach(r => byRec.set(r, [...(byRec.get(r) ?? []), id])))
  const ranked = PRODUCTS
    .map((p, order) => ({ ...p, order, recs: Object.keys(RECS).filter(r => RECS[r].product === p.key && byRec.has(r)) }))
    .filter(p => p.recs.length)
    .sort((a, b) => b.recs.length - a.recs.length || a.order - b.order)
  const recCount = ranked.reduce((n, p) => n + p.recs.length, 0)
  const notes = new Set(selected.map(id => TILE[id].note).filter(Boolean))

  const recLabel = (id: string) => {
    if (LABEL_OVERRIDE.has(id)) return f(`rec_label.${id}`)
    const nav = NAV_ITEMS.find(i => i.to === RECS[id].to)
    return nav ? t(nav.labelKey) : RECS[id].to
  }
  const tileName = (id: string) => f(`tiles.${id}.name`)
  const mailHref = `mailto:${CONTACT}?subject=${encodeURIComponent(`${t('shell.site_name')}: ${f('other_subject')}`)}&body=${encodeURIComponent(`${f('other_body')}\n${window.location.href}\n\n`)}`

  return (
    <section className="min-h-screen bg-bg-base px-6 py-16">
      <div className="mx-auto max-w-6xl space-y-10">
        <PageHeader badge={f('badge')} title={f('title')} subtitle={f('subtitle')} />

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Tile picker */}
          <div className="space-y-8">
            {GROUPS.map(g => (
              <fieldset key={g.key} className="space-y-3">
                <legend className="text-xs font-semibold uppercase tracking-wider text-text-muted">{f(`groups.${g.key}`)}</legend>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {g.tiles.map(tile => {
                    const on = isOn(tile.id)
                    return (
                      <button key={tile.id} type="button" aria-pressed={on} onClick={() => toggle(tile.id)}
                        className={`relative flex min-h-[104px] flex-col items-center justify-center gap-2 rounded-2xl border px-3 py-4 text-center transition-colors duration-200
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base
                          ${on ? 'border-idira-blue bg-idira-blue/10 shadow-sm' : 'border-border bg-bg-card hover:border-idira-blue/60 hover:bg-bg-muted'}`}>
                        {on && (
                          <span className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-idira-blue text-white" aria-hidden="true">
                            <Check size={13} strokeWidth={3} />
                          </span>
                        )}
                        <tile.Icon size={24} aria-hidden="true" className={on ? 'text-domain-idira' : 'text-text-2'} />
                        <span className="text-sm font-semibold leading-tight text-text">{tileName(tile.id)}</span>
                        {tile.sub && <span className="text-[11px] leading-snug text-text-muted">{f(`tiles.${tile.id}.sub`)}</span>}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            ))}
          </div>

          {/* Live recommendations */}
          <aside aria-labelledby="finder-panel-title"
            className="rounded-2xl border border-border bg-bg-card lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
            <div className="sticky top-0 z-10 space-y-3 border-b border-border bg-bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 id="finder-panel-title" className="text-base font-semibold text-text">{f('panel_title')}</h2>
                <span className="shrink-0 whitespace-nowrap rounded-full bg-bg-muted px-2 py-0.5 font-mono text-xs text-text-muted tabular-nums">
                  {f('selected_count', { count: selected.length })}
                </span>
              </div>
              <p className="sr-only" aria-live="polite">
                {selected.length ? f('live', { products: ranked.length, pages: recCount }) : f('live_empty')}
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => write([])} disabled={!selected.length}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium text-text-2 transition-colors hover:border-idira-blue hover:text-text disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue">
                  <Eraser size={14} aria-hidden="true" />{f('clear')}
                </button>
                <button type="button" onClick={copyLink} disabled={!selected.length}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium text-text-2 transition-colors hover:border-idira-blue hover:text-text disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue">
                  {copied ? <Check size={14} aria-hidden="true" className="text-tone-success" /> : <Copy size={14} aria-hidden="true" />}
                  {copied ? f('copied') : f('copy')}
                </button>
              </div>
            </div>

            <div className="space-y-5 p-5">
              {!selected.length && (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <Compass size={28} aria-hidden="true" className="text-text-muted" />
                  <p className="text-sm font-medium text-text">{f('empty_title')}</p>
                  <p className="text-sm leading-relaxed text-text-2">{f('empty_desc')}</p>
                </div>
              )}

              {notes.has('iot') && (
                <div role="note" className="flex gap-2.5 rounded-xl border border-tone-warning/40 bg-tone-warning/10 p-3">
                  <TriangleAlert size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-tone-warning" />
                  <p className="text-xs leading-relaxed text-text-2"><span className="font-semibold text-text">{f('note_iot_title')}</span> {f('note_iot')}</p>
                </div>
              )}

              {ranked.map(p => {
                const g = GROUP(p.navKey)
                const Icon = g?.Icon ?? Compass
                return (
                  <section key={p.key} aria-label={t(g?.labelKey ?? '')} className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-text">
                        <Icon size={18} aria-hidden="true" className={g?.color ?? 'text-domain-idira'} />
                        {t(g?.labelKey ?? '')}
                      </h3>
                      <span className="text-xs text-text-muted tabular-nums">{f('pages_count', { count: p.recs.length })}</span>
                    </div>
                    {p.key === 'shub' && notes.has('stores') && (
                      <div role="note" className="flex gap-2.5 rounded-xl border border-tone-warning/40 bg-tone-warning/10 p-3">
                        <TriangleAlert size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-tone-warning" />
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-text">{t('cmp.shub_limits_title')}</p>
                          <ul className="list-disc space-y-0.5 pl-4 text-xs leading-relaxed text-text-2">
                            {(t('cmp.shub_limits', { returnObjects: true }) as string[]).map(s => <li key={s}>{s}</li>)}
                          </ul>
                        </div>
                      </div>
                    )}
                    <ul className="space-y-2">
                      {p.recs.map(r => {
                        const nav = NAV_ITEMS.find(i => i.to === RECS[r].to)
                        const cls = 'group block rounded-xl border border-border bg-bg-base p-3 transition-colors hover:border-idira-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue'
                        const inner = (
                          <>
                            <span className={`flex items-center gap-1.5 text-sm font-semibold text-text`}>
                              <span className="group-hover:underline underline-offset-4">{recLabel(r)}</span>
                              <ArrowRight size={14} aria-hidden="true" className={`shrink-0 ${g?.color ?? ''}`} />
                            </span>
                            <span className="mt-1 block text-xs leading-relaxed text-text-2">{f(`reason.${r}`)}</span>
                            <span className="mt-1.5 block text-[11px] text-text-muted">
                              {f('for')}: {(byRec.get(r) ?? []).map(tileName).join(', ')}
                            </span>
                          </>
                        )
                        return <li key={r}>{nav?.href ? <a href={nav.href} className={cls}>{inner}</a> : <Link to={RECS[r].to} className={cls}>{inner}</Link>}</li>
                      })}
                    </ul>
                  </section>
                )
              })}

              {notes.has('other') && (
                <div className="space-y-2.5 rounded-xl border border-border bg-bg-base p-4">
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-text">
                    <CircleHelp size={16} aria-hidden="true" className="text-text-2" />{f('other_title')}
                  </p>
                  <p className="text-xs leading-relaxed text-text-2">{f('other_desc')}</p>
                  <a href={mailHref} lang={i18n.language}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-bg-card px-4 text-xs font-medium text-text transition-colors hover:border-idira-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue">
                    <Mail size={14} aria-hidden="true" className="text-tone-accent" />{f('other_cta')}
                  </a>
                </div>
              )}

              <p className="flex gap-2 border-t border-border pt-4 text-xs leading-relaxed text-text-muted">
                <Info size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
                <span>
                  {f('starting_point')}{' '}
                  <Link to="/compare" className="font-medium text-text-2 underline underline-offset-4 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue rounded">
                    {f('compare_link')}
                  </Link>
                </span>
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
