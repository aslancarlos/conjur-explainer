import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CheckCircle2, XCircle, Loader2, KeyRound, ShieldCheck, Server, Vault, Search, RefreshCw, RotateCw,
  History, Copy, Check, AlertTriangle, Info, Repeat2,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Loading from '../components/Loading'
import { useToolsCopy } from '../lib/toolsCopy'

/**
 * Cofre Info: lists the accounts of the demo Safe, explains each field, flags
 * Dual Accounts, requests a CPM rotation and shows the current, current-1 and
 * current-2 versions (metadata only, value always masked). Backend:
 * vault-control (/api/vault), which reads its Vault credential from Conjur with
 * the pod's service account JWT, so whoever runs the demo never opens the Vault.
 */

const API = '/api/vault'
const MASK = '••••••••••••'
/** Platforms whose rotation reaches infrastructure, cloud keys or the platform itself: typed confirmation. */
const SENSITIVE = /linux|win|unix|aws|azure|gcp|identity|conjur|paloalto|ssh/i

interface Management {
  automaticManagementEnabled?: boolean; status?: string; manualManagementReason?: string
  lastModifiedTime?: number; lastReconciledTime?: number; lastVerifiedTime?: number
}
interface Account {
  id: string; name: string; userName?: string; address?: string; platformId: string; secretType?: string
  createdTime?: number; properties?: Record<string, string>; management?: Management
  dual: boolean; self: boolean; conjurPath: string
}
interface Version { label: string; version: number; modifiedBy?: string; modifiedAt?: number | string; temporary?: boolean }
interface ChainStep { step: string; ok: boolean; error?: string }

const CHAIN = [
  { key: 'conjur_jwt', Icon: KeyRound },
  { key: 'conjur_secret', Icon: ShieldCheck },
  { key: 'identity_token', Icon: Server },
  { key: 'privilege_cloud', Icon: Vault },
] as const

