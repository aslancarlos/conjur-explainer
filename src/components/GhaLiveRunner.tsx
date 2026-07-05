import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ExternalLink, Play, Loader2,
  CheckCircle2, XCircle, Circle, CircleDot, MinusCircle, AlertTriangle,
} from 'lucide-react'

type Status     = 'idle' | 'queued' | 'in_progress' | 'completed' | 'waiting' | 'pending' | 'requested'
type Conclusion = 'success' | 'failure' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | 'neutral' | null

interface ApiJob {
  id:           number
  name:         string
  status:       Status
  conclusion:   Conclusion
  started_at:   string | null
  completed_at: string | null
  html_url:     string
}
interface ApiRun {
  run:  {
    id:              number
    status:          Status
    conclusion:      Conclusion
    html_url:        string
    created_at:      string
    run_started_at:  string | null
  }
  jobs: ApiJob[]
}

function StatusIcon({ status, conclusion }: { status: Status; conclusion: Conclusion }) {
  if (status === 'completed') {
    if (conclusion === 'success')                             return <CheckCircle2 size={14} className="text-emerald-400" />
    if (conclusion === 'failure' || conclusion === 'timed_out')return <XCircle      size={14} className="text-red-400"     />
    if (conclusion === 'cancelled')                            return <MinusCircle  size={14} className="text-slate-500"   />
    if (conclusion === 'skipped')                              return <Circle       size={14} className="text-slate-600"   />
    if (conclusion === 'action_required')                      return <CircleDot    size={14} className="text-amber-400"   />
    return <Circle size={14} className="text-slate-500" />
  }
  if (status === 'in_progress')                                return <Loader2 size={14} className="text-blue-400 animate-spin" />
  if (status === 'waiting' || status === 'pending' || status === 'requested')
                                                               return <CircleDot size={14} className="text-amber-400" />
  if (status === 'queued')                                     return <Circle size={14} className="text-slate-500 animate-pulse" />
  return <Circle size={14} className="text-slate-700" />
}

