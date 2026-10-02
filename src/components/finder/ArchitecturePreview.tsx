import { useId } from 'react'
import { Box, Cloud, Cpu, Database, Network } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { LaidNode } from '../../lib/finder/layout'
import type { Direction, NodeKind, Product, Resolved } from '../../lib/finder/netCatalog'
import { routedLayout, routeEdges, routePolyline } from '../../lib/finder/routing'

/**
 * SVG preview of the resolved architecture. Same layout and edge routes as the
 * draw.io export (customer zones | IDIRA SaaS | providers, orthogonal edges
 * through the gaps), so what the page shows is what the file contains.
 * Theme tokens only; scales to the container width.
 */
export interface ArchitecturePreviewLabels {
  title: string
  desc: string
  legend: string
  outbound: string
  inbound: string
  internal: string
  external: string
  inferred?: string
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
  inferred: 'Inferred (*)',
}

const PRODUCT: Record<Product, { box: string; badge: string; text: string; initials: string }> = {
  sm: { box: 'fill-domain-idira/10 stroke-domain-idira/70', badge: 'fill-domain-idira', text: 'fill-white', initials: 'SM' },
  swa: { box: 'fill-tone-live/10 stroke-tone-live/70', badge: 'fill-tone-live', text: 'fill-white', initials: 'SWA' },
  cp: { box: 'fill-domain-cp/10 stroke-domain-cp/70', badge: 'fill-domain-cp', text: 'fill-white', initials: 'CP' },
  shub: { box: 'fill-domain-svc/10 stroke-domain-svc/70', badge: 'fill-domain-svc', text: 'fill-white', initials: 'SH' },
  customer: { box: 'fill-surface stroke-line', badge: 'fill-bg-muted', text: 'fill-text-2', initials: '' },
  external: { box: 'fill-surface stroke-line', badge: 'fill-bg-muted', text: 'fill-text-2', initials: '' },
}

/** Generic glyph for customer and provider components (the draw.io file carries the vendor icons). */
const KIND_ICON: Record<NodeKind, LucideIcon> = {
  workload: Box, agent: Cpu, 'idira-service': Box, platform: Cloud, store: Database, network: Network,
}

const DIR: Record<Direction, { stroke: string; text: string; dash?: string; marker: string }> = {
  outbound: { stroke: 'stroke-domain-idira', text: 'fill-domain-idira', marker: 'fill-domain-idira' },
  inbound: { stroke: 'stroke-tone-danger', text: 'fill-tone-danger', marker: 'fill-tone-danger' },
  internal: { stroke: 'stroke-text-2', text: 'fill-text-2', dash: '7 4', marker: 'fill-text-2' },
  external: { stroke: 'stroke-text-muted', text: 'fill-text-muted', dash: '2 4', marker: 'fill-text-muted' },
}

const ICON = 36

export default function ArchitecturePreview({ resolved, labels = DEFAULT_PREVIEW_LABELS, className = '' }: {
  resolved: Resolved
  labels?: ArchitecturePreviewLabels
  className?: string
}) {
  const uid = useId().replace(/:/g, '')
  const { lay, top, corridorY } = routedLayout(resolved, { top: 0, left: 0 })
  if (!lay.nodes.length) return null
  const box: Record<string, LaidNode> = Object.fromEntries(lay.nodes.map(n => [n.node.id, n]))
  const routes = routeEdges(lay, box, corridorY)
  const flowById = Object.fromEntries(resolved.flows.map(f => [f.id, f]))
  const legendY = top + lay.height + 40
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

        {lay.zones.map(z => {
          const idira = z.zone.id === 'idira-saas'
          return (
            <g key={z.zone.id}>
              <rect x={z.x} y={z.y} width={z.w} height={z.h} rx={6} strokeWidth={1.5} strokeDasharray={z.zone.customer ? undefined : '8 4'}
                className={idira ? 'fill-domain-idira/[0.05] stroke-domain-idira/60' : z.zone.customer ? 'fill-text-muted/[0.04] stroke-text-muted/60' : 'fill-none stroke-text-muted/40'} />
              <text x={z.x + 16} y={z.y + 28} fontSize={13} letterSpacing="0.04em"
                className={`${idira ? 'fill-domain-idira' : 'fill-text-2'} font-sans font-semibold uppercase`}>
                {labels.zones?.[z.zone.id] ?? z.zone.label}
              </text>
            </g>
          )
        })}

        {lay.edges.map(e => {
          const d = DIR[e.direction]
          const rt = routes.get(e.id)!
          const pts = routePolyline(box[e.from], box[e.to], rt)
          const inferred = e.flowIds.every(id => flowById[id]?.confidence === 'inferred')
          // label on the longest segment
          let best = 0, bestLen = -1
          for (let i = 1; i < pts.length; i++) {
            const len = Math.abs(pts[i][0] - pts[i - 1][0]) + Math.abs(pts[i][1] - pts[i - 1][1])
            if (len > bestLen) { bestLen = len; best = i }
          }
          const mx = (pts[best][0] + pts[best - 1][0]) / 2, my = (pts[best][1] + pts[best - 1][1]) / 2
          const label = `${e.label}${inferred ? ' *' : ''}`
          const w = label.length * 6.4 + 14
          return (
            <g key={e.id}>
              <polyline points={pts.map(p => p.join(',')).join(' ')} fill="none" strokeWidth={1.75} strokeLinejoin="round"
                strokeDasharray={d.dash ?? (inferred ? '7 4' : undefined)} className={`${d.stroke} opacity-85`} markerEnd={`url(#${uid}-m-${e.direction})`} />
              <rect x={mx - w / 2} y={my - 9} width={w} height={18} rx={9} strokeWidth={1} className="fill-surface stroke-line" />
              <text x={mx} y={my + 3.8} fontSize={10.5} textAnchor="middle" className={`${d.text} font-mono`}>{label}</text>
            </g>
          )
        })}

        {lay.nodes.map(n => {
          const p = PRODUCT[n.node.product]
          const idira = !!p.initials
          const Icon = KIND_ICON[n.node.kind]
          const ix = n.x + 14, iy = n.y + (n.h - ICON) / 2
          return (
            <g key={n.node.id}>
              <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={10} strokeWidth={idira ? 1.5 : 1} className={p.box} />
              <rect x={ix} y={iy} width={ICON} height={ICON} rx={8} className={p.badge} />
              {idira
                ? <text x={ix + ICON / 2} y={iy + ICON / 2 + 4} fontSize={p.initials.length > 2 ? 10 : 12} textAnchor="middle" className={`${p.text} font-sans font-bold`}>{p.initials}</text>
                : <Icon x={ix + 8} y={iy + 8} width={20} height={20} strokeWidth={1.75} className="stroke-text-2" aria-hidden="true" />}
              <text x={n.x + 62} y={n.y + n.h / 2 - 3} fontSize={13} className="fill-text font-sans font-semibold">{n.node.label}</text>
              {n.node.details && <text x={n.x + 62} y={n.y + n.h / 2 + 14} fontSize={10.5} className="fill-text-2 font-sans">{n.node.details}</text>}
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
          {labels.inferred && (
            <g transform={`translate(${dirs.filter(d => used.has(d)).length * 220} 22)`}>
              <line x1={0} y1={6} x2={44} y2={6} strokeWidth={2} strokeDasharray="7 4" className="stroke-text-2" />
              <text x={54} y={10} fontSize={12} className="fill-text font-sans">{labels.inferred}</text>
            </g>
          )}
        </g>
      </svg>
    </figure>
  )
}
