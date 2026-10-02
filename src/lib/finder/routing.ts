/**
 * Orthogonal edge routing shared by the draw.io export and the in-page SVG
 * preview, so both draw the same paths.
 */
import { computeLayout, type LaidEdge, type LaidNode, type Layout } from './layout'
import type { Resolved } from './netCatalog'

// ---------------------------------------------------------------------------
// Edge routing
//
// Same-column neighbours connect top/bottom. Everything else runs through the
// vertical channel between two columns; when a sibling card sits between a
// node and that channel, the edge leaves through the row gap (top or bottom)
// so it never cuts a card. Edges that span more than one column go over the
// diagram along a corridor above the zones. Ports and channel lanes are
// spread so parallel edges do not overlap.
// ---------------------------------------------------------------------------

export type Side = 'left' | 'right' | 'top' | 'bottom'
export interface Port { side: Side; f: number }
export interface Route { src: Port; dst: Port; points: Array<[number, number]> }

const ROW_GAP = 17      // half of the layout's vertical gap between cards
export const LANE = 9          // spacing between parallel edges in a channel / corridor

export function portXY(n: LaidNode, p: Port): [number, number] {
  if (p.side === 'left') return [n.x, n.y + p.f * n.h]
  if (p.side === 'right') return [n.x + n.w, n.y + p.f * n.h]
  if (p.side === 'top') return [n.x + p.f * n.w, n.y]
  return [n.x + p.f * n.w, n.y + n.h]
}

