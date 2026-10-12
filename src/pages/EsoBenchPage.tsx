import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Activity, AlertTriangle, ArrowDown, ArrowRight, BarChart3, CheckCircle2, Cloud, Database, ExternalLink, Gauge, Globe,
  HelpCircle, History, Info, KeyRound, Loader2, Network, Pause, Play, PowerOff, RefreshCw, Server, ShoppingCart, Square, Timer,
  XCircle, Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Loading from '../components/Loading'
import BenchChart from '../components/bench/BenchChart'
import { useToolsCopy } from '../lib/toolsCopy'
import {
  benchFetch, clock, duration, since, toMs,
  type BenchEstado, type BenchPonto, type VmEstado,
} from '../lib/benchApi'

/**
 * Benchmark ESO Shop (/eso-bench): whoever is watching the demo picks a rate
 * (calls per second), a duration and a scenario; a load client on an Azure Spot
 * VM (Brazil South, started on demand) calls the ESO Shop over the internet and
 * the page follows the run live. Backend: /api/bench (see lib/benchApi.ts).
 * Polls /estado every 2 s and /serie every 4 s, only while the tab is visible.
 */

const ESTADO_MS = 2000
const SERIE_MS = 4000
const COOLDOWN_MS = 2000
const DEFAULT_LIMITS = { rps: 300, duracao_s: 900 }
const DEFAULT_CENARIOS = ['misto', 'health', 'produtos']
const DURATION_PRESETS = [60, 180, 300, 600, 900]
const MIN_DURATION = 10
const GRAFANA_FALLBACK = '/grafana/d/eso-shop-bench/eso-shop'
const ROUTE_PATH: Record<string, string> = { health: '/health', dashboard: '/dashboard', 'secrets-info': '/secrets-info', products: '/products' }

const card = 'rounded-2xl border border-border bg-bg-card'
const input = 'h-11 rounded-lg border border-border bg-bg-base px-3 text-sm text-text tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue'

/** True while the tab is visible (polling stops when it is hidden). */
function usePageVisible() {
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || document.visibilityState === 'visible')
  useEffect(() => {
    const on = () => setVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', on)
    return () => document.removeEventListener('visibilitychange', on)
  }, [])
  return visible
}

/** Runs `fn` now and then every `ms` while `active`; skips a tick while the previous call is still running. */
function usePoll(fn: () => Promise<void>, ms: number, active: boolean) {
  const ref = useRef(fn)
  ref.current = fn
  useEffect(() => {
    if (!active) return
    let busy = false
    const run = () => {
      if (busy) return
      busy = true
      ref.current().finally(() => { busy = false })
    }
    run()
    const id = window.setInterval(run, ms)
    return () => window.clearInterval(id)
  }, [ms, active])
}

