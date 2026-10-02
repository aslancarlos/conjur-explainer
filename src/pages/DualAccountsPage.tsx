import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AppWindow, CalendarClock, ChevronLeft, ChevronRight, Container, Database, ExternalLink, Fingerprint,
  Hourglass, KeySquare, ListChecks, Pause, Play, RefreshCw, RotateCcw, ServerCog, ShieldCheck,
  ShoppingCart, Tag, UserCheck, UserRound, Vault,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { gsap } from 'gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import securityLayers from '../assets/brand/security-layers-blue.png'

gsap.registerPlugin(MotionPathPlugin)

// ─── model ────────────────────────────────────────────────────────────────────
// One Dual Accounts pair (VirtualUserName dbuser_dual) consumed by two paths:
//   1. an application through the Credential Provider (CP cache)
//   2. Kubernetes pods through Vault Synchronizer → Secrets Manager → ESO →
//      K8s Secret → rollout operator (same pipeline as the ESO Shop demo)
// Flow follows CyberArk docs "Configure dual accounts" → Account rotation flow.
//
// The whole walkthrough is ONE seekable GSAP timeline. Each step owns a label
// `sN` (step start) and `sN_end` (its beats finished); the gap up to the next
// label is reading time used only by autoplay. Every visual state change is an
// explicit fromTo inside that timeline, so seeking / scrubbing is exact.

type NodeId = 'app' | 'cp' | 'acctA' | 'acctB' | 'cpm' | 'db' | 'sm' | 'eso' | 'secret' | 'pods'
type EdgeId =
  | 'app-cp' | 'cp-app' | 'cp-A' | 'cp-B'
  | 'vault-sm' | 'sm-eso' | 'eso-secret' | 'secret-pods'
  | 'cpm-A' | 'cpm-B' | 'cpm-db'
type Plane  = 'data' | 'control'

interface Box { x: number; y: number; w: number; h: number }
interface Layout {
  w: number; h: number; title: number
  nodes: Record<NodeId, Box>
  vault: Box
  /** stacked: status goes under the bar (narrow meter) instead of right-aligned */
  grace: { x: number; y: number; w: number; stacked?: boolean }
  lanes: { cp: [number, number]; k8s: [number, number] }
  edges: Record<EdgeId, string>
}

const PLANE: Record<EdgeId, Plane> = {
  'app-cp': 'data', 'cp-app': 'data', 'cp-A': 'data', 'cp-B': 'data',
  'vault-sm': 'data', 'sm-eso': 'data', 'eso-secret': 'data', 'secret-pods': 'data',
  'cpm-A': 'control', 'cpm-B': 'control', 'cpm-db': 'control',
}

const WIDE: Layout = {
  w: 980, h: 500, title: 15,
  nodes: {
    app:    { x: 16,  y: 50,  w: 160, h: 84  },
    cp:     { x: 236, y: 30,  w: 200, h: 128 },
    acctA:  { x: 580, y: 68,  w: 182, h: 120 },
    acctB:  { x: 580, y: 202, w: 182, h: 120 },
    cpm:    { x: 796, y: 30,  w: 170, h: 96  },
    db:     { x: 796, y: 312, w: 170, h: 96  },
    sm:     { x: 330, y: 236, w: 180, h: 118 },
    eso:    { x: 16,  y: 236, w: 170, h: 84  },
    secret: { x: 16,  y: 380, w: 170, h: 84  },
    pods:   { x: 256, y: 372, w: 210, h: 118 },
  },
  vault: { x: 566, y: 30, w: 210, h: 390 },
  grace: { x: 580, y: 348, w: 182, stacked: true },
  lanes: { cp: [16, 20], k8s: [16, 222] },
  edges: {
    'app-cp':      'M 176,80 L 236,80',
    'cp-app':      'M 236,104 L 176,104',
    'cp-A':        'M 436,78 C 500,78 516,128 580,128',
    'cp-B':        'M 436,122 C 500,122 516,262 580,262',
    'vault-sm':    'M 566,295 L 510,295',
    'sm-eso':      'M 330,278 L 186,278',
    'eso-secret':  'M 101,320 L 101,380',
    'secret-pods': 'M 186,422 L 256,422',
    'cpm-A':       'M 796,64 C 780,64 784,128 762,128',
    'cpm-B':       'M 796,100 C 774,100 786,262 762,262',
    'cpm-db':      'M 881,126 L 881,312',
  },
}

const NARROW: Layout = {
  w: 360, h: 975, title: 14,
  nodes: {
    cpm:    { x: 8,   y: 8,   w: 150, h: 96  },
    db:     { x: 202, y: 8,   w: 150, h: 96  },
    acctA:  { x: 20,  y: 184, w: 154, h: 120 },
    acctB:  { x: 186, y: 184, w: 154, h: 120 },
    cp:     { x: 16,  y: 436, w: 156, h: 128 },
    sm:     { x: 188, y: 436, w: 156, h: 118 },
    app:    { x: 16,  y: 612, w: 156, h: 84  },
    eso:    { x: 188, y: 596, w: 156, h: 84  },
    secret: { x: 188, y: 720, w: 156, h: 84  },
    pods:   { x: 188, y: 844, w: 156, h: 118 },
  },
  vault: { x: 8, y: 146, w: 344, h: 240 },
  grace: { x: 20, y: 330, w: 320 },
  lanes: { cp: [16, 412], k8s: [188, 412] },
  edges: {
    'app-cp':      'M 80,612 L 80,564',
    'cp-app':      'M 120,564 L 120,612',
    'cp-A':        'M 56,436 L 56,386',
    'cp-B':        'M 108,436 L 108,386',
    'vault-sm':    'M 266,386 L 266,436',
    'sm-eso':      'M 266,554 L 266,596',
    'eso-secret':  'M 266,680 L 266,720',
    'secret-pods': 'M 266,804 L 266,844',
    'cpm-A':       'M 130,104 L 130,184',
    'cpm-B':       'M 158,88 C 190,88 212,120 212,184',
    'cpm-db':      'M 158,56 L 202,56',
  },
}

/** Initial value of every cross-faded state group (see <Swap/>). */
const INITIAL = {
  statusA: 'active', statusB: 'inactive', curr: '1', pwA: '1',
  cache: 'A', loginApp: '1', sm: 'A', secret: 'A', loginPods: '1', pods: 'ready',
  cpm: 'idle', grace: 'idle',
} as const
type StateKey = keyof typeof INITIAL

