/**
 * Orthogonal edge routing shared by the draw.io export and the in-page SVG
 * preview, so both draw the same paths and badges.
 *
 * - Neighbours inside a zone connect directly (side to side, top to bottom).
 * - Other edges in one zone travel along the row gap or the column gap.
 * - Everything else runs through the vertical channel between two columns;
 *   a card with a sibling between it and the channel leaves through the row
 *   gap below it, so no edge cuts a card.
 * - Edges spanning two columns ride a corridor above the zones.
 * - Each channel has lanes (LANE apart); their order is chosen by a small
 *   local search that minimises crossings.
 * - Each edge gets a numbered badge placed on its path away from cards and
 *   from other badges (`badge.t` is the fraction of the path length, which
 *   draw.io uses to place the edge label).
 */
import { computeLayout, GAP_X, GAP_Y, PAD_TOP, type Endpoint, type LaidEdge, type Layout } from './layout'
import type { Resolved } from './netCatalog'

export type Side = 'left' | 'right' | 'top' | 'bottom'
export interface Port { side: Side; f: number }
export type Pt = [number, number]
export interface Route { src: Port; dst: Port; points: Pt[]; poly: Pt[]; badge: { x: number; y: number; t: number } }

export const LANE = 14
const STUB = 18                 // distance from a card side to the gap line it travels on
const BADGE_R = 12

export function portXY(n: Endpoint, p: Port): Pt {
  if (p.side === 'left') return [n.x, n.y + p.f * n.h]
  if (p.side === 'right') return [n.x + n.w, n.y + p.f * n.h]
  if (p.side === 'top') return [n.x + p.f * n.w, n.y]
  return [n.x + p.f * n.w, n.y + n.h]
}

type Kind = 'direct' | 'rowgap' | 'colgap' | 'diag' | 'ell' | 'channel'
interface Plan {
  e: LaidEdge; a: Endpoint; b: Endpoint; kind: Kind
  src: Port; dst: Port
  chS?: number; chD?: number      // channel index (vertical run near the source / target)
  corridor?: boolean              // spans 2+ columns
  passY?: number                  // y of the horizontal run across the skipped columns
  passAt?: 'src' | 'dst' | 'free' // run level with the source port, the target port, or a free band
  gx?: number                     // column-gap x (colgap / diag)
}

/** Builds and routes the layout. `top` is where zones start (room above for the corridor). */
export function routedLayout(r: Resolved, opts: { left?: number; top?: number } = {}): { lay: Layout; top: number; corridorY: number; routes: Map<string, Route> } {
  const left = opts.left ?? 0, baseTop = opts.top ?? 0
  // long edges (skipping a column) cross the middle column through a free
  // horizontal band; the band above the zones is the fallback
  const top = baseTop + 40
  const lay = computeLayout(r, { top, left })
  const corridorY = top - 24
  return { lay, top, corridorY, routes: routeEdges(lay, corridorY) }
}

