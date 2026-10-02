import { useId, useState } from 'react'
import { Box, Cloud, Cpu, Database, Maximize2, Minimize2, Network } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Direction, NodeKind, Product, Resolved } from '../../lib/finder/netCatalog'
import { routedLayout } from '../../lib/finder/routing'

/**
 * SVG preview of the resolved architecture. Same layout, edge routes and
 * numbered badges as the draw.io export, so what the page shows is what the
 * file contains; the numbers match the network flows table.
 * Theme tokens only. It opens as a fit-to-width overview; "Full size" shows
 * it at 1:1 and scrolls inside its own frame (never the page).
 */
export interface ArchitecturePreviewLabels {
  title: string
  desc: string
  legend: string
  outbound: string
  inbound: string
  internal: string
  external: string
  badgeDocumented: string
  badgeInferred: string
  fullSize?: string                  // toggle: show at 1:1
  fitWidth?: string                  // toggle: fit to the width
  zones?: Record<string, string>     // zone id -> translated title
}

export const DEFAULT_PREVIEW_LABELS: ArchitecturePreviewLabels = {
  title: 'Reference architecture',
  desc: 'Components, connections, ports and protocols for the selected environment.',
  legend: 'Legend',
  outbound: 'Outbound from your network',
  inbound: 'Inbound to your network',
  internal: 'Inside your network',
  external: 'Between providers',
  badgeDocumented: 'Documented',
  badgeInferred: 'Inferred: confirm before opening rules',
  fullSize: 'Full size',
  fitWidth: 'Fit to width',
}

const PRODUCT: Record<Product, { box: string; badge: string; initials: string }> = {
  sm: { box: 'fill-domain-idira/10 stroke-domain-idira/70', badge: 'fill-domain-idira', initials: 'SM' },
  swa: { box: 'fill-tone-live/10 stroke-tone-live/70', badge: 'fill-tone-live', initials: 'SWA' },
  cp: { box: 'fill-domain-cp/10 stroke-domain-cp/70', badge: 'fill-domain-cp', initials: 'CP' },
  shub: { box: 'fill-domain-svc/10 stroke-domain-svc/70', badge: 'fill-domain-svc', initials: 'SH' },
  customer: { box: 'fill-surface stroke-line', badge: 'fill-bg-muted', initials: '' },
  external: { box: 'fill-surface stroke-line', badge: 'fill-bg-muted', initials: '' },
}

/** Generic glyph for customer and provider components (the draw.io file carries the vendor icons). */
const KIND_ICON: Record<NodeKind, LucideIcon> = {
  workload: Box, agent: Cpu, 'idira-service': Box, platform: Cloud, store: Database, network: Network,
}

const DIR: Record<Direction, { stroke: string; fill: string; text: string; dash?: string }> = {
  outbound: { stroke: 'stroke-domain-idira', fill: 'fill-domain-idira', text: 'fill-domain-idira' },
  inbound: { stroke: 'stroke-tone-danger', fill: 'fill-tone-danger', text: 'fill-tone-danger' },
  internal: { stroke: 'stroke-text-2', fill: 'fill-text-2', text: 'fill-text-2', dash: '7 4' },
  external: { stroke: 'stroke-text-muted', fill: 'fill-text-muted', text: 'fill-text-muted', dash: '2 4' },
}

const ICON = 44
const R = 12

