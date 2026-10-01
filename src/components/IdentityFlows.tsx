import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChevronLeft, ChevronRight, Cloud, Container, Database, Fingerprint, HardDrive, KeyRound, Pause, Play,
  Plug, RotateCcw, ShieldCheck, Vault,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { gsap } from 'gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'

gsap.registerPlugin(MotionPathPlugin)

// ─── model ────────────────────────────────────────────────────────────────────
// Two ways a workload reaches a service, played in sequence on ONE seekable
// GSAP timeline (DESIGN.md §10):
//   Path 1  identity → secret → service: Kubernetes ServiceAccount JWT →
//           IDIRA Secrets Manager authn-jwt → access token → policy → vault →
//           DB password → MySQL
//   Path 2  identity straight to the service: Secure Workload Access issues an
//           SVID → AWS STS AssumeRoleWithWebIdentity → temporary credentials →
//           Amazon S3. No secret is created, stored or distributed.
// Packet kinds carry icon + label + colour (never colour alone).

type NodeId = 'issA' | 'app' | 'idira' | 'db' | 'swa' | 'wl' | 'sts' | 's3'
type EdgeId = 'a-iss' | 'a-req' | 'a-res' | 'a-svc' | 'b-iss' | 'b-req' | 'b-res' | 'b-svc'
type Kind = 'identity' | 'secret' | 'access'

interface Box { x: number; y: number; w: number; h: number }
type Domain = 'idira' | 'k8s' | 'svc'
interface Zone extends Box { d: Domain }
interface Layout {
  w: number; h: number; title: number
  nodes: Record<NodeId, Box>
  zones: Zone[]
  lanes: { a: [number, number]; b: [number, number] }
  edges: Record<EdgeId, string>
}

const WIDE: Layout = {
  w: 980, h: 470, title: 15,
  nodes: {
    issA:  { x: 16,  y: 56,  w: 170, h: 96  },
    app:   { x: 248, y: 44,  w: 176, h: 120 },
    idira: { x: 560, y: 36,  w: 210, h: 150 },
    db:    { x: 826, y: 56,  w: 138, h: 96  },
    swa:   { x: 16,  y: 286, w: 170, h: 96  },
    wl:    { x: 248, y: 274, w: 176, h: 120 },
    sts:   { x: 560, y: 280, w: 210, h: 108 },
    s3:    { x: 826, y: 286, w: 138, h: 96  },
  },
  lanes: { a: [16, 22], b: [16, 252] },
  zones: [
    { d: 'k8s',   x: 6,   y: 28,  w: 428, h: 150 },
    { d: 'idira', x: 550, y: 26,  w: 230, h: 170 },
    { d: 'svc',   x: 816, y: 44,  w: 158, h: 120 },
    { d: 'idira', x: 6,   y: 272, w: 190, h: 122 },
    { d: 'k8s',   x: 238, y: 262, w: 196, h: 144 },
    { d: 'svc',   x: 550, y: 266, w: 424, h: 134 },
  ],
  edges: {
    'a-iss': 'M 186,104 L 248,104',
    'a-req': 'M 424,92 L 560,92',
    'a-res': 'M 560,128 L 424,128',
    'a-svc': 'M 336,164 C 336,218 895,218 895,152',
    'b-iss': 'M 186,334 L 248,334',
    'b-req': 'M 424,320 L 560,320',
    'b-res': 'M 560,352 L 424,352',
    'b-svc': 'M 336,394 C 336,448 895,448 895,382',
  },
}

