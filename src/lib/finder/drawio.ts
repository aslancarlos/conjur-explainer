/**
 * draw.io (diagrams.net) export of a resolved selection.
 *
 * Zones are containers and every node is a child of its zone, so moving a
 * zone in draw.io moves its components. Customer and cloud components carry
 * the official draw.io icon (AWS4, Azure, Kubernetes, brand logos); IDIRA
 * components are product-coloured cards with a product badge. Edges are
 * orthogonal, attach to the side facing the other node and are spread along
 * that side so they do not pile up on one point.
 *
 * Colours are hex on purpose: the file is opened outside the site.
 */
import { routedLayout, type Port } from './routing'
import type { Direction, Product, Resolved } from './netCatalog'
import { DEFAULT_EXPORT_LABELS, DIRECTION_STYLE, PRODUCT_COLORS, type ExportLabels } from './exports'

// ---------------------------------------------------------------------------
// Icons (style strings from the draw.io shape library)
// ---------------------------------------------------------------------------

const AWS = (res: string, fill: string) =>
  `sketch=0;outlineConnect=0;fillColor=${fill};strokeColor=#ffffff;dashed=0;html=1;aspect=fixed;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.${res};`
const K8S = (icon: string) =>
  `aspect=fixed;sketch=0;html=1;dashed=0;fillColor=#2875E2;strokeColor=#ffffff;shape=mxgraph.kubernetes.icon2;prIcon=${icon};`
const IMG = (url: string) => `image;aspect=fixed;html=1;points=[];image=${url};`
const AZ = (path: string) => IMG(`https://app.diagrams.net/img/lib/azure2/${path}.svg`)
const FA = (name: string) => IMG(`https://icons.diagrams.net/assets/font-awesome/1/${name}.svg`)

/** Icon per catalog node id. Nodes without an entry get a product badge. */
const ICON: Record<string, string> = {
  'k8s-app': K8S('pod'),
  'k8s-api': K8S('control_plane'),
  'vm-app': IMG('https://icons.diagrams.net/assets/servers/1/Generic_Server.svg'),
  'cicd-self': IMG('https://icons.diagrams.net/assets/apps-and-system-logos/1/Jenkins.svg'),
  'platform-apps': IMG('https://icons.diagrams.net/assets/servers/1/Generic_Server.svg'),
  appserver: 'sketch=0;aspect=fixed;html=1;strokeColor=none;fillColor=#00188D;shape=mxgraph.mscae.enterprise.application_server;',
  'legacy-app': IMG('https://icons.diagrams.net/assets/servers/1/Windows_Server.svg'),
  db: 'shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=6;fillColor=#64748B;strokeColor=none;',
  iot: IMG('https://icons.diagrams.net/assets/iot-devices/1/Sensors.svg'),
  hcv: FA('Vault'),
  admins: FA('Users'),
  'sm-lb': AWS('elastic_load_balancing', '#8C4FFF'),
  'zos-job': 'sketch=0;html=1;dashed=0;fillColor=#036897;strokeColor=#ffffff;strokeWidth=2;shape=mxgraph.cisco.computers_and_peripherals.ibm_mainframe;',
  'zos-cp': 'sketch=0;html=1;dashed=0;fillColor=#036897;strokeColor=#ffffff;strokeWidth=2;shape=mxgraph.cisco.computers_and_peripherals.ibm_mainframe;',
  'ai-agent': FA('Robot'),
  gha: 'dashed=0;outlineConnect=0;html=1;shape=mxgraph.weblogos.github;',
  gitlab: IMG('https://icons.diagrams.net/icon-cache1/Brands_Pack-2317/gitlab-1375.svg'),
  azdo: AZ('devops/Azure_DevOps'),
  bitbucket: IMG('https://app.diagrams.net/img/lib/atlassian/Bitbucket_Logo.svg'),
  circleci: IMG('https://icons.diagrams.net/icon-cache1/CSS_Vol_1-2664/circleci-1342.svg'),
  octopus: FA('Octopus_Deploy_brand'),
  'aws-app': AWS('ec2', '#ED7100'),
  'aws-ec2': AWS('ec2', '#ED7100'),
  'aws-lambda': AWS('lambda', '#ED7100'),
  'aws-ecs': AWS('ecs', '#ED7100'),
  'azure-vm': AZ('compute/Virtual_Machine'),
  'azure-func': AZ('compute/Function_Apps'),
  'gcp-gce': 'sketch=0;html=1;aspect=fixed;strokeColor=none;fillColor=#3B8DF1;shape=mxgraph.gcp2.compute_engine_2;',
  'gcp-func': 'sketch=0;html=1;aspect=fixed;strokeColor=none;fillColor=#3B8DF1;shape=mxgraph.gcp2.compute_engine_2;',
  'aws-imds': AWS('ec2', '#ED7100'),
  'aws-sts': AWS('identity_and_access_management', '#DD344C'),
  'aws-sm': AWS('secrets_manager', '#DD344C'),
  'azure-app': AZ('compute/Virtual_Machine'),
  'azure-imds': AZ('identity/Managed_Identities'),
  entra: AZ('identity/Azure_Active_Directory'),
  akv: AZ('security/Key_Vaults'),
  'gcp-app': 'sketch=0;html=1;aspect=fixed;strokeColor=none;fillColor=#3B8DF1;shape=mxgraph.gcp2.compute_engine_2;',
  'gcp-iam': FA('Google_brand'),
  gsm: FA('Key'),
  anthropic: FA('Claude_brand'),
  'iot-broker': AWS('iot_core', '#7AA116'),
}

