import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * Local dev only (`BENCH_MOCK=1 npm run dev`): an in-memory imitation of the
 * benchmark API that production serves at /api/bench (load client on an Azure
 * Spot VM driving the ESO Shop). It never reaches the production build
 * (`apply: 'serve'`), and without BENCH_MOCK the page simply shows that the API
 * is unreachable.
 *
 * Timings are shortened (the VM "boots" in 20 s) so every state can be seen in
 * a few minutes. For screenshots, POST /api/bench/__mock {"preset": ...}
 * jumps straight to a state: "idle", "ligando", "rodando", "erro" (estado and
 * iniciar answer 503) or "ok" (clears the error).
 */

type Cenario = 'misto' | 'health' | 'produtos'
interface Totais { enviadas: number; sucesso: number; falhas: number; descartes: number }
interface Execucao {
  geracao: number; rps: number; cenario: Cenario; duracao_s: number
  inicio: string; ate: string; aguardando_cliente: boolean; origem: string; totais: Totais
}
interface Historico extends Omit<Execucao, 'aguardando_cliente'> { fim: string; motivo_fim: string }
interface Ponto {
  t: string; geracao: number; rps_alvo: number; rps: number; ok_ps: number; erros_ps: number
  p50_ms: number; p95_ms: number; p99_ms: number; em_voo: number
}

const LIMITES = { rps: 300, duracao_s: 900 }
const CENARIOS: Cenario[] = ['misto', 'health', 'produtos']
const BOOT_MS = 20_000
const IDLE_OFF_MS = 10 * 60_000
const STEP_MS = 2_000
const iso = (ms: number) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z')
const rnd = (a: number, b: number) => a + Math.random() * (b - a)

interface Sim {
  vm: 'desalocada' | 'ligando' | 'ligada' | 'desligando' | 'despejada' | 'desconhecido'
  vmAte: number          // when ligando/desligando ends
  desligaEm: number | null
  exec: (Execucao & { inicioMs: number; ateMs: number }) | null
  historico: Historico[]
  serie: Ponto[]
  lastTick: number
  lastChange: number
  erro: boolean
}

function seedHistory(now: number): Historico[] {
  const mk = (agoMin: number, rps: number, cenario: Cenario, dur: number, motivo: string, falhas: number, descartes = 0): Historico => {
    const ini = now - agoMin * 60_000
    const enviadas = rps * dur
    return {
      geracao: ini * 1e6, rps, cenario, duracao_s: dur, inicio: iso(ini), ate: iso(ini + dur * 1000), fim: iso(ini + dur * 1000),
      motivo_fim: motivo, origem: '198.51.100.7', totais: { enviadas, sucesso: enviadas - falhas - descartes, falhas, descartes },
    }
  }
  return [
    mk(42, 120, 'produtos', 300, 'duração atingida', 37, 4),
    mk(95, 50, 'misto', 180, 'parada manual', 3),
    mk(180, 5, 'health', 60, 'duração atingida', 0),
  ]
}

export function createSim(): Sim {
  const now = Date.now()
  return { vm: 'desalocada', vmAte: 0, desligaEm: null, exec: null, historico: seedHistory(now), serie: [], lastTick: now, lastChange: 0, erro: false }
}

function point(s: Sim, ms: number): Ponto | null {
  const e = s.exec
  if (!e || e.aguardando_cliente || ms < e.inicioMs) return null
  const target = e.rps
  const sent = target * rnd(0.97, 1.01)
  const errRate = e.cenario === 'health' ? 0.001 : target > 200 ? 0.03 : 0.006
  const err = sent * errRate * rnd(0.3, 1.7)
  const base = e.cenario === 'health' ? 18 : e.cenario === 'produtos' ? 85 : 55
  const load = 1 + (target / LIMITES.rps) ** 2 * 3
  const p50 = base * load * rnd(0.9, 1.1)
  return {
    t: iso(ms), geracao: e.geracao, rps_alvo: target, rps: +sent.toFixed(1), ok_ps: +(sent - err).toFixed(1), erros_ps: +err.toFixed(1),
    p50_ms: Math.round(p50), p95_ms: Math.round(p50 * rnd(1.8, 2.3)), p99_ms: Math.round(p50 * rnd(3, 4)), em_voo: Math.max(0, Math.round(sent * p50 / 1000)),
  }
}

