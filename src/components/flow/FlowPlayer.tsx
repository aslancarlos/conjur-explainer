import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Fingerprint, KeyRound, Pause, Play, Plug, RotateCcw, ScrollText, TriangleAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { gsap } from 'gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'

gsap.registerPlugin(MotionPathPlugin)

/**
 * FlowPlayer: the site-wide animated diagram (DESIGN.md §10). A diagram is a
 * FlowSpec (data); the player renders it and plays it on ONE seekable GSAP
 * timeline with prev / play / next / restart, a scrubbable segmented stepper,
 * scoped keyboard, aria-live narration, reduced-motion support, theme tokens,
 * trust zones and domain colours, and a vertical layout on phones.
 */

// ─── spec types ───────────────────────────────────────────────────────────────

export type Domain = 'idira' | 'k8s' | 'svc' | 'cp' | 'neutral'
export type Kind = 'identity' | 'secret' | 'access' | 'control' | 'leak'
export type Tone = 'muted' | 'warn' | 'ok' | 'bad'

export interface Box { x: number; y: number; w: number; h: number }

export type FlowRow =
  | { label: string; value: string; tone?: Tone }
  | { label: string; k: string; states: Array<{ v: string; text: string; tone: Tone }> }

export interface FlowNode { id: string; domain: Domain; Icon: LucideIcon; title: string; sub?: string; rows?: FlowRow[] }

export interface FlowLayout {
  w: number; h: number
  title?: number                          // node title font size (default 15)
  boxes: Record<string, Box>
  zones?: Array<Box & { d: Domain }>
  lanes?: Array<{ x: number; y: number; text: string }>
  edges: Record<string, string>            // edge id -> SVG path (start -> end)
  labels?: Array<{ x: number; y: number; text: string; edge?: string }>  // persistent pills (ports, protocols)
}

export type FlowEffect =
  | { t: 'packet'; at: number; edge: string; label: string; kind?: Kind; reverse?: boolean }
  | { t: 'set'; at: number; k: string; v: string; pop?: boolean }

export interface FlowStep { title: string; desc: string; focus: string[]; end: number; fx: FlowEffect[] }

export interface FlowSpec {
  id: string                               // unique per page (prefixes SVG ids)
  ariaLabel: string
  nodes: FlowNode[]
  edgeKinds: Record<string, Kind>
  layouts: { wide: FlowLayout; narrow: FlowLayout }
  initial?: Record<string, string>
  steps: FlowStep[]
}

// ─── visual language ──────────────────────────────────────────────────────────