export function routeEdges(lay: Layout, corridorY: number): Map<string, Route> {
  const { ends, nodes } = lay
  const nCols = lay.colX.length
  /** Channel i runs between column i and i+1; -1 is left of column 0, nCols-1 right of the last. */
  const chX = (i: number) => i < 0 ? lay.colX[0] - 48 : i >= nCols - 1 ? lay.colR[nCols - 1] + 48 : (lay.colR[i] + lay.colX[i + 1]) / 2
  const cardsOfZone = (z: string) => nodes.filter(n => n.node.zone === z)
  /** A sibling card between a card and the zone side `side`. */
  const blocked = (n: Endpoint, side: 'left' | 'right') => !n.isZone && cardsOfZone(n.zone).some(o => o.row === n.row && (side === 'right' ? o.x > n.x : o.x < n.x))
  const facing = (a: Endpoint, b: Endpoint): 'left' | 'right' => (b.col > a.col ? 'right' : b.col < a.col ? 'left' : a.col < nCols - 1 ? 'right' : 'left')
  /** Port for leaving towards a channel on `side`; a blocked card leaves through the row gap below (or above). */
  const exitPort = (n: Endpoint, side: 'left' | 'right', otherY: number): Port => {
    if (!blocked(n, side)) return { side, f: 0.5 }
    const up = otherY < n.y && n.row > 0
    return { side: up ? 'top' : 'bottom', f: 0.5 }
  }

  const plans: Plan[] = []
  for (const e of lay.edges) {
    const a = ends[e.from], b = ends[e.to]
    const sameZone = a.zone === b.zone && !a.isZone && !b.isZone
    if (sameZone) {
      if (a.row === b.row && Math.abs(a.gridCol - b.gridCol) === 1) {
        const right = b.x > a.x
        plans.push({ e, a, b, kind: 'direct', src: { side: right ? 'right' : 'left', f: 0.5 }, dst: { side: right ? 'left' : 'right', f: 0.5 } })
      } else if (a.gridCol === b.gridCol && Math.abs(a.row - b.row) === 1) {
        const down = b.y > a.y
        plans.push({ e, a, b, kind: 'direct', src: { side: down ? 'bottom' : 'top', f: 0.5 }, dst: { side: down ? 'top' : 'bottom', f: 0.5 } })
      } else if (a.row === b.row) {
        plans.push({ e, a, b, kind: 'rowgap', src: { side: 'bottom', f: 0.5 }, dst: { side: 'bottom', f: 0.5 } })
      } else if (a.gridCol === b.gridCol) {
        const zoneCards = cardsOfZone(a.zone)
        const hasRight = zoneCards.some(o => o.gridCol > a.gridCol)
        const hasLeft = zoneCards.some(o => o.gridCol < a.gridCol)
        // between card columns use the middle of the gap; on the zone edge stay inside the padding
        const gx = hasRight ? a.x + a.w + GAP_X / 2 : a.x - (hasLeft ? GAP_X / 2 : 14)
        const side: Side = hasRight ? 'right' : 'left'
        plans.push({ e, a, b, kind: 'colgap', gx, src: { side, f: 0.5 }, dst: { side, f: 0.5 } })
      } else {
        const right = b.x > a.x
        const down = b.y > a.y
        // L shape (one bend) when no card sits under/over the source on the way down/up
        const cx = a.x + a.w / 2, ty = b.y + b.h / 2
        const lo = Math.min(a.y, ty), hi = Math.max(a.y + a.h, ty)
        const clear = !cardsOfZone(a.zone).some(o => o.node.id !== a.id && o.node.id !== b.id && cx > o.x && cx < o.x + o.w && o.y < hi && o.y + o.h > lo)
          && !cardsOfZone(a.zone).some(o => o.node.id !== a.id && o.node.id !== b.id && ty > o.y - 4 && ty < o.y + o.h + 4 && (right ? o.x > cx && o.x < b.x : o.x + o.w < cx && o.x > b.x))
        if (clear) {
          plans.push({ e, a, b, kind: 'ell', src: { side: down ? 'bottom' : 'top', f: 0.5 }, dst: { side: right ? 'left' : 'right', f: 0.5 } })
          continue
        }
        plans.push({ e, a, b, kind: 'diag', gx: right ? b.x - GAP_X / 2 : b.x + b.w + GAP_X / 2,
          src: { side: down ? 'bottom' : (a.row > 0 ? 'top' : 'bottom'), f: 0.5 }, dst: { side: right ? 'left' : 'right', f: 0.5 } })
      }
      continue
    }
    const sa = facing(a, b), sb = facing(b, a)
    const corridor = Math.abs(a.col - b.col) > 1
    const chS = a.col === b.col ? (sa === 'right' ? a.col : a.col - 1) : sa === 'right' ? a.col : a.col - 1
    const chD = a.col === b.col ? chS : sb === 'right' ? b.col : b.col - 1
    const ay = a.y + a.h / 2, by = b.y + b.h / 2
    let passY: number | undefined
    if (corridor) {
      // free y across the skipped columns, closest to the two ends
      const x1 = Math.min(chX(chS), chX(chD)), x2 = Math.max(chX(chS), chX(chD))
      const blockers = lay.zones.filter(z => z.x < x2 && z.x + z.w > x1 && z.col !== a.col && z.col !== b.col)
      const free = (y: number) => !blockers.some(z => y > z.y - 14 && y < z.y + z.h + 14)
      const cands = [ay, by, corridorY, ...blockers.flatMap(z => [z.y - 30, z.y + z.h + 30])]
      passY = cands.filter(free).sort((p, q) => (Math.abs(ay - p) + Math.abs(p - by)) - (Math.abs(ay - q) + Math.abs(q - by)))[0] ?? corridorY
    }
    const passAt = passY === undefined ? undefined : passY === ay ? 'src' : passY === by ? 'dst' : 'free'
    plans.push({ e, a, b, kind: 'channel', chS, chD, corridor, passY, passAt,
      src: exitPort(a, sa, corridor ? passY! : by), dst: exitPort(b, sb, corridor ? passY! : ay) })
  }

  // ---- spread ports along each side, ordered by where the other end sits ----
  const buckets = new Map<string, Array<{ p: Port; key: number; zone: boolean }>>()
  const add = (n: Endpoint, port: Port, other: Endpoint) => {
    const k = `${n.id}|${port.side}`
    const horizontal = port.side === 'top' || port.side === 'bottom'
    const key = horizontal ? other.x + other.w / 2 : other.y + other.h / 2
    buckets.set(k, [...(buckets.get(k) ?? []), { p: port, key, zone: n.isZone }])
  }
  for (const pl of plans) { add(pl.a, pl.src, pl.b); add(pl.b, pl.dst, pl.a) }
  for (const list of buckets.values()) {
    list.sort((p, q) => p.key - q.key)
    // zone borders: keep ports in the middle band, away from the title
    const lo = list[0].zone ? 0.3 : 0, hi = list[0].zone ? 0.85 : 1
    list.forEach((it, i) => { it.p.f = lo + (hi - lo) * (i + 1) / (list.length + 1) })
  }

  // ---- lanes ----
  const laneMembers = new Map<string, string[]>()   // channel key -> edge ids, in lane order
  const join = (k: string, id: string) => laneMembers.set(k, [...(laneMembers.get(k) ?? []), id])
  for (const pl of plans) if (pl.kind === 'channel') {
    join(`ch${pl.chS}`, pl.e.id)
    if (pl.chD !== pl.chS) join(`ch${pl.chD}`, pl.e.id)
    if (pl.corridor) join(`pass${Math.round(pl.passY!)}`, pl.e.id)
  }
  // initial order: by the y of the far end, a decent start for the search
  for (const [k, ids] of laneMembers) {
    const key = (id: string) => { const pl = plans.find(p => p.e.id === id)!; return (pl.b.y + pl.b.h / 2) + (pl.a.y + pl.a.h / 2) / 1000 }
    laneMembers.set(k, [...ids].sort((p, q) => key(p) - key(q)))
  }
  const offset = (k: string, id: string) => {
    const ids = laneMembers.get(k) ?? []
    const i = ids.indexOf(id)
    return i < 0 ? 0 : (i - (ids.length - 1) / 2) * LANE
  }

  const gapY = (n: Endpoint, side: Side) => {
    if (side === 'top') return n.row > 0 ? n.y - GAP_Y / 2 : n.y - STUB
    return n.row < n.rows - 1 ? n.y + n.h + GAP_Y / 2 : n.y + n.h + STUB
  }

  const pointsOf = (pl: Plan): Pt[] => {
    const [sx, sy] = portXY(pl.a, pl.src)
    const [dx, dy] = portXY(pl.b, pl.dst)
    switch (pl.kind) {
      case 'direct': return []
      case 'rowgap': { const y = gapY(pl.a, 'bottom'); return [[sx, y], [dx, y]] }
      case 'colgap': return [[pl.gx!, sy], [pl.gx!, dy]]
      case 'ell': return [[sx, dy]]
      case 'diag': { const y = gapY(pl.a, pl.src.side); return [[sx, y], [pl.gx!, y], [pl.gx!, dy]] }
      case 'channel': {
        const xs = chX(pl.chS!) + offset(`ch${pl.chS}`, pl.e.id)
        const xd = chX(pl.chD!) + offset(`ch${pl.chD}`, pl.e.id)
        const pts: Pt[] = []
        const vS = pl.src.side === 'top' || pl.src.side === 'bottom'
        const yS = vS ? gapY(pl.a, pl.src.side) : sy
        if (vS) pts.push([sx, yS])
        pts.push([xs, yS])
        const vD = pl.dst.side === 'top' || pl.dst.side === 'bottom'
        const yD = vD ? gapY(pl.b, pl.dst.side) : dy
        if (pl.corridor) {
          const py = pl.passY!
          const k = `pass${Math.round(py)}`
          if (pl.passAt === 'src') { pts.pop(); pts.push([xd, yS]) }                // straight across from the source
          else if (pl.passAt === 'dst') { pts.push([xs, yD]) }                      // down the source channel, straight in
          else { const cy = py + offset(k, pl.e.id); pts.push([xs, cy], [xd, cy]) }
        }
        pts.push([xd, yD])
        if (vD) pts.push([dx, yD])
        return pts
      }
    }
  }
  const polyOf = (pl: Plan): Pt[] => {
    const raw: Pt[] = [portXY(pl.a, pl.src), ...pointsOf(pl), portXY(pl.b, pl.dst)]
    const out: Pt[] = [raw[0]]
    for (let i = 1; i < raw.length; i++) {
      const [px, py] = out[out.length - 1], [x, y] = raw[i]
      if (px === x && py === y) continue
      if (px !== x && py !== y) {
        // a direct side-to-side link between offset ports: go through the middle
        const sideways = i === 1 ? (pl.src.side === 'left' || pl.src.side === 'right') : !(pl.dst.side === 'left' || pl.dst.side === 'right')
        if (pl.kind === 'direct' && raw.length === 2) {
          if (sideways) { const mx = (px + x) / 2; out.push([mx, py], [mx, y]) } else { const my = (py + y) / 2; out.push([px, my], [x, my]) }
        } else out.push(sideways ? [x, py] : [px, y])
      }
      out.push([x, y])
    }
    return out
  }

  // ---- crossing-minimising lane order ----
  const segs = (poly: Pt[]) => poly.slice(1).map((p, i) => [poly[i], p] as [Pt, Pt])
  const cross = (p: Pt[], q: Pt[]) => {
    let n = 0
    for (const [a1, a2] of segs(p)) for (const [b1, b2] of segs(q)) {
      const ah = a1[1] === a2[1], bh = b1[1] === b2[1]
      if (ah === bh) {
        // collinear overlap is worse than a crossing
        if (ah && a1[1] === b1[1] && Math.min(Math.max(a1[0], a2[0]), Math.max(b1[0], b2[0])) - Math.max(Math.min(a1[0], a2[0]), Math.min(b1[0], b2[0])) > 1) n += 3
        if (!ah && a1[0] === b1[0] && Math.min(Math.max(a1[1], a2[1]), Math.max(b1[1], b2[1])) - Math.max(Math.min(a1[1], a2[1]), Math.min(b1[1], b2[1])) > 1) n += 3
        continue
      }
      const [h1, h2, v1, v2] = ah ? [a1, a2, b1, b2] : [b1, b2, a1, a2]
      const x = v1[0], y = h1[1]
      if (x > Math.min(h1[0], h2[0]) + 0.5 && x < Math.max(h1[0], h2[0]) - 0.5 && y > Math.min(v1[1], v2[1]) + 0.5 && y < Math.max(v1[1], v2[1]) - 0.5) n++
    }
    return n
  }
  const total = () => {
    const polys = plans.map(polyOf)
    let n = 0
    for (let i = 0; i < polys.length; i++) for (let j = i + 1; j < polys.length; j++) n += cross(polys[i], polys[j])
    return n
  }
  let best = total()
  for (let pass = 0; pass < 4 && best > 0; pass++) {
    let improved = false
    for (const [k, ids] of laneMembers) {
      for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
        ;[ids[i], ids[j]] = [ids[j], ids[i]]
        const n = total()
        if (n < best) { best = n; improved = true } else { [ids[i], ids[j]] = [ids[j], ids[i]] }
      }
      laneMembers.set(k, ids)
    }
    if (!improved) break
  }

  // ---- badges ----
  const placed: Pt[] = []
  const inCard = (x: number, y: number) => nodes.some(n => x > n.x - BADGE_R - 4 && x < n.x + n.w + BADGE_R + 4 && y > n.y - BADGE_R - 4 && y < n.y + n.h + BADGE_R + 4)
  const inTitle = (x: number, y: number) => lay.zones.some(z => x > z.x && x < z.x + z.w * 0.75 && y > z.y && y < z.y + PAD_TOP - 6)
  const out = new Map<string, Route>()
  for (const pl of plans) {
    const poly = polyOf(pl)
    const lens = segs(poly).map(([p, q]) => Math.abs(q[0] - p[0]) + Math.abs(q[1] - p[1]))
    const L = lens.reduce((s, v) => s + v, 0) || 1
    const at = (t: number): Pt => {
      let d = t * L
      for (let i = 0; i < lens.length; i++) {
        if (d <= lens[i] || i === lens.length - 1) {
          const [p, q] = segs(poly)[i]; const u = lens[i] ? Math.min(1, d / lens[i]) : 0
          return [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u]
        }
        d -= lens[i]
      }
      return poly[0]
    }
    // candidates: the horizontal stub next to the source (so the number sits by
    // the card it leaves), then the one next to the target, then the middle of
    // each segment (longest first), then fractions of the whole path
    const cands: number[] = []
    let acc = 0
    const mids = segs(poly).map(([p, q], i) => { const t = (acc + lens[i] / 2) / L; acc += lens[i]; return { t, len: lens[i], horiz: p[1] === q[1], i } })
    const n = mids.length
    const stub = (i: number) => mids[i] && mids[i].horiz && mids[i].len >= 2 * BADGE_R + 16
    if (stub(0)) cands.push(mids[0].t)
    if (stub(1) && !mids[0].horiz) cands.push(mids[1].t)
    if (stub(n - 1)) cands.push(mids[n - 1].t)
    if (stub(n - 2) && !mids[n - 1].horiz) cands.push(mids[n - 2].t)
    ;[...mids].sort((p, q) => q.len - p.len).forEach(m => cands.push(m.t))
    for (let k = 1; k < 20; k++) cands.push(k / 20)
    let chosen = { t: 0.5, p: at(0.5) }
    for (const t of cands) {
      const p = at(t)
      if (inCard(p[0], p[1]) || inTitle(p[0], p[1])) continue
      if (placed.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < BADGE_R * 2 + 6)) continue
      chosen = { t, p }
      break
    }
    placed.push(chosen.p)
    out.set(pl.e.id, { src: pl.src, dst: pl.dst, points: pointsOf(pl), poly, badge: { x: chosen.p[0], y: chosen.p[1], t: chosen.t } })
  }
  return out
}

export type { LaidEdge }
