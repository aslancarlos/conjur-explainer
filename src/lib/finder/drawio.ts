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
import type { LaidNode } from './layout'
import { routedLayout, routeEdges, type Port } from './routing'
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
  selectedNames?: string[]
}

const PRODUCT_NAMES: Array<[Product, string]> = [
  ['sm', 'IDIRA Secrets Manager'], ['swa', 'Secure Workload Access'], ['cp', 'Credential Providers'], ['shub', 'Secrets Hub'],
]

const DASH: Record<'solid' | 'dashed' | 'dotted', string> = { solid: '', dashed: 'dashed=1;dashPattern=8 4;', dotted: 'dashed=1;dashPattern=2 3;' }

export function buildDrawio(r: Resolved, opts: DrawioOptions = {}): string {
  const L = { ...DEFAULT_EXPORT_LABELS, ...opts.labels }
  const date = opts.date ?? new Date().toISOString().slice(0, 10)
  const title = opts.title ?? L.title
  const selected = (opts.selectedNames ?? r.selected).join(', ')

  const LEFT = 40
  const { lay, top: TOP, corridorY } = routedLayout(r, { left: LEFT, top: 150 })
  const box: Record<string, LaidNode> = Object.fromEntries(lay.nodes.map(n => [n.node.id, n]))
  const cells: string[] = []

  // title block
  const titleW = Math.max(lay.width, 640)
  cells.push(vertex('title', '1',
    `<font style="font-size:22px"><b>${h(title)}</b></font><br><font style="font-size:12px" color="#475569">${h(date)} | ${h(L.edition)}: ${h(L.editionValue)}</font><br><font style="font-size:12px" color="#475569">${h(L.selected)}: ${h(selected)}</font><br><font style="font-size:11px" color="#64748B">${h(L.generatedBy)}</font>`,
    'text;html=1;whiteSpace=wrap;align=left;verticalAlign=top;spacing=0;', LEFT, 24, titleW, 110))

  // zones (containers)
  for (const z of lay.zones) {
    const idira = z.zone.id === 'idira-saas'
    const stroke = idira ? PRODUCT_COLORS.sm.stroke : z.zone.customer ? '#475569' : '#94A3B8'
    const fill = idira ? '#F4F8FE' : z.zone.customer ? '#F8FAFC' : '#FFFFFF'
    const style = `rounded=1;arcSize=3;absoluteArcSize=1;html=1;whiteSpace=wrap;container=1;collapsible=0;recursiveResize=0;`
      + `fillColor=${fill};strokeColor=${stroke};strokeWidth=1.5;${z.zone.customer ? '' : 'dashed=1;dashPattern=8 4;'}`
      + `verticalAlign=top;align=left;spacingLeft=16;spacingTop=12;fontSize=12;fontStyle=1;fontColor=${idira ? PRODUCT_COLORS.sm.stroke : '#334155'};`
    cells.push(vertex(`zone-${z.zone.id}`, '1', z.zone.label.toUpperCase(), style, z.x, z.y, z.w, z.h))
  }

  // nodes: card (child of its zone) + icon or badge (child of the card)
  const zoneOf = Object.fromEntries(lay.zones.map(z => [z.zone.id, z]))
  for (const n of lay.nodes) {
    const z = zoneOf[n.node.zone]
    const id = `node-${n.node.id}`
    const idira = n.node.product !== 'customer' && n.node.product !== 'external'
    const c = PRODUCT_COLORS[n.node.product]
    const cardStyle = `rounded=1;arcSize=10;html=1;whiteSpace=wrap;align=left;verticalAlign=middle;spacingLeft=64;spacingRight=8;`
      + `fillColor=${idira ? c.bg : '#FFFFFF'};strokeColor=${idira ? c.stroke : '#CBD5E1'};strokeWidth=${idira ? 1.5 : 1};`
      + `shadow=0;fontSize=12;fontColor=#0F172A;`
    const label = `<b>${h(n.node.label)}</b>${n.node.details ? `<br><font style="font-size:10px" color="#64748B">${h(n.node.details)}</font>` : ''}`
    cells.push(vertex(id, `zone-${n.node.zone}`, label, cardStyle, n.x - z.x, n.y - z.y, n.w, n.h))
    const icon = ICON[n.node.id] ?? (idira ? undefined : EXTERNAL_ICON)
    const S = 40, ix = 14, iy = (n.h - S) / 2
    if (icon) {
      cells.push(vertex(`${id}-icon`, id, '', `${icon}movable=0;resizable=0;editable=0;`, ix, iy, S, S))
    } else {
      const badge = BADGE[n.node.product] || '?'
      cells.push(vertex(`${id}-icon`, id, badge,
        `rounded=1;arcSize=24;html=1;fillColor=${c.stroke};strokeColor=none;fontColor=#FFFFFF;fontStyle=1;fontSize=${badge.length > 2 ? 10 : 12};align=center;verticalAlign=middle;movable=0;resizable=0;`,
        ix, iy, S, S))
    }
  }

  // edges
  const routes = routeEdges(lay, box, corridorY)
  const flowById = Object.fromEntries(r.flows.map(f => [f.id, f]))
  for (const e of lay.edges) {
    const st = DIRECTION_STYLE[e.direction]
    const inferred = e.flowIds.every(id => flowById[id]?.confidence === 'inferred')
    const rt = routes.get(e.id)!
    const style = `edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;endArrow=block;endFill=1;endSize=6;`
      + `strokeWidth=1.5;strokeColor=${st.stroke};${inferred && st.style === 'solid' ? DASH.dashed : DASH[st.style]}`
      + `fontSize=10;fontColor=${st.stroke};labelBackgroundColor=#FFFFFF;labelBorderColor=none;`
      + portStyle(rt.src, 'exit') + portStyle(rt.dst, 'entry')
    const label = `${e.label}${inferred ? ' *' : ''}`
    const pts = rt.points.length ? `<Array as="points">${rt.points.map(([x, y]) => `<mxPoint x="${r0(x)}" y="${r0(y)}"/>`).join('')}</Array>` : ''
    cells.push(`<mxCell id="${esc(e.id)}" value="${esc(label)}" style="${esc(style)}" edge="1" parent="1" source="node-${esc(e.from)}" target="node-${esc(e.to)}"><mxGeometry relative="1" as="geometry">${pts}</mxGeometry></mxCell>`)
  }

  // legend (below the diagram, left; the inferred note sits to its right)
  const LW = 360, LH = 236
  const lx = LEFT, ly = TOP + lay.height + 40
  cells.push(vertex('legend', '1', L.legend.toUpperCase(),
    'rounded=1;arcSize=4;absoluteArcSize=1;html=1;container=1;collapsible=0;fillColor=#FFFFFF;strokeColor=#CBD5E1;verticalAlign=top;align=left;spacingLeft=14;spacingTop=8;fontSize=11;fontStyle=1;fontColor=#334155;',
    lx, ly, LW, LH))
  const rows: Array<[Direction, string]> = [['outbound', L.outbound], ['inbound', L.inbound], ['internal', L.internal], ['external', L.external]]
  rows.forEach(([d, text], i) => {
    const st = DIRECTION_STYLE[d]
    const y = 38 + i * 22
    cells.push(`<mxCell id="legend-e-${d}" value="" style="endArrow=block;endFill=1;endSize=5;html=1;strokeWidth=1.5;strokeColor=${st.stroke};${DASH[st.style]}" edge="1" parent="legend"><mxGeometry relative="1" as="geometry"><mxPoint x="14" y="${y}" as="sourcePoint"/><mxPoint x="58" y="${y}" as="targetPoint"/></mxGeometry></mxCell>`)
    cells.push(vertex(`legend-t-${d}`, 'legend', h(text), 'text;html=1;align=left;verticalAlign=middle;fontSize=11;fontColor=#334155;', 66, y - 9, LW - 80, 18))
  })
  const yInf = 38 + rows.length * 22
  cells.push(`<mxCell id="legend-e-inferred" value="" style="endArrow=block;endFill=1;endSize=5;html=1;strokeWidth=1.5;strokeColor=#475569;${DASH.dashed}" edge="1" parent="legend"><mxGeometry relative="1" as="geometry"><mxPoint x="14" y="${yInf}" as="sourcePoint"/><mxPoint x="58" y="${yInf}" as="targetPoint"/></mxGeometry></mxCell>`)
  cells.push(vertex('legend-t-inferred', 'legend', h(L.inferred), 'text;html=1;align=left;verticalAlign=middle;fontSize=11;fontColor=#334155;', 66, yInf - 9, LW - 80, 18))
  const yp = yInf + 26
  cells.push(vertex('legend-products', 'legend', h(L.products.toUpperCase()), 'text;html=1;align=left;verticalAlign=middle;fontSize=10;fontStyle=1;fontColor=#64748B;', 14, yp - 9, 200, 18))
  PRODUCT_NAMES.forEach(([p, name], i) => {
    const c = PRODUCT_COLORS[p]
    const col = i % 2, row = Math.floor(i / 2)
    const x = 14 + col * 172, y = yp + 14 + row * 24
    cells.push(vertex(`legend-p-${p}`, 'legend', '', `rounded=1;arcSize=30;html=1;fillColor=${c.bg};strokeColor=${c.stroke};strokeWidth=1.5;`, x, y, 18, 14))
    cells.push(vertex(`legend-pt-${p}`, 'legend', h(name), 'text;html=1;align=left;verticalAlign=middle;fontSize=10;fontColor=#334155;', x + 24, y - 2, 146, 18))
  })

  // inferred-flows note, right of the legend
  const noteW = Math.max(lay.width - LW - 40, 360)
  cells.push(vertex('note', '1', `<font color="#64748B">* ${h(L.inferredNote)}</font>`,
    'text;html=1;whiteSpace=wrap;align=left;verticalAlign=top;fontSize=11;', LEFT + LW + 40, ly + 8, noteW, 60))

  const pageW = r0(LEFT * 2 + Math.max(lay.width, titleW, LW + 40 + noteW))
  const pageH = r0(ly + LH + 40)
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
