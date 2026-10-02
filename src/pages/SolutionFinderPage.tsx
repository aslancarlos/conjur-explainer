import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeft, ArrowRight, Check, Compass, Copy, Download, Flag, Info, ListChecks, Mail, Pencil, Printer, RotateCcw, TriangleAlert, Sparkles, Lock,
  ShipWheel, Monitor, CloudUpload, RadioTower, Server, GitBranch, Infinity as InfinityIcon, Github, GitPullRequest, CircleDot, Rocket, Boxes, Blocks, Cog,
  Cloud, Vault, KeyRound, Leaf, Hexagon, Code, Workflow, Layers, AppWindow, Cpu, Database, Bot, Plug, CircleHelp, Building2, Zap, Container,
  Fingerprint, Timer, RefreshCw, ClipboardList, ScanLine,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { NAV } from '../lib/nav'
import { APPS_ENVS, DETAIL_GROUPS, DETAILS, ENVS, GOALS, LOGO, PRODUCTS, RECS, evaluate, goalEnabled, effectiveDetails } from './finderModel'
import type { GoalId, Prod } from './finderModel'

/**
 * /finder: a three-step wizard driven by finderModel.ts. Step 1 picks where the
 * environment is; step 2 shows only the services of those environments; step 3
 * picks goals (disabled when the selection does not support them). The result
 * lists only the products whose recommendations match: main product,
 * complements, per-item coverage, a reading path, prerequisites and a print /
 * text report. State lives in the URL (?have=ids&step=1|2|3|result); goals are
 * stored as g_<id> and "Not sure" as g_unsure.
 */
const ICON: Record<string, LucideIcon> = {
  aws: Cloud, azure: Cloud, gcp: Cloud, k8s: ShipWheel, onprem: Building2, mainframe: Cpu, cicd: Workflow, ai: Bot, pam: Vault, other: CircleHelp,
  aws_ec2: Monitor, aws_lambda: Zap, aws_eks: ShipWheel, aws_ecs: Container, aws_sm: KeyRound,
  az_vm: Monitor, az_aks: ShipWheel, az_app: Zap, azdo: InfinityIcon, az_kv: KeyRound,
  gcp_ce: Monitor, gcp_gke: ShipWheel, gcp_run: Zap, gcp_sm: KeyRound,
  k8s_openshift: ShipWheel, k8s_other: ShipWheel,
  op_linux: Server, op_windows: AppWindow, op_appservers: Layers, op_legacy: AppWindow, op_cf: CloudUpload, op_db: Database, op_hcv: Vault, op_iot: RadioTower,
  mf_zos: Cpu,
  ci_jenkins: Server, ci_gitlab: GitBranch, ci_gha: Github, ci_bitbucket: GitPullRequest, ci_circleci: CircleDot, ci_octopus: Rocket, ci_ansible: Boxes, ci_terraform: Blocks, ci_puppet: Cog,
  ai_agents: Bot, ai_mcp: Plug, pam_pc: Cloud, pam_sh: Vault,
  app_java: Leaf, app_dotnet: Hexagon, app_python: Code, app_mulesoft: Workflow,
  g_hardcoded: ScanLine, g_vault_gov: KeyRound, g_legacy_pam: Layers, g_workload_id: Fingerprint, g_ai: Bot, g_dynamic: Timer, g_rotation: RefreshCw, g_audit: ClipboardList, g_unsure: Sparkles,
}
/** Tiles with a short sub line under the name. */
const WITH_SUB = new Set([...ENVS, 'op_appservers', 'ai_agents', 'k8s_other'])
/** Labels that need more context than the sidebar label gives. */
const LABEL_OVERRIDE = new Set(['swaArch', 'shubPc', 'shubSh'])
const ALL_IDS = new Set<string>([...ENVS, ...DETAILS, ...GOALS.map(g => `g_${g.id}`), 'g_unsure'])

type StepKey = 's1' | 's2' | 's3'
type View = StepKey | 'result'
const VIEWS: View[] = ['s1', 's2', 's3', 'result']

const CONTACT = 'asramos@paloaltonetworks.com'
const SITE = 'https://demo.minha.cloud'
const NAV_ITEMS = NAV.flatMap(g => g.items)
const GROUP = (navKey: string) => NAV.find(g => g.key === navKey)
const PROD_OF = (p: Prod) => GROUP(PRODUCTS.find(x => x.key === p)!.navKey)

const btnBase = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card disabled:cursor-not-allowed disabled:opacity-50'
const btnPrimary = `${btnBase} bg-idira-blue text-white hover:bg-idira-blue-2 active:bg-idira-blue-deep`
const btnSecondary = `${btnBase} border border-border bg-bg-card text-text hover:border-idira-blue`
const btnGhost = 'inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-text-2 underline-offset-4 transition-colors hover:text-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue'

/** Reading path: the first START pages get full cards, the rest a compact list. */
const START = 5


/** Technology logo on a light rounded slot (keeps dark logos legible in the dark theme). */
function Logo({ id, size, fallback: Fallback, className = '' }: { id: string; size: number; fallback: LucideIcon; className?: string }) {
  const src = LOGO[id]
  if (!src) return <Fallback size={size - 4} aria-hidden="true" className={`shrink-0 ${className}`} />
  const pad = size >= 28 ? 4 : 2
  return (
    <span aria-hidden="true" className="inline-flex shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-black/5" style={{ width: size + pad * 2, height: size + pad * 2 }}>
      <img src={src} alt="" width={size} height={size} loading="lazy" decoding="async" />
    </span>
  )
}

