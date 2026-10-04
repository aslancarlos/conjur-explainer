/**
 * Live services behind demo.minha.cloud, checked from the browser (same
 * origin). `json`: body must contain {"status":"ok"}; `http`: any 2xx.
 * HTTP 503 means the demo is intentionally scaled down (maintenance page),
 * not broken. Only the status field is read: never secret-looking fields.
 */
export interface LiveService {
  key: string
  name: string
  check: string
  kind: 'json' | 'http'
  open?: string        // console / app to open from the status panel
}

export const SERVICES: LiveService[] = [
  { key: 'spring',    name: 'Spring Boot',          check: '/springboot/checkit',  kind: 'json', open: '/springboot/dashboard' },
  { key: 'eso',       name: 'ESO Shop',             check: '/k8s-eso/health',      kind: 'json', open: '/eso-shop/' },
  { key: 'dotnet',    name: '.NET',                 check: '/dotnet/usuarios',     kind: 'http', open: '/dotnet/usuarios' },
  { key: 'svid',      name: 'SVID Explorer',        check: '/svid',                kind: 'http', open: '/svid' },
  { key: 'swa',       name: 'SWA → AWS S3',         check: '/swa-s3/',             kind: 'http', open: '/swa-s3/' },
  { key: 'k8s',       name: 'Kubernetes Dashboard', check: '/dashboard/',          kind: 'http', open: '/dashboard/' },
  { key: 'grafana',   name: 'Grafana',              check: '/grafana/api/health',  kind: 'http', open: '/grafana/' },
]

export type ServiceState = 'checking' | 'ok' | 'maintenance' | 'down'

export interface ServiceResult { state: ServiceState; ms?: number; code?: number }

const SPA_MARKER = '<div id="root"></div>'
/** The marker sits in index.html's body, after the head; never read past this. */
const MARKER_SCAN_BYTES = 16 * 1024

/**
 * Stream the body until the SPA marker shows up or MARKER_SCAN_BYTES were read,
 * then cancel: a service page (dashboard, Grafana) can be large and only its
 * start matters here.
 */
async function hasSpaMarker(r: Response): Promise<boolean> {
  const reader = r.body?.getReader()
  if (!reader) return false
  const decoder = new TextDecoder()
  let text = ''
  let read = 0
  try {
    while (read < MARKER_SCAN_BYTES) {
      const { done, value } = await reader.read()
      if (done) break
      read += value.byteLength
      text += decoder.decode(value, { stream: true })
      if (text.includes(SPA_MARKER)) return true
    }
    return false
  } catch {
    return false
  } finally {
    reader.cancel().catch(() => {})
  }
}

export async function checkService(s: LiveService, timeoutMs = 6000): Promise<ServiceResult> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  const t0 = performance.now()
  try {
    const r = await fetch(s.check, { cache: 'no-store', signal: ctrl.signal, redirect: 'follow' })
    const ms = Math.round(performance.now() - t0)
    if (r.status === 503) return { state: 'maintenance', ms, code: r.status }
    if (!r.ok) return { state: 'down', ms, code: r.status }
    if (s.kind === 'json') {
      const j = await r.json().catch(() => null) as { status?: string } | null
      return { state: j?.status === 'ok' ? 'ok' : 'down', ms, code: r.status }
    }
    // A 2xx that is this site's own SPA shell means the route is not served by
    // the service (dev server / nginx try_files fallback), so it is not "online".
    if (await hasSpaMarker(r)) return { state: 'down', ms, code: r.status }
    return { state: 'ok', ms, code: r.status }
  } catch {
    return { state: 'down' }
  } finally {
    clearTimeout(timer)
  }
}
