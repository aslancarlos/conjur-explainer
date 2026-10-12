import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import type { BenchPonto } from '../../lib/benchApi'

/**
 * Live chart of the benchmark series (GET /api/bench/serie), plain SVG (no
 * chart library in the bundle). Two panels on the same time axis, never a dual
 * axis: calls per second (target, sent, success, errors) and p95 latency in ms.
 * Hover or arrow keys move a crosshair with the exact values; a table view
 * sits behind a disclosure. Lines break when the client was silent for more
 * than 10 s or a new run (geracao) started.
 */

const WINDOW_MS = 10 * 60_000
const GAP_MS = 10_000
const PAD = { l: 52, r: 16, t: 10, b: 24 }

type Key = 'rps_alvo' | 'rps' | 'ok_ps' | 'erros_ps' | 'p95_ms'
interface Serie { key: Key; cls: string; dash?: string; width: number }

// Colours validated with the dataviz checks (light): accent, success, danger pass
// CVD and normal-vision separation; errors are also dotted, the target dashed.
const RPS_SERIES: Serie[] = [
  { key: 'rps_alvo', cls: 'stroke-text-muted', dash: '6 4', width: 1.5 },
  { key: 'rps', cls: 'stroke-tone-accent', width: 2 },
  { key: 'ok_ps', cls: 'stroke-tone-success', width: 2 },
  { key: 'erros_ps', cls: 'stroke-tone-danger', dash: '1 4', width: 2.5 },
]
const LAT_SERIES: Serie[] = [{ key: 'p95_ms', cls: 'stroke-tone-live', width: 2 }]

function niceMax(v: number): number {
  if (!(v > 0)) return 1
  const raw = v / 4
  const pow = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map(m => m * pow).find(s => s >= raw) ?? raw
  return step * 4
}

interface P extends BenchPonto { ms: number }

function segments(points: P[]): P[][] {
  const out: P[][] = []
  let cur: P[] = []
  for (const p of points) {
    const prev = cur[cur.length - 1]
    if (prev && (p.ms - prev.ms > GAP_MS || p.geracao !== prev.geracao)) { out.push(cur); cur = [] }
    cur.push(p)
  }
  if (cur.length) out.push(cur)
  return out
}

function Panel({ points, segs, series, width, height, start, yMax, ticksX, fmtTime, fmtY, hover, label }: {
  points: P[]; segs: P[][]; series: Serie[]; width: number; height: number; start: number; yMax: number
  ticksX: number[]; fmtTime: (ms: number) => string; fmtY: (v: number) => string; hover: number | null; label: string
}) {
  const iw = Math.max(10, width - PAD.l - PAD.r)
  const ih = height - PAD.t - PAD.b
  const x = (ms: number) => PAD.l + ((ms - start) / WINDOW_MS) * iw
  const y = (v: number) => PAD.t + ih - (Math.max(0, v) / yMax) * ih
  const hp = hover !== null ? points[hover] : null
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block overflow-visible" aria-hidden="true">
      <title>{label}</title>
      {[0, 0.25, 0.5, 0.75, 1].map(f => (
        <g key={f}>
          <line x1={PAD.l} x2={PAD.l + iw} y1={y(yMax * f)} y2={y(yMax * f)} className={f === 0 ? 'stroke-text-muted/60' : 'stroke-border'} strokeWidth={1} />
          {(f === 0 || f === 0.5 || f === 1) && (
            <text x={PAD.l - 8} y={y(yMax * f)} dy="0.32em" textAnchor="end" className="fill-text-muted font-mono text-xs tabular-nums">{fmtY(yMax * f)}</text>
          )}
        </g>
      ))}
      {ticksX.map(ms => (
        <text key={ms} x={x(ms)} y={height - 6} textAnchor="middle" className="fill-text-muted font-mono text-xs tabular-nums">{fmtTime(ms)}</text>
      ))}
      {series.map(s => segs.map((seg, i) => {
        if (seg.length === 1) {
          const p = seg[0]
          return <circle key={`${s.key}-${i}`} cx={x(p.ms)} cy={y(p[s.key])} r={2} className={s.cls.replace('stroke-', 'fill-')} />
        }
        const d = seg.map((p, j) => `${j ? 'L' : 'M'}${x(p.ms).toFixed(1)},${y(p[s.key]).toFixed(1)}`).join('')
        return <path key={`${s.key}-${i}`} d={d} fill="none" className={s.cls} strokeWidth={s.width} strokeDasharray={s.dash} strokeLinejoin="round" strokeLinecap="round" />
      }))}
      {hp && (
        <g>
          <line x1={x(hp.ms)} x2={x(hp.ms)} y1={PAD.t} y2={PAD.t + ih} className="stroke-text-2/60" strokeWidth={1} />
          {series.map(s => (
            <circle key={s.key} cx={x(hp.ms)} cy={y(hp[s.key])} r={4} strokeWidth={2} className={`${s.cls} fill-bg-card`} />
          ))}
        </g>
      )}
    </svg>
  )
}