function Section({ id, title, icon: Icon, lead, children, actions, className = '' }: {
  id: string; title: string; icon: LucideIcon; lead?: ReactNode; children: ReactNode; actions?: ReactNode; className?: string
}) {
  return (
    <section aria-labelledby={id} className={`${card} space-y-4 p-6 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-[70ch] space-y-1">
          <h2 id={id} className="inline-flex items-center gap-2 text-lg font-semibold text-text">
            <Icon size={18} aria-hidden="true" className="text-text-2" />{title}
          </h2>
          {lead && <p className="text-sm leading-relaxed text-text-2">{lead}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  )
}

function EsoBenchView() {
  const { t, i18n } = useTranslation()
  const v = useCallback((k: string, o?: Record<string, unknown>) => t(`esobench.${k}`, o) as string, [t])
  const nf = useMemo(() => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 }), [i18n.language])
  const nf0 = useMemo(() => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 0 }), [i18n.language])
  const pf = useMemo(() => new Intl.NumberFormat(i18n.language, { style: 'percent', maximumFractionDigits: 1 }), [i18n.language])
  const df = useMemo(() => new Intl.DateTimeFormat(i18n.language, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }), [i18n.language])

  const visible = usePageVisible()

  // ---------- server state ----------
  const [estado, setEstado] = useState<BenchEstado | null>(null)
  const [estadoErr, setEstadoErr] = useState<string | null>(null)
  const [skew, setSkew] = useState(0) // server clock minus browser clock
  const apply = useCallback((e: BenchEstado) => {
    setEstado(e)
    const srv = toMs(e.agora)
    if (Number.isFinite(srv)) setSkew(srv - Date.now())
  }, [])
  const errText = useCallback((status: number, erro?: string) => {
    if (status === 0) return v('err_network')
    return erro ? `${erro} (HTTP ${status})` : `HTTP ${status}`
  }, [v])

  usePoll(async () => {
    const r = await benchFetch<BenchEstado>('/estado')
    if (r.ok && r.data) { apply(r.data); setEstadoErr(null) } else setEstadoErr(errText(r.status, r.erro))
  }, ESTADO_MS, visible)

  const [pontos, setPontos] = useState<BenchPonto[]>([])
  const [serieErr, setSerieErr] = useState(false)
  const [frozen, setFrozen] = useState<{ pontos: BenchPonto[]; end: number } | null>(null)
  usePoll(async () => {
    const r = await benchFetch<{ pontos: BenchPonto[] }>('/serie')
    if (r.ok && r.data) { setPontos(r.data.pontos ?? []); setSerieErr(false) } else setSerieErr(true)
  }, SERIE_MS, visible)

  // 1 s clock for the countdowns, aligned with the server's `agora`
  const [tick, setTick] = useState(() => Date.now())
  useEffect(() => {
    if (!visible) return
    const id = window.setInterval(() => setTick(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [visible])
  const now = tick + skew

  const limites = estado?.limites ?? DEFAULT_LIMITS
  const cenarios = estado?.cenarios?.length ? estado.cenarios : DEFAULT_CENARIOS
  const exec = estado?.ativo ? estado.execucao : null
  const medido = estado?.medido ?? null
  const vmEstado = (estado?.vm?.estado ?? 'desconhecido') as VmEstado

  // ---------- controls ----------
  const [rps, setRps] = useState(20)
  const [rpsText, setRpsText] = useState('20')
  const [dur, setDur] = useState(300)
  const [durText, setDurText] = useState('300')
  const [cenario, setCenario] = useState('misto')
  const touched = useRef(false)
  const synced = useRef(false)
  // First state from the server: mirror a run in progress, unless the visitor already edited the form.
  useEffect(() => {
    if (!estado || synced.current) return
    synced.current = true
    if (estado.execucao && estado.ativo && !touched.current) {
      setRps(estado.execucao.rps); setRpsText(String(estado.execucao.rps))
      setDur(estado.execucao.duracao_s); setDurText(String(estado.execucao.duracao_s))
      setCenario(estado.execucao.cenario)
    }
  }, [estado])
  const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(n)))
  const setRpsN = (n: number) => { touched.current = true; const c = clamp(n, 1, limites.rps); setRps(c); setRpsText(String(c)) }
  const setDurN = (n: number) => { touched.current = true; const c = clamp(n, MIN_DURATION, limites.duracao_s); setDur(c); setDurText(String(c)) }

  const [busy, setBusy] = useState<'iniciar' | 'parar' | null>(null)
  const [actionErr, setActionErr] = useState<string | null>(null)
  const [actionOk, setActionOk] = useState<string | null>(null)
  const [coolUntil, setCoolUntil] = useState(0)
  const cooling = tick < coolUntil
  useEffect(() => {
    if (!coolUntil) return
    const id = window.setTimeout(() => setTick(Date.now()), Math.max(0, coolUntil - Date.now()) + 20)
    return () => window.clearTimeout(id)
  }, [coolUntil])

  const post = async (kind: 'iniciar' | 'parar') => {
    setBusy(kind); setActionErr(null); setActionOk(null)
    const init: RequestInit = { method: 'POST', headers: { 'Content-Type': 'application/json' } }
    if (kind === 'iniciar') init.body = JSON.stringify({ rps, duracao_s: dur, cenario })
    const r = await benchFetch<BenchEstado>(`/${kind}`, init)
    setBusy(null)
    setCoolUntil(Date.now() + COOLDOWN_MS)
    if (r.ok && r.data) {
      apply(r.data)
      setActionOk(kind === 'iniciar' ? v('ok_started') : v('ok_stopped'))
    } else if (r.status === 429) {
      setActionErr(v('err_429'))
    } else {
      setActionErr(errText(r.status, r.erro))
    }
  }

  // ---------- derived ----------
  const ateMs = toMs(exec?.ate)
  const inicioMs = toMs(exec?.inicio)
  const waiting = !!exec?.aguardando_cliente
  const remaining = Number.isFinite(ateMs) ? ateMs - now : NaN
  const progress = exec && !waiting && Number.isFinite(ateMs) && Number.isFinite(inicioMs) && ateMs > inicioMs
    ? Math.min(1, Math.max(0, (now - inicioMs) / (ateMs - inicioMs))) : 0
  const offMs = toMs(estado?.vm?.desliga_em)
  const grafanaHref = estado?.grafana && /^\/(?!\/)/.test(estado.grafana) ? estado.grafana : GRAFANA_FALLBACK
  const cenarioLabel = (c: string) => (t(`esobench.cen_${c}`, { defaultValue: c }) as string)

  const VM: Record<VmEstado, { Icon: LucideIcon; cls: string; spin?: boolean }> = {
    desalocada: { Icon: PowerOff, cls: 'border-border bg-bg-muted text-text-2' },
    ligando: { Icon: Loader2, cls: 'border-tone-warning/40 bg-tone-warning/10 text-tone-warning', spin: true },
    ligada: { Icon: CheckCircle2, cls: 'border-tone-success/40 bg-tone-success/10 text-tone-success' },
    desligando: { Icon: Loader2, cls: 'border-tone-warning/40 bg-tone-warning/10 text-tone-warning', spin: true },
    despejada: { Icon: AlertTriangle, cls: 'border-tone-warning/40 bg-tone-warning/10 text-tone-warning' },
    desconhecido: { Icon: HelpCircle, cls: 'border-border bg-bg-muted text-text-2' },
  }
  const vmKey: VmEstado = vmEstado in VM ? vmEstado : 'desconhecido'
  const vmStyle = VM[vmKey]

  const statusEntries = Object.entries(medido?.status ?? {}).sort((a, b) => b[1] - a[1])
  const statusTotal = statusEntries.reduce((s, [, n]) => s + n, 0)
  const statusTone = (k: string): 'success' | 'warning' | 'danger' => /^2\d\d$/.test(k) ? 'success' : k === 'conteudo' || /^[34]\d\d$/.test(k) ? 'warning' : 'danger'
  // full class names (Tailwind only generates classes it can read in the source)
  const TONE = {
    success: { text: 'text-tone-success', bg: 'bg-tone-success', Icon: CheckCircle2 },
    warning: { text: 'text-tone-warning', bg: 'bg-tone-warning', Icon: AlertTriangle },
    danger: { text: 'text-tone-danger', bg: 'bg-tone-danger', Icon: XCircle },
  } as const
  const statusLabel = (k: string) => /^\d{3}$/.test(k) ? `HTTP ${k}` : (t(`esobench.st_${k}`, { defaultValue: k }) as string)
  const rotaEntries = Object.entries(medido?.por_rota ?? {}).sort((a, b) => b[1] - a[1])
  const rotaTotal = rotaEntries.reduce((s, [, n]) => s + n, 0)
  const totais = exec?.totais
  const historico = estado?.historico ?? []

  const kpi = (label: string, value: ReactNode, sub?: ReactNode, Icon?: LucideIcon, tone?: string) => (
    <div className="card-inset min-w-0 space-y-1">
      <p className="text-overline inline-flex items-center gap-1.5">{Icon && <Icon size={14} aria-hidden="true" className={tone} />}{label}</p>
      <p className="text-2xl font-bold tabular-nums text-text">{value}</p>
      {sub && <p className="text-xs text-text-muted">{sub}</p>}
    </div>
  )
  const dash = '-'

  const FLOW: Array<{ key: string; Icon: LucideIcon; stripe: string; chip: string }> = [
    { key: 'client', Icon: Cloud, stripe: 'bg-domain-svc', chip: 'text-domain-svc' },
    { key: 'internet', Icon: Globe, stripe: 'bg-text-muted', chip: 'text-text-2' },
    { key: 'nlb', Icon: Network, stripe: 'bg-domain-k8s', chip: 'text-domain-k8s' },
    { key: 'ingress', Icon: Server, stripe: 'bg-domain-k8s', chip: 'text-domain-k8s' },
    { key: 'shop', Icon: ShoppingCart, stripe: 'bg-domain-k8s', chip: 'text-domain-k8s' },
    { key: 'mysql', Icon: Database, stripe: 'bg-domain-svc', chip: 'text-domain-svc' },
  ]

  const startLabel = exec ? v('btn_replace') : v('btn_start')
  const disabledAll = !!busy || cooling

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <PageHeader badge={v('badge')} title={v('title')} subtitle={v('subtitle')} />

      {/* how the calls travel */}
      <section aria-labelledby="bench-flow" className={`${card} space-y-3 px-6 py-5`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="bench-flow" className="text-lg font-semibold text-text">{v('flow_title')}</h2>
          <p className="text-xs text-text-muted">{v('flow_target')} <code className="font-mono text-text-2 [overflow-wrap:anywhere]">{estado?.alvo ?? 'https://demo.minha.cloud/k8s-eso/'}</code></p>
        </div>
        <ol className="flex flex-col gap-2 md:flex-row md:items-stretch">
          {FLOW.map(({ key, Icon, stripe, chip }, i) => (
            <li key={key} className="flex min-w-0 flex-col items-center gap-2 md:flex-1 md:flex-row">
              <div className="relative w-full min-w-0 flex-1 self-stretch overflow-hidden rounded-xl border border-border bg-bg-base p-3 pt-4">
                <span className={`absolute inset-x-0 top-0 h-[3px] ${stripe}`} aria-hidden="true" />
                <p className="flex items-center gap-2 text-sm font-semibold leading-snug text-text">
                  <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-bg-muted ${chip}`}><Icon size={15} aria-hidden="true" /></span>
                  <span className="min-w-0">{v(`flow_${key}`)}</span>
                </p>
                <p className="mt-1.5 text-xs leading-snug text-text-2">{v(`flow_${key}_sub`)}</p>
                {key === 'mysql' && (
                  <p className="mt-1.5 inline-flex items-start gap-1 text-xs leading-snug text-tone-live"><KeyRound size={12} aria-hidden="true" className="mt-0.5 shrink-0" />{v('flow_mysql_cred')}</p>
                )}
              </div>
              {i < FLOW.length - 1 && (
                <>
                  <ArrowRight size={16} aria-hidden="true" className="hidden shrink-0 text-tone-live md:block" />
                  <ArrowDown size={16} aria-hidden="true" className="shrink-0 text-tone-live md:hidden" />
                </>
              )}
            </li>
          ))}
        </ol>
        <p className="text-xs leading-relaxed text-text-muted">{v('flow_note')}</p>
      </section>

      {estadoErr && (
        <p role="alert" className="callout-danger text-text">
          <XCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-tone-danger" />
          <span>{v('err_estado', { erro: estadoErr })}</span>
        </p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        {/* controls */}
        <Section id="bench-controls" title={v('ctl_title')} icon={Gauge} lead={v('ctl_lead')}>
          <form className="space-y-5" onSubmit={e => { e.preventDefault(); if (!disabledAll) void post('iniciar') }}>
            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold text-text">{v('ctl_rps')}</legend>
              <div className="flex items-center gap-4">
                <input type="range" min={1} max={limites.rps} step={1} value={rps} onChange={e => setRpsN(Number(e.target.value))}
                  aria-label={v('ctl_rps')} aria-valuetext={v('ctl_rps_value', { n: rps })}
                  className="h-11 min-w-0 flex-1 cursor-pointer accent-idira-blue" />
                <label className="flex shrink-0 items-center gap-2">
                  <span className="sr-only">{v('ctl_rps')}</span>
                  <input type="number" inputMode="numeric" min={1} max={limites.rps} step={1} value={rpsText}
                    onChange={e => { touched.current = true; setRpsText(e.target.value); const n = Number(e.target.value); if (Number.isFinite(n) && n >= 1 && n <= limites.rps) setRps(Math.round(n)) }}
                    onBlur={() => setRpsN(Number(rpsText) || 1)}
                    className={`${input} w-24 text-right font-mono`} />
                  <span className="text-sm text-text-2">{v('unit_rps')}</span>
                </label>
              </div>
              <p className="text-xs text-text-muted">{v('ctl_rps_help', { max: limites.rps })}</p>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold text-text">{v('ctl_dur')}</legend>
              <div className="flex flex-wrap items-center gap-2">
                {DURATION_PRESETS.filter(s => s <= limites.duracao_s).map(s => (
                  <button key={s} type="button" aria-pressed={dur === s} onClick={() => setDurN(s)}
                    className={`inline-flex h-11 min-w-16 items-center justify-center rounded-full border px-4 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue ${dur === s ? 'border-idira-blue bg-idira-blue/10 text-text' : 'border-border text-text-2 hover:border-idira-blue hover:text-text'}`}>
                    {duration(s)}
                  </button>
                ))}
                <label className="ml-auto flex items-center gap-2">
                  <span className="text-sm text-text-2">{v('ctl_dur_custom')}</span>
                  <input type="number" inputMode="numeric" min={MIN_DURATION} max={limites.duracao_s} step={1} value={durText}
                    onChange={e => { touched.current = true; setDurText(e.target.value); const n = Number(e.target.value); if (Number.isFinite(n) && n >= MIN_DURATION && n <= limites.duracao_s) setDur(Math.round(n)) }}
                    onBlur={() => setDurN(Number(durText) || MIN_DURATION)}
                    className={`${input} w-24 text-right font-mono`} />
                  <span className="text-sm text-text-2">s</span>
                </label>
              </div>
              <p className="text-xs text-text-muted">{v('ctl_dur_help', { max: duration(limites.duracao_s) })}</p>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold text-text">{v('ctl_cen')}</legend>
              <div role="radiogroup" aria-label={v('ctl_cen')} className="grid gap-2 sm:grid-cols-3">
                {cenarios.map(c => {
                  const on = cenario === c
                  return (
                    <label key={c} className={`flex cursor-pointer flex-col gap-1 rounded-xl border p-3 transition-colors duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-idira-blue ${on ? 'border-idira-blue bg-idira-blue/10' : 'border-border hover:border-idira-blue'}`}>
                      <span className="flex items-center gap-2">
                        <input type="radio" name="cenario" value={c} checked={on} onChange={() => { touched.current = true; setCenario(c) }} className="h-4 w-4 accent-idira-blue" />
                        <span className="text-sm font-semibold text-text">{cenarioLabel(c)}</span>
                      </span>
                      <span className="text-xs leading-relaxed text-text-2">{t(`esobench.cen_${c}_desc`, { defaultValue: '' }) as string}</span>
                    </label>
                  )
                })}
              </div>
            </fieldset>

            {exec && (
              <p className="callout-warning text-text">
                <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-tone-warning" />
                <span>{v('ctl_replace_warn', { rps: exec.rps, cen: cenarioLabel(exec.cenario) })}</span>
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" className="btn-primary" disabled={disabledAll}>
                {busy === 'iniciar' ? <Loader2 size={18} aria-hidden="true" className="animate-spin" /> : <Play size={18} aria-hidden="true" />}
                {startLabel}
              </button>
              <button type="button" className="btn-secondary" disabled={disabledAll || !exec} onClick={() => void post('parar')}>
                {busy === 'parar' ? <Loader2 size={18} aria-hidden="true" className="animate-spin" /> : <Square size={16} aria-hidden="true" />}
                {v('btn_stop')}
              </button>
              {cooling && !busy && <span className="text-xs text-text-muted">{v('cooldown')}</span>}
            </div>
            <div aria-live="polite" className="empty:hidden">
              {actionErr && (
                <p role="alert" className="callout-danger text-text">
                  <XCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-tone-danger" />
                  <span><strong className="font-semibold">{v('err_action')}</strong> {actionErr}</span>
                </p>
              )}
              {actionOk && !actionErr && (
                <p className="inline-flex items-center gap-2 text-sm text-tone-success"><CheckCircle2 size={16} aria-hidden="true" />{actionOk}</p>
              )}
            </div>
            <p className="text-xs leading-relaxed text-text-muted">{v('ctl_shared')}</p>
          </form>
        </Section>

        {/* Azure VM + agent */}
        <Section id="bench-vm" title={v('vm_title')} icon={Cloud} lead={v('vm_lead')}>
          <div className="space-y-3">
            <p className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold ${vmStyle.cls}`} role="status">
              <vmStyle.Icon size={16} aria-hidden="true" className={vmStyle.spin ? 'animate-spin motion-reduce:animate-none' : ''} />
              {estado ? v(`vm_${vmKey}`) : v('loading')}
            </p>
            {estado && <p className="text-sm leading-relaxed text-text-2">{v(`vm_${vmKey}_desc`)}</p>}
            {vmKey === 'ligando' && (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-muted" role="progressbar" aria-label={v('vm_ligando')} aria-busy="true">
                <div className="h-full w-2/5 rounded-full bg-tone-warning animate-indeterminate motion-reduce:animate-none" />
              </div>
            )}
            {Number.isFinite(offMs) && vmKey === 'ligada' && (
              <p className="inline-flex items-center gap-2 text-sm text-text">
                <Timer size={16} aria-hidden="true" className="text-text-2" />
                <span>{v('vm_off_in')} <strong className="font-mono font-semibold tabular-nums">{clock(offMs - now)}</strong></span>
              </p>
            )}
            {estado?.vm?.detalhe && <p className="font-mono text-xs text-text-muted [overflow-wrap:anywhere]">{estado.vm.detalhe}</p>}
          </div>
          <div className="border-t border-border pt-4">
            <h3 className="text-overline mb-2">{v('ag_title')}</h3>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-text-2">{v('ag_status')}</dt>
              <dd>
                {estado?.agente?.online
                  ? <span className="chip-success"><CheckCircle2 size={14} aria-hidden="true" />{v('ag_online')}</span>
                  : <span className="chip"><PowerOff size={14} aria-hidden="true" />{v('ag_offline')}</span>}
              </dd>
              <dt className="text-text-2">{v('ag_ip')}</dt>
              <dd className="font-mono text-text [overflow-wrap:anywhere]">{estado?.agente?.ip || dash}</dd>
              <dt className="text-text-2">{v('ag_load')}</dt>
              <dd className="text-text"><span className="font-mono tabular-nums">{estado?.agente?.online && estado.agente.load1 !== undefined ? nf.format(estado.agente.load1) : dash}</span> <span className="text-xs text-text-muted">{v('ag_load_help')}</span></dd>
              <dt className="text-text-2">{v('ag_host')}</dt>
              <dd className="font-mono text-text [overflow-wrap:anywhere]">{estado?.agente?.host || dash}{estado?.agente?.versao ? <span className="text-text-muted"> · v{estado.agente.versao}</span> : null}</dd>
              <dt className="text-text-2">{v('ag_seen')}</dt>
              <dd className="text-text">{estado?.agente?.visto_em && Number.isFinite(toMs(estado.agente.visto_em)) ? v('ago', { t: since(now - toMs(estado.agente.visto_em)) }) : dash}</dd>
            </dl>
          </div>
        </Section>
      </div>

      {/* current run */}
      <Section id="bench-run" title={v('run_title')} icon={Activity}
        lead={exec ? v('run_lead', { rps: exec.rps, cen: cenarioLabel(exec.cenario), dur: duration(exec.duracao_s) }) : undefined}
        actions={exec ? (
          <div className="flex flex-col items-end gap-1 text-right">
            {waiting ? (
              <span className="chip border-tone-warning/40 bg-tone-warning/10 text-tone-warning"><Loader2 size={14} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />{v('run_waiting')}</span>
            ) : (
              <span className="chip-success"><Activity size={14} aria-hidden="true" />{v('run_running')}</span>
            )}
            {!waiting && Number.isFinite(remaining) && (
              <span className="text-sm text-text-2">{v('run_ends_in')} <strong className="font-mono font-semibold tabular-nums text-text">{clock(remaining)}</strong></span>
            )}
          </div>
        ) : undefined}>
        {!exec ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Gauge size={28} aria-hidden="true" className="text-text-muted" />
            <p className="text-sm font-semibold text-text">{v('run_none')}</p>
            <p className="max-w-md text-sm text-text-2">{v('run_none_desc')}</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-muted" role="progressbar" aria-label={v('run_progress')}
              aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
              <div className="h-full rounded-full bg-tone-live transition-[width] duration-1000 ease-linear motion-reduce:transition-none" style={{ width: `${progress * 100}%` }} />
            </div>
            {waiting && <p className="text-sm text-text-2">{v('run_waiting_desc')}</p>}
            {!(waiting && !medido) && (<>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
              {kpi(v('k_rps'), medido ? nf.format(medido.rps) : dash, v('k_rps_target', { n: exec.rps }), Zap, 'text-tone-accent')}
              {kpi(v('k_ok'), medido ? nf.format(medido.ok_ps) : dash, v('k_per_s'), CheckCircle2, 'text-tone-success')}
              {kpi(v('k_err'), medido ? nf.format(medido.erros_ps) : dash, v('k_per_s'), XCircle, 'text-tone-danger')}
              {kpi(v('k_drop'), medido ? nf.format(medido.descartes_ps) : dash, v('k_drop_help'), AlertTriangle, 'text-tone-warning')}
              {kpi(v('k_inflight'), medido ? nf0.format(medido.em_voo) : dash, v('k_inflight_help'), RefreshCw, 'text-text-2')}
              <div className="card-inset min-w-0 space-y-1">
                <p className="text-overline inline-flex items-center gap-1.5"><Timer size={14} aria-hidden="true" />{v('k_lat')}</p>
                <dl className="grid grid-cols-[auto_1fr] gap-x-2 font-mono text-sm tabular-nums">
                  {(['p50', 'p95', 'p99'] as const).map(p => (
                    <div key={p} className="contents">
                      <dt className="text-text-muted">{p}</dt>
                      <dd className="text-right font-semibold text-text">{medido ? `${nf0.format(medido[`${p}_ms`])} ms` : dash}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
            {!medido && <p className="text-xs text-text-muted">{v('k_none')}</p>}

            {totais && (
              <div className="grid gap-3 sm:grid-cols-5">
                {[
                  ['tot_sent', nf0.format(totais.enviadas)],
                  ['tot_ok', nf0.format(totais.sucesso)],
                  ['tot_fail', nf0.format(totais.falhas)],
                  ['tot_drop', nf0.format(totais.descartes)],
                  ['tot_rate', totais.enviadas ? pf.format(totais.sucesso / totais.enviadas) : dash],
                ].map(([k, val]) => (
                  <div key={k} className="rounded-xl border border-border px-4 py-3">
                    <p className="text-xs text-text-muted">{v(k)}</p>
                    <p className="text-lg font-semibold tabular-nums text-text">{val}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="text-overline">{v('dist_status')}</h3>
                {statusEntries.length === 0 ? <p className="text-sm text-text-muted">{dash}</p> : (
                  <ul className="space-y-2">
                    {statusEntries.map(([k, n]) => {
                      const { text, bg, Icon } = TONE[statusTone(k)]
                      return (
                        <li key={k} className="space-y-1">
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="inline-flex items-center gap-1.5 font-medium text-text"><Icon size={14} aria-hidden="true" className={text} />{statusLabel(k)}</span>
                            <span className="font-mono tabular-nums text-text-2">{nf0.format(n)} <span className="text-text-muted">({pf.format(statusTotal ? n / statusTotal : 0)})</span></span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-bg-muted" aria-hidden="true">
                            <div className={`h-full rounded-full ${bg}`} style={{ width: `${statusTotal ? Math.max(1, (n / statusTotal) * 100) : 0}%` }} />
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
                <p className="text-xs leading-relaxed text-text-muted">{v('dist_status_help')}</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-overline">{v('dist_route')}</h3>
                {rotaEntries.length === 0 ? <p className="text-sm text-text-muted">{dash}</p> : (
                  <ul className="space-y-2">
                    {rotaEntries.map(([k, n]) => (
                      <li key={k} className="space-y-1">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <code className="font-mono text-text">{ROUTE_PATH[k] ?? k}</code>
                          <span className="font-mono tabular-nums text-text-2">{nf0.format(n)} <span className="text-text-muted">({pf.format(rotaTotal ? n / rotaTotal : 0)})</span></span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-bg-muted" aria-hidden="true">
                          <div className="h-full rounded-full bg-tone-live" style={{ width: `${rotaTotal ? Math.max(1, (n / rotaTotal) * 100) : 0}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-xs leading-relaxed text-text-muted">{v('dist_route_help')}</p>
              </div>
            </div>
            </>)}
          </div>
        )}
      </Section>

      {/* live chart */}
      <Section id="bench-chart" title={v('chart_title')} icon={BarChart3} lead={v('chart_lead')}
        actions={(
          <button type="button" className="btn-secondary" aria-pressed={!!frozen}
            onClick={() => setFrozen(f => (f ? null : { pontos, end: now }))}>
            {frozen ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
            {frozen ? v('chart_resume') : v('chart_pause')}
          </button>
        )}>
        {serieErr && <p className="text-xs text-tone-warning">{v('chart_err')}</p>}
        <BenchChart pontos={frozen?.pontos ?? pontos} endMs={frozen?.end ?? now} />
      </Section>

      {/* Grafana */}
      <section aria-labelledby="bench-grafana" className={`${card} flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between`}>
        <div className="min-w-0 max-w-[75ch] space-y-1">
          <h2 id="bench-grafana" className="inline-flex items-center gap-2 text-lg font-semibold text-text"><BarChart3 size={18} aria-hidden="true" className="text-text-2" />{v('gf_title')}</h2>
          <p className="text-sm leading-relaxed text-text-2">{v('gf_desc')}</p>
        </div>
        <a href={grafanaHref} target="_blank" rel="noopener noreferrer" className="btn-secondary shrink-0">
          {v('gf_btn')}<ExternalLink size={14} aria-hidden="true" />
          <span className="sr-only">{v('new_tab')}</span>
        </a>
      </section>

      {/* history */}
      <Section id="bench-history" title={v('hist_title')} icon={History} lead={v('hist_lead')}>
        {historico.length === 0 ? (
          <p className="text-sm text-text-muted">{estado ? v('hist_empty') : v('loading')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-muted">
                  {['h_start', 'h_rps', 'h_cen', 'h_dur', 'h_sent', 'h_ok', 'h_fail', 'h_drop', 'h_end'].map((k, i) => (
                    <th key={k} scope="col" className={`py-2 pr-3 font-semibold ${i >= 4 && i <= 7 ? 'text-right' : ''} ${i === 1 ? 'text-right' : ''}`}>{v(k)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historico.map(h => (
                  <tr key={`${h.geracao}-${h.inicio}`} className="border-b border-border last:border-b-0">
                    <td className="py-2 pr-3 font-mono text-xs text-text-2">{Number.isFinite(toMs(h.inicio)) ? df.format(toMs(h.inicio)) : dash}</td>
                    <td className="py-2 pr-3 text-right font-mono tabular-nums text-text">{h.rps}</td>
                    <td className="py-2 pr-3 text-text">{cenarioLabel(h.cenario)}</td>
                    <td className="py-2 pr-3 text-text-2">{duration(h.duracao_s)}</td>
                    <td className="py-2 pr-3 text-right font-mono tabular-nums text-text">{nf0.format(h.totais?.enviadas ?? 0)}</td>
                    <td className="py-2 pr-3 text-right font-mono tabular-nums text-text">{nf0.format(h.totais?.sucesso ?? 0)}</td>
                    <td className="py-2 pr-3 text-right font-mono tabular-nums text-text">{nf0.format(h.totais?.falhas ?? 0)}</td>
                    <td className="py-2 pr-3 text-right font-mono tabular-nums text-text">{nf0.format(h.totais?.descartes ?? 0)}</td>
                    <td className="py-2 text-text-2">{h.motivo_fim || dash}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <p className="flex gap-2 text-xs leading-relaxed text-text-muted">
        <Info size={14} aria-hidden="true" className="mt-0.5 shrink-0" />{v('footnote')}
      </p>
    </main>
  )
}

export default function EsoBenchPage() {
  const ready = useToolsCopy()
  return ready ? <EsoBenchView /> : <Loading />
}