export function routeEdges(lay: Layout, box: Record<string, LaidNode>, corridorY: number): Map<string, Route> {
  const colXs = [...new Set(lay.zones.map(z => z.x))].sort((a, b) => a - b)
  const colOf = (n: LaidNode) => {
    const z = lay.zones.find(z => z.zone.id === n.node.zone)!
    return colXs.indexOf(z.x)
  }
  const colLeft = colXs
  const colRight = colXs.map(x => Math.max(...lay.zones.filter(z => z.x === x).map(z => z.x + z.w)))
  const channel = (c: number, dir: 1 | -1) =>
    dir > 0 ? (c + 1 < colXs.length ? (colRight[c] + colLeft[c + 1]) / 2 : colRight[c] + 40)
            : (c > 0 ? (colLeft[c] + colRight[c - 1]) / 2 : colLeft[c] - 40)
  const sameRow = (a: LaidNode, b: LaidNode) => a.node.zone === b.node.zone && Math.abs(a.y - b.y) < 1
  /** A sibling card between n and the channel on side `dir`. */
  const blocked = (n: LaidNode, dir: 1 | -1) => lay.nodes.some(o => o !== n && sameRow(o, n) && (dir > 0 ? o.x > n.x : o.x < n.x))
  /** Any card of the column strictly between a and b vertically (same-column edges). */
  const between = (a: LaidNode, b: LaidNode) => {
    const top = Math.min(a.y, b.y), bottom = Math.max(a.y, b.y)
    return lay.nodes.some(o => o !== a && o !== b && o.y > top && o.y < bottom && o.x < Math.max(a.x, b.x) + a.w && o.x + o.w > Math.min(a.x, b.x))
  }

  interface Plan { e: LaidEdge; a: LaidNode; b: LaidNode; kind: 'direct' | 'channel' | 'gap' | 'diag'; dir: 1 | -1; chS: number; chD: number; corridor: boolean; src: Port; dst: Port }
  const plans: Plan[] = []
  for (const e of lay.edges) {
    const a = box[e.from], b = box[e.to]
    const ca = colOf(a), cb = colOf(b)
    if (ca === cb) {
      const overlapX = a.x < b.x + b.w && b.x < a.x + a.w
      // side by side in the same zone row with cards in between: travel along the row gap below
      const rowBetween = !overlapX && Math.abs(a.y - b.y) < 1 && lay.nodes.some(o => o !== a && o !== b && sameRow(o, a) && o.x > Math.min(a.x, b.x) && o.x < Math.max(a.x, b.x))
      if (rowBetween) {
        plans.push({ e, a, b, kind: 'gap', dir: 1, chS: 0, chD: 0, corridor: false, src: { side: 'bottom', f: 0.5 }, dst: { side: 'bottom', f: 0.5 } })
        continue
      }
      // diagonal inside the same column (different rows and card columns): row gap, then the
      // vertical gap next to the target card, then into its side
      const diag = !overlapX && Math.abs(a.y - b.y) >= 1
      if (diag) {
        const right = b.x > a.x
        plans.push({ e, a, b, kind: 'diag', dir: right ? 1 : -1, chS: 0, chD: 0, corridor: false,
          src: { side: b.y > a.y ? 'bottom' : 'top', f: 0.5 }, dst: { side: right ? 'left' : 'right', f: 0.5 } })
        continue
      }
      if (!between(a, b) || !overlapX) {
        // neighbours: top/bottom when stacked, left/right when side by side in the same zone row
        const down = b.y > a.y
        const [sa, sb]: [Side, Side] = overlapX ? (down ? ['bottom', 'top'] : ['top', 'bottom']) : (b.x > a.x ? ['right', 'left'] : ['left', 'right'])
        plans.push({ e, a, b, kind: 'direct', dir: 1, chS: 0, chD: 0, corridor: false, src: { side: sa, f: 0.5 }, dst: { side: sb, f: 0.5 } })
        continue
      }
      // same column with cards in between: detour through the channel on the right (left for the last column)
      const dir: 1 | -1 = ca + 1 < colXs.length ? 1 : -1
      const ch = channel(ca, dir)
      plans.push({ e, a, b, kind: 'channel', dir, chS: ch, chD: ch, corridor: false,
        src: blocked(a, dir) ? { side: b.y < a.y ? 'top' : 'bottom', f: 0.5 } : { side: dir > 0 ? 'right' : 'left', f: 0.5 },
        dst: blocked(b, dir) ? { side: a.y < b.y ? 'top' : 'bottom', f: 0.5 } : { side: dir > 0 ? 'right' : 'left', f: 0.5 } })
      continue
    }
    const dir: 1 | -1 = cb > ca ? 1 : -1
    const chS = channel(ca, dir), chD = channel(cb, dir > 0 ? -1 : 1)
    const corridor = Math.abs(cb - ca) > 1
    const midY = corridor ? corridorY : (b.y + b.h / 2)
    plans.push({ e, a, b, kind: 'channel', dir, chS, chD, corridor,
      src: blocked(a, dir) ? { side: midY < a.y + a.h / 2 ? 'top' : 'bottom', f: 0.5 } : { side: dir > 0 ? 'right' : 'left', f: 0.5 },
      dst: blocked(b, dir > 0 ? -1 : 1) ? { side: (corridor ? corridorY : a.y + a.h / 2) < b.y + b.h / 2 ? 'top' : 'bottom', f: 0.5 } : { side: dir > 0 ? 'left' : 'right', f: 0.5 } })
  }

  // spread ports along each node side, ordered by where the other end sits
  const buckets = new Map<string, Array<{ p: Port; key: number }>>()
  for (const pl of plans) {
    const add = (n: LaidNode, port: Port, other: LaidNode) => {
      const k = `${n.node.id}|${port.side}`
      const horizontal = port.side === 'top' || port.side === 'bottom'
      buckets.set(k, [...(buckets.get(k) ?? []), { p: port, key: horizontal ? other.x : other.y }])
    }
    add(pl.a, pl.src, pl.b); add(pl.b, pl.dst, pl.a)
  }
  for (const list of buckets.values()) {
    list.sort((p, q) => p.key - q.key)
    list.forEach((it, i) => { it.p.f = (i + 1) / (list.length + 1) })
  }

  // lanes: parallel edges in the same channel / the corridor get distinct offsets
  const laneOf = new Map<string, number>()
  const lanes = (key: string, ids: string[]) => ids.forEach((id, i) => laneOf.set(`${key}|${id}`, (i - (ids.length - 1) / 2) * LANE))
  const byChannel = new Map<number, string[]>()
  for (const pl of plans) if (pl.kind === 'channel') {
    for (const ch of new Set([pl.chS, pl.chD])) byChannel.set(ch, [...(byChannel.get(ch) ?? []), pl.e.id])
  }
  for (const [ch, ids] of byChannel) lanes(`ch${ch}`, ids)
  lanes('corr', plans.filter(p => p.corridor).map(p => p.e.id))
  // row-gap edges below the same row share that gap: give each its own lane
  const byGap = new Map<string, string[]>()
  for (const pl of plans) if (pl.kind === 'gap') { const k = `${pl.a.node.zone}|${pl.a.y}`; byGap.set(k, [...(byGap.get(k) ?? []), pl.e.id]) }
  for (const ids of byGap.values()) lanes('gap', ids)

  const out = new Map<string, Route>()
  for (const pl of plans) {
    if (pl.kind === 'direct') { out.set(pl.e.id, { src: pl.src, dst: pl.dst, points: [] }); continue }
    if (pl.kind === 'diag') {
      const [sx] = portXY(pl.a, pl.src), [, dy] = portXY(pl.b, pl.dst)
      const gy = pl.src.side === 'bottom' ? pl.a.y + pl.a.h + ROW_GAP : pl.a.y - ROW_GAP
      const lx = pl.dir > 0 ? pl.b.x - ROW_GAP : pl.b.x + pl.b.w + ROW_GAP
      out.set(pl.e.id, { src: pl.src, dst: pl.dst, points: [[sx, gy], [lx, gy], [lx, dy]] })
      continue
    }
    if (pl.kind === 'gap') {
      const [sx] = portXY(pl.a, pl.src), [dx] = portXY(pl.b, pl.dst)
      const gy = pl.a.y + pl.a.h + ROW_GAP + (laneOf.get(`gap|${pl.e.id}`) ?? 0)
      out.set(pl.e.id, { src: pl.src, dst: pl.dst, points: [[sx, gy], [dx, gy]] })
      continue
    }
    const [sx, sy] = portXY(pl.a, pl.src)
    const [dx, dy] = portXY(pl.b, pl.dst)
    const xs = pl.chS + (laneOf.get(`ch${pl.chS}|${pl.e.id}`) ?? 0)
    const xd = pl.chD + (laneOf.get(`ch${pl.chD}|${pl.e.id}`) ?? 0)
    const pts: Array<[number, number]> = []
    // leave the source
    const sGap = pl.src.side === 'top' ? pl.a.y - ROW_GAP : pl.src.side === 'bottom' ? pl.a.y + pl.a.h + ROW_GAP : sy
    if (pl.src.side === 'top' || pl.src.side === 'bottom') pts.push([sx, sGap])
    pts.push([xs, sGap])
    // travel
    const dGap = pl.dst.side === 'top' ? pl.b.y - ROW_GAP : pl.dst.side === 'bottom' ? pl.b.y + pl.b.h + ROW_GAP : dy
    if (pl.corridor) {
      const cy = corridorY + (laneOf.get(`corr|${pl.e.id}`) ?? 0)
      pts.push([xs, cy], [xd, cy])
    }
    pts.push([xd, dGap])
    if (pl.dst.side === 'top' || pl.dst.side === 'bottom') pts.push([dx, dGap])
    out.set(pl.e.id, { src: pl.src, dst: pl.dst, points: pts })
  }
  return out
}