function finish(s: Sim, motivo: string, ms: number) {
  const e = s.exec
  if (!e) return
  const { inicioMs: _a, ateMs: _b, aguardando_cliente: _c, ...rest } = e
  s.historico.unshift({ ...rest, fim: iso(ms), motivo_fim: motivo })
  s.historico = s.historico.slice(0, 10)
  s.exec = null
  s.desligaEm = ms + IDLE_OFF_MS
}

/** Advance the simulation to `now` in 2 s steps (series points, totals, VM transitions). */
function tick(s: Sim, now: number) {
  for (let ms = s.lastTick + STEP_MS; ms <= now; ms += STEP_MS) {
    if (s.vm === 'ligando' && ms >= s.vmAte) {
      s.vm = 'ligada'
      if (s.exec?.aguardando_cliente) {
        const e = s.exec
        e.aguardando_cliente = false; e.inicioMs = ms; e.ateMs = ms + e.duracao_s * 1000
        e.inicio = iso(e.inicioMs); e.ate = iso(e.ateMs)
      }
    }
    if (s.vm === 'desligando' && ms >= s.vmAte) { s.vm = 'desalocada'; s.desligaEm = null }
    if (s.vm === 'ligada' && !s.exec && s.desligaEm && ms >= s.desligaEm) { s.vm = 'desligando'; s.vmAte = ms + 15_000 }
    if (s.exec && !s.exec.aguardando_cliente && ms >= s.exec.ateMs) finish(s, 'duração atingida', s.exec.ateMs)
    const p = point(s, ms)
    if (p && s.exec) {
      s.serie.push(p)
      const tt = s.exec.totais
      tt.enviadas += Math.round(p.rps * 2); tt.falhas += Math.round(p.erros_ps * 2); tt.sucesso = tt.enviadas - tt.falhas - tt.descartes
    }
  }
  s.lastTick = now - ((now - s.lastTick) % STEP_MS)
  const cut = now - 15 * 60_000
  s.serie = s.serie.filter(p => Date.parse(p.t) >= cut)
}

function estado(s: Sim, now: number) {
  const e = s.exec
  const last = s.serie[s.serie.length - 1]
  const running = !!e && !e.aguardando_cliente && last && last.geracao === e.geracao
  const misto = { health: 0.2, dashboard: 0.2, 'secrets-info': 0.1, products: 0.5 }
  const routes = e?.cenario === 'health' ? { health: 1 } : e?.cenario === 'produtos' ? { products: 1 } : misto
  const n = running ? Math.round(last.rps * 10) : 0
  const err = running ? Math.round(last.erros_ps * 10) : 0
  return {
    ativo: !!e,
    execucao: e ? (({ inicioMs: _a, ateMs: _b, ...x }) => x)(e) : null,
    historico: s.historico,
    limites: LIMITES,
    cenarios: CENARIOS,
    agente: s.vm === 'ligada'
      ? { online: true, visto_em: iso(now - 1000), host: 'vm-eso-bench', ip: '20.195.182.2', versao: '1.0.0', load1: running ? +(last.rps / 120).toFixed(2) : 0.04 }
      : { online: false, visto_em: iso(now - 30 * 60_000), host: 'vm-eso-bench', ip: '', versao: '1.0.0', load1: 0 },
    medido: running ? {
      rps: last.rps, ok_ps: last.ok_ps, erros_ps: last.erros_ps, descartes_ps: 0,
      p50_ms: last.p50_ms, p95_ms: last.p95_ms, p99_ms: last.p99_ms, em_voo: last.em_voo,
      status: Object.fromEntries(Object.entries({ '200': n - err, '503': Math.round(err * 0.5), erro_conexao: Math.round(err * 0.2), timeout: Math.round(err * 0.2), conteudo: Math.round(err * 0.1) }).filter(([, v]) => v > 0)),
      por_rota: Object.fromEntries(Object.entries(routes).map(([k, w]) => [k, Math.round(n * w)])),
    } : null,
    vm: {
      estado: s.vm,
      detalhe: { desalocada: 'PowerState/deallocated', ligando: 'PowerState/starting', ligada: 'PowerState/running', desligando: 'PowerState/deallocating', despejada: 'PowerState/deallocated (Spot eviction)', desconhecido: '' }[s.vm],
      ...(s.vm === 'ligada' && s.desligaEm ? { desliga_em: iso(s.desligaEm) } : {}),
      ...(s.vm === 'ligada' && e && !e.aguardando_cliente ? { desliga_em: iso(e.ateMs + IDLE_OFF_MS) } : {}),
    },
    alvo: 'https://demo.minha.cloud/k8s-eso/',
    grafana: '/grafana/d/eso-shop-bench/eso-shop',
    agora: iso(now),
  }
}

