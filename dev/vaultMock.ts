import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * Local dev only (`VAULT_MOCK=1 npm run dev`): an in-memory imitation of
 * vault-control (/api/vault), the backend of the Cofre Info page. It never
 * reaches the production build (`apply: 'serve'`). Response shapes follow
 * vault-control/main.go, history.go and dual.go.
 *
 * Pair rotations run on a short clock (the Central Policy Manager "confirms" in
 * 8 s). POST /api/vault/__mock {"outcome": ...} picks how the next rotation
 * ends: "ok", "forbidden" (PATCH 403, permission "Update account properties"),
 * "failure" (the Central Policy Manager reports failure) or "slow" (never
 * confirms: fails after the 5 minute timeout). {"reset": true} restores the
 * initial Safe. Only metadata exists here: there is no secret value at all.
 * /presence answers like vault-control/presence.go (online tabs + the rotation
 * to announce), with two extra simulated tabs.
 */

type Outcome = 'ok' | 'forbidden' | 'failure' | 'slow'
interface Version { id: number; by: string; at: number; temporary?: boolean } // at: epoch seconds
interface Acct {
  id: string; name: string; userName: string; address: string; platformId: string
  props: Record<string, string>; status: string; auto: boolean; lmt: number; versions: Version[]
}
interface Step { step: string; at: string }
interface Rot {
  rotationId: string; virtualUserName: string; from: string; to: string
  target: { id: string; name: string; userName: string }; other: { id: string; name: string; userName: string }
  step: string; steps: Step[]; errorCode?: string; reason?: string; cpmTimeoutSeconds: number
  deadline?: string; startedAt: string; finishedAt?: string; serverTime?: string
  t0: number; outcome: Outcome
}