const DOM: Record<Domain, { stripe?: string; chip: string; icon: string; zone: string; swatch: string }> = {
  idira:   { stripe: 'fill-domain-idira', chip: 'stroke-domain-idira/70', icon: 'text-domain-idira', zone: 'fill-domain-idira/[0.06] stroke-domain-idira/30', swatch: 'bg-domain-idira' },
  k8s:     { stripe: 'fill-domain-k8s',   chip: 'stroke-domain-k8s/70',   icon: 'text-domain-k8s',   zone: 'fill-domain-k8s/[0.06] stroke-domain-k8s/30',     swatch: 'bg-domain-k8s' },
  svc:     { stripe: 'fill-domain-svc',   chip: 'stroke-domain-svc/70',   icon: 'text-domain-svc',   zone: 'fill-domain-svc/[0.06] stroke-domain-svc/30',     swatch: 'bg-domain-svc' },
  cp:      { stripe: 'fill-domain-cp',    chip: 'stroke-domain-cp/70',    icon: 'text-domain-cp',    zone: 'fill-domain-cp/[0.06] stroke-domain-cp/30',       swatch: 'bg-domain-cp' },
  neutral: {                              chip: 'stroke-line',            icon: 'text-text-2',       zone: 'fill-text-muted/[0.04] stroke-text-muted/30',      swatch: 'bg-text-muted' },
}
const KIND: Record<Kind, { stroke: string; fill: string; text: string; tw: string; Icon: LucideIcon; dash?: string }> = {
  identity: { stroke: 'stroke-tone-accent', fill: 'fill-tone-accent/15', text: 'fill-tone-accent', tw: 'text-tone-accent', Icon: Fingerprint },
  secret:   { stroke: 'stroke-tone-live',   fill: 'fill-tone-live/15',   text: 'fill-tone-live',   tw: 'text-tone-live',   Icon: KeyRound },
  access:   { stroke: 'stroke-text-2',      fill: 'fill-bg-muted',       text: 'fill-text',        tw: 'text-text-2',      Icon: Plug },
  control:  { stroke: 'stroke-domain-cp',   fill: 'fill-domain-cp/15',   text: 'fill-domain-cp',   tw: 'text-domain-cp',   Icon: ScrollText, dash: '5 4' },
  leak:     { stroke: 'stroke-tone-danger', fill: 'fill-tone-danger/15', text: 'fill-tone-danger', tw: 'text-tone-danger', Icon: TriangleAlert, dash: '3 4' },
}
const TONE: Record<Tone, string> = { muted: 'fill-text-muted', warn: 'fill-tone-warning', ok: 'fill-tone-success', bad: 'fill-tone-danger' }
const ZONE_ORDER: Domain[] = ['k8s', 'idira', 'svc', 'cp', 'neutral']
const KIND_ORDER: Kind[] = ['identity', 'secret', 'access', 'control', 'leak']

const PKT = 1.0
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

/** One value of a cross-faded state group (module level: must never remount). */
function Swap({ k, v, init, children }: { k: string; v: string; init: Record<string, string>; children: ReactNode }) {
  return <g data-k={k} data-v={v} style={{ opacity: (init[k] ?? '') === v ? 1 : 0 }}>{children}</g>
}

// ─── player ───────────────────────────────────────────────────────────────────