export default function ArchitecturePreview({ resolved, labels = DEFAULT_PREVIEW_LABELS, className = '', fit = false }: {
  resolved: Resolved
  labels?: ArchitecturePreviewLabels
  className?: string
  fit?: boolean                    // scale to the width (print), no minimum size
}) {
  const uid = useId().replace(/:/g, '')
  const [full, setFull] = useState(false)
  const { lay, top, routes } = routedLayout(resolved, { top: 0, left: 0 })
  if (!lay.nodes.length) return null
  const minY = Math.min(top - 40, ...lay.zones.map(z => z.y))
  const legendY = top + lay.height + 44
  const W = Math.max(lay.width, 720), H = legendY + 100 - minY
  const dirs = (['outbound', 'inbound', 'internal', 'external'] as Direction[]).filter(d => lay.edges.some(e => e.direction === d))

  return (
    <figure className={`relative w-full rounded-2xl border border-border bg-bg-card p-4 ${className}`}>
      {!fit && (
        <button type="button" onClick={() => setFull(v => !v)} aria-pressed={full}
          className="absolute right-3 top-3 z-10 inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-bg-card px-3 text-xs font-medium text-text-2 shadow-sm transition-colors hover:border-idira-blue hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue">
          {full ? <Minimize2 size={14} aria-hidden="true" /> : <Maximize2 size={14} aria-hidden="true" />}
          {full ? labels.fitWidth : labels.fullSize}
        </button>
      )}
      <div className={full && !fit ? 'max-h-[80vh] overflow-auto' : ''}>
      <svg viewBox={`-16 ${minY - 8} ${W + 32} ${H + 16}`} className="h-auto" style={full && !fit ? { width: W + 32 } : { width: '100%' }}
        role="img" aria-labelledby={`${uid}-t ${uid}-d`}>
        <title id={`${uid}-t`}>{labels.title}</title>
        <desc id={`${uid}-d`}>{labels.desc}</desc>
        <defs>
          {dirs.map(d => (
            <marker key={d} id={`${uid}-m-${d}`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0.8 L 7 4 L 0 7.2 z" className={DIR[d].fill} />
            </marker>
          ))}
        </defs>

        {lay.zones.map(z => {
          const idira = z.zone.id === 'idira-saas'
          return (
            <g key={z.zone.id}>
              <rect x={z.x} y={z.y} width={z.w} height={z.h} rx={6} strokeWidth={1.5} strokeDasharray={z.zone.customer ? undefined : '8 4'}
                className={idira ? 'fill-domain-idira/[0.05] stroke-domain-idira/60' : z.zone.customer ? 'fill-text-muted/[0.04] stroke-text-muted/60' : 'fill-none stroke-text-muted/40'} />
              <text x={z.x + 20} y={z.y + 32} fontSize={14} className={`${idira ? 'fill-domain-idira' : 'fill-text'} font-sans font-semibold`}>
                {labels.zones?.[z.zone.id] ?? z.zone.label}
              </text>
            </g>
          )
        })}

        {lay.edges.map(e => {
          const d = DIR[e.direction]
          const pts = routes.get(e.id)!.poly
          return (
            <polyline key={e.id} points={pts.map(p => p.join(',')).join(' ')} fill="none" strokeWidth={1.75} strokeLinejoin="round"
              strokeDasharray={d.dash} className={d.stroke} markerEnd={`url(#${uid}-m-${e.direction})`} />
          )
        })}

        {lay.nodes.map(n => {
          const p = PRODUCT[n.node.product]
          const idira = !!p.initials
          const Icon = KIND_ICON[n.node.kind]
          const ix = n.x + 16, iy = n.y + (n.h - ICON) / 2
          return (
            <g key={n.node.id}>
              <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={10} strokeWidth={idira ? 1.5 : 1} className={p.box} />
              <rect x={ix} y={iy} width={ICON} height={ICON} rx={9} className={p.badge} />
              {idira
                ? <text x={ix + ICON / 2} y={iy + ICON / 2 + 5} fontSize={p.initials.length > 2 ? 12 : 14} textAnchor="middle" className="fill-white font-sans font-bold">{p.initials}</text>
                : <Icon x={ix + 10} y={iy + 10} width={24} height={24} strokeWidth={1.75} className="stroke-text-2" aria-hidden="true" />}
              <text x={n.x + 76} y={n.y + n.h / 2 - 3} fontSize={14} className="fill-text font-sans font-semibold">{n.node.label}</text>
              {n.node.details && <text x={n.x + 76} y={n.y + n.h / 2 + 16} fontSize={12} className="fill-text-2 font-sans">{n.node.details}</text>}
            </g>
          )
        })}

        {lay.edges.map(e => {
          const d = DIR[e.direction]
          const b = routes.get(e.id)!.badge
          return (
            <g key={`b-${e.id}`}>
              <circle cx={b.x} cy={b.y} r={R} strokeWidth={e.inferred ? 2 : 1.5}
                className={e.inferred ? `fill-surface ${d.stroke}` : `${d.fill} stroke-surface`} />
              <text x={b.x} y={b.y + 4} fontSize={11} textAnchor="middle" className={`${e.inferred ? d.text : 'fill-bg-base'} font-sans font-bold tabular-nums`}>{e.num}</text>
            </g>
          )
        })}

        <g transform={`translate(0 ${legendY})`}>
          <text x={0} y={0} fontSize={13} className="fill-text font-sans font-semibold">{labels.legend}</text>
          {dirs.map((d, i) => (
            <g key={d} transform={`translate(${i * 250} 22)`}>
              <line x1={0} y1={6} x2={44} y2={6} strokeWidth={2} strokeDasharray={DIR[d].dash} className={DIR[d].stroke} markerEnd={`url(#${uid}-m-${d})`} />
              <text x={54} y={10} fontSize={13} className="fill-text font-sans">{labels[d]}</text>
            </g>
          ))}
          <g transform="translate(0 52)">
            <circle cx={12} cy={6} r={R - 1} className="fill-domain-idira stroke-surface" strokeWidth={1.5} />
            <text x={12} y={10} fontSize={11} textAnchor="middle" className="fill-bg-base font-sans font-bold">1</text>
            <text x={32} y={10} fontSize={13} className="fill-text font-sans">{labels.badgeDocumented}</text>
            <circle cx={12} cy={34} r={R - 1} className="fill-surface stroke-domain-idira" strokeWidth={2} />
            <text x={12} y={38} fontSize={11} textAnchor="middle" className="fill-domain-idira font-sans font-bold">2</text>
            <text x={32} y={38} fontSize={13} className="fill-text font-sans">{labels.badgeInferred}</text>
          </g>
        </g>
      </svg>
      </div>
    </figure>
  )
}