const SAFE = 'dev-demo-aslan'
const CRED = 'svc-cofre-info-api'
const CPM_TIMEOUT_S = 300
const now = () => Math.floor(Date.now() / 1000)
const iso = (s: number) => new Date(s * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z')

function seed(): Acct[] {
  const t = now()
  const h = (x: number) => t - x * 3600
  return [
    { id: '116_3', name: 'appuser_db', userName: 'appuser_db', address: 'mysql.eso-shop.svc', platformId: 'MySQL', auto: true, status: 'success',
      props: { VirtualUsername: 'dbuser_dual', Index: '1', DualAccountStatus: 'Active', Database: 'userdb' }, lmt: h(2.2),
      versions: [{ id: 345, by: 'PasswordManager', at: h(170) }, { id: 359, by: 'PasswordManager', at: h(50) }, { id: 373, by: 'PasswordManager', at: h(2.2) }] },
    { id: '116_27', name: 'userdb_mariadb', userName: 'appuser_db_02', address: 'mysql.eso-shop.svc', platformId: 'MySQL', auto: true, status: 'success',
      props: { VirtualUsername: 'dbuser_dual', Index: '2', DualAccountStatus: 'Inactive', Port: '3306' }, lmt: h(26),
      versions: [{ id: 3, by: 'aslan', at: h(200) }, { id: 5, by: 'PasswordManager', at: h(97) }, { id: 8, by: 'PasswordManager', at: h(26) }] },
    { id: '120_4', name: 'reports-postgres', userName: 'report_ro', address: 'pg.demo.internal', platformId: 'PostgreSQL', auto: true, status: 'success',
      props: { Port: '5432' }, lmt: h(30), versions: [{ id: 11, by: 'PasswordManager', at: h(400) }, { id: 12, by: 'PasswordManager', at: h(30) }] },
    { id: '120_9', name: 'linux-jump-root', userName: 'root', address: '10.0.12.8', platformId: 'UnixSSH', auto: false, status: '',
      props: {}, lmt: h(700), versions: [{ id: 1, by: 'aslan', at: h(700) }] },
    { id: '121_2', name: CRED, userName: CRED, address: 'identity', platformId: 'CyberArkIdentityServiceUser', auto: true, status: 'success',
      props: {}, lmt: h(12), versions: [{ id: 40, by: 'PasswordManager', at: h(12) }] },
  ]
}

interface Sim { accts: Acct[]; rots: Map<string, Rot>; outcome: Outcome }
const sim: Sim = { accts: seed(), rots: new Map(), outcome: 'ok' }

const find = (id: string) => sim.accts.find(a => a.id === id)
const isDual = (a: Acct) => Boolean(a.props.VirtualUsername || a.props.DualAccountStatus)

function summarize(a: Acct) {
  const dual = isDual(a)
  return {
    id: a.id, name: a.name, userName: a.userName, address: a.address, platformId: a.platformId, secretType: 'password',
    createdTime: a.versions[0]?.at, properties: a.props,
    management: { automaticManagementEnabled: a.auto, status: a.status, lastModifiedTime: a.lmt, lastVerifiedTime: a.lmt + 600, ...(a.auto ? {} : { manualManagementReason: 'Gerenciada manualmente na demo' }) },
    dual, virtualUserName: a.props.VirtualUsername ?? '', dualStatus: a.props.DualAccountStatus ?? '', self: a.name === CRED,
    conjurPath: `data/vault/${SAFE}/${dual ? a.props.VirtualUsername : a.name}`,
  }
}

function history(a: Acct) {
  const asc = [...a.versions].sort((x, y) => x.id - y.id)
  return asc.map((v, i) => ({
    version: v.id, accountId: a.id, userName: a.userName, modifiedBy: v.by, validFrom: iso(v.at),
    validUntil: i + 1 < asc.length ? iso(asc[i + 1].at) : null, temporary: !!v.temporary, current: i === asc.length - 1,
    inUse: false, from: v.at,
  })).reverse()
}

function pairOf(a: Acct) {
  const members = sim.accts.filter(x => x.props.VirtualUsername && x.props.VirtualUsername === a.props.VirtualUsername)
  const active = members.filter(m => m.props.DualAccountStatus === 'Active')
  const inactive = members.filter(m => m.props.DualAccountStatus === 'Inactive')
  if (members.length !== 2) return { error: 'dual_pair_size' }
  if (active.length !== 1 || inactive.length !== 1) return { error: 'dual_status_ambiguous' }
  return { active: active[0], inactive: inactive[0] }
}

function view(r: Rot) {
  const { t0: _t0, outcome: _o, ...pub } = r
  return { ...pub, serverTime: new Date().toISOString() }
}

/** Advance a rotation along its scripted clock. */
function tick(r: Rot) {
  if (r.step === 'concluida' || r.step === 'falhou') return
  const el = (Date.now() - r.t0) / 1000
  const at = (s: number) => new Date(r.t0 + s * 1000).toISOString()
  const push = (step: string, s: number) => { r.step = step; r.steps.push({ step, at: at(s) }) }
  const fail = (code: string, reason: string, s: number) => { push('falhou', s); r.errorCode = code; r.reason = reason; r.finishedAt = at(s) }
  if (r.step === 'solicitada' && el >= 1) { push('trocando_senha', 1); r.deadline = at(1 + CPM_TIMEOUT_S) }
  if (r.step !== 'trocando_senha') return
  const target = find(r.target.id)!, other = find(r.other.id)!
  if (r.outcome === 'slow') { if (el >= 1 + CPM_TIMEOUT_S) fail('cpm_timeout', 'o Central Policy Manager não confirmou a troca em 5 minutos', 1 + CPM_TIMEOUT_S); return }
  if (el < 8) return
  if (r.outcome === 'failure') { target.status = 'failure'; fail('cpm_failure', `o Central Policy Manager informou falha ao trocar a senha de ${target.userName}; os status do par não foram alterados`, 8); return }
  // password changed: new version on the Inactive member
  const t = Math.floor((r.t0 + 8000) / 1000)
  target.versions.push({ id: Math.max(...target.versions.map(v => v.id)) + 1, by: 'PasswordManager', at: t })
  target.lmt = t; target.status = 'success'
  push('promovendo', 8)
  if (r.outcome === 'forbidden') {
    fail('permission_missing', `a credencial do vault-control não tem a permissão "Update account properties" no Safe ${SAFE}: nenhuma senha foi trocada`, 9)
    return
  }
  target.props.DualAccountStatus = 'Active'; other.props.DualAccountStatus = 'Inactive'
  push('concluida', 10); r.finishedAt = at(10)
}

function send(res: ServerResponse, code: number, body: unknown) {
  res.statusCode = code
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise(resolve => {
    let s = ''
    req.on('data', c => { s += c })
    req.on('end', () => { try { resolve(JSON.parse(s || '{}')) } catch { resolve({}) } })
  })
}

const lastRot = new Map<string, number>()
const seen = new Map<string, number>() // presence: tab id -> last heartbeat (ms)

function presence() {
  const t = Date.now()
  for (const [id, at] of seen) if (t - at >= 60_000) seen.delete(id)
  const last = [...sim.rots.values()].pop()
  const show = last && (!last.finishedAt || t - new Date(last.finishedAt).getTime() < 120_000)
  // a few extra tabs so the indicator shows a realistic number in screenshots
  return { online: seen.size + 2, rotation: show ? view(last) : null, now: new Date().toISOString() }
}

export const devVault = (): Plugin => ({
  name: 'dev-vault-mock',
  apply: 'serve',
  configureServer(server) {
    if (process.env.VAULT_MOCK !== '1') return
    server.middlewares.use('/api/vault', (req, res) => {
      void (async () => {
        sim.rots.forEach(tick)
        const path = (req.url ?? '/').replace(/\?.*$/, '')
        if (path === '/__mock') {
          const b = await readBody(req)
          if (b.reset) { sim.accts = seed(); sim.rots.clear(); lastRot.clear() }
          if (typeof b.outcome === 'string') sim.outcome = b.outcome as Outcome
          return send(res, 200, { ok: true, outcome: sim.outcome })
        }
        if (path === '/presence') {
          if (req.method === 'POST') {
            const b = await readBody(req)
            if (typeof b.id !== 'string' || !/^[0-9a-f-]{36}$/.test(b.id)) return send(res, 400, { error: 'bad_id' })
            seen.set(b.id, Date.now())
          }
          return send(res, 200, presence())
        }
        if (path === '/chain') return send(res, 200, { safe: SAFE, credential: CRED, steps: ['conjur_jwt', 'conjur_secret', 'identity_token', 'privilege_cloud'].map(step => ({ step, ok: true })) })
        if (path === '/accounts') return send(res, 200, { safe: SAFE, credential: CRED, accounts: sim.accts.map(summarize), fetchedAt: new Date().toISOString() })
        const rm = path.match(/^\/rotations\/([\w-]+)$/)
        if (rm) {
          const r = sim.rots.get(rm[1])
          return r ? send(res, 200, view(r)) : send(res, 404, { error: 'unknown_rotation' })
        }
        const m = path.match(/^\/accounts\/([\w-]+)(\/rotate)?$/)
        const a = m && find(m[1])
        if (!m || !a) return send(res, 404, { error: 'not found' })
        if (!m[2] && req.method === 'GET') {
          const out: Record<string, unknown> = { account: summarize(a), history: history(a).slice(0, 6).map(({ from: _f, ...e }) => e) }
          if (isDual(a)) {
            const p = pairOf(a)
            if ('error' in p) out.pairError = p.error
            else {
              const done = [...sim.rots.values()].filter(r => r.step === 'concluida' && r.target.id === p.active.id).pop()
              out.pair = {
                virtualUserName: a.props.VirtualUsername, conjurPath: `data/vault/${SAFE}/${a.props.VirtualUsername}`,
                active: { id: p.active.id, name: p.active.name, userName: p.active.userName,
                  ...(done ? { since: done.steps[done.steps.length - 1].at, sinceSource: 'rotation' } : { since: iso(p.active.lmt - 120), sinceSource: 'activities' }) },
                inactive: { id: p.inactive.id, name: p.inactive.name, userName: p.inactive.userName },
              }
              out.pairTimeline = [p.active, p.inactive]
                .flatMap(x => history(x).map(e => ({ ...e, dualStatus: x.props.DualAccountStatus, inUse: x === p.active && e.current })))
                .sort((x, y) => y.from - x.from).slice(0, 8).map(({ from: _f, ...e }) => e)
              const rot = [...sim.rots.values()].filter(r => [r.target.id, r.other.id].includes(a.id)).pop()
              if (rot) out.rotation = view(rot)
            }
          }
          return send(res, 200, out)
        }
        if (m[2] && req.method === 'POST') {
          if (req.headers['x-cofre-info'] !== '1') return send(res, 403, { error: 'origin not allowed' })
          if (a.name === CRED) return send(res, 409, { error: 'self' })
          const ip = String(req.socket.remoteAddress)
          if (Date.now() - (lastRot.get(ip) ?? 0) < 3000) return send(res, 429, { error: 'wait' })
          lastRot.set(ip, Date.now())
          if (!isDual(a)) {
            a.status = ''
            setTimeout(() => { a.versions.push({ id: Math.max(...a.versions.map(v => v.id)) + 1, by: 'PasswordManager', at: now() }); a.lmt = now(); a.status = 'success' }, 6000)
            return send(res, 202, { requested: true, account: a.id, dual: false })
          }
          const p = pairOf(a)
          if ('error' in p) return send(res, 409, { error: p.error })
          const running = [...sim.rots.values()].find(r => r.step !== 'concluida' && r.step !== 'falhou')
          if (running) return send(res, 409, { error: 'rotation_in_progress', rotationId: running.rotationId, rotation: view(running) })
          const t0 = Date.now()
          const r: Rot = {
            rotationId: Math.random().toString(16).slice(2, 14), virtualUserName: a.props.VirtualUsername,
            from: p.active.userName, to: p.inactive.userName,
            target: { id: p.inactive.id, name: p.inactive.name, userName: p.inactive.userName },
            other: { id: p.active.id, name: p.active.name, userName: p.active.userName },
            step: 'solicitada', steps: [{ step: 'solicitada', at: new Date(t0).toISOString() }], cpmTimeoutSeconds: CPM_TIMEOUT_S,
            startedAt: new Date(t0).toISOString(), t0, outcome: sim.outcome,
          }
          sim.rots.set(r.rotationId, r)
          return send(res, 202, { requested: true, account: a.id, dual: true, rotationId: r.rotationId, rotation: view(r) })
        }
        send(res, 404, { error: 'not found' })
      })()
    })
  },
})