type Effect =
  | { t: 'packet'; at: number; edge: EdgeId; label: string; reverse?: boolean }
  | { t: 'set';    at: number; k: StateKey; v: string; pop?: boolean }
  | { t: 'grace';  at: number; fill: number; dur: number; v?: 'running' | 'ended' }

interface Step { focus: NodeId[]; end: number; fx: Effect[] }

const PKT = 1.0 // seconds a packet takes to travel an edge

const STEPS: Step[] = [
  // 1 · setup
  { focus: ['acctA', 'acctB', 'db'], end: 0.6, fx: [] },
  // 2 · CP path serves A
  { focus: ['app', 'cp', 'acctA'], end: 2.6, fx: [
    { t: 'packet', at: 0.3, edge: 'app-cp', label: 'pkt_query' },
    { t: 'packet', at: 1.4, edge: 'cp-app', label: 'user_a' },
  ] },
  // 3 · K8s path serves A
  { focus: ['sm', 'eso', 'secret', 'pods', 'acctA'], end: 4.8, fx: [
    { t: 'packet', at: 0.3, edge: 'vault-sm',    label: 'pkt_sync' },
    { t: 'packet', at: 1.4, edge: 'sm-eso',      label: 'user_a' },
    { t: 'packet', at: 2.5, edge: 'eso-secret',  label: 'pkt_env' },
    { t: 'packet', at: 3.6, edge: 'secret-pods', label: 'pkt_envfrom' },
  ] },
  // 4 · CPM: rotation due
  { focus: ['cpm'], end: 1.0, fx: [
    { t: 'set', at: 0.3, k: 'cpm', v: 'due' },
  ] },
  // 5 · status swap, CurrInd, A marked for change, grace starts
  { focus: ['cpm', 'acctA', 'acctB'], end: 2.9, fx: [
    { t: 'set',    at: 0.1, k: 'cpm', v: 'flip' },
    { t: 'packet', at: 0.3, edge: 'cpm-A', label: 'pkt_inactive' },
    { t: 'packet', at: 0.3, edge: 'cpm-B', label: 'pkt_active' },
    { t: 'set',    at: 1.3, k: 'statusA', v: 'inactive', pop: true },
    { t: 'set',    at: 1.3, k: 'statusB', v: 'active', pop: true },
    { t: 'set',    at: 1.4, k: 'curr', v: '2', pop: true },
    { t: 'set',    at: 1.5, k: 'pwA', v: 'pending' },
    { t: 'set',    at: 1.7, k: 'cache', v: 'stale' },
    { t: 'set',    at: 1.7, k: 'sm', v: 'stale' },
    { t: 'set',    at: 1.9, k: 'cpm', v: 'wait' },
    { t: 'grace',  at: 1.7, fill: 0.15, dur: 1, v: 'running' },
  ] },
  // 6 · CP refreshes its cache → app on B
  { focus: ['app', 'cp', 'acctB'], end: 5.4, fx: [
    { t: 'packet', at: 0.3, edge: 'cp-B', label: 'pkt_refresh' },
    { t: 'packet', at: 1.4, edge: 'cp-B', label: 'user_b', reverse: true },
    { t: 'set',    at: 2.4, k: 'cache', v: 'B', pop: true },
    { t: 'packet', at: 2.7, edge: 'app-cp', label: 'pkt_query' },
    { t: 'packet', at: 3.8, edge: 'cp-app', label: 'user_b' },
    { t: 'set',    at: 4.8, k: 'loginApp', v: '2', pop: true },
    { t: 'grace',  at: 0.3, fill: 0.4, dur: 4.5 },
  ] },
  // 7 · Synchronizer → ESO → Secret → rolling restart → pods on B
  { focus: ['sm', 'eso', 'secret', 'pods', 'acctB'], end: 7.0, fx: [
    { t: 'packet', at: 0.3, edge: 'vault-sm',    label: 'pkt_sync' },
    { t: 'set',    at: 1.3, k: 'sm', v: 'B', pop: true },
    { t: 'packet', at: 1.5, edge: 'sm-eso',      label: 'user_b' },
    { t: 'packet', at: 2.6, edge: 'eso-secret',  label: 'pkt_update' },
    { t: 'set',    at: 3.6, k: 'secret', v: 'B', pop: true },
    { t: 'packet', at: 3.8, edge: 'secret-pods', label: 'pkt_rollout' },
    { t: 'set',    at: 4.8, k: 'pods', v: 'rolling' },
    { t: 'set',    at: 5.8, k: 'loginPods', v: '2', pop: true },
    { t: 'set',    at: 6.5, k: 'pods', v: 'ready' },
    { t: 'grace',  at: 0.3, fill: 0.8, dur: 6.4 },
  ] },
  // 8 · grace ends → CPM changes the inactive account's password
  { focus: ['cpm', 'acctA', 'db'], end: 3.5, fx: [
    { t: 'grace',  at: 0.1, fill: 1, dur: 0.4, v: 'ended' },
    { t: 'set',    at: 0.5, k: 'cpm', v: 'reset' },
    { t: 'packet', at: 0.7, edge: 'cpm-db', label: 'pkt_new_pw' },
    { t: 'packet', at: 1.9, edge: 'cpm-A',  label: 'pkt_vault_update' },
    { t: 'set',    at: 2.9, k: 'pwA', v: '2', pop: true },
  ] },
  // 9 · cycle complete
  { focus: ['app', 'pods', 'acctA', 'acctB'], end: 0.8, fx: [
    { t: 'set', at: 0.1, k: 'cpm', v: 'idle' },
  ] },
]

const TOTAL = STEPS.length

// Colour = ownership. Domain colours mark WHO a component belongs to and are
// applied only to the icon chip, the top stripe and lane labels. Status keeps
// its reserved colours (success = active, warning = pending/stale), so the two
// never compete.
type Domain = 'idira' | 'cp' | 'k8s' | 'neutral'
const DOMAIN: Record<Domain, { stripe: string; chip: string; icon: string; text: string }> = {
  idira:   { stripe: 'fill-domain-idira', chip: 'stroke-domain-idira/70', icon: 'text-domain-idira', text: 'fill-domain-idira' },
  cp:      { stripe: 'fill-domain-cp',    chip: 'stroke-domain-cp/70',    icon: 'text-domain-cp',    text: 'fill-domain-cp' },
  k8s:     { stripe: 'fill-domain-k8s',   chip: 'stroke-domain-k8s/70',   icon: 'text-domain-k8s',   text: 'fill-domain-k8s' },
  neutral: { stripe: '',                  chip: 'stroke-line',            icon: 'text-text-2',       text: 'fill-text-2' },
}
const NODE_DOMAIN: Record<NodeId, Domain> = {
  app: 'cp', cp: 'cp',
  acctA: 'idira', acctB: 'idira', cpm: 'idira', sm: 'idira',
  eso: 'k8s', secret: 'k8s', pods: 'k8s',
  db: 'neutral',
}
const EDGE_IDS = Object.keys(PLANE) as EdgeId[]