export default function BenchChart({ pontos, endMs }: { pontos: BenchPonto[]; endMs: number }) {
  const { t, i18n } = useTranslation()
  const v = (k: string, o?: Record<string, unknown>) => t(`esobench.${k}`, o) as string
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(800)
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const start = endMs - WINDOW_MS
  const points = useMemo<P[]>(() => pontos
    .map(p => ({ ...p, ms: Date.parse(p.t) }))
    .filter(p => Number.isFinite(p.ms) && p.ms >= start && p.ms <= endMs + 5000)
    .sort((a, b) => a.ms - b.ms), [pontos, start, endMs])
  const segs = useMemo(() => segments(points), [points])

  const nf = useMemo(() => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 }), [i18n.language])
  const tf = useMemo(() => new Intl.DateTimeFormat(i18n.language, { hour: '2-digit', minute: '2-digit' }), [i18n.language])
  const tfs = useMemo(() => new Intl.DateTimeFormat(i18n.language, { hour: '2-digit', minute: '2-digit', second: '2-digit' }), [i18n.language])

  const rpsMax = niceMax(Math.max(1, ...points.flatMap(p => [p.rps_alvo, p.rps, p.ok_ps, p.erros_ps])) * 1.05)
  const latMax = niceMax(Math.max(10, ...points.map(p => p.p95_ms)) * 1.05)
  const ticksX = useMemo(() => {
    const step = 2 * 60_000
    const first = Math.ceil(start / step) * step
    const out: number[] = []
    for (let ms = first; ms <= endMs; ms += step) out.push(ms)
    return out
  }, [start, endMs])

  const [hover, setHover] = useState<number | null>(null)
  useEffect(() => { if (hover !== null && hover >= points.length) setHover(points.length ? points.length - 1 : null) }, [points.length, hover])

  const iw = Math.max(10, width - PAD.l - PAD.r)
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!points.length) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ms = start + ((e.clientX - rect.left - PAD.l) / iw) * WINDOW_MS
    let best = 0
    for (let i = 1; i < points.length; i++) if (Math.abs(points[i].ms - ms) < Math.abs(points[best].ms - ms)) best = i
    setHover(best)
  }
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!points.length) return
    const last = points.length - 1
    const cur = hover ?? last
    const next = e.key === 'ArrowLeft' ? Math.max(0, cur - 1) : e.key === 'ArrowRight' ? Math.min(last, cur + 1)
      : e.key === 'Home' ? 0 : e.key === 'End' ? last : e.key === 'Escape' ? null : undefined
    if (next === undefined) return
    e.preventDefault()
    setHover(next)
  }

  const hp = hover !== null ? points[hover] : null
  const hx = hp ? PAD.l + ((hp.ms - start) / WINDOW_MS) * iw : 0
  const legend: Array<{ key: Key; label: string; s: Serie }> = [
    ...RPS_SERIES.map(s => ({ key: s.key, label: v(`chart_${s.key}`), s })),
  ]
  const last = points[points.length - 1]
  const summary = last
    ? v('chart_summary', { rps: nf.format(last.rps), alvo: nf.format(last.rps_alvo), erros: nf.format(last.erros_ps), p95: nf.format(last.p95_ms) })
    : v('chart_empty')

  return (
    <div className="space-y-3">
      <ul className="flex flex-wrap gap-x-5 gap-y-2" aria-label={v('chart_legend')}>
        {legend.map(({ key, label, s }) => (
          <li key={key} className="inline-flex items-center gap-2 text-xs font-medium text-text-2">
            <svg width="28" height="10" aria-hidden="true"><line x1="2" x2="26" y1="5" y2="5" className={s.cls} strokeWidth={s.width} strokeDasharray={s.dash} strokeLinecap="round" /></svg>
            {label}
          </li>
        ))}
      </ul>
      <p className="sr-only" aria-live="polite">{summary}</p>
      <div
        ref={wrapRef}
        className="relative rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue"
        tabIndex={points.length ? 0 : -1}
        role="group"
        aria-label={`${v('chart_title')}. ${summary}. ${v('chart_keys')}`}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        onKeyDown={onKey}
        onBlur={() => setHover(null)}
      >
        <p className="mb-1 text-xs font-semibold text-text-2">{v('chart_rps_axis')}</p>
        <Panel points={points} segs={segs} series={RPS_SERIES} width={width} height={210} start={start} yMax={rpsMax}
          ticksX={ticksX} fmtTime={ms => tf.format(ms)} fmtY={n => nf.format(n)} hover={hover} label={v('chart_rps_axis')} />
        <p className="mb-1 mt-4 text-xs font-semibold text-text-2">{v('chart_p95_axis')}</p>
        <Panel points={points} segs={segs} series={LAT_SERIES} width={width} height={120} start={start} yMax={latMax}
          ticksX={ticksX} fmtTime={ms => tf.format(ms)} fmtY={n => nf.format(n)} hover={hover} label={v('chart_p95_axis')} />
        {!points.length && (
          <p className="absolute inset-x-0 top-16 mx-auto max-w-sm rounded-lg border border-border bg-bg-card px-4 py-3 text-center text-sm text-text-2">{v('chart_empty')}</p>
        )}
        {hp && (
          <div
            className="pointer-events-none absolute top-6 z-raised w-60 rounded-xl border border-border bg-bg-card p-3 text-xs shadow-raised"
            style={{ left: hx > width - 264 ? Math.max(0, hx - 252) : hx + 12 }}
          >
            <p className="mb-1.5 font-mono font-semibold text-text">{tfs.format(hp.ms)}</p>
            <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5">
              {(['rps_alvo', 'rps', 'ok_ps', 'erros_ps'] as const).map(k => (
                <div key={k} className="contents"><dt className="text-text-2">{v(`chart_${k}`)}</dt><dd className="text-right font-mono tabular-nums text-text">{nf.format(hp[k])}</dd></div>
              ))}
              <div className="contents"><dt className="whitespace-nowrap text-text-2">p50/p95/p99</dt><dd className="text-right font-mono tabular-nums text-text">{hp.p50_ms} / {hp.p95_ms} / {hp.p99_ms} ms</dd></div>
              <div className="contents"><dt className="text-text-2">{v('k_inflight')}</dt><dd className="text-right font-mono tabular-nums text-text">{hp.em_voo}</dd></div>
            </dl>
          </div>
        )}
      </div>
      {points.length > 0 && (
        <details className="group text-sm">
          <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-lg px-1 text-sm font-medium text-text-2 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue [&::-webkit-details-marker]:hidden">
            <ChevronRight size={16} aria-hidden="true" className="transition-transform duration-200 group-open:rotate-90" />
            {v('chart_table')}
          </summary>
          <div className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-border">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-bg-muted">
                <tr className="text-left text-text-muted">
                  <th scope="col" className="px-3 py-2 font-semibold">{v('chart_col_time')}</th>
                  {(['rps_alvo', 'rps', 'ok_ps', 'erros_ps'] as const).map(k => <th key={k} scope="col" className="px-3 py-2 text-right font-semibold">{v(`chart_${k}`)}</th>)}
                  <th scope="col" className="px-3 py-2 text-right font-semibold">p95 (ms)</th>
                </tr>
              </thead>
              <tbody>
                {points.slice(-30).reverse().map(p => (
                  <tr key={p.t} className="border-t border-border">
                    <td className="px-3 py-1.5 font-mono text-text-2">{tfs.format(p.ms)}</td>
                    {(['rps_alvo', 'rps', 'ok_ps', 'erros_ps'] as const).map(k => <td key={k} className="px-3 py-1.5 text-right font-mono tabular-nums text-text">{nf.format(p[k])}</td>)}
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums text-text">{p.p95_ms}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  )
}
