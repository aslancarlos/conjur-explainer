/**
 * Contract of the ESO Shop benchmark API (same origin, /api/bench). A load
 * client on an Azure Spot VM (started on demand) calls /k8s-eso/ at the chosen
 * rate; the API reports the VM, the agent, the run and what it measures.
 * Every response is JSON with Cache-Control: no-store. In local dev,
 * `BENCH_MOCK=1 npm run dev` serves an in-memory imitation (dev/benchMock.ts).
 */

export const BENCH_API = '/api/bench'

export type VmEstado = 'desalocada' | 'ligando' | 'ligada' | 'desligando' | 'despejada' | 'desconhecido'

export interface BenchTotais { enviadas: number; sucesso: number; falhas: number; descartes: number }

export interface BenchExecucao {
  geracao: number
  rps: number
  cenario: string
  duracao_s: number
  inicio: string
  ate: string
  aguardando_cliente?: boolean
  origem?: string
  totais: BenchTotais
}

export interface BenchHistorico extends BenchExecucao { fim?: string; motivo_fim?: string }

export interface BenchMedido {
  rps: number; ok_ps: number; erros_ps: number; descartes_ps: number
  p50_ms: number; p95_ms: number; p99_ms: number; em_voo: number
  status?: Record<string, number>
  por_rota?: Record<string, number>
}

export interface BenchEstado {
  ativo: boolean
  execucao: BenchExecucao | null
  historico?: BenchHistorico[]
  limites?: { rps: number; duracao_s: number }
  cenarios?: string[]
  agente?: { online: boolean; visto_em?: string; host?: string; ip?: string; versao?: string; load1?: number }
  medido: BenchMedido | null
  vm?: { estado: VmEstado | string; detalhe?: string; desliga_em?: string }
  alvo?: string
  grafana?: string
  agora?: string
}

export interface BenchPonto {
  t: string; geracao: number; rps_alvo: number; rps: number; ok_ps: number; erros_ps: number
  p50_ms: number; p95_ms: number; p99_ms: number; em_voo: number
}

export interface BenchResult<T> { ok: boolean; status: number; data: T | null; erro?: string }

/** fetch + JSON with a timeout; never throws (network errors come back as status 0). */
export async function benchFetch<T>(path: string, init?: RequestInit, timeoutMs = 8000): Promise<BenchResult<T>> {
  const ctl = new AbortController()
  const timer = window.setTimeout(() => ctl.abort(), timeoutMs)
  try {
    const r = await fetch(`${BENCH_API}${path}`, { cache: 'no-store', ...init, signal: ctl.signal })
    const body = await r.json().catch(() => null) as (T & { erro?: string }) | null
    if (!r.ok) return { ok: false, status: r.status, data: null, erro: body?.erro }
    return { ok: true, status: r.status, data: body }
  } catch {
    return { ok: false, status: 0, data: null }
  } finally {
    window.clearTimeout(timer)
  }
}

export const toMs = (iso?: string | null) => {
  if (!iso) return NaN
  return Date.parse(iso)
}

/** mm:ss (or h:mm:ss) for a remaining time in ms; never negative. */
export function clock(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = String(s % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${String(m).padStart(2, '0')}:${ss}`
}

/** 300 -> "5 min", 90 -> "1 min 30 s", 45 -> "45 s". */
export function duration(s: number): string {
  if (!Number.isFinite(s)) return '-'
  if (s < 60) return `${s} s`
  const m = Math.floor(s / 60)
  const r = s % 60
  return r ? `${m} min ${r} s` : `${m} min`
}

/** Elapsed time, coarse: "4 s", "12 min", "3 h". */
export function since(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000))
  if (s < 60) return `${s} s`
  if (s < 3600) return `${Math.floor(s / 60)} min`
  return `${Math.floor(s / 3600)} h`
}