export default function SolutionFinderPage() {
  const { t, i18n } = useTranslation()
  const f = (k: string, o?: Record<string, unknown>) => t(`finder.${k}`, o) as string
  const reduce = useReducedMotion()
  const [params, setParams] = useSearchParams()
  const [copied, setCopied] = useState(false)
  const [copiedPrereq, setCopiedPrereq] = useState(false)
  const [showPrereq, setShowPrereq] = useState(false)
  const [showOff, setShowOff] = useState(false)

  const readHave = (ps: URLSearchParams) => (ps.get('have') ?? '').split(',').filter(id => ALL_IDS.has(id))
  const readView = (ps: URLSearchParams): View => {
    const v = ps.get('step')
    return v === '1' ? 's1' : v === '2' ? 's2' : v === '3' ? 's3' : v === 'result' ? 'result' : 's1'
  }
  // Selection and step live in React state (fast clicks never drop) and are
  // mirrored to ?have=&step= so a link reopens the same answers or result.
  const [selected, setSelected] = useState<string[]>(() => readHave(params))
  const [view, setView] = useState<View>(() => readView(params))
  const [furthest, setFurthest] = useState(() => VIEWS.indexOf(readView(params)))
  const headingRef = useRef<HTMLHeadingElement>(null)
  const pendingFocus = useRef(false)

  const sorted = [...ALL_IDS].filter(id => selected.includes(id))
  useEffect(() => {
    const next = new URLSearchParams(params)
    if (sorted.length) next.set('have', sorted.join(',')); else next.delete('have')
    next.set('step', view === 'result' ? 'result' : view.slice(1))
    if (next.toString() !== params.toString()) setParams(next, { replace: true, preventScrollReset: true })
  }, [selected, view]) // eslint-disable-line react-hooks/exhaustive-deps

  // Move focus to the new step heading once the entering step has rendered
  // (AnimatePresence waits for the exit), and keep the wizard top in view.
  const viewRef = useRef(view)
  viewRef.current = view
  const focusHeading = (of: View) => {
    if (!pendingFocus.current || of !== viewRef.current) return  // ignore the exiting step
    pendingFocus.current = false
    headingRef.current?.focus({ preventScroll: true })
    const top = headingRef.current?.closest('[data-wizard]')?.getBoundingClientRect().top ?? 0
    if (top < 64) window.scrollBy({ top: top - 80, behavior: reduce ? 'auto' : 'smooth' })
  }

  useEffect(() => { if (!copied) return; const h = setTimeout(() => setCopied(false), 2000); return () => clearTimeout(h) }, [copied])
  useEffect(() => { if (!copiedPrereq) return; const h = setTimeout(() => setCopiedPrereq(false), 2000); return () => clearTimeout(h) }, [copiedPrereq])
  const copyLink = async () => { try { await navigator.clipboard.writeText(window.location.href); setCopied(true) } catch { /* clipboard blocked */ } }

  const go = (v: View) => { pendingFocus.current = true; setView(v); setFurthest(n => Math.max(n, VIEWS.indexOf(v))) }
  // "Not sure" and explicit goals are mutually exclusive.
  const toggle = (id: string) => setSelected(ids => {
    if (ids.includes(id)) return ids.filter(x => x !== id)
    if (id === 'g_unsure') return [...ids.filter(x => !x.startsWith('g_')), id]
    if (id.startsWith('g_')) return [...ids.filter(x => x !== 'g_unsure'), id]
    return [...ids, id]
  })
  const tileName = (id: string) => (id.startsWith('g_') ? f(`goals.${id.slice(2)}.name`) : f(`tiles.${id}.name`))

  // ---------- model ----------
  const sel = {
    envs: sorted.filter(id => (ENVS as string[]).includes(id)),
    details: sorted.filter(id => DETAILS.includes(id)),
    goals: sorted.filter(id => id.startsWith('g_') && id !== 'g_unsure').map(id => id.slice(2)),
    unsure: sorted.includes('g_unsure'),
  }
  const ev = evaluate(sel)
  const visibleDetails = effectiveDetails(sel)
  const items = ev.items
  const ranked = ev.products
  const path = ev.recs
  const notes = new Set<string>(ev.notes)
  const byRecGet = (r: string) => ev.byRec[r] ?? []
  const coverageOf = (id: string) => ev.coverage[id] ?? []
  /** Step-2 group a selected detail is shown in ('apps' for applications). */
  const groupOf = (d: string) => DETAIL_GROUPS.find(g => g.details.includes(d) && (g.env === 'apps' ? APPS_ENVS.some(e => sel.envs.includes(e)) : sel.envs.includes(g.env)))?.env
  /** Environment summary lines for the report: "AWS: EC2, Lambda", then applications. */
  const envLines = () => [
    ...sel.envs.map(e => ({ name: tileName(e), list: ev.details.filter(d => groupOf(d) === e).map(tileName) })),
    ...(ev.details.some(d => groupOf(d) === 'apps') ? [{ name: f('groups.apps'), list: ev.details.filter(d => groupOf(d) === 'apps').map(tileName) }] : []),
  ]
  const goalNames = ev.goals.map(g => f(`goals.${g}.name`))
  const stepCount = (v: View) => v === 's1' ? sel.envs.length : v === 's2' ? visibleDetails.length : v === 's3' ? (sel.unsure ? 1 : sel.goals.length) : 0

  const recLabel = (id: string) => {
    if (LABEL_OVERRIDE.has(id)) return f(`rec_label.${id}`)
    const nav = NAV_ITEMS.find(i => i.to === RECS[id].to)
    return nav ? t(nav.labelKey) : RECS[id].to
  }
  const prodName = (p: Prod) => t(PROD_OF(p)?.labelKey ?? '')
  const mailHref = `mailto:${CONTACT}?subject=${encodeURIComponent(`${t('shell.site_name')}: ${f('other_subject')}`)}&body=${encodeURIComponent(`${f('other_body')} ${[...sel.envs.filter(id => id !== 'other'), ...items].map(tileName).join(', ')}\n${window.location.href}\n\n`)}`

  // ---------- prerequisites and client report ----------
  const prereqOf = (r: string): string[] =>
    i18n.exists(`finder.prereq.rec.${r}`) ? (t(`finder.prereq.rec.${r}`, { returnObjects: true }) as string[]) : []
  const generalOf = (p: Prod) => t(`finder.prereq.general.${p}`, { returnObjects: true }) as string[]
  const fullUrl = (r: string) => `${SITE}${RECS[r].to}`
  const today = new Date().toLocaleDateString(i18n.language, { year: 'numeric', month: 'long', day: 'numeric' })
  const noteLines = (): string[] => [
    ...ev.needsPam.map(p => `${f('needs_pam_title')} ${f(`needs_pam.${p}`)}`),
    ...(notes.has('iot') ? [`${f('note_iot_title')} ${f('note_iot')}`] : []),
    ...(notes.has('stores') ? [`${t('cmp.shub_limits_title')}: ${(t('cmp.shub_limits', { returnObjects: true }) as string[]).join(' ')}`] : []),
    ...(notes.has('other') ? [`${f('other_title')} ${f('other_desc')} ${CONTACT}`] : []),
  ]
  const buildText = () => {
    const L: string[] = []
    L.push(`${t('shell.site_name')} | ${f('report_title')}`, `${f('report_date')}: ${today}`, f('report_prepared'), '')
    L.push(f('report_env').toUpperCase(), ...envLines().map(l => `- ${l.name}${l.list.length ? `: ${l.list.join(', ')}` : ''}`), '')
    L.push(f('goals_line').toUpperCase(), `- ${goalNames.join(', ') || '-'}${ev.inferred ? ` (${f('goals_suggested')})` : ''}`, '')
    if (ranked.length) {
      L.push(f('report_solution').toUpperCase())
      L.push(`${f('report_main')}: ${prodName(ranked[0].key)} (${f('covers', { covered: ranked[0].items.length, total: items.length })})`)
      ranked.slice(1).forEach(p => L.push(`${f('report_complement')}: ${prodName(p.key)} (${f('covers_short', { covered: p.items.length, total: items.length })})`))
      L.push('')
    }
    L.push(f('coverage_title').toUpperCase(), ...items.map(id => {
      const ps = coverageOf(id)
      return `- ${tileName(id)}: ${ps.length ? ps.map(prodName).join(', ') : id === 'other' ? f('coverage_other') : f('coverage_none')}`
    }), '')
    if (path.length) {
      L.push(f('path_title').toUpperCase(), ...path.map((r, i) => `${i + 1}. ${recLabel(r)} (${prodName(RECS[r].product)}): ${fullUrl(r)}`), '')
      L.push(f('prereq_title').toUpperCase())
      ranked.forEach(p => { L.push(f('prereq_general', { product: prodName(p.key) }), ...generalOf(p.key).map(x => `  [ ] ${x}`)) })
      path.forEach(r => {
        const items = prereqOf(r)
        L.push(`${recLabel(r)} (${fullUrl(r)})`, ...(items.length ? items.map(x => `  [ ] ${x}`) : [`  ${f('prereq_see_page')}`]))
      })
      L.push('')
    }
    const nl = noteLines()
    if (nl.length) L.push(f('report_notes').toUpperCase(), ...nl.map(x => `- ${x}`), '')
    L.push(f('report_sources'))
    return L.join('\n')
  }
  const copyPrereq = async () => { try { await navigator.clipboard.writeText(buildText()); setCopiedPrereq(true) } catch { /* clipboard blocked */ } }
  const downloadTxt = () => {
    const url = URL.createObjectURL(new Blob([buildText()], { type: 'text/plain;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url; a.download = `solution-prerequisites-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
  }

  const idx = VIEWS.indexOf(view)
  const motionProps = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 } }
    : { initial: { opacity: 0, x: 16 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -16 }, transition: { duration: 0.2, ease: 'easeOut' as const } }

  // ---------- pieces ----------
  const ProdDot = (p: Prod) => {
    const g = PROD_OF(p); const Icon = g?.Icon ?? Compass
    return <Icon size={14} aria-hidden="true" className={`shrink-0 ${g?.color ?? 'text-domain-idira'}`} />
  }
  const ProdChip = (p: Prod, count?: number) => (
    <span key={p} className="inline-flex min-h-7 items-center gap-1.5 rounded-full border border-border bg-bg-base px-2.5 text-xs font-medium text-text">
      {ProdDot(p)}{p === 'swa' ? 'SWA' : prodName(p)}
      {count !== undefined && <span className="font-mono tabular-nums text-text-muted">{count}</span>}
    </span>
  )
  const ItemChip = (id: string) => {
    const T = { Icon: ICON[id] ?? CircleHelp }
    return (
      <span key={id} className="inline-flex min-h-7 items-center gap-1.5 rounded-full bg-bg-muted px-2.5 text-xs text-text-2">
        <Logo id={id} size={14} fallback={T.Icon} className="text-text-muted" />{tileName(id)}
      </span>
    )
  }

  const checklist = (items: string[]) => (
    <ul className="space-y-1.5">
      {items.map(x => (
        <li key={x} className="flex gap-2.5 text-sm leading-relaxed text-text-2">
          <span aria-hidden="true" className="mt-1 h-3.5 w-3.5 shrink-0 rounded-[3px] border border-text-muted" />{x}
        </li>
      ))}
    </ul>
  )

  const Stepper = () => (
    <nav aria-label={f('stepper_label')} className="border-b border-border px-6 py-4 sm:px-8">
      <ol className="flex items-center gap-2">
        {VIEWS.map((v, i) => {
          const current = v === view
          const done = i < idx || (i <= furthest && !current && v !== 'result')
          const reachable = i <= furthest || (v === 'result' && furthest >= 2)
          const count = stepCount(v)
          return (
            <li key={v} className="flex min-w-0 flex-1 items-center gap-2">
              <button type="button" onClick={() => reachable && go(v)} disabled={!reachable}
                aria-current={current ? 'step' : undefined}
                className={`group flex min-h-11 min-w-0 items-center gap-2.5 rounded-lg pr-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue disabled:cursor-not-allowed`}>
                <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold tabular-nums transition-colors
                  ${current ? 'border-idira-blue bg-idira-blue text-white' : done ? 'border-idira-blue/50 bg-idira-blue/10 text-domain-idira' : 'border-border bg-bg-base text-text-muted'}`}>
                  {v === 'result' ? <Flag size={14} aria-hidden="true" /> : done && !current ? <Check size={14} strokeWidth={3} aria-hidden="true" /> : i + 1}
                </span>
                <span className="min-w-0">
                  <span className={`block truncate text-sm font-semibold ${current ? 'text-text' : reachable ? 'text-text-2 group-hover:text-text' : 'text-text-muted'}`}>{f(`${v}_label`)}</span>
                  {v !== 'result' && (
                    <span className="block truncate text-xs text-text-muted tabular-nums">{count ? f('selected_short', { count }) : f('optional')}</span>
                  )}
                </span>
              </button>
              {i < VIEWS.length - 1 && <span aria-hidden="true" className={`hidden h-px flex-1 sm:block ${i < furthest ? 'bg-idira-blue/50' : 'bg-border'}`} />}
            </li>
          )
        })}
      </ol>
    </nav>
  )

  const TileButton = (id: string, opts: { disabledHint?: string; help?: string } = {}) => {
    const on = selected.includes(id)
    const disabled = !!opts.disabledHint
    const Icon = ICON[id] ?? CircleHelp
    const sub = opts.disabledHint ?? opts.help ?? (WITH_SUB.has(id) ? f(`tiles.${id}.sub`) : undefined)
    return (
      <button key={id} type="button" aria-pressed={on} aria-disabled={disabled || undefined} onClick={() => !disabled && toggle(id)}
        className={`relative flex min-h-[60px] items-center gap-3 rounded-xl border py-2.5 pl-3.5 pr-9 text-left transition-colors duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card
          ${disabled ? 'cursor-not-allowed border-dashed border-border bg-bg-card' : on ? 'border-idira-blue bg-idira-blue/10' : 'border-border bg-bg-base hover:border-idira-blue/60 hover:bg-bg-muted'}`}>
        {disabled
          ? <Lock size={18} aria-hidden="true" className="shrink-0 text-text-muted" />
          : <Logo id={id} size={28} fallback={Icon} className={on ? 'text-domain-idira' : 'text-text-2'} />}
        <span className="min-w-0 flex-1">
          <span className={`block text-sm font-semibold leading-tight ${disabled ? 'text-text-muted' : 'text-text'}`}>{tileName(id)}</span>
          {sub && <span title={sub} className={`mt-0.5 block text-xs leading-snug ${opts.help || disabled ? '' : 'truncate'} text-text-muted`}>{sub}</span>}
        </span>
        {!disabled && (
          <span aria-hidden="true" className={`absolute right-3 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border transition-colors
            ${on ? 'border-idira-blue bg-idira-blue text-white' : 'border-border bg-bg-card text-transparent'}`}>
            <Check size={12} strokeWidth={3} />
          </span>
        )}
      </button>
    )
  }

  const StepHead = (k: StepKey) => (
    <div className="space-y-1.5">
      <p className="font-mono text-xs uppercase tracking-wider text-text-muted">{f('step_of', { current: idx + 1, total: 3 })}</p>
      <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-bold tracking-[-0.01em] text-text focus:outline-none">{f(`${k}_title`)}</h2>
      <p className="max-w-[65ch] text-sm leading-relaxed text-text-2">{f(`${k}_help`)}</p>
    </div>
  )
  const grid = 'grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-2.5'
  const StepFoot = (k: StepKey) => {
    const n = stepCount(k)
    return <p className="text-xs text-text-muted tabular-nums" aria-live="polite">{n ? f('selected_in_step', { count: n }) : f('none_in_step')}</p>
  }

  const StepView = (k: StepKey) => {
    if (k === 's1') {
      return (
        <div className="space-y-5">
          {StepHead(k)}
          <fieldset>
            <legend className="sr-only">{f('s1_title')}</legend>
            <div className={grid}>{ENVS.map(id => TileButton(id))}</div>
          </fieldset>
          {StepFoot(k)}
        </div>
      )
    }
    if (k === 's2') {
      const groups = DETAIL_GROUPS.filter(g => g.env === 'apps' ? APPS_ENVS.some(e => sel.envs.includes(e)) : sel.envs.includes(g.env))
      return (
        <div className="space-y-6">
          {StepHead(k)}
          {groups.length === 0 ? (
            <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border bg-bg-base p-5">
              <p className="text-sm font-semibold text-text">{f('s2_empty_title')}</p>
              <p className="text-sm leading-relaxed text-text-2">{f('s2_empty_desc')}</p>
              <button type="button" onClick={() => go('s1')} className={btnSecondary}><ArrowLeft size={16} aria-hidden="true" />{f('s2_empty_cta')}</button>
            </div>
          ) : groups.map(g => {
            const GIcon = g.env === 'apps' ? Code : ICON[g.env]
            return (
              <fieldset key={g.env} className="space-y-2.5">
                <legend className="mb-2.5 inline-flex items-center gap-2 text-sm font-semibold text-text">
                  {g.env === 'apps' ? <GIcon size={16} aria-hidden="true" className="text-text-2" /> : <Logo id={g.env} size={16} fallback={GIcon} className="text-text-2" />}{g.env === 'apps' ? f('groups.apps') : tileName(g.env)}
                  {g.env === 'apps' && <span className="text-xs font-normal text-text-muted">{f('groups.apps_hint')}</span>}
                </legend>
                <div className={grid}>{g.details.map(id => TileButton(id))}</div>
              </fieldset>
            )
          })}
          {groups.length > 0 && StepFoot(k)}
        </div>
      )
    }
    // s3: goals, disabled when the selection does not support them
    const enabled = (g: GoalId) => goalEnabled(g, visibleDetails)
    const goalsOn = GOALS.filter(g => enabled(g.id))
    const goalsOff = GOALS.filter(g => !enabled(g.id))
    return (
      <div className="space-y-5">
        {StepHead(k)}
        <fieldset className="space-y-2.5">
          <legend className="sr-only">{f('s3_title')}</legend>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {TileButton('g_unsure', { help: f('goals.unsure.help') })}
            {goalsOn.map(g => TileButton(`g_${g.id}`, { help: f(`goals.${g.id}.help`) }))}
          </div>
          {goalsOff.length > 0 && (
            <div className="pt-2">
              <button type="button" aria-expanded={showOff} aria-controls="finder-goals-off" onClick={() => setShowOff(v => !v)} className={btnGhost}>
                <Lock size={14} aria-hidden="true" />{f('goals_off_title', { count: goalsOff.length })}
                <ArrowRight size={14} aria-hidden="true" className={`transition-transform ${showOff ? 'rotate-90' : ''}`} />
              </button>
              <ul id="finder-goals-off" className={`${showOff ? 'block' : 'hidden'} mt-1 divide-y divide-border overflow-hidden rounded-xl border border-dashed border-border`}>
                {goalsOff.map(g => (
                  <li key={g.id} className="flex flex-wrap items-baseline gap-x-2 px-4 py-2.5 text-sm">
                    <span className="font-medium text-text-2">{f(`goals.${g.id}.name`)}</span>
                    <span className="text-xs text-text-muted">{f(`goals.${g.id}.needs`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </fieldset>
        {StepFoot(k)}
      </div>
    )
  }

  const Notes = () => (
    <>
      {ev.needsPam.map(p => (
        <div key={p} role="note" className="flex gap-2.5 rounded-xl border border-tone-warning/40 bg-tone-warning/10 p-4">
          <TriangleAlert size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-tone-warning" />
          <p className="text-sm leading-relaxed text-text-2"><span className="font-semibold text-text">{f('needs_pam_title')}</span> {f(`needs_pam.${p}`)}</p>
        </div>
      ))}
      {notes.has('iot') && (
        <div role="note" className="flex gap-2.5 rounded-xl border border-tone-warning/40 bg-tone-warning/10 p-4">
          <TriangleAlert size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-tone-warning" />
          <p className="text-sm leading-relaxed text-text-2"><span className="font-semibold text-text">{f('note_iot_title')}</span> {f('note_iot')}</p>
        </div>
      )}
      {notes.has('stores') && (
        <div role="note" className="flex gap-2.5 rounded-xl border border-tone-warning/40 bg-tone-warning/10 p-4">
          <TriangleAlert size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-tone-warning" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-text">{t('cmp.shub_limits_title')}</p>
            <ul className="list-disc space-y-0.5 pl-4 text-sm leading-relaxed text-text-2">
              {(t('cmp.shub_limits', { returnObjects: true }) as string[]).map(x => <li key={x}>{x}</li>)}
            </ul>
          </div>
        </div>
      )}
      {notes.has('other') && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-bg-base p-4">
          <div className="min-w-0 space-y-1">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-text">
              <CircleHelp size={16} aria-hidden="true" className="text-text-2" />{f('other_title')}
            </p>
            <p className="text-sm leading-relaxed text-text-2">{f('other_desc')}</p>
          </div>
          <a href={mailHref} lang={i18n.language} className={btnSecondary}>
            <Mail size={16} aria-hidden="true" className="text-tone-accent" />{f('other_cta')}
          </a>
        </div>
      )}
    </>
  )

  const ResultView = () => {
    const covered = items.filter(id => coverageOf(id).length)
    if (!items.length && !notes.has('other')) {
      return (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <h2 ref={headingRef} tabIndex={-1} className="text-xl font-bold text-text focus:outline-none">{f('empty_result_title')}</h2>
          <p className="max-w-md text-sm leading-relaxed text-text-2">{f('empty_result_desc')}</p>
          <button type="button" onClick={() => go('s1')} className={`${btnPrimary} mt-2`}>
            <ArrowLeft size={16} aria-hidden="true" />{f('empty_result_cta')}
          </button>
        </div>
      )
    }
    const main = ranked[0]
    const rest = ranked.slice(1)
    const mg = main ? PROD_OF(main.key) : undefined
    const MainIcon = mg?.Icon ?? Compass
    return (
      <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1.5">
            <p className="font-mono text-xs uppercase tracking-wider text-text-muted">{f('result_label')}</p>
            <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-bold tracking-[-0.01em] text-text focus:outline-none">{f('result_title')}</h2>
            <p className="text-sm text-text-2">{f('result_based', { count: items.length })}</p>
            {goalNames.length > 0 && <p className="text-sm text-text-2"><span className="font-medium text-text">{f('goals_line')}:</span> {goalNames.join(', ')}{ev.inferred && <span className="text-text-muted"> ({f('goals_suggested')})</span>}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2" role="toolbar" aria-label={f('result_title')}>
          <button type="button" onClick={() => window.print()} className={btnPrimary}>
            <Printer size={16} aria-hidden="true" />{f('print')}
          </button>
          <button type="button" onClick={copyPrereq} className={btnSecondary}>
            {copiedPrereq ? <Check size={16} aria-hidden="true" className="text-tone-success" /> : <ListChecks size={16} aria-hidden="true" />}
            {copiedPrereq ? f('copied_prereq') : f('copy_prereq')}
          </button>
          <button type="button" onClick={downloadTxt} className={btnSecondary}>
            <Download size={16} aria-hidden="true" />{f('download')}
          </button>
          <button type="button" onClick={copyLink} className={btnSecondary}>
            {copied ? <Check size={16} aria-hidden="true" className="text-tone-success" /> : <Copy size={16} aria-hidden="true" />}
            {copied ? f('copied') : f('copy')}
          </button>
        </div>
        <p className="sr-only" aria-live="polite">{f('live', { products: ranked.length, pages: path.length })}</p>

        {main && (
          <section aria-labelledby="finder-main" className="relative overflow-hidden rounded-2xl border border-border bg-bg-base p-6">
            <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 bg-current ${mg?.color ?? 'text-domain-idira'}`} />
            <div className="flex flex-wrap items-start gap-5">
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-bg-card">
                <MainIcon size={24} aria-hidden="true" className={mg?.color ?? 'text-domain-idira'} />
              </span>
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">{f('main_eyebrow')}</p>
                <h3 id="finder-main" className="text-xl font-bold text-text">{prodName(main.key)}</h3>
                <p className="text-sm font-medium text-text tabular-nums">{f('covers', { covered: main.items.length, total: items.length })}</p>
                <p className="max-w-[70ch] text-sm leading-relaxed text-text-2">{f(`why.${main.key}`)}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">{main.items.map(id => ItemChip(id))}</div>
              </div>
              <div className="w-full sm:w-40" aria-hidden="true">
                <div className="h-2 overflow-hidden rounded-full bg-bg-muted">
                  <div className={`h-full rounded-full bg-current ${mg?.color ?? 'text-domain-idira'}`} style={{ width: `${Math.round(main.items.length / items.length * 100)}%` }} />
                </div>
                <p className="mt-1.5 text-right font-mono text-xs text-text-muted tabular-nums">{Math.round(main.items.length / items.length * 100)}%</p>
              </div>
            </div>
          </section>
        )}

        {rest.length > 0 && (
          <section aria-labelledby="finder-complements" className="space-y-3">
            <h3 id="finder-complements" className="text-sm font-semibold uppercase tracking-wider text-text-muted">{f('complements_title')}</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {rest.map(p => {
                const g = PROD_OF(p.key); const Icon = g?.Icon ?? Compass
                return (
                  <div key={p.key} className="space-y-2.5 rounded-2xl border border-border bg-bg-base p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="inline-flex items-center gap-2 text-base font-semibold text-text">
                        <Icon size={18} aria-hidden="true" className={g?.color ?? 'text-domain-idira'} />{prodName(p.key)}
                      </p>
                      <span className="whitespace-nowrap font-mono text-xs text-text-muted tabular-nums">{f('covers_short', { covered: p.items.length, total: items.length })}</span>
                    </div>
                    <p className="text-sm leading-relaxed text-text-2">{f(`why.${p.key}`)}</p>
                    <div className="flex flex-wrap gap-1.5">{p.items.map(id => ItemChip(id))}</div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        <section aria-labelledby="finder-coverage" className="space-y-3">
          <h3 id="finder-coverage" className="text-sm font-semibold uppercase tracking-wider text-text-muted">{f('coverage_title')}</h3>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-bg-base">
            {items.map(id => {
              const ps = coverageOf(id); const T = { Icon: ICON[id] ?? CircleHelp, note: id === 'op_iot' ? 'iot' : undefined }
              return (
                <li key={id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <span className="inline-flex items-center gap-2.5 text-sm font-medium text-text">
                    <Logo id={id} size={18} fallback={T.Icon} className="text-text-2" />{tileName(id)}
                    {T.note === 'iot' && <span className="inline-flex items-center gap-1 rounded-full bg-tone-warning/10 px-2 py-0.5 text-[11px] font-medium text-tone-warning"><TriangleAlert size={12} aria-hidden="true" />{f('no_dedicated')}</span>}
                  </span>
                  <span className="flex flex-wrap gap-1.5">
                    {ps.length ? ps.map(p => ProdChip(p)) : <span className="text-xs text-text-muted">{id === 'other' ? f('coverage_other') : f('coverage_none')}</span>}
                  </span>
                </li>
              )
            })}
          </ul>
          {covered.length < items.length && <p className="text-xs text-text-muted">{f('coverage_gap')}</p>}
        </section>

        {Notes()}

        {path.length > 0 && (
          <section aria-labelledby="finder-path" className="space-y-3">
            <div className="space-y-1">
              <h3 id="finder-path" className="text-sm font-semibold uppercase tracking-wider text-text-muted">{f('path_title')}</h3>
              <p className="text-sm text-text-2">{f('path_lead')}</p>
            </div>
            <p className="pt-1 text-xs font-semibold text-text">{f('path_start')}</p>
            <ol className="space-y-2">
              {path.slice(0, START).map((r, i) => {
                const nav = NAV_ITEMS.find(x => x.to === RECS[r].to)
                const g = PROD_OF(RECS[r].product)
                const cls = 'group flex gap-4 rounded-xl border border-border bg-bg-base p-4 transition-colors hover:border-idira-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue'
                const inner = (
                  <>
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-bg-muted font-mono text-xs font-semibold text-text-2 tabular-nums">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-sm font-semibold text-text group-hover:underline underline-offset-4">{recLabel(r)}</span>
                        <span className="inline-flex items-center gap-1 text-xs text-text-muted">{ProdDot(RECS[r].product)}{RECS[r].product === 'swa' ? 'SWA' : t(g?.labelKey ?? '')}</span>
                      </span>
                      <span className="mt-1 block text-sm leading-relaxed text-text-2">{f(`reason.${r}`)}</span>
                      <span className="mt-1 block text-xs text-text-muted">{f('for')}: {byRecGet(r).map(tileName).join(', ')}</span>
                    </span>
                    <ArrowRight size={16} aria-hidden="true" className="mt-1 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-text" />
                  </>
                )
                return <li key={r}>{nav?.href ? <a href={nav.href} className={cls}>{inner}</a> : <Link to={RECS[r].to} className={cls}>{inner}</Link>}</li>
              })}
            </ol>
            {path.length > START && (
              <>
                <p className="pt-3 text-xs font-semibold text-text">{f('path_more', { count: path.length - START })}</p>
                <ol start={START + 1} className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-bg-base">
                  {path.slice(START).map((r, i) => {
                    const nav = NAV_ITEMS.find(x => x.to === RECS[r].to)
                    const g = PROD_OF(RECS[r].product)
                    const cls = 'group flex min-h-11 items-center gap-3 px-4 py-2.5 transition-colors hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-idira-blue'
                    const inner = (
                      <>
                        <span className="w-6 shrink-0 font-mono text-xs text-text-muted tabular-nums">{START + i + 1}</span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-text group-hover:underline underline-offset-4" title={f(`reason.${r}`)}>{recLabel(r)}</span>
                        <span className="hidden shrink-0 items-center gap-1 text-xs text-text-muted sm:inline-flex">{ProdDot(RECS[r].product)}{RECS[r].product === 'swa' ? 'SWA' : t(g?.labelKey ?? '')}</span>
                        <ArrowRight size={14} aria-hidden="true" className="shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-text" />
                      </>
                    )
                    return <li key={r}>{nav?.href ? <a href={nav.href} className={cls}>{inner}</a> : <Link to={RECS[r].to} className={cls}>{inner}</Link>}</li>
                  })}
                </ol>
              </>
            )}
          </section>
        )}

        {path.length > 0 && (
          <section aria-labelledby="finder-prereq" className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="space-y-1">
                <h3 id="finder-prereq" className="text-sm font-semibold uppercase tracking-wider text-text-muted">{f('prereq_title')}</h3>
                <p className="text-sm text-text-2">{f('prereq_lead')}</p>
              </div>
              <button type="button" aria-expanded={showPrereq} aria-controls="finder-prereq-list" onClick={() => setShowPrereq(v => !v)} className={btnSecondary}>
                <ListChecks size={16} aria-hidden="true" />
                {showPrereq ? f('prereq_hide') : f('prereq_show', { count: ranked.reduce((n, p) => n + generalOf(p.key).length, 0) + path.reduce((n, r) => n + prereqOf(r).length, 0) })}
              </button>
            </div>
            <div id="finder-prereq-list" className={`${showPrereq ? 'grid' : 'hidden'} gap-3 md:grid-cols-2`}>
              {ranked.map(p => (
                <div key={p.key} className="space-y-2.5 rounded-xl border border-border bg-bg-base p-4">
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-text">{ProdDot(p.key)}{f('prereq_general', { product: prodName(p.key) })}</p>
                  {checklist(generalOf(p.key))}
                </div>
              ))}
              {path.map(r => {
                const items = prereqOf(r)
                return (
                  <div key={r} className="space-y-2.5 rounded-xl border border-border bg-bg-base p-4">
                    <p className="inline-flex items-center gap-2 text-sm font-semibold text-text">{ProdDot(RECS[r].product)}{recLabel(r)}</p>
                    {items.length ? checklist(items) : <p className="text-sm text-text-muted">{f('prereq_see_page')}</p>}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        <p className="flex gap-2 text-xs leading-relaxed text-text-muted">
          <Info size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span>
            {f('starting_point')}{' '}
            <Link to="/compare" className="rounded font-medium text-text-2 underline underline-offset-4 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue">
              {f('compare_link')}
            </Link>
          </span>
        </p>
      </div>
    )
  }

  // Print-only client report (window.print / Save as PDF). Plain black on white
  // in both themes; the interactive wizard is hidden in print.
  const PrintReport = () => {
    if (view !== 'result' || (!items.length && !notes.has('other'))) return null
    const h = 'mt-6 mb-2 border-b border-black/30 pb-1 text-[13px] font-bold uppercase tracking-wider text-black'
    const box = <span aria-hidden="true" className="mt-[3px] inline-block h-3 w-3 shrink-0 border border-black" />
    return (
      <div id="finder-report" className="hidden bg-white text-[12px] leading-relaxed text-black print:block">
        <div className="flex items-end justify-between border-b-2 border-black pb-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-black/70">{t('shell.site_name')}</p>
            <h1 className="text-[22px] font-bold leading-tight text-black">{f('report_title')}</h1>
          </div>
          <div className="text-right text-[11px] text-black/80">
            <p>{f('report_date')}: {today}</p>
            <p>{f('report_prepared')}</p>
          </div>
        </div>

        <h2 className={h}>{f('report_env')}</h2>
        <ul className="space-y-0.5">{envLines().map(l => <li key={l.name}><span className="font-semibold">{l.name}</span>{l.list.length ? `: ${l.list.join(', ')}` : ''}</li>)}</ul>
        <h2 className={h}>{f('goals_line')}</h2>
        <p>{goalNames.join(', ') || '-'}{ev.inferred ? ` (${f('goals_suggested')})` : ''}</p>

        {ranked.length > 0 && (
          <>
            <h2 className={h}>{f('report_solution')}</h2>
            <div className="break-inside-avoid border border-black/40 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-black/70">{f('report_main')}</p>
              <p className="text-[15px] font-bold">{prodName(ranked[0].key)} <span className="text-[12px] font-normal">({f('covers', { covered: ranked[0].items.length, total: items.length })})</span></p>
              <p>{f(`why.${ranked[0].key}`)}</p>
              <p className="mt-1 text-black/80">{ranked[0].items.map(tileName).join(', ')}</p>
            </div>
            {ranked.slice(1).map(p => (
              <div key={p.key} className="mt-2 break-inside-avoid border border-black/25 p-3">
                <p className="font-bold">{f('report_complement')}: {prodName(p.key)} <span className="font-normal">({f('covers_short', { covered: p.items.length, total: items.length })})</span></p>
                <p>{f(`why.${p.key}`)}</p>
                <p className="mt-1 text-black/80">{p.items.map(tileName).join(', ')}</p>
              </div>
            ))}
          </>
        )}

        <h2 className={h}>{f('coverage_title')}</h2>
        <table className="w-full border-collapse">
          <tbody>
            {items.map(id => {
              const ps = coverageOf(id)
              return (
                <tr key={id} className="break-inside-avoid border-b border-black/20">
                  <td className="py-1 pr-3 font-semibold">{tileName(id)}</td>
                  <td className="py-1">{ps.length ? ps.map(prodName).join(', ') : id === 'other' ? f('coverage_other') : f('coverage_none')}{id === 'op_iot' ? ` (${f('no_dedicated')})` : ''}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {path.length > 0 && (
          <>
            <h2 className={h}>{f('path_title')}</h2>
            <ol className="space-y-1.5">
              {path.map((r, i) => (
                <li key={r} className="break-inside-avoid">
                  <span className="font-bold">{i + 1}. {recLabel(r)}</span> <span className="text-black/70">({prodName(RECS[r].product)})</span>
                  <span className="block">{f(`reason.${r}`)}</span>
                  <span className="block font-mono text-[10.5px] text-black/80">{fullUrl(r)}</span>
                </li>
              ))}
            </ol>

            <h2 className={h}>{f('prereq_title')}</h2>
            <p className="mb-2 text-black/80">{f('prereq_lead')}</p>
            {ranked.map(p => (
              <div key={p.key} className="mb-3 break-inside-avoid">
                <p className="font-bold">{f('prereq_general', { product: prodName(p.key) })}</p>
                <ul className="mt-1 space-y-1">{generalOf(p.key).map(x => <li key={x} className="flex gap-2">{box}<span>{x}</span></li>)}</ul>
              </div>
            ))}
            {path.map(r => {
              const items = prereqOf(r)
              return (
                <div key={r} className="mb-3 break-inside-avoid">
                  <p className="font-bold">{recLabel(r)} <span className="font-mono text-[10.5px] font-normal text-black/70">{fullUrl(r)}</span></p>
                  {items.length
                    ? <ul className="mt-1 space-y-1">{items.map(x => <li key={x} className="flex gap-2">{box}<span>{x}</span></li>)}</ul>
                    : <p className="mt-1 text-black/70">{f('prereq_see_page')}</p>}
                </div>
              )
            })}
          </>
        )}

        {noteLines().length > 0 && (
          <>
            <h2 className={h}>{f('report_notes')}</h2>
            <ul className="list-disc space-y-1 pl-5">{noteLines().map(x => <li key={x} className="break-inside-avoid">{x}</li>)}</ul>
          </>
        )}
        <p className="mt-6 border-t border-black/30 pt-2 text-[10.5px] text-black/70">{f('report_sources')}</p>
      </div>
    )
  }

  // ---------- footer ----------
  const soFar = ranked
  const isStep = view !== 'result'
  const stepHasSel = isStep && stepCount(view) > 0
  const nextView = VIEWS[idx + 1]

  return (
    <section className="min-h-screen bg-bg-base px-6 py-8 print:min-h-0 print:bg-white print:p-0">
      {/* Print: hide the app shell and keep only the client report. */}
      <style>{`@media print {
        @page { margin: 14mm; }
        html, body, #root, #main { background: white !important; }
        header.nav-iridescent, aside, footer, [href="#main"] { display: none !important; }
        #main { padding-top: 0 !important; }
        [class~="lg:pl-16"], [class~="lg:pl-[17rem]"] { padding-left: 0 !important; }
        .sr-only { display: none !important; }
      }`}</style>
      <div className="mx-auto max-w-4xl space-y-6 print:max-w-none print:space-y-0">
        <div className="print:hidden"><PageHeader badge={f('badge')} title={f('title')} subtitle={f('subtitle')} /></div>

        {PrintReport()}

        <div data-wizard className="rounded-2xl border border-border bg-bg-card shadow-sm print:hidden">
          {Stepper()}
          <div className="px-6 py-7 sm:px-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={view} {...motionProps} onAnimationComplete={() => focusHeading(view)}>
                {view === 'result' ? ResultView() : StepView(view)}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className={`${isStep ? 'sticky bottom-0 z-10 bg-bg-card/95 backdrop-blur' : 'bg-bg-card'} flex flex-wrap items-center gap-3 rounded-b-2xl border-t border-border px-6 py-3.5 sm:px-8`}>
            {isStep ? (
              <>
                <p className="mr-auto flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-text-muted" aria-live="polite">
                  {soFar.length ? (
                    <>
                      <span className="font-medium text-text-2">{f('so_far')}</span>
                      {soFar.map(p => ProdChip(p.key, p.items.length))}
                    </>
                  ) : <span>{f('so_far_empty')}</span>}
                </p>
                {idx > 0 && (
                  <button type="button" onClick={() => go(VIEWS[idx - 1])} className={btnSecondary}>
                    <ArrowLeft size={16} aria-hidden="true" />{f('back')}
                  </button>
                )}
                {!stepHasSel && (
                  <button type="button" onClick={() => go(nextView)} className={btnGhost}>{f('skip')}</button>
                )}
                {stepHasSel && (
                  <button type="button" onClick={() => go(nextView)} className={btnPrimary}>
                    {nextView === 'result' ? f('see_result') : f('next')}<ArrowRight size={16} aria-hidden="true" />
                  </button>
                )}
              </>
            ) : (
              <>
                <button type="button" onClick={() => go('s1')} className={btnSecondary}>
                  <Pencil size={16} aria-hidden="true" />{f('edit')}
                </button>
                <button type="button" onClick={() => { pendingFocus.current = true; setSelected([]); setFurthest(0); setView('s1') }} className={btnGhost}>
                  <RotateCcw size={16} aria-hidden="true" />{f('restart')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