export default function FlowPlayer({ spec, className = '' }: { spec: FlowSpec; className?: string }) {
  const { t, i18n } = useTranslation()
  const reduce = useReducedMotion() ?? false
  const narrow = useIsNarrow()
  const L = narrow ? spec.layouts.narrow : spec.layouts.wide
  const steps = spec.steps
  const TOTAL = steps.length
  const initial = useMemo(() => spec.initial ?? {}, [spec.initial])

  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [segments, setSegments] = useState<number[]>(() => steps.map(() => 1))

  const svgRef = useRef<SVGSVGElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const seekRef = useRef<gsap.core.Tween | null>(null)
  const startsRef = useRef<number[]>([])
  const stepRef = useRef(0)
  const fillRefs = useRef<(HTMLSpanElement | null)[]>([])
  const barRef = useRef<HTMLDivElement>(null)
  const scrubRef = useRef<{ x: number; moved: boolean } | null>(null)

  const clampStep = (i: number) => Math.max(0, Math.min(TOTAL - 1, i))

  const packets = useMemo(() => steps.flatMap((s, i) =>
    s.fx.flatMap((f, j) => f.t === 'packet'
      ? [{ id: `s${i}-${j}`, edge: f.edge, label: f.label, kind: f.kind ?? spec.edgeKinds[f.edge] ?? 'access' }]
      : [])), [steps, spec.edgeKinds])

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
    const one = <T extends Element>(sel: string) => svg.querySelector<T>(sel)
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true, onUpdate: sync, onComplete: () => setPlaying(false) })
      const his = Array.from(svg.querySelectorAll<SVGPathElement>('[data-edge-hi]'))
      his.forEach(p => { const len = p.getTotalLength(); gsap.set(p, { strokeDasharray: len, strokeDashoffset: len, opacity: 0 }) })

      // Every tween is an explicit fromTo against state tracked here, so the
      // timeline renders identically however it is seeked.
      const IR = { immediateRender: false }
      const current: Record<string, string> = { ...initial }
      let prevFocus: Element[] = []
      let prevLit: Element[] = []
      const fade = (k: string, v: string, at: number, pop = false) => {
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
      steps.forEach((s, i) => {
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
          if (!path || !hi || !pkt) return
          const len = hi.getTotalLength()
          if (!lit.includes(hi)) lit.push(hi)
          tl.fromTo(hi, { opacity: 1, strokeDashoffset: f.reverse ? -len : len },
            { opacity: 1, strokeDashoffset: 0, duration: PKT, ease: 'power1.inOut', ...IR }, at)
          tl.fromTo(pkt, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.18, ...IR }, at)
          tl.to(pkt, { motionPath: { path, start: f.reverse ? 1 : 0, end: f.reverse ? 0 : 1 }, duration: PKT, ease: 'power1.inOut' }, at)
          // fade out before the pill reaches the card so it never covers card text
          tl.fromTo(pkt, { opacity: 1 }, { opacity: 0, duration: 0.18, ...IR }, at + PKT * 0.8)
        })
        prevLit = lit
        tl.addLabel(`s${i}_end`, t0 + s.end)
        cursor = t0 + s.end + holdFor(s.desc)
        tl.set({}, {}, cursor)
      })
      startsRef.current = starts
      tlRef.current = tl
      setSegments(starts.map((s, i) => (starts[i + 1] ?? cursor) - s))
      tl.seek(`s${Math.min(stepRef.current, steps.length - 1)}_end`)
      sync()
    }, svg)
    return () => { seekRef.current?.kill(); ctx.revert(); tlRef.current = null; setPlaying(false) }
  }, [L, steps, initial, reduce, sync])

  const go = useCallback((i: number) => {
    const tl = tlRef.current
    if (!tl) return
    const n = Math.max(0, Math.min(TOTAL - 1, i))
    seekRef.current?.kill()
    tl.pause()
    setPlaying(false)
    if (reduce) tl.seek(`s${n}_end`)
    else { tl.seek(`s${n}`); seekRef.current = tl.tweenTo(`s${n}_end`, { ease: 'none', onUpdate: sync }) }
    sync()
  }, [reduce, sync, TOTAL])

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
    }, holdFor(steps[step]?.desc ?? '') * 1000)
    return () => clearTimeout(id)
  }, [playing, reduce, step, steps, sync, TOTAL])

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
    go(clampStep(idx))
  }

  const btn = 'inline-flex h-11 w-11 items-center justify-center rounded-md border border-border text-text-2 transition-colors duration-200 ' +
    'hover:border-idira-blue hover:text-text disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:text-text-2'
  const ts = L.title ?? 15
  const cur = steps[step]
  const zonesUsed = ZONE_ORDER.filter(d => L.zones?.some(z => z.d === d))
  const kindsUsed = KIND_ORDER.filter(k => Object.values(spec.edgeKinds).includes(k) || packets.some(p => p.kind === k))
  const marker = `${spec.id}-arrow`

  return (
    <div className={`rounded-2xl border border-border bg-bg-card shadow-md overflow-hidden ${className}`} onKeyDown={onKeyDown}>
      {/* step header + transport */}
      <div className="border-b border-border px-4 sm:px-6 py-4 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[12rem]">
          <p className="text-xs font-mono text-text-muted mb-1 tabular-nums">{t('dual.step_of', { current: step + 1, total: TOTAL })}</p>
          <AnimatePresence mode="wait" initial={false}>
            <motion.h3 key={`${step}-${i18n.language}`}
              initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -4 }} transition={{ duration: 0.2, ease: 'easeOut' }}
              className="text-base sm:text-lg font-semibold text-text leading-snug">{cur?.title}</motion.h3>
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
          aria-valuemin={1} aria-valuemax={TOTAL} aria-valuenow={step + 1} aria-valuetext={cur?.title}
          onPointerDown={onScrubDown} onPointerMove={onScrubMove} onPointerUp={onScrubUp} onPointerCancel={() => { scrubRef.current = null }}
          className="flex gap-1 py-2.5 cursor-pointer touch-none select-none rounded-md">
          {segments.map((d, i) => (
            <span key={i} style={{ flexGrow: d, flexBasis: 0 }} className="relative h-1.5 rounded-full overflow-hidden bg-line">
              <span ref={el => { fillRefs.current[i] = el }} style={{ transform: 'scaleX(0)' }}
                className={`absolute inset-0 origin-left rounded-full ${i === step ? 'bg-idira-blue' : 'bg-idira-blue/50'}`} />
            </span>
          ))}
        </div>
      </div>

      {/* diagram */}
      <div className="px-3 sm:px-6 pt-2 pb-2">
        <svg ref={svgRef} viewBox={`0 0 ${L.w} ${L.h}`} className="w-full h-auto" role="img"
          aria-label={`${spec.ariaLabel}. ${cur?.title ?? ''}`}>
          <defs>
            <marker id={marker} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M 0 0.8 L 7 4 L 0 7.2 z" className="fill-text-muted/60" />
            </marker>
          </defs>

          {L.zones?.map((z, i) => (
            <rect key={i} x={z.x} y={z.y} width={z.w} height={z.h} rx={18} strokeWidth={1.25} strokeDasharray="5 4"
              className={DOM[z.d].zone} aria-hidden="true" />
          ))}
          {L.lanes?.map((ln, i) => (
            <text key={i} x={ln.x} y={ln.y} fontSize={11} letterSpacing="0.06em" strokeWidth={6} strokeLinejoin="round"
              style={{ paintOrder: 'stroke' }} className="fill-text-2 stroke-surface font-sans font-semibold uppercase">{ln.text}</text>
          ))}

          {Object.keys(spec.edgeKinds).filter(id => L.edges[id]).map(id => (
            <path key={id} data-edge={id} d={L.edges[id]} fill="none" strokeWidth={1.5}
              strokeDasharray={KIND[spec.edgeKinds[id]].dash} className="stroke-text-muted/40" markerEnd={`url(#${marker})`} />
          ))}
          {Object.keys(spec.edgeKinds).filter(id => L.edges[id]).map(id => (
            <path key={id} data-edge-hi={id} d={L.edges[id]} fill="none" strokeWidth={2.5} strokeLinecap="round"
              style={{ opacity: 0 }} className={KIND[spec.edgeKinds[id]].stroke} />
          ))}

          {L.labels?.map((lb, i) => {
            const w = Math.round(lb.text.length * 6.3 + 14)
            return (
              <g key={`lbl-${i}`} data-label="" aria-hidden="true">
                <rect x={lb.x - w / 2} y={lb.y - 9} width={w} height={18} rx={9} strokeWidth={1} className="fill-surface stroke-line" />
                <text x={lb.x} y={lb.y + 3.6} fontSize={10.5} textAnchor="middle" className="fill-text-2 font-mono">{lb.text}</text>
              </g>
            )
          })}

          {spec.nodes.filter(n => L.boxes[n.id]).map(n => {
            const b = L.boxes[n.id]
            const d = DOM[n.domain]
            const cx = b.x + b.w - 24, cy = b.y - 2
            return (
              <g key={n.id}>
                <rect data-ring={n.id} x={b.x - 5} y={b.y - 5} width={b.w + 10} height={b.h + 10} rx={16}
                  className="fill-none stroke-text-2/60" strokeWidth={2} style={{ opacity: 0 }} />
                <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={12} className="fill-bg-muted stroke-line" strokeWidth={1.25} />
                {d.stripe && <rect x={b.x + 14} y={b.y - 1.5} width={b.w - 58} height={3} rx={1.5} className={d.stripe} aria-hidden="true" />}
                <g aria-hidden="true">
                  <circle cx={cx} cy={cy} r={12} className={`fill-surface ${d.chip}`} strokeWidth={1.5} />
                  <n.Icon x={cx - 7.5} y={cy - 7.5} width={15} height={15} strokeWidth={1.9} className={d.icon} />
                </g>
                <text x={b.x + 14} y={b.y + 25} fontSize={ts} className="fill-text font-sans font-semibold">{n.title}</text>
                {n.sub && <text x={b.x + 14} y={b.y + 43} fontSize={11} className="fill-text-muted font-sans">{n.sub}</text>}
                {n.rows?.map((r, ri) => {
                  const y = b.y + (n.sub ? 70 : 56) + ri * 20
                  return (
                    <g key={ri}>
                      <text x={b.x + 14} y={y} fontSize={11.5} className="fill-text-2 font-mono">{r.label}</text>
                      {'value' in r
                        ? <text x={b.x + b.w - 14} y={y} fontSize={11.5} textAnchor="end" className={`font-sans font-semibold ${TONE[r.tone ?? 'muted']}`}>{r.value}</text>
                        : r.states.map(s => (
                            <Swap key={s.v} k={r.k} v={s.v} init={initial}>
                              <text x={b.x + b.w - 14} y={y} fontSize={11.5} textAnchor="end" className={`font-sans font-semibold ${TONE[s.tone]}`}>{s.text}</text>
                            </Swap>
                          ))}
                    </g>
                  )
                })}
              </g>
            )
          })}

          {packets.map(p => {
            const k = KIND[p.kind]
            const w = Math.round(p.label.length * 7 + 40)
            return (
              <g key={p.id} data-pkt={p.id} style={{ opacity: 0 }} aria-hidden="true">
                <rect x={-w / 2} y={-12} width={w} height={24} rx={12} className="fill-surface" />
                <rect x={-w / 2} y={-12} width={w} height={24} rx={12} strokeWidth={1.25} className={`${k.fill} ${k.stroke}`} />
                <k.Icon x={-w / 2 + 9} y={-7} width={14} height={14} strokeWidth={2} className={k.tw} />
                <text x={-w / 2 + 28} y={4} fontSize={11.5} className={`font-mono font-semibold ${k.text}`}>{p.label}</text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* legend: zones (ownership) + flows (icon + label + colour) */}
      <div className="px-4 sm:px-6 pb-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-text-2">
        {zonesUsed.length > 0 && <>
          <span className="font-semibold uppercase tracking-wider text-text-muted">{t('idflow.legend_zones')}</span>
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {zonesUsed.map(z => (
              <li key={z} className="inline-flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-sm ${DOM[z].swatch}`} aria-hidden="true" />{t(`player.zone_${z}`)}
              </li>
            ))}
          </ul>
          <span className="hidden sm:block h-4 w-px bg-border" aria-hidden="true" />
        </>}
        <span className="font-semibold uppercase tracking-wider text-text-muted">{t('idflow.legend_flows')}</span>
        <ul className="flex flex-wrap gap-x-4 gap-y-2">
          {kindsUsed.map(k => {
            const Icon = KIND[k].Icon
            return (
              <li key={k} className="inline-flex items-center gap-1.5">
                <Icon size={14} strokeWidth={2} className={KIND[k].tw} aria-hidden="true" />{t(`player.kind_${k}`)}
              </li>
            )
          })}
        </ul>
      </div>

      {/* narration */}
      <div className="border-t border-border px-4 sm:px-6 py-5 min-h-[7.5rem]" aria-live="polite" aria-atomic="true">
        <span className="sr-only">{t('dual.step_of', { current: step + 1, total: TOTAL })}: {cur?.title}. </span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.p key={`${step}-${i18n.language}`}
            initial={reduce ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="text-base text-text-2 leading-relaxed max-w-[75ch] [overflow-wrap:anywhere]">
            {cur?.desc}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}
