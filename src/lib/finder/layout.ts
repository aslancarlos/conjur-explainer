/**
 * Deterministic layout shared by the draw.io export, the SVG preview, the
 * network table and the CSV / Markdown exports.
 *
 * Three columns: customer environment | IDIRA (SaaS tenant, plus the
 * customer-run IDIRA and PAM components) | cloud, CI/CD and AI providers.
 * Zones stack inside a column; cards sit on a grid inside each zone, so
 * nothing overlaps whatever the selection.
 *
 * Edges are AGGREGATED before drawing: when several cards of one zone talk to
 * the same destination in the same direction, one edge leaves the zone border
 * ("Kubernetes cluster -> Secrets Manager"); the same applies on the
 * destination side. Every drawn edge gets a number (1..N, reading order);
 * flowNo maps each flow to the number of the edge it is drawn on, so the
 * diagram badges and the table rows match.
 */
import type { Direction, NetNode, Resolved, Zone, ZoneId } from './netCatalog'

export const NODE_W = 248
export const NODE_H = 84
export const GAP_X = 48
export const GAP_Y = 44
const PAD = 28
export const PAD_TOP = 56   // room for the zone title
const ZONE_GAP = 60
export const COL_GAP = 240  // channel for edges between columns

const COLUMNS: ZoneId[][] = [
  ['customer-k8s', 'customer-dc', 'customer-mainframe', 'customer-ai'],
  ['idira-saas', 'customer-idira', 'customer-pam'],
  ['cicd-saas', 'cloud-aws', 'cloud-azure', 'cloud-gcp', 'ai-saas'],
]

/** Cards drawn last inside their zone (the PAM back end sits at the bottom of IDIRA). */
const LAST = new Set(['pcloud', 'iot-broker'])

export interface Box { x: number; y: number; w: number; h: number }
export interface LaidZone extends Box { zone: Zone; col: number }
export interface LaidNode extends Box { node: NetNode; col: number; row: number; gridCol: number; rows: number }
/** A drawable edge end: a card, or a zone border ("zone:<id>"). */
export interface Endpoint extends Box { id: string; zone: ZoneId; col: number; isZone: boolean; row: number; gridCol: number; rows: number }
export interface LaidEdge {
  id: string
  num: number
  from: string
  to: string
  direction: Direction
  flowIds: string[]
  label: string            // merged short tags, e.g. "HTTPS 443 · TCP 5432"
  inferred: boolean        // every flow on it is inferred
}
export interface Layout {
  width: number
  height: number
  zones: LaidZone[]
  nodes: LaidNode[]
  edges: LaidEdge[]
  ends: Record<string, Endpoint>
  flowNo: Record<string, number>
  colX: number[]           // left x of each used column
  colR: number[]           // right x of each used column
}

const colsFor = (n: number) => (n <= 3 ? 1 : n <= 8 ? 2 : 3)

/** Short protocol tag: "HTTPS 443", "TCP 5432", "unix socket". */
export function shortLabel(protocol: string, port: string): string {
  const p = protocol.replace(/\s*\(.*\)$/, '').split(/\s+/)[0]
  if (port === 'n/a') return protocol.toLowerCase().includes('socket') ? 'unix socket' : p.toLowerCase()
  return `${p} ${port}`
}

export const zoneEnd = (z: ZoneId) => `zone:${z}`