function start(s: Sim, now: number, rps: number, duracao_s: number, cenario: Cenario) {
  if (s.exec) finish(s, 'substituída por um novo teste', now)
  const needsBoot = s.vm !== 'ligada'
  if (needsBoot) { s.vm = 'ligando'; s.vmAte = now + BOOT_MS }
  s.desligaEm = null
  s.exec = {
    geracao: now * 1e6, rps, cenario, duracao_s, origem: '198.51.100.7', aguardando_cliente: needsBoot,
    inicio: iso(now), ate: iso(now + duracao_s * 1000), inicioMs: now, ateMs: now + duracao_s * 1000,
    totais: { enviadas: 0, sucesso: 0, falhas: 0, descartes: 0 },
  }
}

function preset(s: Sim, name: string, now: number) {
  s.erro = name === 'erro'
  if (name === 'erro' || name === 'ok') return
  Object.assign(s, createSim(), { lastTick: now })
  if (name === 'ligando') { start(s, now, 50, 300, 'misto'); s.vmAte = now + 10 * 60_000 }
  if (name === 'rodando') {
    // an earlier run 9 min ago plus the current one, so the chart has history
    s.vm = 'ligada'
    s.lastTick = now - 9 * 60_000
    start(s, s.lastTick, 40, 120, 'health')
    tick(s, now - 6 * 60_000)
    start(s, now - 6 * 60_000 + 30_000, 120, 600, 'misto')
    tick(s, now)
  }
}

async function body(req: IncomingMessage): Promise<Record<string, unknown>> {
  let raw = ''
  for await (const c of req) raw += c
  try { return JSON.parse(raw || '{}') } catch { return {} }
}

function send(res: ServerResponse, code: number, data: unknown) {
  res.statusCode = code
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(data))
}

export const devBench = (): Plugin => ({
  name: 'dev-bench-mock',
  apply: 'serve',
  configureServer(server) {
    if (process.env.BENCH_MOCK !== '1') return
    const s = createSim()
    server.middlewares.use('/api/bench', (req, res) => {
      void (async () => {
        const now = Date.now()
        tick(s, now)
        const path = (req.url ?? '/').replace(/\?.*$/, '')
        if (path === '/__mock') { preset(s, String((await body(req)).preset ?? ''), now); return send(res, 200, { ok: true }) }
        if (s.erro && path !== '/serie') return send(res, 503, { erro: 'serviço de benchmark indisponível (simulação de falha)' })
        if (req.method === 'GET' && path === '/estado') return send(res, 200, estado(s, now))
        if (req.method === 'GET' && path === '/serie') return send(res, 200, { pontos: s.serie })
        if (req.method === 'POST' && (path === '/iniciar' || path === '/parar')) {
          if (now - s.lastChange < 2000) return send(res, 429, { erro: 'aguarde 2 segundos entre alterações' })
          s.lastChange = now
          if (path === '/parar') { finish(s, 'parada manual', now); return send(res, 200, estado(s, now)) }
          const b = await body(req)
          const rps = Number(b.rps), dur = Number(b.duracao_s), cen = String(b.cenario) as Cenario
          if (!Number.isInteger(rps) || rps < 1 || rps > LIMITES.rps) return send(res, 400, { erro: `rps deve estar entre 1 e ${LIMITES.rps}` })
          if (!Number.isInteger(dur) || dur < 10 || dur > LIMITES.duracao_s) return send(res, 400, { erro: `duracao_s deve estar entre 10 e ${LIMITES.duracao_s}` })
          if (!CENARIOS.includes(cen)) return send(res, 400, { erro: 'cenário desconhecido' })
          start(s, now, rps, dur, cen)
          return send(res, 200, estado(s, now))
        }
        send(res, 404, { erro: 'rota desconhecida' })
      })()
    })
  },
})