/**
 * Layout with room reserved above the zones for the corridor that edges
 * spanning two or more columns ride on. `top` is where zones start.
 */
export function routedLayout(r: Resolved, opts: { left?: number; top?: number } = {}): { lay: Layout; top: number; corridorY: number } {
  const left = opts.left ?? 0, baseTop = opts.top ?? 0
  const probe = computeLayout(r)
  const colXs = [...new Set(probe.zones.map(z => z.x))].sort((a, b) => a - b)
  const colOfZone = (zid: string) => colXs.indexOf(probe.zones.find(z => z.zone.id === zid)!.x)
  const zoneOfNode = Object.fromEntries(probe.nodes.map(n => [n.node.id, n.node.zone]))
  const longEdges = probe.edges.filter(e => Math.abs(colOfZone(zoneOfNode[e.from]) - colOfZone(zoneOfNode[e.to])) > 1).length
  const corridorH = longEdges ? 28 + longEdges * LANE : 0
  const top = baseTop + corridorH
  return { lay: computeLayout(r, { top, left }), top, corridorY: top - corridorH / 2 - 4 }
}

/** Full polyline of a routed edge: source port, waypoints, target port. */
export function routePolyline(a: LaidNode, b: LaidNode, rt: Route): Array<[number, number]> {
  const s = portXY(a, rt.src), d = portXY(b, rt.dst)
  const pts: Array<[number, number]> = [s, ...rt.points, d]
  // make every segment orthogonal (draw.io's orthogonal style does the same)
  const out: Array<[number, number]> = [pts[0]]
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = out[out.length - 1], [x, y] = pts[i]
    if (px !== x && py !== y) {
      const horizontalFirst = i === 1 ? (rt.src.side === 'left' || rt.src.side === 'right') : !(rt.dst.side === 'left' || rt.dst.side === 'right')
      out.push(horizontalFirst ? [x, py] : [px, y])
    }
    out.push([x, y])
  }
  return out
}

export type { LaidEdge }