const NARROW: Layout = {
  w: 360, h: 1268, title: 14,
  nodes: {
    issA:  { x: 70, y: 30,   w: 220, h: 84  },
    app:   { x: 70, y: 162,  w: 220, h: 120 },
    idira: { x: 50, y: 332,  w: 260, h: 150 },
    db:    { x: 70, y: 544,  w: 220, h: 84  },
    swa:   { x: 70, y: 700,  w: 220, h: 84  },
    wl:    { x: 70, y: 832,  w: 220, h: 120 },
    sts:   { x: 50, y: 1002, w: 260, h: 108 },
    s3:    { x: 70, y: 1168, w: 220, h: 84  },
  },
  lanes: { a: [16, 14], b: [16, 682] },
  zones: [
    { d: 'k8s',   x: 56, y: 20,   w: 248, h: 272 },
    { d: 'idira', x: 40, y: 318,  w: 280, h: 174 },
    { d: 'svc',   x: 60, y: 530,  w: 240, h: 108 },
    { d: 'idira', x: 60, y: 690,  w: 240, h: 104 },
    { d: 'k8s',   x: 60, y: 820,  w: 240, h: 142 },
    { d: 'svc',   x: 40, y: 990,  w: 280, h: 272 },
  ],
  edges: {
    'a-iss': 'M 180,114 L 180,162',
    'a-req': 'M 160,282 L 160,332',
    'a-res': 'M 200,332 L 200,282',
    'a-svc': 'M 290,222 C 348,222 348,586 290,586',
    'b-iss': 'M 180,784 L 180,832',
    'b-req': 'M 160,952 L 160,1002',
    'b-res': 'M 200,1002 L 200,952',
    'b-svc': 'M 290,892 C 348,892 348,1210 290,1210',
  },
}

const INITIAL = {
  appId: 'none', appTok: 'none', appSec: 'none', db: 'idle',
  authn: 'idle', policy: 'idle', vault: 'idle',
  wlId: 'none', wlCred: 'none', sts: 'idle', s3: 'idle',
} as const
type StateKey = keyof typeof INITIAL

type Effect =
  | { t: 'packet'; at: number; edge: EdgeId; label: string; kind: Kind }
  | { t: 'set'; at: number; k: StateKey; v: string; pop?: boolean }

interface Step { focus: NodeId[]; end: number; fx: Effect[] }

const PKT = 1.0

const STEPS: Step[] = [
  { focus: ['app', 'wl'], end: 0.6, fx: [] },
  // Path 1
  { focus: ['issA', 'app'], end: 2.2, fx: [
    { t: 'packet', at: 0.3, edge: 'a-iss', label: 'p_sajwt', kind: 'identity' },
    { t: 'set', at: 1.3, k: 'appId', v: 'ok', pop: true },
  ] },
  { focus: ['app', 'idira'], end: 2.4, fx: [
    { t: 'packet', at: 0.3, edge: 'a-req', label: 'p_jwt', kind: 'identity' },
    { t: 'set', at: 1.2, k: 'authn', v: 'check' },
    { t: 'set', at: 1.9, k: 'authn', v: 'ok', pop: true },
  ] },
  { focus: ['idira', 'app'], end: 2.2, fx: [
    { t: 'packet', at: 0.3, edge: 'a-res', label: 'p_token', kind: 'identity' },
    { t: 'set', at: 1.3, k: 'appTok', v: 'ok', pop: true },
  ] },
  { focus: ['app', 'idira'], end: 3.8, fx: [
    { t: 'packet', at: 0.3, edge: 'a-req', label: 'p_get', kind: 'identity' },
    { t: 'set', at: 1.2, k: 'policy', v: 'check' },
    { t: 'set', at: 1.8, k: 'policy', v: 'ok', pop: true },
    { t: 'set', at: 2.0, k: 'vault', v: 'ok', pop: true },
    { t: 'packet', at: 2.2, edge: 'a-res', label: 'p_dbpass', kind: 'secret' },
    { t: 'set', at: 3.2, k: 'appSec', v: 'ok', pop: true },
  ] },
  { focus: ['app', 'db'], end: 2.4, fx: [
    { t: 'packet', at: 0.3, edge: 'a-svc', label: 'p_login', kind: 'access' },
    { t: 'set', at: 1.4, k: 'db', v: 'ok', pop: true },
  ] },
  // Path 2
  { focus: ['swa', 'wl'], end: 2.2, fx: [
    { t: 'packet', at: 0.3, edge: 'b-iss', label: 'p_svid', kind: 'identity' },
    { t: 'set', at: 1.3, k: 'wlId', v: 'ok', pop: true },
  ] },
  { focus: ['wl', 'sts'], end: 2.4, fx: [
    { t: 'packet', at: 0.3, edge: 'b-req', label: 'p_jwtsvid', kind: 'identity' },
    { t: 'set', at: 1.2, k: 'sts', v: 'check' },
    { t: 'set', at: 1.9, k: 'sts', v: 'ok', pop: true },
  ] },
  { focus: ['sts', 'wl'], end: 2.2, fx: [
    { t: 'packet', at: 0.3, edge: 'b-res', label: 'p_tempcreds', kind: 'secret' },
    { t: 'set', at: 1.3, k: 'wlCred', v: 'ok', pop: true },
  ] },
  { focus: ['wl', 's3'], end: 2.4, fx: [
    { t: 'packet', at: 0.3, edge: 'b-svc', label: 'p_s3read', kind: 'access' },
    { t: 'set', at: 1.4, k: 's3', v: 'ok', pop: true },
  ] },
  // Summary
  { focus: ['app', 'db', 'wl', 's3'], end: 0.8, fx: [] },
]