export function computeLayout(r: Resolved, opts: { top?: number; left?: number } = {}): Layout {
  const top = opts.top ?? 0, left = opts.left ?? 0
  const zones: LaidZone[] = []
  const nodes: LaidNode[] = []
  const colX: number[] = [], colR: number[] = []
  let x = left
  let maxH = 0
  let col = 0
  for (const [ci, colIds] of COLUMNS.entries()) {
    const colZones = colIds.map(id => r.zones.find(z => z.id === id)).filter(Boolean) as Zone[]
    if (!colZones.length) continue
    const dims = colZones.map(z => {
      const zn = r.nodes.filter(n => n.zone === z.id).sort((a, b) => Number(LAST.has(a.id)) - Number(LAST.has(b.id)))
      // the middle column stacks its cards: each one reaches both channels
      const c = ci === 1 ? 1 : colsFor(zn.length), rows = Math.ceil(zn.length / c)
      return { z, zn, c, rows, w: PAD * 2 + c * NODE_W + (c - 1) * GAP_X, h: PAD_TOP + PAD + rows * NODE_H + (rows - 1) * GAP_Y }
    })
    const colW = Math.max(...dims.map(d => d.w))
    let y = top
    for (const d of dims) {
      zones.push({ zone: d.z, col, x, y, w: colW, h: d.h })
      const innerW = d.c * NODE_W + (d.c - 1) * GAP_X
      const offset = (colW - PAD * 2 - innerW) / 2
      d.zn.forEach((n, i) => {
        const gx = i % d.c, gy = Math.floor(i / d.c)
        nodes.push({ node: n, col, row: gy, gridCol: gx, rows: d.rows, x: x + PAD + offset + gx * (NODE_W + GAP_X), y: y + PAD_TOP + gy * (NODE_H + GAP_Y), w: NODE_W, h: NODE_H })
      })
      y += d.h + ZONE_GAP
    }
    maxH = Math.max(maxH, y - ZONE_GAP - top)
    colX.push(x); colR.push(x + colW)
    x += colW + COL_GAP
    col++
  }

  // centre shorter columns vertically: the IDIRA column sits level with the
  // middle of the customer zones, which keeps the edge runs short
  for (let c = 0; c < col; c++) {
    const zs = zones.filter(z => z.col === c)
    const h = Math.max(...zs.map(z => z.y + z.h)) - top
    const dy = Math.round((maxH - h) / 2)
    if (dy > 0) {
      zs.forEach(z => { z.y += dy })
      nodes.filter(n => n.col === c).forEach(n => { n.y += dy })
    }
  }

  // endpoints: cards and zone borders
  const ends: Record<string, Endpoint> = {}
  for (const n of nodes) ends[n.node.id] = { id: n.node.id, zone: n.node.zone, col: n.col, isZone: false, row: n.row, gridCol: n.gridCol, rows: n.rows, x: n.x, y: n.y, w: n.w, h: n.h }
  for (const z of zones) ends[zoneEnd(z.zone.id)] = { id: zoneEnd(z.zone.id), zone: z.zone.id, col: z.col, isZone: true, row: 0, gridCol: 0, rows: 1, x: z.x, y: z.y, w: z.w, h: z.h }

  // ---- aggregation ----
  interface E { a: string; b: string; dir: Direction; flows: string[] }
  const zoneOfEnd = (id: string) => ends[id].zone
  let list: E[] = r.flows.filter(f => f.from !== f.to && ends[f.from] && ends[f.to]).map(f => ({ a: f.from, b: f.to, dir: f.direction, flows: [f.id] }))
  // source side: >= 2 cards of one zone to the same destination (other zone), same direction
  const srcGroups = new Map<string, Set<string>>()
  for (const e of list) if (zoneOfEnd(e.a) !== zoneOfEnd(e.b)) {
    const k = `${zoneOfEnd(e.a)}|${e.b}|${e.dir}`
    srcGroups.set(k, (srcGroups.get(k) ?? new Set()).add(e.a))
  }
  list = list.map(e => {
    const k = `${zoneOfEnd(e.a)}|${e.b}|${e.dir}`
    return zoneOfEnd(e.a) !== zoneOfEnd(e.b) && (srcGroups.get(k)?.size ?? 0) >= 2 ? { ...e, a: zoneEnd(zoneOfEnd(e.a)) } : e
  })
  // destination side: one source to >= 2 cards of another zone, same direction
  const dstGroups = new Map<string, Set<string>>()
  for (const e of list) if (zoneOfEnd(e.a) !== zoneOfEnd(e.b) && !ends[e.b].isZone) {
    const k = `${e.a}|${zoneOfEnd(e.b)}|${e.dir}`
    dstGroups.set(k, (dstGroups.get(k) ?? new Set()).add(e.b))
  }
  list = list.map(e => {
    const k = `${e.a}|${zoneOfEnd(e.b)}|${e.dir}`
    return zoneOfEnd(e.a) !== zoneOfEnd(e.b) && !ends[e.b].isZone && (dstGroups.get(k)?.size ?? 0) >= 2 ? { ...e, b: zoneEnd(zoneOfEnd(e.b)) } : e
  })
  // merge identical (a, b, dir)
  const merged = new Map<string, E>()
  for (const e of list) {
    const k = `${e.a}>${e.b}|${e.dir}`
    const m = merged.get(k)
    if (m) m.flows.push(...e.flows); else merged.set(k, { ...e, flows: [...e.flows] })
  }

  // ---- numbering in reading order: left column first, then top to bottom ----
  const flowById = Object.fromEntries(r.flows.map(f => [f.id, f]))
  const ordered = [...merged.values()].sort((p, q) => {
    const pa = ends[p.a], qa = ends[q.a], pb = ends[p.b], qb = ends[q.b]
    const pc = Math.min(pa.col, pb.col), qc = Math.min(qa.col, qb.col)
    return pc - qc || (pa.y + pa.h / 2) - (qa.y + qa.h / 2) || (pb.y + pb.h / 2) - (qb.y + qb.h / 2) || pa.x - qa.x
  })
  const flowNo: Record<string, number> = {}
  const edges: LaidEdge[] = ordered.map((e, i) => {
    const tags: string[] = []
    e.flows.forEach(id => { const f = flowById[id]; const t = shortLabel(f.protocol, f.port); if (!tags.includes(t)) tags.push(t); flowNo[id] = i + 1 })
    return {
      id: `e${i + 1}`, num: i + 1, from: e.a, to: e.b, direction: e.dir, flowIds: e.flows, label: tags.join(' · '),
      inferred: e.flows.every(id => flowById[id].confidence === 'inferred'),
    }
  })

  return { width: Math.max(0, x - COL_GAP - left), height: maxH, zones, nodes, edges, ends, flowNo, colX, colR }
}