const DOCS = {
  manage:    'https://docs.cyberark.com/credential-providers/latest/en/content/cp%20and%20ascp/cv_managing-dual-accounts.htm',
  configure: 'https://docs.cyberark.com/credential-providers/latest/en/content/cp%20and%20ascp/cv_automatic_dual_account.htm',
  repr:      'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/conjurcloud/cl_addaccount.htm',
}

const clampStep = (i: number) => Math.max(0, Math.min(TOTAL - 1, i))

/** Reading time for autoplay: ~3.5 words/s, bounded. */
const holdFor = (text: string) =>
  Math.min(12, Math.max(4, text.trim().split(/\s+/).length / 3.5))

function useIsNarrow() {
  const query = '(max-width: 639px)'
  const [narrow, setNarrow] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const m = window.matchMedia(query)
    const h = () => setNarrow(m.matches)
    m.addEventListener('change', h)
    return () => m.removeEventListener('change', h)
  }, [])
  return narrow
}

// ─── SVG pieces ───────────────────────────────────────────────────────────────

/** One value of a cross-faded state group; GSAP swaps which one is visible. */
function Swap({ k, v, children }: { k: StateKey; v: string; children: ReactNode }) {
  return <g data-k={k} data-v={v} style={{ opacity: INITIAL[k] === v ? 1 : 0 }}>{children}</g>
}

function Ring({ id, b }: { id: NodeId; b: Box }) {
  return (
    <rect data-ring={id} x={b.x - 5} y={b.y - 5} width={b.w + 10} height={b.h + 10} rx={16}
      className="fill-none stroke-text-2/60" strokeWidth={2} style={{ opacity: 0 }} />
  )
}

const ICON = 15

/** Lucide icon in a round chip sitting on the card's top edge. Never competes
 *  with the title for width, so it works on the narrow layout too. */
function CardIcon({ b, Icon, domain, cls }: { b: Box; Icon: LucideIcon; domain: Domain; cls?: string }) {
  const cx = b.x + b.w - 24, cy = b.y - 2
  const d = DOMAIN[domain]
  return (
    <g aria-hidden="true">
      <circle cx={cx} cy={cy} r={12} className={`fill-surface ${d.chip}`} strokeWidth={1.5} />
      <Icon x={cx - ICON / 2} y={cy - ICON / 2} width={ICON} height={ICON} strokeWidth={1.9} className={cls ?? d.icon} />
    </g>
  )
}

/** Thin domain stripe on the card's top edge, stopping short of the icon chip. */
function DomainStripe({ b, domain }: { b: Box; domain: Domain }) {
  const d = DOMAIN[domain]
  if (!d.stripe) return null
  return <rect x={b.x + 14} y={b.y - 1.5} width={b.w - 14 - 44} height={3} rx={1.5} className={d.stripe} aria-hidden="true" />
}

function NodeCard({ id, b, title, sub, size, mono, Icon, children }: {
  id: NodeId; b: Box; title: string; sub: string; size: number; mono?: boolean
  Icon: LucideIcon; children?: ReactNode
}) {
  const domain = NODE_DOMAIN[id]
  return (
    <g>
      <Ring id={id} b={b} />
      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={12}
        className="fill-bg-muted stroke-line" strokeWidth={1.25} />
      <DomainStripe b={b} domain={domain} />
      <CardIcon b={b} Icon={Icon} domain={domain} />
      <text x={b.x + 14} y={b.y + 25} fontSize={size} className="fill-text font-sans font-semibold">{title}</text>
      <text x={b.x + 14} y={b.y + 43} fontSize={11}
        className={`fill-text-muted ${mono ? 'font-mono' : 'font-sans'}`}>{sub}</text>
      {children}
    </g>
  )
}

/** "label ........ value" row; value children are right-aligned by the caller. */
function RowLabel({ b, y, label }: { b: Box; y: number; label: string }) {
  return <text x={b.x + 14} y={b.y + y} fontSize={11} className="fill-text-muted font-sans">{label}</text>
}

function StatusBadge({ x, y, on, label }: { x: number; y: number; on: boolean; label: string }) {
  return (
    <g data-badge>
      <rect x={x} y={y} width={112} height={24} rx={12} strokeWidth={1.25}
        className={on ? 'fill-tone-success/15 stroke-tone-success/60' : 'fill-none stroke-text-muted/50'} />
      {on
        ? <circle cx={x + 16} cy={y + 12} r={4} className="fill-tone-success" />
        : <circle cx={x + 16} cy={y + 12} r={3.5} className="fill-none stroke-text-muted" strokeWidth={1.5} />}
      <text x={x + 64} y={y + 16.5} fontSize={11.5} textAnchor="middle"
        className={`font-mono font-semibold ${on ? 'fill-tone-success' : 'fill-text-muted'}`}>
        {label}
      </text>
    </g>
  )
}

