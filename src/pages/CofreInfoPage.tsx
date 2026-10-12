import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CheckCircle2, XCircle, Loader2, KeyRound, ShieldCheck, Server, Vault, Search, RefreshCw, RotateCw,
  History, Copy, Check, AlertTriangle, Info, Repeat2, PauseCircle, Circle, EyeOff, Timer, Boxes,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Loading from '../components/Loading'
import { useToolsCopy } from '../lib/toolsCopy'
import { mmss, refreshPresence, ROTATION_STEPS, rotationEnded, secondsLeft, type RotationRec } from '../lib/presence'

/**
 * Cofre Info: lists the accounts of the demo Safe, explains each field, shows
 * who is in use in a Dual Account pair and since when, the version history
 * with validity windows (metadata only, the value is never read) and requests
 * a rotation. A Dual Account rotates as a pair: vault-control changes the
 * password of the Inactive member, waits for the Central Policy Manager, then
 * promotes it (see vault-control/dual.go). Local mock: VAULT_MOCK=1 npm run dev.
 */

const API = '/api/vault'
/** Platforms whose rotation reaches infrastructure, cloud keys or the platform itself: typed confirmation. */
const SENSITIVE = /linux|win|unix|aws|azure|gcp|identity|conjur|paloalto|ssh/i
/** Dual Account properties worth explaining (lookup ignores case: VirtualUsername and VirtualUserName). */
const DUAL_PROPS = ['VirtualUserName', 'DualAccountStatus', 'Index', 'CurrInd', 'GroupName']

interface Management {
  automaticManagementEnabled?: boolean; status?: string; manualManagementReason?: string
  lastModifiedTime?: number | string; lastReconciledTime?: number | string; lastVerifiedTime?: number | string
}
interface Account {
  id: string; name: string; userName?: string; address?: string; platformId: string; secretType?: string
  createdTime?: number; properties?: Record<string, string>; management?: Management
  dual: boolean; virtualUserName?: string; dualStatus?: string; self: boolean; conjurPath: string
}
interface HistEntry {
  version: number; accountId: string; userName: string; modifiedBy?: string
  validFrom: string | null; validUntil: string | null; temporary?: boolean; current: boolean
  dualStatus?: string; inUse?: boolean
}
interface Member { id: string; name: string; userName: string }
interface Pair {
  virtualUserName: string; conjurPath: string
  active: Member & { since?: string; sinceSource?: 'rotation' | 'activities' }
  inactive: Member
}
interface Detail {
  account: Account; history: HistEntry[]; historyError?: string
  pair?: Pair; pairTimeline?: HistEntry[]; pairTimelineError?: string; pairError?: string; rotation?: RotationRec
}
interface ChainStep { step: string; ok: boolean; error?: string }

type RotUI =
  | { kind: 'idle' } | { kind: 'confirm' } | { kind: 'sending' }
  | { kind: 'simple'; phase: 'waiting' | 'done' | 'failed'; message?: string }
  | { kind: 'dual'; rec: RotationRec; skew: number; note?: string }
  | { kind: 'error'; message: string }

const CHAIN = [
  { key: 'conjur_jwt', Icon: KeyRound },
  { key: 'conjur_secret', Icon: ShieldCheck },
  { key: 'identity_token', Icon: Server },
  { key: 'privilege_cloud', Icon: Vault },
] as const

function toDate(v?: number | string | null): Date | null {
  if (v === undefined || v === null || v === '' || v === 0) return null
  if (typeof v === 'number') return new Date(v < 1e12 ? v * 1000 : v)
  const n = Number(v)
  if (!Number.isNaN(n)) return toDate(n)
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

async function getJSON<T>(url: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: T }> {
  const r = await fetch(url, { cache: 'no-store', ...init })
  const data = await r.json().catch(() => ({} as T))
  return { ok: r.ok, status: r.status, data }
}

const prop = (props: Record<string, string> | undefined, key: string) =>
  Object.entries(props ?? {}).find(([k]) => k.toLowerCase() === key.toLowerCase())?.[1]

const card = 'rounded-2xl border border-border bg-bg-card'
const btnSecondary = 'inline-flex h-11 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-text-2 transition-colors hover:border-idira-blue hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue disabled:cursor-not-allowed disabled:opacity-40'
const btnPrimary = 'inline-flex h-11 items-center gap-2 rounded-md bg-idira-blue px-4 text-sm font-semibold text-white transition-colors hover:bg-idira-blue-2 active:bg-idira-blue-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40'
const btnIcon = 'inline-flex shrink-0 items-center justify-center rounded-lg border border-border text-text-2 transition-colors hover:border-idira-blue hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue'
const chip = 'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium'


type VFn = (k: string, o?: Record<string, unknown>) => string

/** Short date in the browser time zone; the full date and zone go in the title. */
function When({ iso, lang, className = '' }: { iso?: string | null; lang: string; className?: string }) {
  const d = toDate(iso ?? null)
  if (!d) return <span className="text-text-muted">-</span>
  const sameYear = d.getFullYear() === new Date().getFullYear()
  const day = d.toLocaleDateString(lang, { day: '2-digit', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) })
  const time = d.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })
  return (
    <time dateTime={d.toISOString()} title={d.toLocaleString(lang, { dateStyle: 'full', timeStyle: 'long' })} className={`block whitespace-nowrap tabular-nums ${className}`}>
      {day}<span className="block text-xs text-text-muted">{time}</span>
    </time>
  )
}

