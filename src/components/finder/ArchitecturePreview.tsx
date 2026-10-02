import { useId } from 'react'
import { computeLayout } from '../../lib/finder/layout'
import type { Direction, Product, Resolved } from '../../lib/finder/netCatalog'

/**
 * SVG preview of the resolved architecture (same layout as the Excalidraw
 * export). Theme tokens only; scales to the container width.
 */
export interface ArchitecturePreviewLabels {
  title: string
  desc: string
  legend: string
  outbound: string
  inbound: string
  internal: string
  external: string
  zones?: Record<string, string>     // zone id -> translated title
}

export const DEFAULT_PREVIEW_LABELS: ArchitecturePreviewLabels = {
  title: 'Reference architecture',
  desc: 'Components, connections, ports and protocols for the selected environment.',
  legend: 'Legend',
  outbound: 'Outbound',
  inbound: 'Inbound',
  internal: 'Internal',
  external: 'Provider to provider',
}

const PRODUCT: Record<Product, { box: string; stripe: string }> = {
  sm: { box: 'fill-domain-idira/10 stroke-domain-idira/60', stripe: 'fill-domain-idira' },
  swa: { box: 'fill-tone-live/10 stroke-tone-live/60', stripe: 'fill-tone-live' },
  cp: { box: 'fill-domain-cp/10 stroke-domain-cp/60', stripe: 'fill-domain-cp' },
  shub: { box: 'fill-domain-svc/10 stroke-domain-svc/60', stripe: 'fill-domain-svc' },
  customer: { box: 'fill-surface stroke-line', stripe: 'fill-text-muted' },
  external: { box: 'fill-surface stroke-line', stripe: 'fill-text-2' },
}

const DIR: Record<Direction, { stroke: string; text: string; dash?: string; marker: string }> = {
  outbound: { stroke: 'stroke-domain-idira', text: 'fill-domain-idira', marker: 'fill-domain-idira', },
  inbound: { stroke: 'stroke-tone-danger', text: 'fill-tone-danger', marker: 'fill-tone-danger' },
  internal: { stroke: 'stroke-text-2', text: 'fill-text-2', dash: '6 5', marker: 'fill-text-2' },
  external: { stroke: 'stroke-text-muted', text: 'fill-text-muted', dash: '2 5', marker: 'fill-text-muted' },
}

export default function ArchitecturePreview({ resolved, labels = DEFAULT_PREVIEW_LABELS, className = '' }: {
  resolved: Resolved
  labels?: ArchitecturePreviewLabels
  className?: string
}) {
  const uid = useId().replace(/:/g, '')
  const lay = computeLayout(resolved, { top: 0, left: 0 })
  if (!lay.nodes.length) return null
  const legendY = lay.height + 40
  const W = Math.max(lay.width, 640), H = legendY + 60
  const dirs: Direction[] = ['outbound', 'inbound', 'internal', 'external']
  const used = new Set(lay.edges.map(e => e.direction))

  return (
    <figure className={`w-full overflow-hidden rounded-2xl border border-border bg-bg-card p-4 ${className}`}>
      <svg viewBox={`-12 -12 ${W + 24} ${H + 24}`} className="h-auto w-full" role="img" aria-labelledby={`${uid}-t ${uid}-d`}>
        <title id={`${uid}-t`}>{labels.title}</title>
        <desc id={`${uid}-d`}>{labels.desc}</desc>
        <defs>
          {dirs.map(d => (
            <marker key={d} id={`${uid}-m-${d}`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0.8 L 7 4 L 0 7.2 z" className={DIR[d].marker} />
            </marker>
          ))}
        </defs>

        {lay.zones.map(z => (
          <g key={z.zone.id}>
            <rect x={z.x} y={z.y} width={z.w} height={z.h} rx={18} strokeWidth={1.25} strokeDasharray="6 5"
              className={z.zone.id === 'idira-saas' ? 'fill-domain-idira/[0.05] stroke-domain-idira/40' : z.zone.customer ? 'fill-text-muted/[0.04] stroke-text-muted/40' : 'fill-none stroke-text-muted/30'} />
            <text x={z.x + 16} y={z.y + 28} fontSize={13} letterSpacing="0.06em" className="fill-text-2 font-sans font-semibold uppercase">
              {labels.zones?.[z.zone.id] ?? z.zone.label}
            </text>
          </g>
        ))}

        {lay.edges.map(e => {
          const d = DIR[e.direction]
          const mx = (e.start.x + e.end.x) / 2, my = (e.start.y + e.end.y) / 2
          const w = e.label.length * 6.6 + 16
          return (
            <g key={e.id}>
              <line x1={e.start.x} y1={e.start.y} x2={e.end.x} y2={e.end.y} strokeWidth={1.75} strokeDasharray={d.dash}
                className={`${d.stroke} opacity-80`} markerEnd={`url(#${uid}-m-${e.direction})`} />
              <rect x={mx - w / 2} y={my - 10} width={w} height={20} rx={10} strokeWidth={1} className="fill-surface stroke-line" />
              <text x={mx} y={my + 4} fontSize={11} textAnchor="middle" className={`${d.text} font-mono`}>{e.label}</text>
            </g>
          )
        })}

        {lay.nodes.map(n => {
          const p = PRODUCT[n.node.product]
          return (
            <g key={n.node.id}>
              <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={12} strokeWidth={1.5} className={p.box} />
              <rect x={n.x + 14} y={n.y} width={n.w - 28} height={3} rx={1.5} className={p.stripe} />
              <text x={n.x + 14} y={n.y + 32} fontSize={14} className="fill-text font-sans font-semibold">{n.node.label}</text>
              {n.node.details && <text x={n.x + 14} y={n.y + 54} fontSize={11.5} className="fill-text-2 font-mono">{n.node.details}</text>}
            </g>
          )
        })}

        <g transform={`translate(0 ${legendY})`}>
          <text x={0} y={0} fontSize={12} letterSpacing="0.06em" className="fill-text-2 font-sans font-semibold uppercase">{labels.legend}</text>
          {dirs.filter(d => used.has(d)).map((d, i) => (
            <g key={d} transform={`translate(${i * 220} 22)`}>
              <line x1={0} y1={6} x2={44} y2={6} strokeWidth={2} strokeDasharray={DIR[d].dash} className={DIR[d].stroke} markerEnd={`url(#${uid}-m-${d})`} />
              <text x={54} y={10} fontSize={12} className="fill-text font-sans">{labels[d]}</text>
            </g>
          ))}
        </g>
      </svg>
    </figure>
  )
}