/** Account card: both status variants are drawn and cross-faded by GSAP. */
function AccountCard({ id, b, size, index, t }: {
  id: 'acctA' | 'acctB'; b: Box; size: number; index: 1 | 2; t: (k: string) => string
}) {
  const isA = id === 'acctA'
  const k: StateKey = isA ? 'statusA' : 'statusB'
  const right = b.x + b.w - 14
  return (
    <g>
      <Ring id={id} b={b} />
      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={12} className="fill-bg-muted" />
      {(['active', 'inactive'] as const).map(s => (
        <Swap key={s} k={k} v={s}>
          {s === 'active'
            ? <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={12} strokeWidth={1.75}
                className="fill-tone-success/5 stroke-tone-success/70" />
            : <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={12} strokeWidth={1.25}
                strokeDasharray="5 4" className="fill-none stroke-text-muted/50" />}
          <StatusBadge x={b.x + 14} y={b.y + 54} on={s === 'active'}
            label={t(s === 'active' ? 'dual.status_active' : 'dual.status_inactive')} />
          <CardIcon b={b} Icon={s === 'active' ? UserCheck : UserRound} domain="idira"
            cls={s === 'active' ? 'text-tone-success' : 'text-text-muted'} />
        </Swap>
      ))}
      <DomainStripe b={b} domain="idira" />
      <text x={b.x + 14} y={b.y + 25} fontSize={size} className="fill-text font-sans font-semibold">
        {t(isA ? 'dual.acct_a' : 'dual.acct_b')}
      </text>
      <text x={right} y={b.y + 43} fontSize={11} textAnchor="end" className="fill-text-muted font-mono">
        {t('dual.index_label')} {index}
      </text>
      <text x={b.x + 14} y={b.y + 43} fontSize={12} className="fill-text-2 font-mono">
        {t(isA ? 'dual.user_a' : 'dual.user_b')}
      </text>
      {isA
        ? (['1', 'pending', '2'] as const).map(v => (
            <Swap key={v} k="pwA" v={v}>
              <text x={b.x + 14} y={b.y + 103} fontSize={11}
                className={`font-mono ${v === 'pending' ? 'fill-tone-warning' : 'fill-text-muted'}`}>
                {v === 'pending' ? t('dual.pw_pending') : `${t('dual.pw_label')} •••••`}
              </text>
              <text x={right} y={b.y + 103} fontSize={11.5} textAnchor="end"
                className={`font-mono font-semibold ${v === '2' ? 'fill-tone-success' : 'fill-text-2'}`}>
                v{v === '2' ? 2 : 1}
              </text>
            </Swap>
          ))
        : <>
            <text x={b.x + 14} y={b.y + 103} fontSize={11} className="fill-text-muted font-mono">
              {t('dual.pw_label')} •••••
            </text>
            <text x={right} y={b.y + 103} fontSize={11.5} textAnchor="end"
              className="font-mono font-semibold fill-text-2">v1</text>
          </>}
    </g>
  )
}

/** Right-aligned "appuser_0N" login value, cross-faded per state group. */
function LoginValue({ k, b, y, t }: { k: 'loginApp' | 'loginPods'; b: Box; y: number; t: (k: string) => string }) {
  return (
    <>
      {(['1', '2'] as const).map(v => (
        <Swap key={v} k={k} v={v}>
          <text x={b.x + b.w - 14} y={b.y + y} fontSize={12.5} textAnchor="end"
            className="font-mono font-semibold fill-text">
            {t(v === '1' ? 'dual.user_a' : 'dual.user_b')}
          </text>
        </Swap>
      ))}
    </>
  )
}

function pillWidth(label: string) { return Math.round(label.length * 7 + 22) }

// ─── page ─────────────────────────────────────────────────────────────────────