const TOTAL = STEPS.length
const EDGE_IDS: EdgeId[] = ['a-iss', 'a-req', 'a-res', 'a-svc', 'b-iss', 'b-req', 'b-res', 'b-svc']
const EDGE_KIND: Record<EdgeId, Kind> = {
  'a-iss': 'identity', 'a-req': 'identity', 'a-res': 'identity', 'a-svc': 'access',
  'b-iss': 'identity', 'b-req': 'identity', 'b-res': 'secret', 'b-svc': 'access',
}
const KIND: Record<Kind, { stroke: string; fill: string; text: string; Icon: LucideIcon }> = {
  identity: { stroke: 'stroke-tone-accent', fill: 'fill-tone-accent/15', text: 'fill-tone-accent', Icon: Fingerprint },
  secret:   { stroke: 'stroke-tone-live',   fill: 'fill-tone-live/15',   text: 'fill-tone-live',   Icon: KeyRound },
  access:   { stroke: 'stroke-text-2',      fill: 'fill-bg-muted',       text: 'fill-text',        Icon: Plug },
}
const KIND_TW: Record<Kind, string> = { identity: 'text-tone-accent', secret: 'text-tone-live', access: 'text-text-2' }

// Colour = ownership (DESIGN.md §3.3): stripe, icon chip and zone tint.
const DOM: Record<Domain, { stripe: string; chip: string; icon: string; zone: string; swatch: string }> = {
  idira: { stripe: 'fill-domain-idira', chip: 'stroke-domain-idira/70', icon: 'text-domain-idira', zone: 'fill-domain-idira/[0.06] stroke-domain-idira/30', swatch: 'bg-domain-idira' },
  k8s:   { stripe: 'fill-domain-k8s',   chip: 'stroke-domain-k8s/70',   icon: 'text-domain-k8s',   zone: 'fill-domain-k8s/[0.06] stroke-domain-k8s/30',     swatch: 'bg-domain-k8s' },
  svc:   { stripe: 'fill-domain-svc',   chip: 'stroke-domain-svc/70',   icon: 'text-domain-svc',   zone: 'fill-domain-svc/[0.06] stroke-domain-svc/30',     swatch: 'bg-domain-svc' },
}
const NODE_DOMAIN: Record<NodeId, Domain> = { issA: 'k8s', app: 'k8s', idira: 'idira', db: 'svc', swa: 'idira', wl: 'k8s', sts: 'svc', s3: 'svc' }

const clampStep = (i: number) => Math.max(0, Math.min(TOTAL - 1, i))
const holdFor = (text: string) => Math.min(11, Math.max(4, text.trim().split(/\s+/).length / 3.5))

function useIsNarrow() {
  const query = '(max-width: 639px)'
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const m = window.matchMedia(query)
    const h = () => setNarrow(m.matches)
    m.addEventListener('change', h)
    return () => m.removeEventListener('change', h)
  }, [])
  return narrow
}

// ─── SVG pieces ───────────────────────────────────────────────────────────────

function Swap({ k, v, children }: { k: StateKey; v: string; children: ReactNode }) {
  return <g data-k={k} data-v={v} style={{ opacity: INITIAL[k] === v ? 1 : 0 }}>{children}</g>
}