/** Fallback for external services without a library icon. */
const EXTERNAL_ICON = IMG('https://icons.diagrams.net/assets/generic/1/Cloud.svg')

/** Short product badge text for IDIRA components without a library icon. */
const BADGE: Record<Product, string> = { sm: 'SM', swa: 'SWA', cp: 'CP', shub: 'SH', customer: '', external: '' }

// ---------------------------------------------------------------------------
// XML helpers
// ---------------------------------------------------------------------------

const esc = (s: string) => s
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/\n/g, '&#10;')
/** Escape text placed inside an HTML label (then escaped again as an attribute). */
const h = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const r0 = (n: number) => Math.round(n)

function vertex(id: string, parent: string, value: string, style: string, x: number, y: number, w: number, hgt: number): string {
  return `<mxCell id="${esc(id)}" value="${esc(value)}" style="${esc(style)}" vertex="1" parent="${esc(parent)}"><mxGeometry x="${r0(x)}" y="${r0(y)}" width="${r0(w)}" height="${r0(hgt)}" as="geometry"/></mxCell>`
}

const portStyle = (p: Port, prefix: 'exit' | 'entry') => {
  const [x, y] = p.side === 'left' ? [0, p.f] : p.side === 'right' ? [1, p.f] : p.side === 'top' ? [p.f, 0] : [p.f, 1]
  return `${prefix}X=${x.toFixed(3)};${prefix}Y=${y.toFixed(3)};${prefix}Dx=0;${prefix}Dy=0;`
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export interface DrawioOptions {
  title?: string
  date?: string
  labels?: Partial<ExportLabels>
  selectedNames?: string[]      // human names of the selected items
  goalNames?: string[]          // human names of the goals
}

const PRODUCT_NAMES: Array<[Product, string]> = [
  ['sm', 'IDIRA Secrets Manager'], ['swa', 'Secure Workload Access'], ['cp', 'Credential Providers'], ['shub', 'Secrets Hub'],
]

const DASH: Record<'solid' | 'dashed' | 'dotted', string> = { solid: '', dashed: 'dashed=1;dashPattern=8 4;', dotted: 'dashed=1;dashPattern=2 4;' }

/** draw.io cell id of an edge end (card or zone border). */
const cellOf = (end: string) => (end.startsWith('zone:') ? `zone-${end.slice(5)}` : `node-${end}`)

/** Badge style: documented flows are filled, inferred ones hollow. */
const badgeStyle = (stroke: string, inferred: boolean) =>
  `ellipse;html=1;aspect=fixed;whiteSpace=wrap;align=center;verticalAlign=middle;fontStyle=1;fontSize=11;resizable=0;connectable=0;`
  + (inferred ? `fillColor=#FFFFFF;strokeColor=${stroke};strokeWidth=2;fontColor=${stroke};` : `fillColor=${stroke};strokeColor=#FFFFFF;strokeWidth=1.5;fontColor=#FFFFFF;`)

export function buildDrawio(r: Resolved, opts: DrawioOptions = {}): string {
  const L = { ...DEFAULT_EXPORT_LABELS, ...opts.labels }
  const date = opts.date ?? new Date().toISOString().slice(0, 10)
  const title = opts.title ?? L.title
  const selected = (opts.selectedNames ?? []).join(', ')
  const goals = (opts.goalNames ?? []).join(', ')

  const LEFT = 48
  const { lay, top: TOP, routes } = routedLayout(r, { left: LEFT, top: 170 })
  const cells: string[] = []

  // title block
  const titleW = Math.max(lay.width, 720)
  const lines = [
    `<font style="font-size:24px" color="#0F172A"><b>${h(title)}</b></font>`,
    `<font style="font-size:12px" color="#475569">${h(date)}${L.editionValue ? `  |  ${h(L.edition)}: ${h(L.editionValue)}` : ''}</font>`,
    selected ? `<font style="font-size:12px" color="#334155"><b>${h(L.selected)}:</b> ${h(selected)}</font>` : '',
    goals ? `<font style="font-size:12px" color="#334155"><b>${h(L.goals)}:</b> ${h(goals)}</font>` : '',
    `<font style="font-size:11px" color="#64748B">${h(L.generatedBy)}</font>`,
  ].filter(Boolean)
  cells.push(vertex('title', '1', lines.join('<br>'), 'text;html=1;whiteSpace=wrap;align=left;verticalAlign=top;spacing=0;spacingBottom=4;', LEFT, 28, titleW, 120))

  // zones (containers)
  for (const z of lay.zones) {
    const idira = z.zone.id === 'idira-saas'
    const stroke = idira ? PRODUCT_COLORS.sm.stroke : z.zone.customer ? '#64748B' : '#94A3B8'
    const fill = idira ? '#F5F8FE' : z.zone.customer ? '#F8FAFC' : '#FFFFFF'
    const style = `rounded=1;arcSize=2;absoluteArcSize=1;html=1;whiteSpace=wrap;container=1;collapsible=0;recursiveResize=0;`
      + `fillColor=${fill};strokeColor=${stroke};strokeWidth=1.5;${z.zone.customer ? '' : 'dashed=1;dashPattern=8 4;'}`
      + `verticalAlign=top;align=left;spacingLeft=20;spacingTop=14;fontSize=14;fontStyle=1;fontColor=${idira ? PRODUCT_COLORS.sm.stroke : '#1E293B'};`
    cells.push(vertex(`zone-${z.zone.id}`, '1', h(L.zones?.[z.zone.id] ?? z.zone.label), style, z.x, z.y, z.w, z.h))
  }

  // cards: child of the zone; icon or product badge child of the card
  const zoneOf = Object.fromEntries(lay.zones.map(z => [z.zone.id, z]))
  for (const n of lay.nodes) {
    const z = zoneOf[n.node.zone]
    const id = `node-${n.node.id}`
    const idira = n.node.product !== 'customer' && n.node.product !== 'external'
    const c = PRODUCT_COLORS[n.node.product]
    const cardStyle = `rounded=1;arcSize=8;html=1;whiteSpace=wrap;align=left;verticalAlign=middle;spacingLeft=80;spacingRight=10;`
      + `fillColor=${idira ? c.bg : '#FFFFFF'};strokeColor=${idira ? c.stroke : '#CBD5E1'};strokeWidth=${idira ? 1.5 : 1};`
      + `shadow=0;fontSize=13;fontColor=#0F172A;`
    const label = `<b>${h(n.node.label)}</b>${n.node.details ? `<br><font style="font-size:11px" color="#64748B">${h(n.node.details)}</font>` : ''}`
    cells.push(vertex(id, `zone-${n.node.zone}`, label, cardStyle, n.x - z.x, n.y - z.y, n.w, n.h))
    const icon = ICON[n.node.id] ?? (idira ? undefined : EXTERNAL_ICON)
    const S = 48, ix = 16, iy = (n.h - S) / 2
    if (icon) {
      cells.push(vertex(`${id}-icon`, id, '', `${icon}movable=0;resizable=0;editable=0;`, ix, iy, S, S))
    } else {
      const badge = BADGE[n.node.product] || '?'
      cells.push(vertex(`${id}-icon`, id, badge,
        `rounded=1;arcSize=22;html=1;fillColor=${c.stroke};strokeColor=none;fontColor=#FFFFFF;fontStyle=1;fontSize=${badge.length > 2 ? 12 : 14};align=center;verticalAlign=middle;movable=0;resizable=0;`,
        ix, iy, S, S))
    }
  }

  // edges + numbered badge (a circle attached to the edge, so it follows it when edited)
  for (const e of lay.edges) {
    const st = DIRECTION_STYLE[e.direction]
    const rt = routes.get(e.id)!
    const style = `edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;endArrow=block;endFill=1;endSize=7;`
      + `strokeWidth=1.75;strokeColor=${st.stroke};${DASH[st.style]}`
      + portStyle(rt.src, 'exit') + portStyle(rt.dst, 'entry')
    const pts = rt.points.length ? `<Array as="points">${rt.points.map(([x, y]) => `<mxPoint x="${r0(x)}" y="${r0(y)}"/>`).join('')}</Array>` : ''
    cells.push(`<mxCell id="${esc(e.id)}" value="" style="${esc(style)}" edge="1" parent="1" source="${esc(cellOf(e.from))}" target="${esc(cellOf(e.to))}"><mxGeometry relative="1" as="geometry">${pts}</mxGeometry></mxCell>`)
    const B = 24
    cells.push(`<mxCell id="${esc(e.id)}-n" value="${e.num}" style="${esc(badgeStyle(st.badge, e.inferred))}" vertex="1" connectable="0" parent="${esc(e.id)}"><mxGeometry x="${(rt.badge.t * 2 - 1).toFixed(4)}" relative="1" width="${B}" height="${B}" as="geometry"><mxPoint x="${-B / 2}" y="${-B / 2}" as="offset"/></mxGeometry></mxCell>`)
  }

  // legend (below the diagram, left) and the inferred note to its right
  const LW = 420, ly = TOP + lay.height + 48
  const rows: Array<[Direction, string]> = (['outbound', 'inbound', 'internal', 'external'] as Direction[])
    .filter(d => lay.edges.some(e => e.direction === d)).map(d => [d, L[d]])
  const LH = 44 + rows.length * 24 + 24 + 34 + 26 + 2 * 24 + 16
  cells.push(vertex('legend', '1', h(L.legend),
    'rounded=1;arcSize=3;absoluteArcSize=1;html=1;container=1;collapsible=0;fillColor=#FFFFFF;strokeColor=#CBD5E1;verticalAlign=top;align=left;spacingLeft=16;spacingTop=10;fontSize=13;fontStyle=1;fontColor=#1E293B;',
    LEFT, ly, LW, LH))
  let y = 46
  for (const [d, text] of rows) {
    const st = DIRECTION_STYLE[d]
    cells.push(`<mxCell id="legend-e-${d}" value="" style="endArrow=block;endFill=1;endSize=6;html=1;strokeWidth=1.75;strokeColor=${st.stroke};${DASH[st.style]}" edge="1" parent="legend"><mxGeometry relative="1" as="geometry"><mxPoint x="16" y="${y}" as="sourcePoint"/><mxPoint x="64" y="${y}" as="targetPoint"/></mxGeometry></mxCell>`)
    cells.push(vertex(`legend-t-${d}`, 'legend', h(text), 'text;html=1;align=left;verticalAlign=middle;fontSize=12;fontColor=#334155;', 76, y - 10, LW - 90, 20))
    y += 24
  }
  // badges: documented vs inferred
  y += 6
  cells.push(vertex('legend-b-doc', 'legend', '1', badgeStyle(DIRECTION_STYLE.outbound.badge, false), 28, y - 11, 22, 22))
  cells.push(vertex('legend-bt-doc', 'legend', h(L.badgeDocumented), 'text;html=1;align=left;verticalAlign=middle;fontSize=12;fontColor=#334155;whiteSpace=wrap;', 76, y - 10, LW - 90, 20))
  y += 30
  cells.push(vertex('legend-b-inf', 'legend', '2', badgeStyle(DIRECTION_STYLE.outbound.badge, true), 28, y - 11, 22, 22))
  cells.push(vertex('legend-bt-inf', 'legend', h(L.badgeInferred), 'text;html=1;align=left;verticalAlign=middle;fontSize=12;fontColor=#334155;whiteSpace=wrap;', 76, y - 10, LW - 90, 20))
  y += 30
  cells.push(vertex('legend-products', 'legend', h(L.products), 'text;html=1;align=left;verticalAlign=middle;fontSize=11;fontStyle=1;fontColor=#64748B;', 16, y - 9, 200, 18))
  y += 18
  PRODUCT_NAMES.forEach(([p, name], i) => {
    const c = PRODUCT_COLORS[p]
    const col = i % 2, row = Math.floor(i / 2)
    const px = 16 + col * 200, py = y + row * 24
    cells.push(vertex(`legend-p-${p}`, 'legend', '', `rounded=1;arcSize=30;html=1;fillColor=${c.bg};strokeColor=${c.stroke};strokeWidth=1.5;`, px, py, 20, 14))
    cells.push(vertex(`legend-pt-${p}`, 'legend', h(name), 'text;html=1;align=left;verticalAlign=middle;fontSize=11;fontColor=#334155;', px + 28, py - 3, 168, 20))
  })

  const noteW = Math.max(lay.width - LW - 48, 380)
  cells.push(vertex('note', '1', `<font color="#475569">${h(L.tableNote)}</font><br><br><font color="#64748B">${h(L.inferredNote)}</font>`,
    'text;html=1;whiteSpace=wrap;align=left;verticalAlign=top;fontSize=12;', LEFT + LW + 48, ly + 6, noteW, 90))

  const pageW = r0(LEFT * 2 + Math.max(lay.width, titleW, LW + 48 + noteW))
  const pageH = r0(ly + LH + 48)
  const model = `<mxGraphModel dx="${pageW}" dy="${pageH}" grid="0" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${pageW}" pageHeight="${pageH}" background="#FFFFFF" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>${cells.join('')}</root></mxGraphModel>`
  return `<mxfile host="demo.minha.cloud" agent="Machine Identity Academy" version="24.0.0"><diagram name="${esc(title)}" id="arch-${date}">${model}</diagram></mxfile>`
}

/** Plain mxGraphModel (no mxfile wrapper), for tools that want just the page. */
export function drawioModel(xml: string): string {
  const s = xml.indexOf('<mxGraphModel'), e = xml.lastIndexOf('</mxGraphModel>')
  return s >= 0 && e > s ? xml.slice(s, e + '</mxGraphModel>'.length) : xml
}

// ---------------------------------------------------------------------------
// "Open in diagrams.net"
// ---------------------------------------------------------------------------

/** URLs longer than this fall back to downloading the file. */
export const DRAWIO_URL_MAX = 2_000_000

async function deflateRaw(data: string): Promise<Uint8Array> {
  const stream = new Blob([new TextEncoder().encode(data)]).stream().pipeThrough(new CompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

function toBase64(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin)
}

/**
 * URL that opens the diagram in diagrams.net. Same encoding as draw.io's own
 * Graph.compress: base64(deflateRaw(encodeURIComponent(xml))), loaded from the
 * "#R" hash. Returns null when the browser lacks CompressionStream or the URL
 * would be too long (callers then offer the .drawio download).
 */
export async function drawioOpenUrl(xml: string): Promise<string | null> {
  if (typeof CompressionStream === 'undefined') return null
  const url = 'https://app.diagrams.net/#R' + encodeURIComponent(toBase64(await deflateRaw(encodeURIComponent(xml))))
  return url.length > DRAWIO_URL_MAX ? null : url
}