function CopyButton({ text, v }: { text: string; v: VFn }) {
  const [copied, setCopied] = useState(false)
  useEffect(() => { if (!copied) return; const h = setTimeout(() => setCopied(false), 2000); return () => clearTimeout(h) }, [copied])
  return (
    <button type="button" onClick={() => navigator.clipboard?.writeText(text).then(() => setCopied(true)).catch(() => {})}
      className={`${btnIcon} h-11 w-11`} aria-label={v('copy_path')} title={v('copy_path')}>
      {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
    </button>
  )
}

function DualChip({ status, v }: { status?: string; v: VFn }) {
  if (!status) return null
  return status.toLowerCase() === 'active'
    ? <span className={`${chip} border-tone-success/40 bg-tone-success/10 text-tone-success`}><CheckCircle2 size={12} aria-hidden="true" />{v('dual_active')}</span>
    : <span className={`${chip} border-border text-text-2`}><PauseCircle size={12} aria-hidden="true" />{v('dual_inactive')}</span>
}

function Field({ label, help, children }: { label: string; help: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-border py-3 last:border-b-0 sm:grid-cols-[200px_1fr] sm:gap-4">
      <dt className="text-sm font-semibold text-text">{label}</dt>
      <dd className="min-w-0 space-y-0.5">
        <div className="break-words text-sm text-text">{children}</div>
        <p className="text-xs leading-relaxed text-text-muted">{help}</p>
      </dd>
    </div>
  )
}

function StatusCell({ h, isPair, v }: { h: HistEntry; isPair: boolean; v: VFn }) {
  const note = (text: string) => <span className="mt-0.5 block text-xs text-text-muted">{text}</span>
  if (h.inUse) return <><span className={`${chip} border-tone-success/40 bg-tone-success/10 text-tone-success`}><CheckCircle2 size={12} aria-hidden="true" />{v('dual_active')}</span>{note(v('st_in_use_note'))}</>
  if (h.current && isPair) return <><span className={`${chip} border-border text-text-2`}><PauseCircle size={12} aria-hidden="true" />{v('dual_inactive')}</span>{note(v('st_standby_note'))}</>
  if (h.current) return <span className={`${chip} border-tone-accent/40 bg-tone-accent/10 text-text`}><Circle size={10} aria-hidden="true" className="fill-current text-tone-accent" />{v('st_current')}</span>
  return <span className="text-xs text-text-muted">{v('st_superseded')}</span>
}

/** Steps of a pair rotation, with the Central Policy Manager countdown and the result. */
function Progress({ rec, skew, note, v, lang, safe, onClose }: {
  rec: RotationRec; skew: number; note?: string; v: VFn; lang: string; safe: string; onClose: () => void
}) {
  const [, setTick] = useState(0)
  const counting = rec.step === 'trocando_senha'
  useEffect(() => {
    if (!counting) return
    const h = window.setInterval(() => setTick(n => n + 1), 1000)
    return () => window.clearInterval(h)
  }, [counting])
  const clock = (iso?: string) => {
    const d = toDate(iso ?? null)
    return d ? d.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''
  }
  const failedAt = rec.step === 'falhou' ? rec.steps[rec.steps.length - 2]?.step : undefined
  const cur = rec.step === 'falhou' ? ROTATION_STEPS.indexOf(failedAt as RotationRec['step']) : ROTATION_STEPS.indexOf(rec.step)
  const at = (s: string) => rec.steps.find(x => x.step === s)?.at
  const left = rec.step === 'trocando_senha' ? secondsLeft(rec.deadline, skew) : null
  const label = (s: string) => v(`step_${s}`, { target: rec.target.userName })
  const names = { target: rec.target.userName, other: rec.other.userName, safe }
  const errText = v(`rot_err_${rec.errorCode ?? 'unknown'}`, { ...names, defaultValue: v('rot_err_unknown') })
  const srText = rec.step === 'concluida' ? v('rot_dual_done', names)
    : rec.step === 'falhou' ? `${v('rot_err_title')}. ${errText}`
    : v('step_of', { n: cur + 1, m: ROTATION_STEPS.length, label: label(rec.step) })
  return (
    <div className="space-y-3">
      <p className="sr-only" role="status" aria-live="polite">{srText}</p>
      {note && <p className="flex items-center gap-2 text-xs text-text-2"><Info size={14} aria-hidden="true" />{note}</p>}
      <ol aria-label={v('rot_progress')}>
        {ROTATION_STEPS.map((s, i) => {
          const done = i < cur || rec.step === 'concluida'
          const isCur = i === cur && rec.step !== 'concluida'
          const failed = isCur && rec.step === 'falhou'
          const last = i === ROTATION_STEPS.length - 1
          return (
            <li key={s} className="relative flex gap-3 pb-3 last:pb-0" aria-current={isCur ? 'step' : undefined}>
              {!last && <span className={`absolute left-[11px] top-6 h-[calc(100%-1.25rem)] w-px ${done ? 'bg-tone-success/60' : 'bg-border'}`} aria-hidden="true" />}
              <span className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bg-base">
                {failed ? <XCircle size={20} aria-hidden="true" className="text-tone-danger" />
                  : done ? <CheckCircle2 size={20} aria-hidden="true" className="text-tone-success" />
                  : isCur ? <Loader2 size={20} aria-hidden="true" className="animate-spin text-tone-accent" />
                  : <Circle size={20} aria-hidden="true" className="text-text-muted" />}
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                  <span className={isCur ? 'font-semibold text-text' : done ? 'text-text' : 'text-text-muted'}>{label(s)}</span>
                  {at(s) && <time dateTime={at(s)} className="font-mono text-xs tabular-nums text-text-muted">{clock(at(s))}</time>}
                </p>
                {s === 'trocando_senha' && left !== null && (
                  <div className="mt-2 flex items-center gap-3 rounded-lg border border-border bg-bg-card px-3 py-2">
                    <Timer size={16} aria-hidden="true" className="shrink-0 text-tone-accent" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-text">{v('rot_deadline')}</p>
                      <p className="text-xs text-text-2">{v('rot_deadline_desc', { min: Math.round(rec.cpmTimeoutSeconds / 60) })}</p>
                    </div>
                    <span role="timer" aria-live="off" className="font-mono text-lg font-semibold tabular-nums text-text">{mmss(left)}</span>
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>
      {rec.step === 'concluida' && (
        <div className="callout-success">
          <CheckCircle2 size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-tone-success" />
          <p className="text-text">{v('rot_dual_done', names)}</p>
        </div>
      )}
      {rec.step === 'falhou' && (
        <div className="callout-danger">
          <XCircle size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-tone-danger" />
          <div className="min-w-0 space-y-1">
            <p className="font-semibold text-text">{v('rot_err_title')}</p>
            <p>{errText}</p>
            {rec.reason && (
              <details className="text-xs">
                <summary className="cursor-pointer rounded text-text-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue">{v('rot_detail')}</summary>
                <p className="mt-1 break-words font-mono text-text-2">{rec.errorCode}: {rec.reason}</p>
              </details>
            )}
          </div>
        </div>
      )}
      {rotationEnded(rec) && <button type="button" onClick={onClose} className={btnSecondary}>{v('rot_again')}</button>}
    </div>
  )
}

function CofreInfoView() {
  const { t, i18n } = useTranslation()
  const v: VFn = (k, o) => t(`vault.${k}`, o) as string
  const lang = i18n.resolvedLanguage ?? i18n.language
  const fmt = (d: Date | null) => (d ? d.toLocaleString(lang, { dateStyle: 'medium', timeStyle: 'short' }) : v('never'))

  // ---------- trust chain ----------
  const [chain, setChain] = useState<ChainStep[] | null>(null)
  const [chainBusy, setChainBusy] = useState(false)
  const loadChain = useCallback(async () => {
    setChainBusy(true)
    try {
      const r = await getJSON<{ steps: ChainStep[] }>(`${API}/chain`)
      setChain(r.data.steps ?? [])
    } catch { setChain([]) } finally { setChainBusy(false) }
  }, [])

  // ---------- accounts ----------
  const [accounts, setAccounts] = useState<Account[] | null>(null)
  const [listError, setListError] = useState('')
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null)
  // Safe and API account names come from the backend (kept out of the public repo)
  const [names, setNames] = useState({ safe: '', account: '' })
  const loadAccounts = useCallback(async (fresh = false) => {
    setListError('')
    try {
      const r = await getJSON<{ accounts: Account[]; safe?: string; credential?: string; error?: string }>(`${API}/accounts${fresh ? '?fresh=1' : ''}`)
      if (!r.ok) throw new Error(r.data.error || `HTTP ${r.status}`)
      setNames({ safe: r.data.safe ?? '', account: r.data.credential ?? '' })
      setAccounts([...r.data.accounts].sort((a, b) => a.name.localeCompare(b.name)))
      setFetchedAt(new Date())
    } catch (e) { setListError((e as Error).message); setAccounts(a => a ?? []) }
  }, [])
  useEffect(() => { loadChain(); loadAccounts() }, [loadChain, loadAccounts])

  const [query, setQuery] = useState('')
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (accounts ?? []).filter(a => !q || [a.name, a.userName, a.address, a.platformId, a.virtualUserName].some(x => x?.toLowerCase().includes(q)))
  }, [accounts, query])
  const stats = useMemo(() => {
    const a = accounts ?? []
    return {
      total: a.length,
      dual: a.filter(x => x.dual).length,
      auto: a.filter(x => x.management?.automaticManagementEnabled).length,
      failed: a.filter(x => (x.management?.status ?? '').toLowerCase().startsWith('fail')).length,
    }
  }, [accounts])

  // ---------- selected account ----------
  const [selId, setSelId] = useState<string | null>(null)
  const [detail, setDetail] = useState<Detail | null>(null)
  const [detailBusy, setDetailBusy] = useState(false)
  const [detailError, setDetailError] = useState('')
  const detailRef = useRef<HTMLDivElement>(null)
  const loadDetail = useCallback(async (id: string) => {
    const r = await getJSON<Detail & { error?: string }>(`${API}/accounts/${encodeURIComponent(id)}`)
    if (!r.ok) throw new Error(r.data.error || `HTTP ${r.status}`)
    return r.data
  }, [])

  // ---------- rotation ----------
  const [rot, setRot] = useState<RotUI>({ kind: 'idle' })
  const [confirmText, setConfirmText] = useState('')
  const pollRef = useRef<number | null>(null)
  const stopPoll = () => { if (pollRef.current) { window.clearInterval(pollRef.current); pollRef.current = null } }
  useEffect(() => stopPoll, [])

  const attachDual = (rec: RotationRec, note?: string) =>
    setRot({ kind: 'dual', rec, skew: new Date(rec.serverTime).getTime() - Date.now(), note })

  const select = async (id: string) => {
    stopPoll()
    setSelId(id); setDetail(null); setDetailError(''); setRot({ kind: 'idle' }); setConfirmText(''); setDetailBusy(true)
    try {
      const d = await loadDetail(id)
      setDetail(d)
      if (d.rotation) attachDual(d.rotation)
    } catch (e) { setDetailError((e as Error).message) } finally { setDetailBusy(false) }
    requestAnimationFrame(() => detailRef.current?.focus())
  }

  // pair rotation: follow /rotations/{id} until it ends, then refresh the account
  const dualId = rot.kind === 'dual' && !rotationEnded(rot.rec) ? rot.rec.rotationId : null
  useEffect(() => {
    if (!dualId) return
    let alive = true
    const h = window.setInterval(async () => {
      try {
        const r = await getJSON<RotationRec>(`${API}/rotations/${dualId}`)
        if (!alive) return
        if (!r.ok) { setRot(s => (s.kind === 'dual' ? { ...s, note: v('rot_poll_lost') } : s)); return }
        attachDual(r.data)
        if (rotationEnded(r.data) && selId) {
          loadDetail(selId).then(d => alive && setDetail(d)).catch(() => {})
          loadAccounts(true)
          refreshPresence()
        }
      } catch { if (alive) setRot(s => (s.kind === 'dual' ? { ...s, note: v('rot_poll_lost') } : s)) }
    }, 2000)
    return () => { alive = false; window.clearInterval(h) }
  }, [dualId]) // eslint-disable-line react-hooks/exhaustive-deps

  const requestRotation = async () => {
    if (!detail) return
    const id = detail.account.id
    const startVersion = detail.history[0]?.version
    const startModified = toDate(detail.account.management?.lastModifiedTime)?.getTime() ?? 0
    setRot({ kind: 'sending' })
    const r = await getJSON<{ error?: string; dual?: boolean; rotation?: RotationRec }>(
      `${API}/accounts/${encodeURIComponent(id)}/rotate`, { method: 'POST', headers: { 'X-Cofre-Info': '1' } })
    if (!r.ok) {
      const code = r.data.error ?? ''
      if (code === 'rotation_in_progress' && r.data.rotation) { attachDual(r.data.rotation, v('rot_in_progress')); return }
      const known: Record<string, string> = { wait: v('rot_wait'), daily: v('rot_daily'), self: v('rot_self') }
      const message = known[code] ?? (code.startsWith('dual_') ? v(`pair_err_${code}`) : code || `HTTP ${r.status}`)
      setRot({ kind: 'error', message })
      return
    }
    if (r.data.dual && r.data.rotation) {
      attachDual(r.data.rotation)
      refreshPresence()
      return
    }
    // simple account: the Central Policy Manager changes it; follow the account metadata
    setRot({ kind: 'simple', phase: 'waiting' })
    const started = Date.now()
    stopPoll()
    pollRef.current = window.setInterval(async () => {
      try {
        const d = await loadDetail(id)
        setDetail(d)
        const st = (d.account.management?.status ?? '').toLowerCase()
        const newVersion = d.history[0]?.version !== undefined && d.history[0]?.version !== startVersion
        const touched = (toDate(d.account.management?.lastModifiedTime)?.getTime() ?? 0) > startModified
        if (newVersion || (touched && st.startsWith('success'))) {
          setRot({ kind: 'simple', phase: 'done' }); stopPoll(); loadAccounts(true)
        } else if (touched && st.startsWith('fail')) {
          setRot({ kind: 'simple', phase: 'failed', message: v('rot_err_cpm_failure', { target: d.account.userName }) }); stopPoll()
        } else if (Date.now() - started > 180_000) {
          setRot({ kind: 'simple', phase: 'failed', message: v('rot_timeout') }); stopPoll()
        }
      } catch { /* keep polling */ }
    }, 5000)
  }

  const sel = detail?.account
  const pair = detail?.pair
  const isPair = !!sel?.dual && !!pair
  const sensitive = !!sel && SENSITIVE.test(sel.platformId)
  const statusOf = (m?: Management) => {
    const s = (m?.status ?? '').toLowerCase()
    if (!m?.automaticManagementEnabled) return { label: v('st_manual'), cls: 'border-border text-text-2', Icon: Info }
    if (s.startsWith('success')) return { label: v('st_ok'), cls: 'border-tone-success/40 bg-tone-success/10 text-tone-success', Icon: CheckCircle2 }
    if (s.startsWith('fail')) return { label: v('st_fail'), cls: 'border-tone-danger/40 bg-tone-danger/10 text-tone-danger', Icon: XCircle }
    return { label: v('st_pending'), cls: 'border-tone-warning/40 bg-tone-warning/10 text-tone-warning', Icon: Loader2 }
  }
  // ---------- history table (pair timeline or one account) ----------
  const rows: HistEntry[] = (isPair ? detail?.pairTimeline : detail?.history) ?? []
  const histError = isPair ? detail?.pairTimelineError : detail?.historyError
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <PageHeader badge={v('badge')} title={v('title')} subtitle={v('subtitle')} />

      {/* trust chain */}
      <section aria-labelledby="vault-chain" className={`${card} space-y-4 p-6`}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="max-w-2xl space-y-1">
            <h2 id="vault-chain" className="text-xl font-semibold text-text">{v('chain_title')}</h2>
            <p className="text-sm leading-relaxed text-text-2">{v('chain_lead')}</p>
          </div>
          <button type="button" onClick={loadChain} disabled={chainBusy} className={btnSecondary}>
            <RefreshCw size={16} aria-hidden="true" className={chainBusy ? 'animate-spin' : ''} />{v('chain_test')}
          </button>
        </div>
        <ol className="grid gap-3 md:grid-cols-4">
          {CHAIN.map(({ key, Icon }, i) => {
            const s = chain?.find(x => x.step === key)
            const state = chainBusy || !chain ? 'busy' : s ? (s.ok ? 'ok' : 'fail') : 'skip'
            return (
              <li key={key} className="relative rounded-xl border border-border bg-bg-base p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-idira-blue/10 text-tone-accent"><Icon size={18} aria-hidden="true" /></span>
                  <span className="font-mono text-xs font-semibold text-text-muted">{i + 1}/4</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-text">{v(`chain_${key}`)}</p>
                <p className="mt-1 text-xs leading-relaxed text-text-2">{v(`chain_${key}_desc`, { safe: names.safe || '…', account: names.account || '…' })}</p>
                <p className={`mt-2 inline-flex items-center gap-1.5 text-xs font-semibold ${state === 'ok' ? 'text-tone-success' : state === 'fail' ? 'text-tone-danger' : 'text-text-muted'}`}>
                  {state === 'ok' ? <CheckCircle2 size={14} aria-hidden="true" /> : state === 'fail' ? <XCircle size={14} aria-hidden="true" /> : <Loader2 size={14} aria-hidden="true" className={state === 'busy' ? 'animate-spin' : ''} />}
                  {v(`state_${state}`)}
                </p>
                {s?.error && <p className="mt-1 break-words font-mono text-xs text-tone-danger">{s.error}</p>}
              </li>
            )
          })}
        </ol>
      </section>

      {/* summary */}
      <section aria-label={v('summary')} className="grid gap-3 sm:grid-cols-4">
        {[
          { k: 'stat_total', n: stats.total },
          { k: 'stat_dual', n: stats.dual },
          { k: 'stat_auto', n: stats.auto },
          { k: 'stat_failed', n: stats.failed },
        ].map(x => (
          <div key={x.k} className={`${card} p-4`}>
            <p className="text-overline">{v(x.k)}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-text">{accounts ? x.n : '-'}</p>
          </div>
        ))}
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] 2xl:grid-cols-[minmax(0,19rem)_minmax(0,1fr)]">
        {/* list */}
        <section aria-labelledby="vault-list" className={`${card} p-4 lg:sticky lg:top-20`}>
          <div className="flex items-center justify-between gap-2 px-2 pb-3">
            <h2 id="vault-list" className="text-base font-semibold text-text [overflow-wrap:anywhere]">{v('list_title', { safe: names.safe || '…' })}</h2>
            <button type="button" onClick={() => loadAccounts(true)} className={`${btnIcon} h-11 w-11`} aria-label={v('refresh')} title={v('refresh')}>
              <RefreshCw size={16} aria-hidden="true" />
            </button>
          </div>
          <label className="relative mb-3 block px-2">
            <span className="sr-only">{v('search')}</span>
            <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={v('search')}
              className="h-11 w-full rounded-md border border-border bg-bg-base pl-10 pr-3 text-sm text-text placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue" />
          </label>
          {listError && <p role="alert" className="mx-2 mb-3 rounded-lg border border-tone-danger/40 bg-tone-danger/10 p-3 text-sm text-tone-danger">{v('error')}: {listError}</p>}
          {!accounts ? (
            <ul className="space-y-2 px-2" aria-busy="true" aria-label={v('loading')}>
              {[0, 1, 2, 3].map(i => <li key={i} className="h-12 animate-pulse rounded-lg bg-bg-muted" />)}
            </ul>
          ) : (
            <ul className="max-h-[560px] space-y-1 overflow-y-auto">
              {shown.map(a => {
                const st = statusOf(a.management)
                const on = a.id === selId
                return (
                  <li key={a.id}>
                    <button type="button" onClick={() => select(a.id)} aria-current={on ? 'true' : undefined}
                      className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue ${on ? 'border-idira-blue bg-idira-blue/10' : 'border-transparent hover:border-border hover:bg-bg-muted'}`}>
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate font-mono text-sm font-semibold text-text" title={a.name}>{a.name}</span>
                        <span className={`${chip} shrink-0 rounded px-1.5 py-0 ${st.cls}`}><st.Icon size={12} aria-hidden="true" />{st.label}</span>
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-2">
                        <span className="truncate font-mono">{a.userName}</span>
                        <span className="text-text-muted">{a.platformId}</span>
                        {a.dual && <span className="inline-flex items-center gap-1 rounded border border-domain-cp/40 px-1.5 font-semibold text-text"><Repeat2 size={12} aria-hidden="true" />{a.virtualUserName || 'Dual Account'}</span>}
                        {a.dual && <DualChip status={a.dualStatus} v={v} />}
                        {a.self && <span className="rounded border border-border px-1.5 text-text-muted">{v('self_tag')}</span>}
                      </span>
                    </button>
                  </li>
                )
              })}
              {shown.length === 0 && <li className="px-2 py-6 text-sm text-text-muted">{v('empty')}</li>}
            </ul>
          )}
          {fetchedAt && <p className="px-2 pt-3 text-xs text-text-muted">{v('fetched', { when: fmt(fetchedAt) })}</p>}
        </section>

        {/* detail */}
        <section aria-labelledby="vault-detail" aria-busy={detailBusy} className={`${card} p-6 focus:outline-none`} ref={detailRef} tabIndex={-1}>
          {!selId ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Vault size={32} aria-hidden="true" className="text-text-muted" />
              <h2 id="vault-detail" className="text-lg font-semibold text-text">{v('pick_title')}</h2>
              <p className="max-w-sm text-sm text-text-2">{v('pick_desc')}</p>
            </div>
          ) : detailError ? (
            <div className="callout-danger" role="alert">
              <AlertTriangle size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-tone-danger" />
              <div className="space-y-2">
                <h2 id="vault-detail" className="font-semibold text-text">{v('error')}</h2>
                <p className="break-words">{detailError}</p>
                <button type="button" onClick={() => select(selId)} className={btnSecondary}><RefreshCw size={16} aria-hidden="true" />{v('refresh')}</button>
              </div>
            </div>
          ) : detailBusy || !sel ? (
            <div className="space-y-4" aria-label={v('loading')}>
              <h2 id="vault-detail" className="sr-only">{v('loading')}</h2>
              <div className="h-7 w-1/2 animate-pulse rounded bg-bg-muted" />
              <div className="h-24 animate-pulse rounded-xl bg-bg-muted" />
              <div className="h-48 animate-pulse rounded-xl bg-bg-muted" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* header */}
              <div className="space-y-2">
                <h2 id="vault-detail" className="break-all font-mono text-xl font-bold text-text">{sel.name}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`${chip} border-border font-mono text-text-2`}>{sel.platformId}</span>
                  {sel.dual && <span className={`${chip} border-domain-cp/50 text-text`}><Repeat2 size={12} aria-hidden="true" />Dual Account</span>}
                  {sel.dual && <DualChip status={sel.dualStatus} v={v} />}
                  {(() => { const st = statusOf(sel.management); return <span className={`${chip} ${st.cls}`}><st.Icon size={12} aria-hidden="true" />{st.label}</span> })()}
                </div>
                <p className="text-sm text-text-2">{v('detail_lead')}</p>
              </div>

              {/* dual pair summary */}
              {sel.dual && detail?.pairError && (
                <div className="callout-warning" role="alert">
                  <AlertTriangle size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-tone-warning" />
                  <div><p className="font-semibold text-text">{v('pair_err_title')}</p><p>{v(`pair_err_${detail.pairError}`, { defaultValue: detail.pairError })}</p></div>
                </div>
              )}
              {isPair && pair && (
                <section aria-labelledby="vault-pair" className="space-y-3">
                  <div className="space-y-1">
                    <h3 id="vault-pair" className="inline-flex items-center gap-2 text-base font-semibold text-text">
                      <Repeat2 size={18} aria-hidden="true" className="text-domain-cp" />{v('pair_title', { name: pair.virtualUserName })}
                    </h3>
                    <p className="text-sm leading-relaxed text-text-2">{v('pair_lead')}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-tone-success/50 bg-tone-success/[0.06] p-4">
                      <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-tone-success"><CheckCircle2 size={14} aria-hidden="true" />{v('pair_in_use')}</p>
                      <p className="mt-2 break-all font-mono text-xl font-semibold text-text">{pair.active.userName}</p>
                      <p className="mt-0.5 text-xs text-text-muted">
                        <span className="font-mono">{pair.active.name}</span> · {v('dual_active')}{pair.active.id === sel.id ? ` · ${v('pair_this')}` : ''}
                      </p>
                      {pair.active.since && (
                        <p className="mt-2 text-sm text-text-2">
                          <time dateTime={pair.active.since} title={toDate(pair.active.since)?.toLocaleString(lang, { dateStyle: 'full', timeStyle: 'long' })}>
                            {v('pair_since', { when: toDate(pair.active.since)?.toLocaleString(lang, { dateStyle: 'medium', timeStyle: 'short' }) })}
                          </time>
                          {pair.active.sinceSource && <span className="block text-xs text-text-muted">{v(`pair_since_${pair.active.sinceSource}`)}</span>}
                        </p>
                      )}
                    </div>
                    <div className="rounded-xl border border-border bg-bg-base p-4">
                      <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-2"><PauseCircle size={14} aria-hidden="true" />{v('pair_standby')}</p>
                      <p className="mt-2 break-all font-mono text-xl font-semibold text-text">{pair.inactive.userName}</p>
                      <p className="mt-0.5 text-xs text-text-muted">
                        <span className="font-mono">{pair.inactive.name}</span> · {v('dual_inactive')}{pair.inactive.id === sel.id ? ` · ${v('pair_this')}` : ''}
                      </p>
                      <p className="mt-2 text-sm text-text-2">{v('pair_standby_desc')}</p>
                    </div>
                  </div>
                  <div className="space-y-3 rounded-xl border border-border bg-bg-base p-4">
                    <p className="inline-flex items-center gap-2 text-overline"><Boxes size={14} aria-hidden="true" className="text-tone-live" />{v('pair_delivery_title')}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-text-2">{v('pair_conjur')}</span>
                      <code className="break-all rounded bg-bg-muted px-1.5 py-0.5 font-mono text-xs text-text">{pair.conjurPath}</code>
                      <CopyButton text={pair.conjurPath} v={v} />
                    </div>
                    <p className="text-sm text-text-2">{v('pair_eso')}</p>
                    <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm">
                      <dt className="font-mono text-xs text-text-muted">{v('pair_eso_user')}</dt><dd className="font-mono text-text">{pair.active.userName}</dd>
                      <dt className="font-mono text-xs text-text-muted">{v('pair_eso_pass')}</dt><dd className="inline-flex items-center gap-1.5 text-text-2"><EyeOff size={14} aria-hidden="true" />{v('pair_eso_pass_value', { user: pair.active.userName })}</dd>
                      <dt className="font-mono text-xs text-text-muted">{v('pair_eso_addr')}</dt><dd className="text-text-2">{v('pair_eso_addr_value')}</dd>
                    </dl>
                  </div>
                </section>
              )}

              {/* history / pair timeline */}
              <section aria-labelledby="vault-hist" className="space-y-3">
                <div className="space-y-1">
                  <h3 id="vault-hist" className="inline-flex items-center gap-2 text-base font-semibold text-text"><History size={18} aria-hidden="true" className="text-text-2" />{isPair ? v('tl_title_pair') : v('tl_title')}</h3>
                  <p className="text-sm leading-relaxed text-text-2">{isPair ? v('tl_lead_pair') : v('tl_lead')}</p>
                </div>
                {histError && rows.length === 0 ? (
                  <div className="callout-warning"><AlertTriangle size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-tone-warning" /><p>{v('hist_error')}: <span className="break-words font-mono text-xs">{histError}</span></p></div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-sm">
                      <caption className="sr-only">{v('tl_caption')}</caption>
                      <thead className="bg-bg-muted">
                        <tr className="text-left">
                          {['col_version', 'col_user', 'col_from', 'col_until', 'col_status'].map(c => (
                            <th key={c} scope="col" className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-text-muted">{v(c)}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map(h => (
                          <tr key={`${h.accountId}-${h.version}`} className={`border-t border-border ${h.inUse ? 'bg-tone-success/[0.06]' : ''}`}>
                            <td className="px-3 py-2.5 align-top">
                              <span className="font-mono font-semibold tabular-nums text-text">#{h.version}</span>
                              {h.temporary && <span className="ml-1 text-xs text-tone-warning">{v('tl_temporary')}</span>}
                              <span className="mt-0.5 block max-w-[11rem] truncate text-xs text-text-muted" title={`${v('col_by')}: ${h.modifiedBy || '-'}`}>
                                <span className="sr-only">{v('col_by')}: </span>{h.modifiedBy || '-'}
                              </span>
                            </td>
                            <td className={`whitespace-nowrap px-3 py-2.5 align-top font-mono ${h.current ? 'font-semibold text-text' : 'text-text-2'}`}>{h.userName}</td>
                            <td className="px-3 py-2.5 align-top text-text-2"><When iso={h.validFrom} lang={lang} /></td>
                            <td className="px-3 py-2.5 align-top">
                              {h.validUntil ? <When iso={h.validUntil} lang={lang} className="text-text-2" />
                                : h.inUse ? <span className="font-semibold text-tone-success">{v('until_in_use')}</span>
                                : <span className="font-medium text-text">{v('until_current')}</span>}
                            </td>
                            <td className="px-3 py-2.5 align-top"><StatusCell h={h} isPair={isPair} v={v} /></td>
                          </tr>
                        ))}
                        {rows.length === 0 && <tr><td colSpan={5} className="px-3 py-4 text-text-muted">{v('hist_empty')}</td></tr>}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="flex items-center gap-1.5 text-xs text-text-muted"><EyeOff size={14} aria-hidden="true" />{v('tl_masked')}</p>
              </section>

              {/* rotation */}
              <section aria-labelledby="vault-rot" className="space-y-3 rounded-xl border border-border bg-bg-base p-4">
                <h3 id="vault-rot" className="inline-flex items-center gap-2 text-base font-semibold text-text"><RotateCw size={18} aria-hidden="true" className="text-tone-accent" />{v('rot_title')}</h3>
                <p className="text-sm leading-relaxed text-text-2">
                  {isPair && pair ? v('rot_dual_lead', { inactive: pair.inactive.userName, active: pair.active.userName }) : v('rot_lead')}
                </p>
                {sel.self ? (
                  <p className="text-sm text-text-2"><Info size={14} aria-hidden="true" className="mr-1 inline" />{v('rot_self')}</p>
                ) : rot.kind === 'idle' ? (
                  <button type="button" onClick={() => setRot({ kind: 'confirm' })} disabled={sel.dual && !pair} className={btnPrimary}>
                    <RotateCw size={16} aria-hidden="true" />{isPair ? v('rot_dual_button') : v('rot_button')}
                  </button>
                ) : rot.kind === 'confirm' ? (
                  <div className="space-y-3">
                    {sensitive && (
                      <p className="callout-warning">
                        <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-tone-warning" /><span className="text-text">{v('rot_sensitive', { name: sel.name })}</span>
                      </p>
                    )}
                    {isPair && pair ? (
                      <div className="callout-info">
                        <Info size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-tone-accent" />
                        <div className="space-y-1">
                          <p className="font-semibold text-text">{v('rot_dual_confirm', { inactive: pair.inactive.userName })}</p>
                          <p>{v('rot_dual_effect', { inactive: pair.inactive.userName, active: pair.active.userName })}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-text">{v('rot_confirm', { name: sel.name })}</p>
                    )}
                    {sensitive && (
                      <label className="block space-y-1">
                        <span className="text-xs font-semibold text-text-2">{v('rot_type_name', { name: sel.name })}</span>
                        <input value={confirmText} onChange={e => setConfirmText(e.target.value)} autoComplete="off" spellCheck={false}
                          className="h-11 w-full rounded-md border border-border bg-bg-card px-3 font-mono text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue" />
                      </label>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={requestRotation} disabled={sensitive && confirmText !== sel.name} className={btnPrimary}>
                        <RotateCw size={16} aria-hidden="true" />{isPair ? v('rot_dual_go') : v('rot_go')}
                      </button>
                      <button type="button" onClick={() => { setRot({ kind: 'idle' }); setConfirmText('') }} className={btnSecondary}>{v('cancel')}</button>
                    </div>
                  </div>
                ) : rot.kind === 'dual' ? (
                  <Progress rec={rot.rec} skew={rot.skew} note={rot.note} v={v} lang={lang} safe={names.safe} onClose={() => setRot({ kind: 'idle' })} />
                ) : rot.kind === 'error' ? (
                  <div className="space-y-3">
                    <div className="callout-danger" role="alert"><XCircle size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-tone-danger" /><p className="text-text">{rot.message}</p></div>
                    <button type="button" onClick={() => setRot({ kind: 'idle' })} className={btnSecondary}>{v('rot_again')}</button>
                  </div>
                ) : (
                  <div role="status" aria-live="polite" className="space-y-2">
                    {(() => {
                      const phase = rot.kind === 'sending' ? 'sending' : rot.phase
                      return (
                        <p className={`inline-flex items-center gap-2 text-sm font-semibold ${phase === 'done' ? 'text-tone-success' : phase === 'failed' ? 'text-tone-danger' : 'text-text'}`}>
                          {phase === 'done' ? <CheckCircle2 size={16} aria-hidden="true" /> : phase === 'failed' ? <XCircle size={16} aria-hidden="true" /> : <Loader2 size={16} aria-hidden="true" className="animate-spin" />}
                          {v(`rot_${phase}`)}
                        </p>
                      )
                    })()}
                    {rot.kind === 'simple' && rot.message && <p className="text-sm text-text-2">{rot.message}</p>}
                    {rot.kind === 'simple' && rot.phase !== 'waiting' && (
                      <button type="button" onClick={() => setRot({ kind: 'idle' })} className={btnSecondary}>{v('rot_again')}</button>
                    )}
                  </div>
                )}
              </section>

              {/* fields */}
              <section aria-labelledby="vault-fields" className="space-y-1">
                <h3 id="vault-fields" className="text-base font-semibold text-text">{v('fields_title')}</h3>
                <dl>
                  <Field label={v('f_safe')} help={v('f_safe_help')}><span className="font-mono">{names.safe || '-'}</span></Field>
                  <Field label={v('f_platform')} help={v('f_platform_help')}><span className="font-mono">{sel.platformId}</span></Field>
                  <Field label={v('f_user')} help={v('f_user_help')}><span className="font-mono">{sel.userName || '-'}</span></Field>
                  <Field label={v('f_address')} help={v('f_address_help')}><span className="font-mono">{sel.address || '-'}</span></Field>
                  <Field label={v('f_auto')} help={sel.management?.automaticManagementEnabled ? v('f_auto_on_help') : v('f_auto_off_help')}>
                    {sel.management?.automaticManagementEnabled ? v('yes') : v('no')}
                    {sel.management?.manualManagementReason ? <span className="text-text-2"> ({sel.management.manualManagementReason})</span> : null}
                  </Field>
                  <Field label={v('f_status')} help={v('f_status_help')}>
                    {(() => { const st = statusOf(sel.management); return <span className={`${chip} ${st.cls}`}><st.Icon size={12} aria-hidden="true" />{st.label}{sel.management?.status ? ` (${sel.management.status})` : ''}</span> })()}
                  </Field>
                  <Field label={v('f_changed')} help={v('f_changed_help')}>{fmt(toDate(sel.management?.lastModifiedTime))}</Field>
                  <Field label={v('f_verified')} help={v('f_verified_help')}>{fmt(toDate(sel.management?.lastVerifiedTime))}</Field>
                  <Field label={v('f_reconciled')} help={v('f_reconciled_help')}>{fmt(toDate(sel.management?.lastReconciledTime))}</Field>
                  <Field label={v('f_conjur')} help={v('f_conjur_help')}>
                    <span className="inline-flex flex-wrap items-center gap-2">
                      <code className="break-all rounded bg-bg-muted px-1.5 py-0.5 font-mono text-xs text-text">{sel.conjurPath}/password</code>
                      <CopyButton text={`${sel.conjurPath}/password`} v={v} />
                    </span>
                  </Field>
                  {sel.dual && (
                    <Field label={v('dual_props_title')} help={v('dual_desc')}>
                      <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1">
                        {DUAL_PROPS.filter(k => prop(sel.properties, k)).map(k => (
                          <div key={k} className="contents">
                            <dt className="font-mono text-xs font-semibold text-text">{Object.keys(sel.properties ?? {}).find(p => p.toLowerCase() === k.toLowerCase())}</dt>
                            <dd className="text-text-2"><span className="font-mono text-text">{prop(sel.properties, k)}</span> <span className="text-xs text-text-muted">{v(`dual_${k}`)}</span></dd>
                          </div>
                        ))}
                      </dl>
                    </Field>
                  )}
                </dl>
              </section>
            </div>
          )}
        </section>
      </div>

      <p className="flex gap-2 text-xs leading-relaxed text-text-muted">
        <Info size={14} aria-hidden="true" className="mt-0.5 shrink-0" />{v('footnote')}
      </p>
    </main>
  )
}

export default function CofreInfoPage() {
  const ready = useToolsCopy()
  return ready ? <CofreInfoView /> : <Loading />
}