function Card({ id, b, size, title, sub, Icon, children }: {
  id: NodeId; b: Box; size: number; title: string; sub: string; Icon: LucideIcon; children?: ReactNode
}) {
  const cx = b.x + b.w - 24, cy = b.y - 2
  const d = DOM[NODE_DOMAIN[id]]
  return (
    <g>
      <rect data-ring={id} x={b.x - 5} y={b.y - 5} width={b.w + 10} height={b.h + 10} rx={16}
        className="fill-none stroke-text-2/60" strokeWidth={2} style={{ opacity: 0 }} />
      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={12} className="fill-bg-muted stroke-line" strokeWidth={1.25} />
      <rect x={b.x + 14} y={b.y - 1.5} width={b.w - 58} height={3} rx={1.5} className={d.stripe} aria-hidden="true" />
      <g aria-hidden="true">
        <circle cx={cx} cy={cy} r={12} className={`fill-surface ${d.chip}`} strokeWidth={1.5} />
        <Icon x={cx - 7.5} y={cy - 7.5} width={15} height={15} strokeWidth={1.9} className={d.icon} />
      </g>
      <text x={b.x + 14} y={b.y + 25} fontSize={size} className="fill-text font-sans font-semibold">{title}</text>
      <text x={b.x + 14} y={b.y + 43} fontSize={11} className="fill-text-muted font-sans">{sub}</text>
      {children}
    </g>
  )
}

/** "label ......... value" row with cross-faded value states. */
function StateRow({ b, y, label, k, states }: {
  b: Box; y: number; label: string; k: StateKey; states: Array<{ v: string; text: string; tone: 'muted' | 'warn' | 'ok' }>
}) {
  const cls = { muted: 'fill-text-muted', warn: 'fill-tone-warning', ok: 'fill-tone-success' }
  return (
    <g>
      <text x={b.x + 14} y={b.y + y} fontSize={11.5} className="fill-text-2 font-mono">{label}</text>
      {states.map(s => (
        <Swap key={s.v} k={k} v={s.v}>
          <text x={b.x + b.w - 14} y={b.y + y} fontSize={11.5} textAnchor="end"
            className={`font-sans font-semibold ${cls[s.tone]}`}>{s.text}</text>
        </Swap>
      ))}
    </g>
  )
}

// ─── component ────────────────────────────────────────────────────────────────