function toDate(v?: number | string): Date | null {
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

const card = 'rounded-2xl border border-border bg-bg-card'
const btnSecondary = 'inline-flex h-11 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-text-2 transition-colors hover:border-idira-blue hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue disabled:cursor-not-allowed disabled:opacity-40'
const btnPrimary = 'inline-flex h-11 items-center gap-2 rounded-md bg-idira-blue px-4 text-sm font-semibold text-white transition-colors hover:bg-idira-blue-2 active:bg-idira-blue-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40'

function CofreInfoView() {
  const { t, i18n } = useTranslation()
  const v = (k: string, o?: Record<string, unknown>) => t(`vault.${k}`, o) as string
  const fmt = (d: Date | null) => (d ? d.toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }) : v('never'))

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
    return (accounts ?? []).filter(a => !q || [a.name, a.userName, a.address, a.platformId].some(x => x?.toLowerCase().includes(q)))
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
  const [detail, setDetail] = useState<{ account: Account; history: Version[]; historyError?: string } | null>(null)
  const [detailBusy, setDetailBusy] = useState(false)
  const loadDetail = useCallback(async (id: string) => {
    const r = await getJSON<{ account: Account; history: Version[]; historyError?: string; error?: string }>(`${API}/accounts/${encodeURIComponent(id)}`)
    if (!r.ok) throw new Error(r.data.error || `HTTP ${r.status}`)
    return r.data
  }, [])
  const select = async (id: string) => {
    setSelId(id); setDetail(null); setRotation({ phase: 'idle' }); setConfirmText(''); setDetailBusy(true)
    try { setDetail(await loadDetail(id)) } catch (e) { setDetail(null); setListError((e as Error).message) } finally { setDetailBusy(false) }
    requestAnimationFrame(() => detailRef.current?.focus())
  }
  const detailRef = useRef<HTMLDivElement>(null)

  // ---------- rotation ----------
  type Rotation = { phase: 'idle' | 'confirm' | 'sending' | 'waiting' | 'done' | 'failed'; message?: string; startVersion?: number }
  const [rotation, setRotation] = useState<Rotation>({ phase: 'idle' })
  const [confirmText, setConfirmText] = useState('')
  const pollRef = useRef<number | null>(null)
  useEffect(() => () => { if (pollRef.current) window.clearInterval(pollRef.current) }, [])

  const requestRotation = async () => {
    if (!detail) return
    const id = detail.account.id
    const startVersion = detail.history[0]?.version
    const startModified = detail.account.management?.lastModifiedTime ?? 0
    setRotation({ phase: 'sending' })
    const r = await getJSON<{ error?: string }>(`${API}/accounts/${encodeURIComponent(id)}/rotate`, { method: 'POST', headers: { 'X-Cofre-Info': '1' } })
    if (!r.ok) {
      const code = r.data.error
      setRotation({ phase: 'failed', message: code === 'wait' ? v('rot_wait') : code === 'daily' ? v('rot_daily') : code === 'self' ? v('rot_self') : (code || `HTTP ${r.status}`) })
      return
    }
    setRotation({ phase: 'waiting', startVersion })
    const started = Date.now()
    if (pollRef.current) window.clearInterval(pollRef.current)
    pollRef.current = window.setInterval(async () => {
      try {
        const d = await loadDetail(id)
        setDetail(d)
        const st = (d.account.management?.status ?? '').toLowerCase()
        const newVersion = d.history[0]?.version !== undefined && d.history[0]?.version !== startVersion
        const touched = (d.account.management?.lastModifiedTime ?? 0) > startModified
        if (newVersion || (touched && st.startsWith('success'))) {
          setRotation({ phase: 'done' }); window.clearInterval(pollRef.current!); loadAccounts(true)
        } else if (touched && st.startsWith('fail')) {
          setRotation({ phase: 'failed', message: v('rot_cpm_failed') }); window.clearInterval(pollRef.current!)
        } else if (Date.now() - started > 180_000) {
          setRotation({ phase: 'failed', message: v('rot_timeout') }); window.clearInterval(pollRef.current!)
        }
      } catch { /* keep polling */ }
    }, 5000)
  }

  // ---------- copy conjur path ----------
  const [copied, setCopied] = useState(false)
  useEffect(() => { if (!copied) return; const h = setTimeout(() => setCopied(false), 2000); return () => clearTimeout(h) }, [copied])

  const sel = detail?.account
  const sensitive = !!sel && SENSITIVE.test(sel.platformId)
  const statusOf = (m?: Management) => {
    const s = (m?.status ?? '').toLowerCase()
    if (!m?.automaticManagementEnabled) return { label: v('st_manual'), cls: 'border-border text-text-2', Icon: Info }
    if (s.startsWith('success')) return { label: v('st_ok'), cls: 'border-tone-success/40 bg-tone-success/10 text-tone-success', Icon: CheckCircle2 }
    if (s.startsWith('fail')) return { label: v('st_fail'), cls: 'border-tone-danger/40 bg-tone-danger/10 text-tone-danger', Icon: XCircle }
    return { label: v('st_pending'), cls: 'border-tone-warning/40 bg-tone-warning/10 text-tone-warning', Icon: Loader2 }
  }

  const Field = ({ label, help, children }: { label: string; help: string; children: React.ReactNode }) => (
    <div className="grid gap-1 border-b border-border py-3 last:border-b-0 sm:grid-cols-[180px_1fr] sm:gap-4">
      <dt className="text-sm font-semibold text-text">{label}</dt>
      <dd className="min-w-0 space-y-0.5">
        <div className="break-words text-sm text-text">{children}</div>
        <p className="text-xs leading-relaxed text-text-muted">{help}</p>
      </dd>
    </div>
  )

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <PageHeader badge={v('badge')} title={v('title')} subtitle={v('subtitle')} />

      {/* trust chain */}
      <section aria-labelledby="vault-chain" className={`${card} space-y-4 p-6`}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="max-w-2xl space-y-1">
            <h2 id="vault-chain" className="text-lg font-semibold text-text">{v('chain_title')}</h2>
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
                  <span className="text-xs font-semibold text-text-muted">{i + 1}/4</span>
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
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">{v(x.k)}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-text">{accounts ? x.n : '-'}</p>
          </div>
        ))}
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* list */}
        <section aria-labelledby="vault-list" className={`${card} p-4`}>
          <div className="flex items-center justify-between gap-2 px-2 pb-3">
            <h2 id="vault-list" className="text-lg font-semibold text-text">{v('list_title', { safe: names.safe || '…' })}</h2>
            <button type="button" onClick={() => loadAccounts(true)} className={`${btnSecondary} w-11 justify-center px-0`} aria-label={v('refresh')} title={v('refresh')}>
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
            <p className="flex items-center gap-2 px-2 py-6 text-sm text-text-muted"><Loader2 size={16} className="animate-spin" aria-hidden="true" />{v('loading')}</p>
          ) : (
            <ul className="max-h-[640px] space-y-1 overflow-y-auto">
              {shown.map(a => {
                const st = statusOf(a.management)
                const on = a.id === selId
                return (
                  <li key={a.id}>
                    <button type="button" onClick={() => select(a.id)} aria-current={on ? 'true' : undefined}
                      className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue ${on ? 'border-idira-blue bg-idira-blue/10' : 'border-transparent hover:border-border hover:bg-bg-muted'}`}>
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate font-mono text-sm font-semibold text-text">{a.name}</span>
                        <span className={`inline-flex shrink-0 items-center gap-1 rounded border px-1.5 text-xs font-medium ${st.cls}`}><st.Icon size={12} aria-hidden="true" />{st.label}</span>
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-2">
                        <span className="truncate">{a.platformId}</span>
                        {a.dual && <span className="inline-flex items-center gap-1 rounded border border-domain-cp/40 px-1.5 font-semibold text-text"><Repeat2 size={12} aria-hidden="true" />Dual Account</span>}
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
        <section aria-labelledby="vault-detail" className={`${card} p-6 focus:outline-none`} ref={detailRef} tabIndex={-1}>
          {!selId ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Vault size={32} aria-hidden="true" className="text-text-muted" />
              <h2 id="vault-detail" className="text-lg font-semibold text-text">{v('pick_title')}</h2>
              <p className="max-w-sm text-sm text-text-2">{v('pick_desc')}</p>
            </div>
          ) : detailBusy || !sel ? (
            <p className="flex items-center gap-2 py-16 text-sm text-text-muted"><Loader2 size={16} className="animate-spin" aria-hidden="true" />{v('loading')}</p>
          ) : (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 id="vault-detail" className="break-all font-mono text-xl font-bold text-text">{sel.name}</h2>
                <p className="text-sm text-text-2">{v('detail_lead')}</p>
              </div>

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
                  {(() => { const st = statusOf(sel.management); return <span className={`inline-flex items-center gap-1 rounded border px-1.5 text-xs font-medium ${st.cls}`}><st.Icon size={12} aria-hidden="true" />{st.label}{sel.management?.status ? ` (${sel.management.status})` : ''}</span> })()}
                </Field>
                <Field label={v('f_changed')} help={v('f_changed_help')}>{fmt(toDate(sel.management?.lastModifiedTime))}</Field>
                <Field label={v('f_verified')} help={v('f_verified_help')}>{fmt(toDate(sel.management?.lastVerifiedTime))}</Field>
                <Field label={v('f_reconciled')} help={v('f_reconciled_help')}>{fmt(toDate(sel.management?.lastReconciledTime))}</Field>
                <Field label={v('f_conjur')} help={v('f_conjur_help')}>
                  <span className="inline-flex flex-wrap items-center gap-2">
                    <code className="break-all rounded bg-bg-muted px-1.5 py-0.5 font-mono text-xs text-text">{sel.conjurPath}/password</code>
                    <button type="button" onClick={() => navigator.clipboard?.writeText(`${sel.conjurPath}/password`).then(() => setCopied(true)).catch(() => {})}
                      className={`${btnSecondary} h-9 w-9 justify-center px-0`} aria-label={v('copy_path')} title={v('copy_path')}>
                      {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                    </button>
                  </span>
                </Field>
              </dl>

              {sel.dual && (
                <div className="space-y-2 rounded-xl border border-domain-cp/40 bg-bg-base p-4">
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-text"><Repeat2 size={16} aria-hidden="true" />{v('dual_title')}</p>
                  <p className="text-sm leading-relaxed text-text-2">{v('dual_desc')}</p>
                  <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[180px_1fr]">
                    {['VirtualUserName', 'CurrInd', 'DualAccountStatus', 'Index', 'GroupName'].filter(k => sel.properties?.[k]).map(k => (
                      <div key={k} className="contents">
                        <dt className="font-mono text-xs font-semibold text-text">{k}</dt>
                        <dd className="text-text-2"><span className="font-mono text-text">{sel.properties![k]}</span> <span className="text-xs text-text-muted">{v(`dual_${k}`)}</span></dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* history */}
              <div className="space-y-3">
                <h3 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-text-muted"><History size={15} aria-hidden="true" />{v('hist_title')}</h3>
                <p className="text-sm text-text-2">{v('hist_lead')}</p>
                {detail?.historyError ? (
                  <p className="text-sm text-tone-warning">{v('hist_error')}: {detail.historyError}</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-muted">
                        <th scope="col" className="py-2 pr-3 font-semibold">{v('hist_col_version')}</th>
                        <th scope="col" className="py-2 pr-3 font-semibold">{v('hist_col_value')}</th>
                        <th scope="col" className="py-2 pr-3 font-semibold">{v('hist_col_when')}</th>
                        <th scope="col" className="py-2 font-semibold">{v('hist_col_by')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(detail?.history ?? []).map(h => (
                        <tr key={h.version} className="border-b border-border last:border-b-0">
                          <td className="py-2 pr-3"><span className="font-semibold text-text">{v(`hist_${h.label.replace('-', '_')}`)}</span> <span className="text-xs text-text-muted">#{h.version}</span></td>
                          <td className="py-2 pr-3 font-mono text-text-2" aria-label={v('hist_masked')}>{MASK}</td>
                          <td className="py-2 pr-3 text-text-2">{fmt(toDate(h.modifiedAt))}</td>
                          <td className="py-2 break-all text-text-2">{h.modifiedBy || '-'}</td>
                        </tr>
                      ))}
                      {(detail?.history ?? []).length === 0 && <tr><td colSpan={4} className="py-3 text-text-muted">{v('hist_empty')}</td></tr>}
                    </tbody>
                  </table>
                )}
              </div>

              {/* rotation */}
              <div className="space-y-3 rounded-xl border border-border bg-bg-base p-4">
                <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-text"><RotateCw size={16} aria-hidden="true" />{v('rot_title')}</h3>
                <p className="text-sm leading-relaxed text-text-2">{v('rot_lead')}</p>
                {sel.self ? (
                  <p className="text-sm text-text-2"><Info size={14} aria-hidden="true" className="mr-1 inline" />{v('rot_self')}</p>
                ) : rotation.phase === 'idle' ? (
                  <button type="button" onClick={() => setRotation({ phase: 'confirm' })} className={btnPrimary}>
                    <RotateCw size={16} aria-hidden="true" />{v('rot_button')}
                  </button>
                ) : rotation.phase === 'confirm' ? (
                  <div className="space-y-3">
                    {sensitive && (
                      <p className="flex gap-2 rounded-lg border border-tone-warning/40 bg-tone-warning/10 p-3 text-sm text-tone-warning">
                        <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />{v('rot_sensitive', { name: sel.name })}
                      </p>
                    )}
                    <p className="text-sm text-text">{v('rot_confirm', { name: sel.name })}</p>
                    {sensitive && (
                      <label className="block space-y-1">
                        <span className="text-xs font-semibold text-text-2">{v('rot_type_name', { name: sel.name })}</span>
                        <input value={confirmText} onChange={e => setConfirmText(e.target.value)} autoComplete="off" spellCheck={false}
                          className="h-11 w-full rounded-md border border-border bg-bg-card px-3 font-mono text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue" />
                      </label>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={requestRotation} disabled={sensitive && confirmText !== sel.name} className={btnPrimary}>
                        <RotateCw size={16} aria-hidden="true" />{v('rot_go')}
                      </button>
                      <button type="button" onClick={() => { setRotation({ phase: 'idle' }); setConfirmText('') }} className={btnSecondary}>{v('cancel')}</button>
                    </div>
                  </div>
                ) : (
                  <div role="status" aria-live="polite" className="space-y-2">
                    <p className={`inline-flex items-center gap-2 text-sm font-semibold ${rotation.phase === 'done' ? 'text-tone-success' : rotation.phase === 'failed' ? 'text-tone-danger' : 'text-text'}`}>
                      {rotation.phase === 'done' ? <CheckCircle2 size={16} aria-hidden="true" /> : rotation.phase === 'failed' ? <XCircle size={16} aria-hidden="true" /> : <Loader2 size={16} aria-hidden="true" className="animate-spin" />}
                      {v(`rot_${rotation.phase}`)}
                    </p>
                    {rotation.message && <p className="text-sm text-text-2">{rotation.message}</p>}
                    {(rotation.phase === 'done' || rotation.phase === 'failed') && (
                      <button type="button" onClick={() => setRotation({ phase: 'idle' })} className={btnSecondary}>{v('rot_again')}</button>
                    )}
                  </div>
                )}
              </div>
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
