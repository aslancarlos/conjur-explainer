import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useReducedMotion } from 'framer-motion'
import { ChevronRight, Pause, Play } from 'lucide-react'

/**
 * CommandCenterFlow — hero centrepiece in the IDIRA "Command Center" style.
 * Seven workloads → their auth method → IDIRA (authn-jwt / authn-iam feed
 * policy · vault · CPM rotation · Dual Accounts) → the database they populate.
 *
 * One journey at a time (DESIGN.md §9, "motion explains cause → effect"): the
 * active workload's full path lights up while a token travels it; after all
 * workloads, a rotation token shows CPM changing the DB credential in place.
 * Pausable (WCAG 2.2.2), pauses on hover/focus, off-screen and hidden tabs,
 * static under prefers-reduced-motion. Workloads link to their demo page.
 * Lives inside the always-dark hero band, so colours are brand constants.
 */

const IDIRA_BLUE = '#265bff'
const CYAN = '#4ad1f0'
const PERI = '#7c8cff'
const ORANGE = '#fa582d'
const LILAC = '#a9b6ff'
const LABEL = '#dbe4f4'
const MUTED = '#8ea0c4'

const IL = 766          // IDIRA authenticators column
const IR = 892          // policy / vault / rotation column
const HDR = (IL + IR) / 2
const POLICY_Y = 224
const VAULT_Y = 312
const CPM_Y = 400
const DUAL_Y = 488
const BOX_TOP = POLICY_Y - 40
const BOX_BOTTOM = DUAL_Y + 40
const AUTHN_JWT_Y = (BOX_TOP + BOX_BOTTOM) / 2 - 44
const AUTHN_IAM_Y = (BOX_TOP + BOX_BOTTOM) / 2 + 44
const TX = 1082
const DB_Y = 312

type Method = 'oidc' | 'jwt' | 'sidecar' | 'iam'
interface WL { key: string; name: string; color: string; y: number; method: Method; to: string }
const WX = 300
// ordered top→bottom grouped by auth method so links never cross
const WORKLOADS: WL[] = [
  { key: 'gha',     name: 'GitHub Actions', color: '#007bff', y: 100, method: 'oidc',    to: '/github-actions' },
  { key: 'spring',  name: 'Spring Boot',    color: '#4ad1f0', y: 168, method: 'jwt',     to: '/spring-boot' },
  { key: 'eso',     name: 'ESO Shop',       color: '#3d9bff', y: 236, method: 'jwt',     to: '/eso-shop' },
  { key: 'jenkins', name: 'Jenkins',        color: '#00c0e8', y: 304, method: 'jwt',     to: '/jenkins' },
  { key: 'csi',     name: 'CSI Driver',     color: '#265bff', y: 372, method: 'jwt',     to: '/csi' },
  { key: 'dotnet',  name: '.NET',           color: '#7c8cff', y: 440, method: 'sidecar', to: '/dotnet' },
  { key: 'ansible', name: 'Ansible',        color: '#fa582d', y: 508, method: 'iam',     to: '/ansible' },
]

const MX = 570
const METHODS: Record<Method, { label: string; y: number; color: string; entry: number; authn: 'jwt' | 'iam' }> = {
  oidc:    { label: 'OIDC',    y: 130, color: '#007bff', entry: AUTHN_JWT_Y, authn: 'jwt' },
  jwt:     { label: 'JWT',     y: 250, color: CYAN,      entry: AUTHN_JWT_Y, authn: 'jwt' },
  sidecar: { label: 'Sidecar', y: 420, color: PERI,      entry: AUTHN_JWT_Y, authn: 'jwt' },
  iam:     { label: 'IAM',     y: 500, color: ORANGE,    entry: AUTHN_IAM_Y, authn: 'iam' },
}

const TRAVEL_MS = 2400
const HOLD_MS = 700
const ROTATE_MS = 1600