export default function IdentityFlows() {
  const { t, i18n } = useTranslation()
  const reduce = useReducedMotion() ?? false
  const narrow = useIsNarrow()
  const L = narrow ? NARROW : WIDE

  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [segments, setSegments] = useState<number[]>(() => STEPS.map(() => 1))

  const svgRef = useRef<SVGSVGElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const seekRef = useRef<gsap.core.Tween | null>(null)
  const startsRef = useRef<number[]>([])
  const stepRef = useRef(0)
  const fillRefs = useRef<(HTMLSpanElement | null)[]>([])
  const barRef = useRef<HTMLDivElement>(null)
  const scrubRef = useRef<{ x: number; moved: boolean } | null>(null)

  const packets = useMemo(() => STEPS.flatMap((s, i) =>
    s.fx.flatMap((f, j) => f.t === 'packet' ? [{ id: `s${i}-${j}`, edge: f.edge, kind: f.kind, label: t(`idflow.${f.label}`) }] : [])), [t])

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

  useLayoutEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const q = (sel: string): Element[] => Array.from(svg.querySelectorAll(sel))
    const one = <T extends Element>(sel: string) => svg.querySelector<T>(sel)!
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true, onUpdate: sync, onComplete: () => setPlaying(false) })
      const his = Array.from(svg.querySelectorAll<SVGPathElement>('[data-edge-hi]'))
      his.forEach(p => { const len = p.getTotalLength(); gsap.set(p, { strokeDasharray: len, strokeDashoffset: len, opacity: 0 }) })

      const IR = { immediateRender: false }
      const current: Record<string, string> = { ...INITIAL }
      let prevFocus: Element[] = []
      let prevLit: Element[] = []
      const fade = (k: StateKey, v: string, at: number, pop = false) => {
        if (current[k] === v) return
        const off = q(`[data-k="${k}"][data-v="${current[k]}"]`)
        const on = q(`[data-k="${k}"][data-v="${v}"]`)
        tl.fromTo(off, { opacity: 1 }, { opacity: 0, duration: 0.25, ...IR }, at)
        tl.fromTo(on, { opacity: 0 }, { opacity: 1, duration: 0.3, ...IR }, at + 0.1)
        current[k] = v
        if (pop) {
          const o = { transformOrigin: '50% 50%', smoothOrigin: false }
          tl.fromTo(on, { scale: 0.85, ...o }, { scale: 1, ...o, duration: 0.45, ease: 'back.out(2.2)', ...IR }, at + 0.1)
        }
      }

      let cursor = 0
      const starts: number[] = []
      STEPS.forEach((s, i) => {
        const t0 = cursor
        starts.push(t0)
        tl.addLabel(`s${i}`, t0)
        const focus = s.focus.flatMap(id => q(`[data-ring="${id}"]`))
        const lost = prevFocus.filter(r => !focus.includes(r))
        const won = focus.filter(r => !prevFocus.includes(r))
        if (lost.length) tl.fromTo(lost, { opacity: 1 }, { opacity: 0, duration: 0.3, ...IR }, t0)
        if (won.length) tl.fromTo(won, { opacity: 0 }, { opacity: 1, duration: 0.3, ...IR }, t0)
        prevFocus = focus
        if (prevLit.length) tl.fromTo(prevLit, { opacity: 1 }, { opacity: 0, duration: 0.3, ...IR }, t0)
        const lit: Element[] = []
        s.fx.forEach((f, j) => {
          const at = t0 + f.at
          if (f.t === 'set') { fade(f.k, f.v, at, f.pop); return }
          const path = one<SVGPathElement>(`[data-edge="${f.edge}"]`)
          const hi = one<SVGPathElement>(`[data-edge-hi="${f.edge}"]`)
          const pkt = one<SVGGElement>(`[data-pkt="s${i}-${j}"]`)
          const len = hi.getTotalLength()
          if (!lit.includes(hi)) lit.push(hi)
          tl.fromTo(hi, { opacity: 1, strokeDashoffset: len }, { opacity: 1, strokeDashoffset: 0, duration: PKT, ease: 'power1.inOut', ...IR }, at)
          tl.fromTo(pkt, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.18, ...IR }, at)
          tl.to(pkt, { motionPath: { path, start: 0, end: 1 }, duration: PKT, ease: 'power1.inOut' }, at)
          // fade out before the pill reaches the card so it never covers card text
          tl.fromTo(pkt, { opacity: 1 }, { opacity: 0, duration: 0.18, ...IR }, at + PKT * 0.8)
        })
        prevLit = lit
        tl.addLabel(`s${i}_end`, t0 + s.end)
        cursor = t0 + s.end + holdFor(t(`idflow.s${i + 1}_desc`))
        tl.set({}, {}, cursor)
      })
      startsRef.current = starts
      tlRef.current = tl
      setSegments(starts.map((s, i) => (starts[i + 1] ?? cursor) - s))
      tl.seek(`s${stepRef.current}_end`)
      sync()
    }, svg)
    return () => { seekRef.current?.kill(); ctx.revert(); tlRef.current = null; setPlaying(false) }
  }, [L, i18n.language, reduce, t, sync])

  const go = useCallback((i: number) => {
    const tl = tlRef.current
    if (!tl) return
    const n = clampStep(i)
    seekRef.current?.kill()
    tl.pause()
    setPlaying(false)
    if (reduce) tl.seek(`s${n}_end`)
    else { tl.seek(`s${n}`); seekRef.current = tl.tweenTo(`s${n}_end`, { ease: 'none', onUpdate: sync }) }
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

  useEffect(() => {
    if (!playing || !reduce) return
    const id = setTimeout(() => {
      if (stepRef.current >= TOTAL - 1) { setPlaying(false); return }
      tlRef.current?.seek(`s${stepRef.current + 1}_end`)
      sync()
    }, holdFor(t(`idflow.s${step + 1}_desc`)) * 1000)
    return () => clearTimeout(id)
  }, [playing, reduce, step, t, sync])

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const onButton = (e.target as HTMLElement).tagName === 'BUTTON'
    switch (e.key) {
      case 'ArrowRight': e.preventDefault(); go(stepRef.current + 1); break
      case 'ArrowLeft': e.preventDefault(); go(stepRef.current - 1); break
      case 'Home': e.preventDefault(); go(0); break
      case 'End': e.preventDefault(); go(TOTAL - 1); break
      case ' ': if (onButton) return; e.preventDefault(); togglePlay(); break
    }
  }

  const timeAt = (clientX: number) => {
    const tl = tlRef.current, bar = barRef.current
    if (!tl || !bar) return 0
    const r = bar.getBoundingClientRect()
    return Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * tl.duration()
  }
  const onScrubDown = (e: ReactPointerEvent<HTMLDivElement>) => { e.currentTarget.setPointerCapture(e.pointerId); scrubRef.current = { x: e.clientX, moved: false } }
  const onScrubMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = scrubRef.current, tl = tlRef.current
    if (!s || !tl) return
    if (!s.moved && Math.abs(e.clientX - s.x) < 4) return
    if (!s.moved) { s.moved = true; seekRef.current?.kill(); tl.pause(); setPlaying(false) }
    tl.seek(timeAt(e.clientX)); sync()
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

  const btn = 'inline-flex h-11 w-11 items-center justify-center rounded-md border border-border text-text-2 transition-colors duration-200 ' +
    'hover:border-idira-blue hover:text-text disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:text-text-2'
  const n = L.nodes
  const ts = L.title
  const title = t(`idflow.s${step + 1}_title`)
  const pend = t('idflow.st_pending')

  return (
    <div className="rounded-2xl border border-border bg-bg-card shadow-md overflow-hidden" onKeyDown={onKeyDown}>
      {/* step header + transport */}
      <div className="border-b border-border px-4 sm:px-6 py-4 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[12rem]">
          <p className="text-xs font-mono text-text-muted mb-1 tabular-nums">{t('dual.step_of', { current: step + 1, total: TOTAL })}</p>
          <AnimatePresence mode="wait" initial={false}>
            <motion.h3 key={`${step}-${i18n.language}`}
              initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -4 }} transition={{ duration: 0.2, ease: 'easeOut' }}
              className="text-base sm:text-lg font-semibold text-text leading-snug">{title}</motion.h3>
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => go(step - 1)} disabled={step === 0} aria-label={t('dual.ctl_prev')} title={t('dual.ctl_prev')} className={btn}>
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button type="button" onClick={togglePlay} aria-label={playing ? t('dual.ctl_pause') : t('dual.ctl_play')} title={playing ? t('dual.ctl_pause') : t('dual.ctl_play')}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-idira-blue text-white transition-colors duration-200 hover:bg-idira-blue-2 active:bg-idira-blue-deep">
            {playing ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
          </button>
          <button type="button" onClick={() => go(step + 1)} disabled={step === TOTAL - 1} aria-label={t('dual.ctl_next')} title={t('dual.ctl_next')} className={btn}>
            <ChevronRight size={18} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => go(0)} aria-label={t('dual.ctl_restart')} title={t('dual.ctl_restart')} className={btn}>
            <RotateCcw size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* segmented, scrubbable timeline */}
      <div className="px-4 sm:px-6 pt-4">
        <div ref={barRef} role="slider" tabIndex={0}
          aria-label={t('dual.timeline_label', { current: step + 1, total: TOTAL })}
          aria-valuemin={1} aria-valuemax={TOTAL} aria-valuenow={step + 1} aria-valuetext={title}
          onPointerDown={onScrubDown} onPointerMove={onScrubMove} onPointerUp={onScrubUp} onPointerCancel={() => { scrubRef.current = null }}
          className="flex gap-1 py-2.5 cursor-pointer touch-none select-none rounded-md">
          {segments.map((d, i) => (
            <span key={i} style={{ flexGrow: d, flexBasis: 0 }}
              className="relative h-1.5 rounded-full overflow-hidden bg-line">
              <span ref={el => { fillRefs.current[i] = el }} style={{ transform: 'scaleX(0)' }}
                className={`absolute inset-0 origin-left rounded-full ${i === step ? 'bg-idira-blue' : 'bg-idira-blue/50'}`} />
            </span>
          ))}
        </div>
      </div>

      {/* diagram */}
      <div className="px-3 sm:px-6 pt-2 pb-2">
        <svg ref={svgRef} viewBox={`0 0 ${L.w} ${L.h}`} className="w-full h-auto" role="img"
          aria-label={`${t('idflow.diagram_label')}. ${title}`}>
          <defs>
            <marker id="idf-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M 0 0.8 L 7 4 L 0 7.2 z" className="fill-text-muted/60" />
            </marker>
          </defs>

          {/* trust zones (who owns what), behind everything */}
          {L.zones.map((z, i) => (
            <rect key={i} x={z.x} y={z.y} width={z.w} height={z.h} rx={18} strokeWidth={1.25} strokeDasharray="5 4"
              className={DOM[z.d].zone} aria-hidden="true" />
          ))}

          {(['a', 'b'] as const).map(k => (
            <text key={k} x={L.lanes[k][0]} y={L.lanes[k][1]} fontSize={11} letterSpacing="0.06em"
              strokeWidth={6} strokeLinejoin="round" style={{ paintOrder: 'stroke' }}
              className="fill-text-2 stroke-surface font-sans font-semibold uppercase">
              {t(narrow ? `idflow.lane_${k}_short` : `idflow.lane_${k}`)}
            </text>
          ))}

          {EDGE_IDS.map(id => (
            <path key={id} data-edge={id} d={L.edges[id]} fill="none" strokeWidth={1.5}
              className="stroke-text-muted/40" markerEnd="url(#idf-arrow)" />
          ))}
          {EDGE_IDS.map(id => (
            <path key={id} data-edge-hi={id} d={L.edges[id]} fill="none" strokeWidth={2.5} strokeLinecap="round"
              style={{ opacity: 0 }} className={KIND[EDGE_KIND[id]].stroke} />
          ))}

          {/* Path 1 */}
          <Card id="issA" b={n.issA} size={ts} title="Kubernetes" sub={t('idflow.n_k8s_sub')} Icon={Container} />
          <Card id="app" b={n.app} size={ts} title={t('idflow.n_app')} sub={t('idflow.n_app_sub')} Icon={HardDrive}>
            <StateRow b={n.app} y={70} label={t('idflow.r_identity')} k="appId" states={[{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: 'JWT', tone: 'ok' }]} />
            <StateRow b={n.app} y={88} label={t('idflow.r_token')} k="appTok" states={[{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: t('idflow.st_ok'), tone: 'ok' }]} />
            <StateRow b={n.app} y={106} label={t('idflow.r_secret')} k="appSec" states={[{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: t('idflow.st_memory'), tone: 'ok' }]} />
          </Card>
          <Card id="idira" b={n.idira} size={ts} title="IDIRA Secrets Manager" sub={t('idflow.n_idira_sub')} Icon={Vault}>
            <line x1={n.idira.x + 14} x2={n.idira.x + n.idira.w - 14} y1={n.idira.y + 54} y2={n.idira.y + 54} className="stroke-line" />
            <StateRow b={n.idira} y={76} label="authn-jwt" k="authn" states={[{ v: 'idle', text: t('idflow.st_idle'), tone: 'muted' }, { v: 'check', text: t('idflow.st_check'), tone: 'warn' }, { v: 'ok', text: t('idflow.st_valid'), tone: 'ok' }]} />
            <StateRow b={n.idira} y={102} label="policy" k="policy" states={[{ v: 'idle', text: t('idflow.st_idle'), tone: 'muted' }, { v: 'check', text: t('idflow.st_check'), tone: 'warn' }, { v: 'ok', text: t('idflow.st_fetcher'), tone: 'ok' }]} />
            <StateRow b={n.idira} y={128} label="vault" k="vault" states={[{ v: 'idle', text: t('idflow.st_idle'), tone: 'muted' }, { v: 'ok', text: t('idflow.st_delivered'), tone: 'ok' }]} />
          </Card>
          <Card id="db" b={n.db} size={ts} title="MySQL" sub={t('idflow.n_db_sub')} Icon={Database}>
            <StateRow b={n.db} y={70} label={t('idflow.r_session')} k="db" states={[{ v: 'idle', text: pend, tone: 'muted' }, { v: 'ok', text: t('idflow.st_connected'), tone: 'ok' }]} />
          </Card>

          {/* Path 2 */}
          <Card id="swa" b={n.swa} size={ts} title="IDIRA SWA" sub={t('idflow.n_swa_sub')} Icon={ShieldCheck} />
          <Card id="wl" b={n.wl} size={ts} title={t('idflow.n_wl')} sub={t('idflow.n_wl_sub')} Icon={HardDrive}>
            <StateRow b={n.wl} y={70} label={t('idflow.r_identity')} k="wlId" states={[{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: 'SVID', tone: 'ok' }]} />
            <StateRow b={n.wl} y={88} label={t('idflow.r_creds')} k="wlCred" states={[{ v: 'none', text: pend, tone: 'muted' }, { v: 'ok', text: t('idflow.st_temp'), tone: 'ok' }]} />
            <text x={n.wl.x + 14} y={n.wl.y + 106} fontSize={11.5} className="fill-text-2 font-mono">{t('idflow.r_secret')}</text>
            <text x={n.wl.x + n.wl.w - 14} y={n.wl.y + 106} fontSize={11.5} textAnchor="end" className="fill-text-muted font-sans font-semibold">{t('idflow.st_none')}</text>
          </Card>
          <Card id="sts" b={n.sts} size={ts} title="AWS STS" sub="AssumeRoleWithWebIdentity" Icon={Cloud}>
            <StateRow b={n.sts} y={76} label={t('idflow.r_trust')} k="sts" states={[{ v: 'idle', text: t('idflow.st_idle'), tone: 'muted' }, { v: 'check', text: t('idflow.st_check'), tone: 'warn' }, { v: 'ok', text: t('idflow.st_valid'), tone: 'ok' }]} />
          </Card>
          <Card id="s3" b={n.s3} size={ts} title="Amazon S3" sub={t('idflow.n_s3_sub')} Icon={Database}>
            <StateRow b={n.s3} y={70} label={t('idflow.r_access')} k="s3" states={[{ v: 'idle', text: pend, tone: 'muted' }, { v: 'ok', text: t('idflow.st_read'), tone: 'ok' }]} />
          </Card>

          {/* packets */}
          {packets.map(p => {
            const k = KIND[p.kind]
            const w = Math.round(p.label.length * 7 + 40)
            return (
              <g key={p.id} data-pkt={p.id} style={{ opacity: 0 }} aria-hidden="true">
                <rect x={-w / 2} y={-12} width={w} height={24} rx={12} className="fill-surface" />
                <rect x={-w / 2} y={-12} width={w} height={24} rx={12} strokeWidth={1.25} className={`${k.fill} ${k.stroke}`} />
                <k.Icon x={-w / 2 + 9} y={-7} width={14} height={14} strokeWidth={2} className={KIND_TW[p.kind]} />
                <text x={-w / 2 + 28} y={4} fontSize={11.5} className={`font-mono font-semibold ${k.text}`}>{p.label}</text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* legend: zones (ownership) + flows (icon + label + colour) */}
      <div className="px-4 sm:px-6 pb-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-text-2">
        <span className="font-semibold uppercase tracking-wider text-text-muted">{t('idflow.legend_zones')}</span>
        <ul className="flex flex-wrap gap-x-4 gap-y-2">
          {(['k8s', 'idira', 'svc'] as const).map(z => (
            <li key={z} className="inline-flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-sm ${DOM[z].swatch}`} aria-hidden="true" />{t(`idflow.zone_${z}`)}
            </li>
          ))}
        </ul>
        <span className="hidden sm:block h-4 w-px bg-border" aria-hidden="true" />
        <span className="font-semibold uppercase tracking-wider text-text-muted">{t('idflow.legend_flows')}</span>
        <ul className="flex flex-wrap gap-x-4 gap-y-2">
          {(['identity', 'secret', 'access'] as const).map(k => {
            const Icon = KIND[k].Icon
            return (
              <li key={k} className="inline-flex items-center gap-1.5">
                <Icon size={14} strokeWidth={2} className={KIND_TW[k]} aria-hidden="true" />{t(`idflow.legend_${k}`)}
              </li>
            )
          })}
        </ul>
      </div>

      {/* narration */}
      <div className="border-t border-border px-4 sm:px-6 py-5 min-h-[7.5rem]" aria-live="polite" aria-atomic="true">
        <span className="sr-only">{t('dual.step_of', { current: step + 1, total: TOTAL })}: {title}. </span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.p key={`${step}-${i18n.language}`}
            initial={reduce ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="text-base text-text-2 leading-relaxed max-w-[75ch] [overflow-wrap:anywhere]">
            {t(`idflow.s${step + 1}_desc`)}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}