export default function DualAccountsPage() {
  const { t, i18n } = useTranslation()
  const reduce = useReducedMotion() ?? false
  const narrow = useIsNarrow()
  const L = narrow ? NARROW : WIDE

  const [step, setStep]         = useState(0)
  const [playing, setPlaying]   = useState(false)
  const [segments, setSegments] = useState<number[]>(() => STEPS.map(() => 1))

  const svgRef     = useRef<SVGSVGElement>(null)
  const tlRef      = useRef<gsap.core.Timeline | null>(null)
  const seekRef    = useRef<gsap.core.Tween | null>(null)
  const startsRef  = useRef<number[]>([])
  const stepRef    = useRef(0)
  const fillRefs   = useRef<(HTMLSpanElement | null)[]>([])
  const barRef     = useRef<HTMLDivElement>(null)
  const scrubRef   = useRef<{ x: number; moved: boolean } | null>(null)

  // Every packet across the walkthrough, rendered once and driven by GSAP.
  const packets = useMemo(() => STEPS.flatMap((s, i) =>
    s.fx.flatMap((f, j) => f.t === 'packet'
      ? [{ id: `s${i}-${j}`, edge: f.edge, label: t(`dual.${f.label}`) }]
      : [])), [t])

  /** Derive current step + segment fills from the playhead (no re-render per frame). */
  const sync = useCallback(() => {
    const tl = tlRef.current
    if (!tl) return
    const time = tl.time()
    const starts = startsRef.current
    const bounds = [...starts, tl.duration()]
    let idx = 0
    starts.forEach((s, i) => { if (time + 1e-3 >= s) idx = i })
    fillRefs.current.forEach((el, i) => {
      if (!el) return
      const p = (time - bounds[i]) / Math.max(1e-3, bounds[i + 1] - bounds[i])
      el.style.transform = `scaleX(${Math.max(0, Math.min(1, p))})`
    })
    if (idx !== stepRef.current) { stepRef.current = idx; setStep(idx) }
  }, [])

  // Build the master timeline. Rebuilt on layout / language / motion changes.
  useLayoutEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const q = (sel: string): Element[] => Array.from(svg.querySelectorAll(sel))
    const one = <T extends Element>(sel: string) => svg.querySelector<T>(sel)!
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true, onUpdate: sync, onComplete: () => setPlaying(false) })
      const his = Array.from(svg.querySelectorAll<SVGPathElement>('[data-edge-hi]'))
      his.forEach(p => {
        const len = p.getTotalLength()
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len, opacity: 0 })
      })
      gsap.set(q('[data-grace-fill]'), { scaleX: 0, transformOrigin: '0% 50%' })

      // Every tween is an explicit fromTo against state tracked here at build
      // time, so the timeline renders identically however it is seeked.
      const IR = { immediateRender: false }
      const current: Record<string, string> = { ...INITIAL }
      let graceFill = 0
      let prevFocus: Element[] = []
      let prevLit: Element[] = []

      const fade = (k: StateKey, v: string, at: number, pop = false) => {
        const off = q(`[data-k="${k}"][data-v="${current[k]}"]`)
        const on  = q(`[data-k="${k}"][data-v="${v}"]`)
        if (current[k] === v) return
        tl.fromTo(off, { opacity: 1 }, { opacity: 0, duration: 0.25, ...IR }, at)
        tl.fromTo(on,  { opacity: 0 }, { opacity: 1, duration: 0.3, ...IR }, at + 0.1)
        current[k] = v
        if (pop) {
          const badges = on.flatMap(g => Array.from(g.querySelectorAll('[data-badge]')))
          const origin = { transformOrigin: '50% 50%', smoothOrigin: false }
          tl.fromTo(badges.length ? badges : on, { scale: 0.85, ...origin },
            { scale: 1, ...origin, duration: 0.45, ease: 'back.out(2.2)', ...IR }, at + 0.1)
        }
      }

      let cursor = 0
      const starts: number[] = []
      STEPS.forEach((s, i) => {
        const t0 = cursor
        starts.push(t0)
        tl.addLabel(`s${i}`, t0)

        // focus rings: fade out what lost focus, fade in what gained it
        const focus = s.focus.flatMap(id => q(`[data-ring="${id}"]`))
        const lost  = prevFocus.filter(r => !focus.includes(r))
        const won   = focus.filter(r => !prevFocus.includes(r))
        if (lost.length) tl.fromTo(lost, { opacity: 1 }, { opacity: 0, duration: 0.3, ...IR }, t0)
        if (won.length)  tl.fromTo(won,  { opacity: 0 }, { opacity: 1, duration: 0.3, ...IR }, t0)
        prevFocus = focus
        // clear edge highlights left lit by the previous step
        if (prevLit.length) tl.fromTo(prevLit, { opacity: 1 }, { opacity: 0, duration: 0.3, ...IR }, t0)
        const lit: Element[] = []

        s.fx.forEach((f, j) => {
          const at = t0 + f.at
          switch (f.t) {
            case 'packet': {
              const path = one<SVGPathElement>(`[data-edge="${f.edge}"]`)
              const hi   = one<SVGPathElement>(`[data-edge-hi="${f.edge}"]`)
              const pkt  = one<SVGGElement>(`[data-pkt="s${i}-${j}"]`)
              const len  = hi.getTotalLength()
              if (!lit.includes(hi)) lit.push(hi)
              tl.fromTo(hi, { opacity: 1, strokeDashoffset: f.reverse ? -len : len },
                { opacity: 1, strokeDashoffset: 0, duration: PKT, ease: 'power1.inOut', ...IR }, at)
              tl.fromTo(pkt, { opacity: 0, scale: 0.8 },
                { opacity: 1, scale: 1, duration: 0.18, ...IR }, at)
              tl.to(pkt, {
                motionPath: { path, start: f.reverse ? 1 : 0, end: f.reverse ? 0 : 1 },
                duration: PKT, ease: 'power1.inOut',
              }, at)
              tl.fromTo(pkt, { opacity: 1 }, { opacity: 0, duration: 0.2, ...IR }, at + PKT)
              break
            }
            case 'set':
              fade(f.k, f.v, at, f.pop)
              break
            case 'grace':
              tl.fromTo(q('[data-grace-fill]'), { scaleX: graceFill },
                { scaleX: f.fill, duration: f.dur, ease: 'none', ...IR }, at)
              graceFill = f.fill
              if (f.v) fade('grace', f.v, at)
              if (f.v === 'ended')
                tl.fromTo(q('[data-grace-done]'), { opacity: 0 }, { opacity: 1, duration: 0.3, ...IR }, at + f.dur)
              break
          }
        })
        prevLit = lit

        tl.addLabel(`s${i}_end`, t0 + s.end)
        cursor = t0 + s.end + holdFor(t(`dual.s${i + 1}_desc`))
        tl.set({}, {}, cursor) // extend the timeline through the reading hold
      })

      startsRef.current = starts
      tlRef.current = tl
      setSegments(starts.map((s, i) => (starts[i + 1] ?? cursor) - s))
      tl.seek(`s${stepRef.current}_end`)
      sync()
    }, svg)

    return () => {
      seekRef.current?.kill()
      ctx.revert()
      tlRef.current = null
      setPlaying(false)
    }
  }, [L, i18n.language, reduce, t, sync])

  const go = useCallback((i: number) => {
    const tl = tlRef.current
    if (!tl) return
    const n = clampStep(i)
    seekRef.current?.kill()
    tl.pause()
    setPlaying(false)
    if (reduce) {
      tl.seek(`s${n}_end`)
    } else {
      tl.seek(`s${n}`)
      seekRef.current = tl.tweenTo(`s${n}_end`, { ease: 'none', onUpdate: sync })
    }
    sync()
  }, [reduce, sync])

  const togglePlay = useCallback(() => {
    const tl = tlRef.current
    if (!tl) return
    seekRef.current?.kill()
    if (playing) { tl.pause(); setPlaying(false); return }
    if (tl.progress() >= 1) { tl.seek(0); sync() }
    setPlaying(true)
    if (!reduce) tl.play()
  }, [playing, reduce, sync])

  // Reduced motion: autoplay jumps between finished steps instead of animating.
  useEffect(() => {
    if (!playing || !reduce) return
    const id = setTimeout(() => {
      if (stepRef.current >= TOTAL - 1) { setPlaying(false); return }
      tlRef.current?.seek(`s${stepRef.current + 1}_end`)
      sync()
    }, holdFor(t(`dual.s${step + 1}_desc`)) * 1000)
    return () => clearTimeout(id)
  }, [playing, reduce, step, t, sync])

  const restart = () => go(0)

  // Keyboard is scoped to the player card: it never hijacks the page.
  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const onButton = (e.target as HTMLElement).tagName === 'BUTTON'
    switch (e.key) {
      case 'ArrowRight': e.preventDefault(); go(stepRef.current + 1); break
      case 'ArrowLeft':  e.preventDefault(); go(stepRef.current - 1); break
      case 'Home':       e.preventDefault(); go(0); break
      case 'End':        e.preventDefault(); go(TOTAL - 1); break
      case ' ':
        if (onButton) return
        e.preventDefault(); togglePlay(); break
    }
  }

  // Timeline scrubbing: drag to seek, click a segment to (re)play that step.
  const timeAt = (clientX: number) => {
    const tl = tlRef.current, bar = barRef.current
    if (!tl || !bar) return 0
    const r = bar.getBoundingClientRect()
    return Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * tl.duration()
  }
  const onScrubDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    scrubRef.current = { x: e.clientX, moved: false }
  }
  const onScrubMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = scrubRef.current, tl = tlRef.current
    if (!s || !tl) return
    if (!s.moved && Math.abs(e.clientX - s.x) < 4) return
    if (!s.moved) { s.moved = true; seekRef.current?.kill(); tl.pause(); setPlaying(false) }
    tl.seek(timeAt(e.clientX))
    sync()
  }
  const onScrubUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = scrubRef.current
    scrubRef.current = null
    if (!s || s.moved) return
    const time = timeAt(e.clientX)
    let idx = 0
    startsRef.current.forEach((st, i) => { if (time >= st) idx = i })
    go(idx)
  }

  const btn = 'inline-flex h-11 w-11 items-center justify-center rounded-md border border-border text-text-2 ' +
    'transition-colors duration-200 hover:border-idira-blue hover:text-text disabled:opacity-40 disabled:cursor-not-allowed ' +
    'disabled:hover:border-border disabled:hover:text-text-2'

  const n = L.nodes
  const ts = L.title
  const title = t(`dual.s${step + 1}_title`)
  const laneCls = 'font-sans font-semibold uppercase'

  return (
    <section id="dualaccounts" className="bg-bg-muted/40">
      {/* Hero band. Always deep navy with the official IDIRA "security layers"
          backdrop, mesh and dot grid, mirroring the home page Hero. */}
      <header className="relative overflow-hidden bg-[#070c1c] text-white">
        <img src={securityLayers} alt="" aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 w-[95%] sm:w-[52%] max-w-[720px] h-auto
            opacity-40 sm:opacity-70 mix-blend-screen select-none" />
        <div className="hero-mesh pointer-events-none absolute inset-0 opacity-90" aria-hidden="true" />
        <div className="hero-grid pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#070c1c] via-[#070c1c]/85 to-transparent"
          aria-hidden="true" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-14 pb-28 sm:pb-32">
          <span className="badge bg-idira-gold/10 text-idira-gold border border-idira-gold/30">{t('dual.badge')}</span>
          <h1 className="mt-5 font-semibold tracking-[-0.03em] leading-[1.02] text-[clamp(34px,5.2vw,60px)] max-w-[18ch]">
            {t('dual.title_lead')}{' '}
            <em className="not-italic idira-shimmer">{t('dual.title_accent')}</em>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-slate-300/90 max-w-[62ch]">{t('dual.subtitle')}</p>
        </div>
      </header>

      <div className="relative -mt-20 px-4 sm:px-6 pb-24">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* player card */}
        <div className="rounded-xl border border-border bg-bg-card shadow-md overflow-hidden" onKeyDown={onKeyDown}>

          {/* step header + transport controls */}
          <div className="border-b border-border px-4 sm:px-6 py-4 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[12rem]">
              <p className="text-xs font-mono text-text-muted mb-1 tabular-nums">
                {t('dual.step_of', { current: step + 1, total: TOTAL })}
              </p>
              <AnimatePresence mode="wait" initial={false}>
                <motion.h2 key={`${step}-${i18n.language}`}
                  initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -4 }} transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="text-base sm:text-lg font-semibold text-text leading-snug">
                  {title}
                </motion.h2>
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={() => go(step - 1)} disabled={step === 0}
                aria-label={t('dual.ctl_prev')} title={t('dual.ctl_prev')} className={btn}>
                <ChevronLeft size={18} aria-hidden="true" />
              </button>
              <button type="button" onClick={togglePlay}
                aria-label={playing ? t('dual.ctl_pause') : t('dual.ctl_play')}
                title={playing ? t('dual.ctl_pause') : t('dual.ctl_play')}
                className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-idira-blue text-white
                  transition-colors duration-200 hover:bg-idira-blue-2 active:bg-idira-blue-deep">
                {playing ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
              </button>
              <button type="button" onClick={() => go(step + 1)} disabled={step === TOTAL - 1}
                aria-label={t('dual.ctl_next')} title={t('dual.ctl_next')} className={btn}>
                <ChevronRight size={18} aria-hidden="true" />
              </button>
              <button type="button" onClick={restart}
                aria-label={t('dual.ctl_restart')} title={t('dual.ctl_restart')} className={btn}>
                <RotateCcw size={16} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* segmented, scrubbable timeline */}
          <div className="px-4 sm:px-6 pt-4">
            <div ref={barRef} role="slider" tabIndex={0}
              aria-label={t('dual.timeline_label', { current: step + 1, total: TOTAL })}
              aria-valuemin={1} aria-valuemax={TOTAL} aria-valuenow={step + 1} aria-valuetext={title}
              onPointerDown={onScrubDown} onPointerMove={onScrubMove} onPointerUp={onScrubUp}
              onPointerCancel={() => { scrubRef.current = null }}
              className="flex gap-1 py-2.5 cursor-pointer touch-none select-none rounded-md">
              {segments.map((d, i) => (
                <span key={i} style={{ flexGrow: d, flexBasis: 0 }}
                  className="relative h-1.5 rounded-full bg-line overflow-hidden">
                  <span ref={el => { fillRefs.current[i] = el }}
                    className={`absolute inset-0 origin-left rounded-full ${i === step ? 'bg-idira-blue' : 'bg-idira-blue/50'}`}
                    style={{ transform: 'scaleX(0)' }} />
                </span>
              ))}
            </div>
          </div>

          {/* diagram */}
          <div className="px-3 sm:px-6 pt-2 pb-2">
            <svg ref={svgRef} viewBox={`0 0 ${L.w} ${L.h}`} className="w-full h-auto" role="img"
              aria-label={`${t('dual.diagram_label')}. ${title}`}>
              <defs>
                <marker id="da-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                  <path d="M 0 0.8 L 7 4 L 0 7.2 z" className="fill-text-muted/60" />
                </marker>
              </defs>

              {/* vault frame */}
              <rect x={L.vault.x} y={L.vault.y} width={L.vault.w} height={L.vault.h} rx={16}
                strokeDasharray="6 4" strokeWidth={1.25} className="fill-bg-muted/60 stroke-text-muted/40" />
              <Vault x={L.vault.x + 4} y={L.vault.y - 21} width={14} height={14} strokeWidth={2}
                className="text-domain-idira" aria-hidden="true" />
              <text x={L.vault.x + 24} y={L.vault.y - 9} fontSize={11} letterSpacing="0.08em"
                className={`${laneCls} fill-domain-idira`}>
                {t('dual.node_vault')}
              </text>
              <text x={n.acctA.x} y={L.vault.y + 20} fontSize={11} className="fill-text-muted font-sans">
                {t('dual.vun_label')}
              </text>
              <text x={L.vault.x + L.vault.w - 14} y={L.vault.y + 20} fontSize={12} textAnchor="end"
                className="fill-text font-mono font-semibold">dbuser_dual</text>

              {/* base edges */}
              {EDGE_IDS.map(id => (
                <path key={id} data-edge={id} d={L.edges[id]} fill="none" strokeWidth={1.5}
                  className="stroke-text-muted/40" markerEnd="url(#da-arrow)" />
              ))}
              {/* highlight overlays (drawn by GSAP) */}
              {EDGE_IDS.map(id => (
                <path key={id} data-edge-hi={id} d={L.edges[id]} fill="none" strokeWidth={2.5}
                  strokeLinecap="round" style={{ opacity: 0 }}
                  className={PLANE[id] === 'data' ? 'stroke-tone-live' : 'stroke-tone-accent'} />
              ))}

              {/* lane labels, haloed so edges passing underneath never cut the text */}
              {(['cp', 'k8s'] as const).map(k => {
                const LaneIcon = k === 'cp' ? ServerCog : Container
                const d = DOMAIN[k]
                const [lx, ly] = L.lanes[k]
                return (
                  <g key={k}>
                    <rect x={lx - 3} y={ly - 13} width={20} height={17} className="fill-surface" />
                    <LaneIcon x={lx} y={ly - 11} width={14} height={14} strokeWidth={2}
                      className={d.icon} aria-hidden="true" />
                    <text x={lx + 20} y={ly} fontSize={11} letterSpacing="0.06em"
                      strokeWidth={6} strokeLinejoin="round" style={{ paintOrder: 'stroke' }}
                      className={`${laneCls} ${d.text} stroke-surface`}>
                      {t(narrow ? `dual.lane_${k}_short` : `dual.lane_${k}`)}
                    </text>
                  </g>
                )
              })}

              {/* grace period meter + rotational group index */}
              <g>
                <Hourglass x={L.grace.x} y={L.grace.y - 10} width={12} height={12} strokeWidth={2}
                  className="text-text-2" aria-hidden="true" />
                <text x={L.grace.x + 17} y={L.grace.y} fontSize={11} className="fill-text-2 font-sans font-medium">
                  {t('dual.grace_label')}
                </text>
                {(['idle', 'running', 'ended'] as const).map(v => (
                  <Swap key={v} k="grace" v={v}>
                    <text x={L.grace.stacked ? L.grace.x : L.grace.x + L.grace.w}
                      y={L.grace.stacked ? L.grace.y + 30 : L.grace.y} fontSize={11}
                      textAnchor={L.grace.stacked ? 'start' : 'end'}
                      className={`font-sans font-semibold ${v === 'running' ? 'fill-tone-warning' : v === 'ended' ? 'fill-tone-success' : 'fill-text-muted'}`}>
                      {t(`dual.grace_${v}`)}
                    </text>
                  </Swap>
                ))}
                <rect x={L.grace.x} y={L.grace.y + 8} width={L.grace.w} height={6} rx={3} className="fill-line" />
                <rect data-grace-fill x={L.grace.x} y={L.grace.y + 8} width={L.grace.w} height={6} rx={3}
                  className="fill-tone-warning" />
                <rect data-grace-done x={L.grace.x} y={L.grace.y + 8} width={L.grace.w} height={6} rx={3}
                  className="fill-tone-success" style={{ opacity: 0 }} />
                <text x={L.grace.x} y={L.grace.y + (L.grace.stacked ? 54 : 40)} fontSize={11} className="fill-text-muted font-sans">
                  {t('dual.group_label')}
                </text>
                {(['1', '2'] as const).map(v => (
                  <Swap key={v} k="curr" v={v}>
                    <text x={L.grace.x + L.grace.w} y={L.grace.y + (L.grace.stacked ? 54 : 40)} fontSize={11.5} textAnchor="end"
                      className="fill-text font-mono font-semibold">CurrInd = {v}</text>
                  </Swap>
                ))}
              </g>

              {/* ── path 1: application → Credential Provider ── */}
              <NodeCard id="app" b={n.app} size={ts} Icon={AppWindow} title={t('dual.node_app')} sub={t('dual.node_app_sub')}>
                <RowLabel b={n.app} y={68} label={t('dual.login_label')} />
                <LoginValue k="loginApp" b={n.app} y={68} t={t} />
              </NodeCard>

              <NodeCard id="cp" b={n.cp} size={ts} Icon={ServerCog} title={t('dual.node_cp')} sub={t('dual.node_cp_sub')}>
                <line x1={n.cp.x + 14} x2={n.cp.x + n.cp.w - 14} y1={n.cp.y + 56} y2={n.cp.y + 56}
                  className="stroke-line" strokeWidth={1} />
                <RowLabel b={n.cp} y={76} label={t('dual.cache_label')} />
                {(['A', 'stale', 'B'] as const).map(v => (
                  <Swap key={v} k="cache" v={v}>
                    <text x={n.cp.x + 14} y={n.cp.y + 98} fontSize={13}
                      className={`font-mono font-semibold ${v === 'stale' ? 'fill-tone-warning' : 'fill-text'}`}>
                      → {t(v === 'B' ? 'dual.acct_b' : 'dual.acct_a')}
                    </text>
                    {v === 'stale' && (
                      <text x={n.cp.x + 14} y={n.cp.y + 116} fontSize={11} className="fill-tone-warning font-sans">
                        {t('dual.cache_stale')}
                      </text>
                    )}
                  </Swap>
                ))}
              </NodeCard>

              {/* ── the pair in the Vault ── */}
              <AccountCard id="acctA" b={n.acctA} size={ts} index={1} t={t} />
              <AccountCard id="acctB" b={n.acctB} size={ts} index={2} t={t} />

              {/* ── control plane ── */}
              <NodeCard id="cpm" b={n.cpm} size={ts} Icon={CalendarClock} title={t('dual.node_cpm')} sub={t('dual.node_cpm_sub')}>
                {(['idle', 'due', 'flip', 'wait', 'reset'] as const).map(v => (
                  <Swap key={v} k="cpm" v={v}>
                    <text x={n.cpm.x + 14} y={n.cpm.y + 70} fontSize={11.5}
                      className={`font-mono font-semibold ${
                        v === 'idle' ? 'fill-text-muted' : v === 'flip' ? 'fill-tone-accent' : 'fill-tone-warning'}`}>
                      ● {t(`dual.cpm_${v}`)}
                    </text>
                  </Swap>
                ))}
              </NodeCard>

              <NodeCard id="db" b={n.db} size={ts} Icon={Database} title={t('dual.node_db')} sub={t('dual.node_db_sub')}>
                {(['user_a', 'user_b'] as const).map((u, i) => (
                  <g key={u}>
                    <text x={n.db.x + 14} y={n.db.y + 66 + i * 18} fontSize={11} className="fill-text-2 font-mono">
                      {t(`dual.${u}`)}
                    </text>
                    <text x={n.db.x + n.db.w - 14} y={n.db.y + 66 + i * 18} fontSize={11} textAnchor="end"
                      className="fill-tone-success font-sans">{t('dual.db_enabled')}</text>
                  </g>
                ))}
              </NodeCard>

              {/* ── path 2: Secrets Manager → ESO → K8s Secret → pods ── */}
              <NodeCard id="sm" b={n.sm} size={ts} Icon={Fingerprint} title={t('dual.node_sm')} sub={t('dual.node_sm_sub')}>
                <text x={n.sm.x + 14} y={n.sm.y + 66} fontSize={10.5} className="fill-text-muted font-mono">
                  dbuser_dual/username
                </text>
                {(['A', 'stale', 'B'] as const).map(v => (
                  <Swap key={v} k="sm" v={v}>
                    <text x={n.sm.x + 14} y={n.sm.y + 88} fontSize={12.5}
                      className={`font-mono font-semibold ${v === 'stale' ? 'fill-tone-warning' : 'fill-text'}`}>
                      = {t(v === 'B' ? 'dual.user_b' : 'dual.user_a')}
                    </text>
                    {v === 'stale' && (
                      <text x={n.sm.x + 14} y={n.sm.y + 106} fontSize={11} className="fill-tone-warning font-sans">
                        {t('dual.cache_stale')}
                      </text>
                    )}
                  </Swap>
                ))}
              </NodeCard>

              <NodeCard id="eso" b={n.eso} size={ts} Icon={RefreshCw} title={t('dual.node_eso')} sub={t('dual.node_eso_sub')}>
                <text x={n.eso.x + 14} y={n.eso.y + 68} fontSize={11} className="fill-text-2 font-mono">
                  refreshInterval: 1m
                </text>
              </NodeCard>

              <NodeCard id="secret" b={n.secret} size={ts} Icon={KeySquare} title={t('dual.node_secret')} sub="eso-shop-db-creds" mono>
                {(['A', 'B'] as const).map(v => (
                  <Swap key={v} k="secret" v={v}>
                    <text x={n.secret.x + 14} y={n.secret.y + 68} fontSize={11} className="fill-text font-mono font-semibold">
                      DB_USER={t(v === 'A' ? 'dual.user_a' : 'dual.user_b')}
                    </text>
                  </Swap>
                ))}
              </NodeCard>

              <NodeCard id="pods" b={n.pods} size={ts} Icon={ShoppingCart} title={t('dual.node_pods')} sub={t('dual.node_pods_sub')}>
                {(['ready', 'rolling'] as const).map(v => (
                  <Swap key={v} k="pods" v={v}>
                    <text x={n.pods.x + 14} y={n.pods.y + 68} fontSize={11.5}
                      className={`font-mono font-semibold ${v === 'ready' ? 'fill-tone-success' : 'fill-tone-warning'}`}>
                      ● {t(`dual.pods_${v}`)}
                    </text>
                  </Swap>
                ))}
                <RowLabel b={n.pods} y={96} label={t('dual.login_label')} />
                <LoginValue k="loginPods" b={n.pods} y={96} t={t} />
              </NodeCard>

              {/* packets. On top of everything */}
              {packets.map(p => {
                const w = pillWidth(p.label)
                const data = PLANE[p.edge] === 'data'
                return (
                  <g key={p.id} data-pkt={p.id} style={{ opacity: 0 }} aria-hidden="true">
                    <rect x={-w / 2} y={-11} width={w} height={22} rx={11} className="fill-surface" />
                    <rect x={-w / 2} y={-11} width={w} height={22} rx={11} strokeWidth={1.25}
                      className={data ? 'fill-tone-live/15 stroke-tone-live' : 'fill-tone-accent/15 stroke-tone-accent'} />
                    <text y={4} fontSize={11.5} textAnchor="middle"
                      className={`font-mono font-semibold ${data ? 'fill-tone-live' : 'fill-tone-accent'}`}>
                      {p.label}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          {/* legend. Two groups: who owns a component vs. what a signal means */}
          <div className="px-4 sm:px-6 pb-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-text-2">
            <span className="font-semibold uppercase tracking-wider text-text-muted">{t('dual.legend_components')}</span>
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {([['idira', 'bg-domain-idira'], ['cp', 'bg-domain-cp'], ['k8s', 'bg-domain-k8s']] as const).map(([k, bg]) => (
                <li key={k} className="inline-flex items-center gap-2">
                  <span className={`h-1 w-4 rounded-full ${bg}`} aria-hidden="true" />{t(`dual.legend_${k}`)}
                </li>
              ))}
            </ul>
            <span className="hidden sm:block h-4 w-px bg-border" aria-hidden="true" />
            <span className="font-semibold uppercase tracking-wider text-text-muted">{t('dual.legend_signals')}</span>
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              <li className="inline-flex items-center gap-2">
                <span className="h-0.5 w-5 rounded-full bg-tone-live" aria-hidden="true" />{t('dual.legend_data')}
              </li>
              <li className="inline-flex items-center gap-2">
                <span className="h-0.5 w-5 rounded-full bg-tone-accent" aria-hidden="true" />{t('dual.legend_control')}
              </li>
              <li className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-tone-success" aria-hidden="true" />{t('dual.legend_active')}
              </li>
              <li className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full border-[1.5px] border-text-muted" aria-hidden="true" />{t('dual.legend_inactive')}
              </li>
            </ul>
          </div>

          {/* narration */}
          <div className="border-t border-border px-4 sm:px-6 py-5 min-h-[8.5rem]" aria-live="polite" aria-atomic="true">
            <span className="sr-only">{t('dual.step_of', { current: step + 1, total: TOTAL })}: {title}. </span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p key={`${step}-${i18n.language}`}
                initial={reduce ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }}
                className="text-base text-text-2 leading-relaxed max-w-[75ch] [overflow-wrap:anywhere]">
                {t(`dual.s${step + 1}_desc`)}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* key concepts */}
        <div className="grid sm:grid-cols-2 gap-4">
          {([ShieldCheck, Hourglass, Tag, ListChecks] as LucideIcon[]).map((KeyIcon, i) => (
            <div key={i} className="section-card flex gap-4">
              <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg
                bg-idira-blue/10 text-tone-accent" aria-hidden="true">
                <KeyIcon size={20} strokeWidth={1.75} />
              </span>
              <div className="min-w-0 space-y-2">
                <h3 className="text-base font-semibold text-text">{t(`dual.key${i + 1}_title`)}</h3>
                <p className="text-sm text-text-2 leading-relaxed [overflow-wrap:anywhere]">{t(`dual.key${i + 1}_desc`)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* sources */}
        <p className="text-sm text-text-muted text-center flex flex-wrap justify-center gap-x-4 gap-y-2">
          <span>{t('dual.sources_label')}</span>
          {(['manage', 'configure', 'repr'] as const).map(k => (
            <a key={k} href={DOCS[k]} target="_blank" rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-1 text-tone-accent hover:underline underline-offset-4">
              {t(`dual.src_${k}`)}<ExternalLink size={12} aria-hidden="true" />
            </a>
          ))}
        </p>

        <p className="hidden sm:block text-center text-xs text-text-muted select-none">{t('dual.keyboard_hint')}</p>
      </div>
      </div>
    </section>
  )
}
