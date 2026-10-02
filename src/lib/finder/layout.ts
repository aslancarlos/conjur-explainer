/**
 * Deterministic layout shared by the Excalidraw export and the SVG preview.
 * Three columns: customer zones | external platforms and clouds | IDIRA SaaS.
 * Zones stack inside a column; nodes sit on a grid inside each zone, so
 * nothing overlaps whatever the selection.
 */
import type { Direction, NetNode, Resolved, Zone, ZoneId } from './netCatalog'

export const NODE_W = 230
export const NODE_H = 78
const GAP_X = 36
const GAP_Y = 34
const PAD = 24
const PAD_TOP = 52       // room for the zone title
const ZONE_GAP = 56
const COL_GAP = 190      // room for arrows and their labels between columns

const COLUMNS: ZoneId[][] = [
  ['customer-k8s', 'customer-dc', 'customer-mainframe', 'customer-ai'],
  ['cicd-saas', 'cloud-aws', 'cloud-azure', 'cloud-gcp', 'ai-saas'],
  ['idira-saas'],
]

export interface Box { x: number; y: number; w: number; h: number }
export interface LaidZone extends Box { zone: Zone }
export interface LaidNode extends Box { node: NetNode }
export interface LaidEdge {
  id: string
  from: string
  to: string
  start: { x: number; y: number }
  end: { x: number; y: number }
  label: string
  direction: Direction
  flowIds: string[]
}
export interface Layout { width: number; height: number; zones: LaidZone[]; nodes: LaidNode[]; edges: LaidEdge[] }

const colsFor = (n: number) => (n <= 1 ? 1 : n <= 4 ? 2 : 3)

/** Short protocol tag for an arrow label: "HTTPS 443", "TCP 5432", "socket". */
export function shortLabel(protocol: string, port: string): string {
  const p = protocol.replace(/\s*\(.*\)$/, '').split(/\s+/)[0]
  if (port === 'n/a') return protocol.toLowerCase().includes('socket') ? 'unix socket' : p.toLowerCase()
  return `${p} ${port}`
}

/** Point where the segment from the box centre towards (tx, ty) crosses the box edge. */
function edgePoint(b: Box, tx: number, ty: number, gap = 6) {
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2
  const dx = tx - cx, dy = ty - cy
  if (dx === 0 && dy === 0) return { x: cx, y: cy }
  const sx = (b.w / 2 + gap) / Math.abs(dx || 1e-9)
  const sy = (b.h / 2 + gap) / Math.abs(dy || 1e-9)
  const s = Math.min(sx, sy)
  return { x: cx + dx * s, y: cy + dy * s }
}

export function computeLayout(r: Resolved, opts: { top?: number; left?: number } = {}): Layout {
  const top = opts.top ?? 0, left = opts.left ?? 0
  const zones: LaidZone[] = []
  const nodes: LaidNode[] = []
  let x = left
  let maxH = 0
  for (const col of COLUMNS) {
    const colZones = col.map(id => r.zones.find(z => z.id === id)).filter(Boolean) as Zone[]
    if (!colZones.length) continue
    // width of this column = widest zone in it
    const dims = colZones.map(z => {
      const zn = r.nodes.filter(n => n.zone === z.id)
      const c = colsFor(zn.length), rows = Math.ceil(zn.length / c)
      return { z, zn, c, w: PAD * 2 + c * NODE_W + (c - 1) * GAP_X, h: PAD_TOP + PAD + rows * NODE_H + (rows - 1) * GAP_Y }
    })
    const colW = Math.max(...dims.map(d => d.w))
    let y = top
    for (const d of dims) {
      zones.push({ zone: d.z, x, y, w: colW, h: d.h })
      d.zn.forEach((n, i) => {
        const cx = i % d.c, cy = Math.floor(i / d.c)
        const innerW = d.c * NODE_W + (d.c - 1) * GAP_X
        const offset = (colW - PAD * 2 - innerW) / 2
        nodes.push({ node: n, x: x + PAD + offset + cx * (NODE_W + GAP_X), y: y + PAD_TOP + cy * (NODE_H + GAP_Y), w: NODE_W, h: NODE_H })
      })
      y += d.h + ZONE_GAP
    }
    maxH = Math.max(maxH, y - ZONE_GAP - top)
    x += colW + COL_GAP
  }

  // one edge per directed node pair, labels merged
  const byPair = new Map<string, LaidEdge>()
  const box = Object.fromEntries(nodes.map(n => [n.node.id, n]))
  for (const f of r.flows) {
    if (f.from === f.to || !box[f.from] || !box[f.to]) continue
    const key = `${f.from}>${f.to}`
    const tag = shortLabel(f.protocol, f.port)
    const e = byPair.get(key)
    if (e) {
      if (!e.label.split(' · ').includes(tag)) e.label += ` · ${tag}`
      e.flowIds.push(f.id)
      continue
    }
    const a = box[f.from], b = box[f.to]
    const start = edgePoint(a, b.x + b.w / 2, b.y + b.h / 2)
    const end = edgePoint(b, a.x + a.w / 2, a.y + a.h / 2)
    byPair.set(key, { id: `e-${f.from}-${f.to}`, from: f.from, to: f.to, start, end, label: tag, direction: f.direction, flowIds: [f.id] })
  }

  return { width: Math.max(0, x - COL_GAP - left), height: maxH, zones, nodes, edges: [...byPair.values()] }
}