function fmtElapsed(start?: string | null, end?: string | null) {
  if (!start) return ''
  const a = new Date(start).getTime()
  const b = end ? new Date(end).getTime() : Date.now()
  const s = Math.max(0, Math.round((b - a) / 1000))
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m${(s % 60).toString().padStart(2, '0')}s`
}

interface Props {
  stages: Array<{ n: string; title: string }>
}

export default function GhaLiveRunner({ stages }: Props) {
  const { t } = useTranslation()
  const [data,    setData]    = useState<ApiRun | null>(null)
  const [runId,   setRunId]   = useState<number | null>(null)
  const [busy,    setBusy]    = useState(false)
  const [err,     setErr]     = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [_, setTick] = useState(0)
  const tickRef = useRef<number | undefined>(undefined)

  // refresh elapsed-time labels while a run is in progress
  useEffect(() => {
    if (!data || data.run.status === 'completed') return
    tickRef.current = window.setInterval(() => setTick(t => t + 1), 1000)
    return () => { if (tickRef.current) window.clearInterval(tickRef.current) }
  }, [data?.run.status])

  const formatErr = (raw: string): string => {
    if (raw.startsWith('rate_limited:per_ip:')) {
      const wait = raw.split(':')[2] ?? ''
      return t('gha.runner.err_rate_limited', { wait })
    }
    if (raw === 'rate_limited:global_cap') return t('gha.runner.err_global_cap')
    return t('gha.runner.err_generic', { msg: raw })
  }

  const start = useCallback(async () => {
    setErr(null); setBusy(true); setPending(false); setData(null); setRunId(null)
    try {
      const r = await fetch('/api/gha/run', { method: 'POST' })
      const j = await r.json().catch(() => ({}))
      if (r.status === 429) { setErr(formatErr(j.error ?? 'rate_limited')); setBusy(false); return }
      if (!r.ok && r.status !== 202) { setErr(formatErr(j.error ?? `HTTP ${r.status}`)); setBusy(false); return }
      if (r.status === 202 || j.pending || !j.run_id) {
        setPending(true); setBusy(false); return
      }
      setRunId(j.run_id)
    } catch (e: unknown) {
      setErr(formatErr(e instanceof Error ? e.message : String(e))); setBusy(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t])

  // poll until run completes — stop the interval on completion, on repeated
  // failures, and at a hard attempt cap so we never poll the backend forever.
  useEffect(() => {
    if (!runId) return
    let stopped = false
    let id: number | undefined
    let attempts = 0
    let failures = 0
    const stop = () => { if (id !== undefined) window.clearInterval(id) }
    const fail = (msg: string) => {
      stop()
      if (!stopped) { setErr(formatErr(msg)); setBusy(false) }
    }
    const poll = async () => {
      if (++attempts > 200) { stop(); if (!stopped) setBusy(false); return } // ~10 min hard cap
      try {
        const r = await fetch(`/api/gha/runs/${runId}`)
        if (!r.ok) { if (++failures >= 5) fail(`HTTP ${r.status}`); return }
        failures = 0
        const j: ApiRun = await r.json()
        if (stopped) return
        setData(j)
        if (j.run.status === 'completed') { setBusy(false); stop() }
      } catch {
        if (++failures >= 5) fail('network_error')
      }
    }
    poll()
    id = window.setInterval(poll, 3000)
    return () => { stopped = true; stop() }
    // formatErr closes over the stable `t`; intentionally excluded from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId])

  const isLive   = !!data
  const rows     = isLive
    ? data!.jobs.map(j => ({
        key:        String(j.id),
        name:       j.name,
        status:     j.status,
        conclusion: j.conclusion,
        elapsed:    fmtElapsed(j.started_at, j.completed_at),
        url:        j.html_url,
      }))
    : stages.map(s => ({
        key:        s.n,
        name:       `${s.n} — ${s.title}`,
        status:     'idle' as Status,
        conclusion: null as Conclusion,
        elapsed:    '',
        url:        '',
      }))

  const stillRunning = busy || (data && data.run.status !== 'completed')

  return (
    <div className="section-card border-gh/20 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <h4 className="font-semibold text-text text-sm">{t('gha.runner.title')}</h4>
          {isLive && (
            <span className={`badge text-[10px] ${
              data!.run.status === 'completed'
                ? data!.run.conclusion === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
                : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
            }`}>
              {data!.run.status === 'completed'
                ? (data!.run.conclusion ?? 'completed')
                : data!.run.status.replace('_', ' ')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {data?.run.html_url && (
            <a href={data.run.html_url} target="_blank" rel="noopener"
              className="text-[11px] text-gh hover:underline inline-flex items-center gap-1">
              {t('gha.runner.view_on_github')} <ExternalLink size={10} />
            </a>
          )}
          <button onClick={start} disabled={!!stillRunning} aria-busy={!!stillRunning}
            className="inline-flex items-center justify-center gap-2 px-4 min-h-[44px] rounded-lg bg-gh text-white text-xs font-semibold hover:bg-gh/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {stillRunning
              ? <><Loader2 size={12} className="animate-spin" /> {t('gha.runner.btn_running')}</>
              : <><Play    size={12} />                          {t('gha.runner.btn_run')}    </>
            }
          </button>
        </div>
      </div>

      {err && (
        <div role="alert" className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
          <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span>{err}</span>
        </div>
      )}
      {pending && !err && (
        <div role="status" className="flex items-start gap-2 text-xs text-blue-600 dark:text-blue-300 bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2">
          <Loader2 size={12} className="mt-0.5 flex-shrink-0 animate-spin" />
          <span>{t('gha.runner.pending')}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-1.5">
        {rows.map(row => (
          <div key={row.key} className="flex items-center gap-2.5 rounded-lg bg-bg-base/60 px-3 py-2">
            <span className="flex-shrink-0 w-4 flex items-center justify-center">
              <StatusIcon status={row.status} conclusion={row.conclusion} />
            </span>
            <span className="text-xs text-text-2 leading-relaxed flex-1 truncate">{row.name}</span>
            {row.elapsed && (
              <span className="text-[10px] font-mono text-text-muted flex-shrink-0">{row.elapsed}</span>
            )}
            {row.url && (
              <a href={row.url} target="_blank" rel="noopener" aria-label={`View ${row.name} on GitHub`} className="text-text-muted hover:text-gh flex-shrink-0">
                <ExternalLink size={11} />
              </a>
            )}
          </div>
        ))}
      </div>

      <p className="text-[10px] text-text-muted">{t('gha.runner.hint')}</p>
    </div>
  )
}