function seg(x1: number, y1: number, x2: number, y2: number) {
  if (x1 === x2) return `L ${x2} ${y2}`
  const dx = (x2 - x1) * 0.5
  return `C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
}
function curve(x1: number, y1: number, x2: number, y2: number) {
  return `M ${x1} ${y1} ${seg(x1, y1, x2, y2)}`
}
function chain(pts: Array<[number, number]>) {
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 1; i < pts.length; i++) d += ' ' + seg(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1])
  return d
}
// full path a secret travels: workload → method → authenticator → policy → vault → DB
function journey(w: WL): Array<[number, number]> {
  const m = METHODS[w.method]
  return [[WX + 12, w.y], [MX, m.y], [IL, m.entry], [IR, POLICY_Y], [IR, VAULT_Y], [TX - 20, DB_Y]]
}
const ROTATION_D = curve(IR + 16, CPM_Y, TX - 24, DB_Y + 8)
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)

function RingNode({ x, y, color, r = 13, glyph, on = true }: {
  x: number; y: number; color: string; r?: number; glyph?: 'lock' | 'dot'; on?: boolean
}) {
  const s = r / 13
  return (
    <g style={{ opacity: on ? 1 : 0.45, transition: 'opacity 300ms ease' }}>
      <circle cx={x} cy={y} r={r + 12} fill={color} opacity={on ? 0.16 : 0.08} />
      <circle cx={x} cy={y} r={r} fill="#0f1b3a" stroke={color} strokeWidth={on ? 2 : 1.5} />
      {glyph === 'lock' ? (
        <g stroke={color} strokeWidth={1.5} fill="none">
          <rect x={x - 4.5} y={y - 1} width={9} height={7.5} rx={1.4} fill={color} fillOpacity={0.9} stroke="none" />
          <path d={`M ${x - 3} ${y - 1} v -2.2 a 3 3 0 0 1 6 0 v 2.2`} />
        </g>
      ) : (
        <circle cx={x} cy={y} r={4 * s} fill={color} />
      )}
    </g>
  )
}

export default function CommandCenterFlow() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const reduce = useReducedMotion() ?? false

  const [active, setActive] = useState(0)
  const [rotating, setRotating] = useState(false)
  const [userPaused, setUserPaused] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [visible, setVisible] = useState(true)

  const rootRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const rotPathRef = useRef<SVGPathElement>(null)
  const tokenRef = useRef<SVGCircleElement>(null)
  const rotTokenRef = useRef<SVGCircleElement>(null)

  const paused = reduce || userPaused || hovering || !visible
  const w = WORKLOADS[active]
  const m = METHODS[w.method]

  // Off-screen / hidden tab → pause (no wasted frames, nothing moving unseen).
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    let inView = true
    const update = () => setVisible(inView && document.visibilityState === 'visible')
    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; update() }, { threshold: 0.15 })
    io.observe(el)
    document.addEventListener('visibilitychange', update)
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', update) }
  }, [])

  // Journey loop: token travels the active path, then advances; after the last
  // workload a rotation token runs CPM → Databases, then the cycle restarts.
  useEffect(() => {
    const token = tokenRef.current, rot = rotTokenRef.current
    if (paused) {
      if (token) token.style.opacity = '0'
      if (rot) rot.style.opacity = '0'
      return
    }
    const path = (rotating ? rotPathRef : pathRef).current
    const dot = rotating ? rot : token
    if (!path || !dot) return
    const dur = rotating ? ROTATE_MS : TRAVEL_MS
    let raf = 0, timer = 0
    const advance = () => {
      if (rotating) { setRotating(false); setActive(0) }
      else if (active === WORKLOADS.length - 1) setRotating(true)
      else setActive(a => a + 1)
    }
    // Diagram hidden (narrow layout): keep the caption cycling on a timer.
    const svgWidth = svgRef.current?.getBoundingClientRect().width ?? 0
    if (svgWidth === 0) {
      timer = window.setTimeout(advance, dur + HOLD_MS)
      return () => clearTimeout(timer)
    }
    const len = path.getTotalLength()
    const t0 = performance.now()
    const frame = (now: number) => {
      const p = Math.min(1, (now - t0) / dur)
      const pt = path.getPointAtLength(easeInOut(p) * len)
      dot.setAttribute('cx', String(pt.x))
      dot.setAttribute('cy', String(pt.y))
      dot.style.opacity = p < 0.06 ? String(p / 0.06) : p > 0.92 ? String((1 - p) / 0.08) : '1'
      if (p < 1) { raf = requestAnimationFrame(frame); return }
      dot.style.opacity = '0'
      timer = window.setTimeout(advance, HOLD_MS)
    }
    raf = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(raf); clearTimeout(timer) }
  }, [active, rotating, paused])

  const select = useCallback((i: number) => { setRotating(false); setActive(i) }, [])

  const open = (e: ReactMouseEvent, to: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    navigate(to)
  }
  const onNodeKey = (e: ReactKeyboardEvent, to: string) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(to) }
  }

  // Which links / nodes belong to the active journey.
  const lit = useMemo(() => new Set([
    `wl-${w.key}`, `m-${w.method}`, `a-${m.authn}`, 's-pv', 'v-db',
  ]), [w, m])
  const on = (id: string) => rotating ? id === 'rot' : lit.has(id)
  const linkOpacity = (id: string, base: number) => (on(id) ? Math.min(1, base + 0.45) : base * 0.35)

  const steps = rotating
    ? ['CPM rotation', 'Databases']
    : [w.name, m.label, `authn-${m.authn}`, 'policy', 'vault', 'Databases']

  return (
    <div ref={rootRef}>
      {/* Controls */}
      <div className="flex justify-end px-1 pb-3">
        {!reduce && (
          <button type="button" onClick={() => setUserPaused(p => !p)}
            aria-pressed={userPaused}
            aria-label={userPaused ? t('ccflow.play') : t('ccflow.pause')}
            className="inline-flex h-11 items-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 text-sm font-medium
              text-slate-200 hover:bg-white/10 hover:border-white/30 transition-colors">
            {userPaused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
            {userPaused ? t('ccflow.play') : t('ccflow.pause')}
          </button>
        )}
      </div>

      {/* Desktop / tablet diagram */}
      <div className="hidden sm:block" onMouseLeave={() => setHovering(false)}>
        <svg ref={svgRef} viewBox="160 0 1130 600" className="w-full h-auto select-none" role="group"
          aria-label={t('constellation.aria')} style={{ fontFamily: 'Onest, system-ui, sans-serif' }}
          onFocus={() => setHovering(true)} onBlur={() => setHovering(false)}>
          {/* Column headers */}
          {[
            [WX, t('ccflow.col_workloads')],
            [MX, t('ccflow.col_auth')],
            [HDR, 'IDIRA'],
            [TX, t('ccflow.col_delivery')],
          ].map(([x, label]) => (
            <text key={String(label)} x={x as number} y={40} textAnchor="middle" fontSize={13} fontWeight={700}
              fill={MUTED} style={{ fontFamily: 'IBM Plex Mono, ui-monospace, monospace', letterSpacing: '0.14em' }}>
              {String(label).toUpperCase()}
            </text>
          ))}

          {/* Links: workload → method */}
          {WORKLOADS.map(x => (
            <path key={`wl-${x.key}`} d={curve(WX + 14, x.y, MX - 14, METHODS[x.method].y)} fill="none"
              stroke={x.color} strokeOpacity={linkOpacity(`wl-${x.key}`, 0.4)} strokeWidth={on(`wl-${x.key}`) ? 2.2 : 1.4}
              style={{ transition: 'stroke-opacity 300ms ease' }} />
          ))}
          {/* Links: method → authenticator */}
          {(Object.entries(METHODS) as Array<[Method, typeof METHODS[Method]]>).map(([k, x]) => (
            <path key={`m-${k}`} d={curve(MX + 14, x.y, IL - 16, x.entry)} fill="none"
              stroke={x.color} strokeOpacity={linkOpacity(`m-${k}`, 0.5)} strokeWidth={on(`m-${k}`) ? 2.8 : 2}
              style={{ transition: 'stroke-opacity 300ms ease' }} />
          ))}
          {/* authenticators → policy */}
          <path d={curve(IL + 16, AUTHN_JWT_Y, IR - 16, POLICY_Y)} fill="none" stroke={CYAN}
            strokeOpacity={linkOpacity('a-jwt', 0.5)} strokeWidth={2} style={{ transition: 'stroke-opacity 300ms ease' }} />
          <path d={curve(IL + 16, AUTHN_IAM_Y, IR - 16, POLICY_Y)} fill="none" stroke={ORANGE}
            strokeOpacity={linkOpacity('a-iam', 0.5)} strokeWidth={2} style={{ transition: 'stroke-opacity 300ms ease' }} />
          {/* spine: policy → vault → CPM → Dual Accounts */}
          <line x1={IR} y1={POLICY_Y + 13} x2={IR} y2={VAULT_Y - 13} stroke={IDIRA_BLUE}
            strokeOpacity={linkOpacity('s-pv', 0.5)} strokeWidth={2} style={{ transition: 'stroke-opacity 300ms ease' }} />
          <line x1={IR} y1={VAULT_Y + 13} x2={IR} y2={CPM_Y - 13} stroke={ORANGE} strokeOpacity={0.45} strokeWidth={2} strokeDasharray="4 4" />
          <line x1={IR} y1={CPM_Y + 13} x2={IR} y2={DUAL_Y - 13} stroke={LILAC} strokeOpacity={0.45} strokeWidth={2} strokeDasharray="4 4" />
          {/* vault → Databases, CPM rotation → Databases */}
          <path d={curve(IR + 16, VAULT_Y, TX - 24, DB_Y)} fill="none" stroke={IDIRA_BLUE}
            strokeOpacity={linkOpacity('v-db', 0.55)} strokeWidth={2.6} style={{ transition: 'stroke-opacity 300ms ease' }} />
          <path ref={rotPathRef} d={ROTATION_D} fill="none" stroke={ORANGE}
            strokeOpacity={on('rot') ? 0.95 : 0.4} strokeWidth={on('rot') ? 2.6 : 2} strokeDasharray="5 5"
            style={{ transition: 'stroke-opacity 300ms ease' }} />

          {/* IDIRA container */}
          <rect x={IL - 44} y={BOX_TOP} width={(IR - IL) + 88} height={BOX_BOTTOM - BOX_TOP} rx={16}
            fill={IDIRA_BLUE} fillOpacity={0.05} stroke={IDIRA_BLUE} strokeOpacity={0.3} />

          {/* invisible path the active token follows */}
          <path ref={pathRef} d={chain(journey(w))} fill="none" stroke="none" />

          {/* Workload nodes — links to each demo */}
          {WORKLOADS.map((x, i) => {
            const act = !rotating && i === active
            return (
              <a key={`node-${x.key}`} href={x.to} onClick={e => open(e, x.to)} onKeyDown={e => onNodeKey(e, x.to)}
                aria-label={t('ccflow.open', { name: x.name })}
                onMouseEnter={() => { setHovering(true); select(i) }} onFocus={() => select(i)}
                className="cursor-pointer outline-none [&:focus-visible>rect]:opacity-100">
                <rect x={WX - 150} y={x.y - 20} width={176} height={40} rx={10} fill="transparent"
                  stroke="#2589ff" strokeWidth={2} opacity={0} />
                <RingNode x={WX} y={x.y} color={x.color} r={12} on={act || rotating} />
                <text x={WX - 24} y={x.y + 5} textAnchor="end" fontSize={14} fontWeight={act ? 700 : 600}
                  fill={LABEL} style={{ opacity: act ? 1 : 0.62, transition: 'opacity 300ms ease' }}>{x.name}</text>
              </a>
            )
          })}

          {/* Method nodes */}
          {(Object.entries(METHODS) as Array<[Method, typeof METHODS[Method]]>).map(([k, x]) => (
            <g key={`mn-${k}`}>
              <RingNode x={MX} y={x.y} color={x.color} r={13} on={!rotating && k === w.method} />
              <text x={MX + 22} y={x.y + 5} fontSize={14} fontWeight={600} fill={LABEL}
                style={{ opacity: !rotating && k === w.method ? 1 : 0.62, transition: 'opacity 300ms ease' }}>{x.label}</text>
            </g>
          ))}

          {/* IDIRA authenticators */}
          {([
            { y: AUTHN_JWT_Y, label: 'authn-jwt', c: CYAN, k: 'jwt' },
            { y: AUTHN_IAM_Y, label: 'authn-iam', c: ORANGE, k: 'iam' },
          ] as const).map(n => (
            <g key={n.label}>
              <RingNode x={IL} y={n.y} color={n.c} r={13} glyph="lock" on={!rotating && m.authn === n.k} />
              <text x={IL} y={n.y - 22} textAnchor="middle" fontSize={12} fontWeight={700} fill={LABEL}
                style={{ fontFamily: 'IBM Plex Mono, ui-monospace, monospace' }}>{n.label}</text>
            </g>
          ))}

          {/* policy / vault / rotation / dual */}
          {([
            { y: POLICY_Y, label: 'policy', c: PERI, glyph: 'lock', lit: !rotating },
            { y: VAULT_Y, label: 'vault', c: IDIRA_BLUE, glyph: 'lock', lit: !rotating },
            { y: CPM_Y, label: 'CPM rotation', c: ORANGE, glyph: 'dot', lit: rotating },
            { y: DUAL_Y, label: 'Dual Accounts', c: LILAC, glyph: 'dot', lit: rotating },
          ] as const).map(n => (
            <g key={n.label}>
              <RingNode x={IR} y={n.y} color={n.c} r={13} glyph={n.glyph} on={n.lit} />
              <text x={IR} y={n.y - 22} textAnchor="middle" fontSize={12} fontWeight={700} fill={LABEL}
                style={{ fontFamily: 'IBM Plex Mono, ui-monospace, monospace' }}>{n.label}</text>
            </g>
          ))}
          {/* static rotation marker (no infinite spin) */}
          <circle cx={IR} cy={CPM_Y} r={20} fill="none" stroke={ORANGE} strokeOpacity={rotating ? 0.8 : 0.4}
            strokeWidth={1.5} strokeDasharray="3 7" />

          {/* Databases */}
          <RingNode x={TX} y={DB_Y} color={IDIRA_BLUE} r={22} />
          <text x={TX + 34} y={DB_Y - 2} fontSize={17} fontWeight={700} fill="#ffffff">Databases</text>
          <text x={TX + 34} y={DB_Y + 17} fontSize={12} fill={MUTED}
            style={{ fontFamily: 'IBM Plex Mono, ui-monospace, monospace' }}>{t('ccflow.injected')}</text>

          {/* tokens */}
          <circle ref={tokenRef} r={5} fill={w.color} style={{ opacity: 0, filter: `drop-shadow(0 0 6px ${w.color})` }} />
          <circle ref={rotTokenRef} r={4.5} fill={ORANGE} style={{ opacity: 0, filter: `drop-shadow(0 0 6px ${ORANGE})` }} />
        </svg>
      </div>

      {/* Mobile: workload chips + vertical journey (no sideways scrolling) */}
      <div className="sm:hidden">
        <div className="flex flex-wrap gap-2" role="group" aria-label={t('ccflow.col_workloads')}>
          {WORKLOADS.map((x, i) => (
            <button key={x.key} type="button" onClick={() => { select(i); setUserPaused(true) }}
              aria-pressed={!rotating && i === active}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3 text-sm transition-colors ${
                !rotating && i === active ? 'border-white/40 bg-white/10 text-white font-semibold' : 'border-white/15 text-slate-300'}`}>
              <span className="h-2 w-2 rounded-full" style={{ background: x.color }} aria-hidden="true" />
              {x.name}
            </button>
          ))}
        </div>
      </div>

      {/* Journey caption (all sizes) */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-2 font-mono text-xs sm:text-sm" aria-label={t('ccflow.path')}>
          {steps.map((s, i) => (
            <li key={s + i} className="inline-flex items-center gap-1.5">
              <span className={`rounded-md border px-2 py-1 ${
                i === 0 ? 'border-white/30 bg-white/10 text-white' : 'border-white/10 text-slate-300'}`}>{s}</span>
              {i < steps.length - 1 && <ChevronRight size={14} className="text-slate-500" aria-hidden="true" />}
            </li>
          ))}
        </ol>
        {rotating && <p className="text-xs text-slate-400">{t('ccflow.rotation')}</p>}
      </div>
      <p className="mt-1 hidden sm:block text-xs text-slate-500">{t('ccflow.hint')}</p>
    </div>
  )
}
