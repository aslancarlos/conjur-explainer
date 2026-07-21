import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Vault, LogIn, LogOut, Eye, EyeOff, RefreshCw, KeyRound, Plus, X,
  Copy, Check, ShieldCheck, Loader2, ChevronRight, Terminal, ArrowRight,
} from 'lucide-react'

// ─── types ──────────────────────────────────────────────────────────────────
interface TraceEntry { step: string; method: string; url: string; status: number; ms: number }
interface Account {
  id: string; name?: string; userName?: string; address?: string
  platformId?: string; secretType?: string; safeName?: string
  createdTime?: number
  secretManagement?: { automaticManagementEnabled?: boolean; lastModifiedTime?: number }
}
interface LogEntry { id: number; time: string; action: string; ok: boolean; status: number; trace: TraceEntry[]; error?: string }

// ─── API helper ───────────────────────────────────────────────────────────────
// Everything goes through the same-origin /api/pcloud proxy. Each response
// carries a `_trace` of the upstream CyberArk calls, which we surface live.
function usePcloud() {
  const [log, setLog] = useState<LogEntry[]>([])
  const counter = useRef(0)

  const call = useCallback(async (
    action: string, path: string,
    opts: { method?: string; token?: string | null; body?: unknown } = {},
  ): Promise<{ ok: boolean; status: number; data: any }> => {
    const headers: Record<string, string> = {}
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
    if (opts.token) headers['X-Pcloud-Token'] = opts.token
    let status = 0
    let data: any = {}
    try {
      const res = await fetch(`/api/pcloud${path}`, {
        method: opts.method ?? 'GET',
        headers,
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      })
      status = res.status
      data = await res.json().catch(() => ({}))
    } catch (e) {
      data = { error: (e as Error).message || 'network error' }
    }
    const ok = status >= 200 && status < 300
    const now = new Date()
    setLog(prev => [{
      id: ++counter.current,
      time: now.toLocaleTimeString(),
      action, ok, status,
      trace: (data && data._trace) || [],
      error: ok ? undefined : (data && data.error) || `HTTP ${status}`,
    }, ...prev].slice(0, 40))
    return { ok, status, data }
  }, [])

  return { log, call }
}

// ─── component ────────────────────────────────────────────────────────────────
export default function PcloudPage() {
  const { t } = useTranslation()
  const { log, call } = usePcloud()

  // session
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [loginBusy, setLoginBusy] = useState(false)
  const [loginErr, setLoginErr] = useState('')

  // data
  const SAFES = ['dev-demo-aslan', 'devsecops']
  const [safe, setSafe] = useState(SAFES[0])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [listBusy, setListBusy] = useState(false)
  const [listErr, setListErr] = useState('')

  // detail
  const [detail, setDetail] = useState<Account | null>(null)
  const [detailBusy, setDetailBusy] = useState(false)
  const [secret, setSecret] = useState<string | null>(null)
  const [showSecret, setShowSecret] = useState(false)
  const [revealBusy, setRevealBusy] = useState(false)
  const [rotateBusy, setRotateBusy] = useState(false)
  const [rotateMsg, setRotateMsg] = useState('')
  const [copied, setCopied] = useState(false)

  // create
  const [showCreate, setShowCreate] = useState(false)

  const authed = !!token

  const loadAccounts = useCallback(async (s: string, tk: string | null) => {
    if (!tk) return
    setListBusy(true); setListErr('')
    const { ok, data } = await call(`list ${s}`, `/accounts?safe=${encodeURIComponent(s)}`, { token: tk })
    if (ok) setAccounts(data.value || [])
    else { setAccounts([]); setListErr(data.error || 'failed to list accounts') }
    setListBusy(false)
  }, [call])

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginBusy(true); setLoginErr('')
    const { ok, data } = await call('logon', '/logon', { method: 'POST', body: { username, password } })
    setLoginBusy(false)
    if (ok && data.token) {
      setToken(data.token)
      setPassword('')
      loadAccounts(safe, data.token)
    } else {
      setLoginErr(data.error || 'authentication failed')
    }
  }

  const onLogoff = () => {
    setToken(null); setAccounts([]); setDetail(null); setSecret(null)
    setUsername(''); setPassword(''); setLoginErr('')
  }

  const openDetail = async (acc: Account) => {
    setDetail(acc); setSecret(null); setShowSecret(false); setRotateMsg('')
    setDetailBusy(true)
    const { ok, data } = await call(`details ${acc.userName || acc.id}`, `/accounts/${encodeURIComponent(acc.id)}`, { token })
    if (ok) setDetail(data)
    setDetailBusy(false)
  }

  const onReveal = async () => {
    if (!detail) return
    setRevealBusy(true)
    const { ok, data } = await call(`reveal ${detail.userName || detail.id}`, `/accounts/${encodeURIComponent(detail.id)}/reveal`, {
      method: 'POST', token, body: { reason: 'Viewed in /pcloud admin tool' },
    })
    if (ok) { setSecret(data.secret); setShowSecret(true) }
    setRevealBusy(false)
  }

  const onRotate = async () => {
    if (!detail) return
    if (!window.confirm(t('pcloud.rotate_confirm'))) return
    setRotateBusy(true); setRotateMsg('')
    const { ok, data } = await call(`rotate ${detail.userName || detail.id}`, `/accounts/${encodeURIComponent(detail.id)}/rotate`, {
      method: 'POST', token,
    })
    setRotateMsg(ok ? (data.status || t('pcloud.rotate_done')) : (data.error || 'rotation failed'))
    setSecret(null)
    setRotateBusy(false)
  }

  const copySecret = () => {
    if (!secret) return
    navigator.clipboard?.writeText(secret)
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-8">

        {/* ── header ── */}
        <header className="space-y-3">
          <span className="badge bg-conjur-cyan/10 text-conjur-cyan border border-conjur-cyan/20 inline-flex items-center gap-1.5">
            <Vault size={13} /> {t('pcloud.badge')}
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{t('pcloud.title')}</h1>
          <p className="text-text-2 max-w-2xl leading-relaxed">{t('pcloud.subtitle')}</p>
        </header>

        {/* ── login ── */}
        {!authed && (
          <form onSubmit={onLogin} className="section-card max-w-md space-y-4">
            <div className="flex items-center gap-2 text-text font-semibold">
              <LogIn size={16} className="text-conjur-cyan" /> {t('pcloud.login_title')}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-text-muted uppercase tracking-wide">{t('pcloud.username')}</label>
              <input
                value={username} onChange={e => setUsername(e.target.value)}
                autoComplete="username" placeholder="user@tenant"
                className="w-full rounded-lg border border-border bg-bg-muted/50 px-3 py-2.5 text-sm text-text outline-none focus:border-conjur-cyan/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-text-muted uppercase tracking-wide">{t('pcloud.password')}</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} autoComplete="current-password"
                  className="w-full rounded-lg border border-border bg-bg-muted/50 px-3 py-2.5 pr-10 text-sm text-text outline-none focus:border-conjur-cyan/50 font-mono"
                />
                <button type="button" onClick={() => setShowPw(s => !s)} tabIndex={-1}
                  aria-label={showPw ? t('pcloud.hide') : t('pcloud.show')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {loginErr && <p className="text-sm text-conjur-red">{loginErr}</p>}
            <button type="submit" disabled={loginBusy || !username || !password}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-conjur-cyan/90 px-4 py-2.5 text-sm font-semibold text-[#04121e] hover:bg-conjur-cyan disabled:opacity-40 transition-colors">
              {loginBusy ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />}
              {loginBusy ? t('pcloud.logging_in') : t('pcloud.logon')}
            </button>
            <p className="text-xs text-text-muted leading-relaxed flex items-start gap-1.5">
              <ShieldCheck size={13} className="text-conjur-cyan mt-0.5 shrink-0" /> {t('pcloud.login_hint')}
            </p>
          </form>
        )}

        {/* ── authed workspace ── */}
        {authed && (
          <>
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="flex items-center gap-1.5 rounded-lg border border-border p-1">
                {SAFES.map(s => (
                  <button key={s} onClick={() => { setSafe(s); loadAccounts(s, token) }}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      safe === s ? 'bg-conjur-cyan/15 text-conjur-cyan' : 'text-text-muted hover:text-text'}`}>
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => loadAccounts(safe, token)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-text-2 hover:text-text hover:border-text-muted transition-colors">
                  <RefreshCw size={14} className={listBusy ? 'animate-spin' : ''} /> {t('pcloud.refresh')}
                </button>
                <button onClick={() => setShowCreate(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-conjur-cyan/90 px-3 py-1.5 text-sm font-semibold text-[#04121e] hover:bg-conjur-cyan transition-colors">
                  <Plus size={15} /> {t('pcloud.new_account')}
                </button>
                <button onClick={onLogoff}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-text-muted hover:text-conjur-red hover:border-conjur-red/40 transition-colors">
                  <LogOut size={14} /> {t('pcloud.logoff')}
                </button>
              </div>
            </div>

            {/* accounts table */}
            <div className="section-card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[720px]">
                  <thead>
                    <tr className="text-left text-[11px] font-mono uppercase tracking-wide text-text-muted border-b border-border">
                      <th className="px-4 py-3">{t('pcloud.col_user')}</th>
                      <th className="px-4 py-3">{t('pcloud.col_address')}</th>
                      <th className="px-4 py-3">{t('pcloud.col_platform')}</th>
                      <th className="px-4 py-3">{t('pcloud.col_type')}</th>
                      <th className="px-4 py-3">{t('pcloud.col_mgmt')}</th>
                      <th className="px-4 py-3 text-right">{t('pcloud.col_actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listBusy && (
                      <tr><td colSpan={6} className="px-4 py-10 text-center text-text-muted">
                        <Loader2 size={18} className="animate-spin inline" /> {t('pcloud.loading')}
                      </td></tr>
                    )}
                    {!listBusy && listErr && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-conjur-red">{listErr}</td></tr>
                    )}
                    {!listBusy && !listErr && accounts.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">{t('pcloud.no_accounts')}</td></tr>
                    )}
                    {!listBusy && accounts.map(a => (
                      <tr key={a.id} onClick={() => openDetail(a)}
                        className="border-b border-border/50 last:border-0 hover:bg-white/[0.03] cursor-pointer">
                        <td className="px-4 py-3 font-medium text-text">{a.userName || a.name || a.id}</td>
                        <td className="px-4 py-3 text-text-2 font-mono text-xs">{a.address || '—'}</td>
                        <td className="px-4 py-3 text-text-2">{a.platformId || '—'}</td>
                        <td className="px-4 py-3 text-text-2">{a.secretType || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                            a.secretManagement?.automaticManagementEnabled
                              ? 'bg-spring/10 text-spring' : 'bg-slate-500/10 text-text-muted'}`}>
                            {a.secretManagement?.automaticManagementEnabled ? t('pcloud.auto') : t('pcloud.manual')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex items-center gap-1 text-conjur-cyan text-xs font-semibold">
                            {t('pcloud.details')} <ChevronRight size={13} />
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── live call log ── */}
        <CallLog log={log} />

        {/* ── how it works ── */}
        <HowItWorks />
      </div>

      {/* ── detail drawer ── */}
      <AnimatePresence>
        {detail && (
          <>
            <motion.div className="fixed inset-0 bg-black/50 z-40"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDetail(null)} />
            <motion.aside
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-bg-card border-l border-border z-50 overflow-y-auto">
              <div className="p-6 space-y-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-mono text-conjur-cyan uppercase tracking-wide">{t('pcloud.detail_title')}</p>
                    <h3 className="text-lg font-bold text-text mt-1">{detail.userName || detail.name || detail.id}</h3>
                  </div>
                  <button onClick={() => setDetail(null)} className="text-text-muted hover:text-text"><X size={20} /></button>
                </div>

                <dl className="space-y-2.5 text-sm">
                  {[
                    ['id', detail.id], ['safe', detail.safeName], ['address', detail.address],
                    ['platform', detail.platformId], ['secretType', detail.secretType],
                    ['management', detail.secretManagement?.automaticManagementEnabled ? t('pcloud.auto') : t('pcloud.manual')],
                  ].map(([k, v]) => (
                    <div key={k as string} className="flex justify-between gap-4 border-b border-border/40 pb-2">
                      <dt className="text-text-muted font-mono text-xs uppercase">{k}</dt>
                      <dd className="text-text-2 text-right font-mono text-xs break-all">{(v as string) || '—'}</dd>
                    </div>
                  ))}
                </dl>

                {/* secret */}
                <div className="space-y-2">
                  {secret == null ? (
                    <button onClick={onReveal} disabled={revealBusy}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-conjur-gold/40 bg-conjur-gold/10 px-4 py-2.5 text-sm font-semibold text-conjur-gold hover:bg-conjur-gold/20 disabled:opacity-40 transition-colors">
                      {revealBusy ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}
                      {revealBusy ? t('pcloud.revealing') : t('pcloud.reveal_secret')}
                    </button>
                  ) : (
                    <div className="rounded-lg border border-border bg-bg-muted/50 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono uppercase text-text-muted">{t('pcloud.secret')}</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setShowSecret(s => !s)} className="text-text-muted hover:text-text">
                            {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button onClick={copySecret} className="text-text-muted hover:text-conjur-cyan">
                            {copied ? <Check size={14} className="text-spring" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                      <code className="block font-mono text-sm text-conjur-cyan break-all">
                        {showSecret ? secret : '•'.repeat(Math.min(secret.length, 24))}
                      </code>
                    </div>
                  )}

                  <button onClick={onRotate} disabled={rotateBusy}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-conjur-cyan/40 bg-conjur-cyan/10 px-4 py-2.5 text-sm font-semibold text-conjur-cyan hover:bg-conjur-cyan/20 disabled:opacity-40 transition-colors">
                    {rotateBusy ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                    {rotateBusy ? t('pcloud.rotating') : t('pcloud.rotate')}
                  </button>
                  {rotateMsg && <p className="text-xs text-spring flex items-center gap-1.5"><Check size={13} /> {rotateMsg}</p>}
                </div>

                {detailBusy && <p className="text-xs text-text-muted"><Loader2 size={12} className="animate-spin inline" /> {t('pcloud.loading')}</p>}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── create modal ── */}
      <AnimatePresence>
        {showCreate && (
          <CreateAccount
            safe={safe} token={token} call={call}
            onClose={() => setShowCreate(false)}
            onCreated={() => { setShowCreate(false); loadAccounts(safe, token) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── create account modal ──────────────────────────────────────────────────────
function CreateAccount({ safe, token, call, onClose, onCreated }: {
  safe: string; token: string | null
  call: ReturnType<typeof usePcloud>['call']
  onClose: () => void; onCreated: () => void
}) {
  const { t } = useTranslation()
  const [platforms, setPlatforms] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState({ platformId: '', name: '', address: '', userName: '', secret: '', secretType: 'password', auto: true })
  const [showPw, setShowPw] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const loaded = useRef(false)

  if (!loaded.current) {
    loaded.current = true
    call('list platforms', '/platforms', { token }).then(({ ok, data }) => { if (ok) setPlatforms(data.platforms || []) })
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setErr('')
    const { ok, data } = await call(`create ${form.userName}`, '/accounts', {
      method: 'POST', token,
      body: { safeName: safe, platformId: form.platformId, name: form.name, address: form.address, userName: form.userName, secret: form.secret, secretType: form.secretType, automaticManagement: form.auto },
    })
    setBusy(false)
    if (ok) onCreated()
    else setErr(data.error || 'creation failed')
  }

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))
  const field = 'w-full rounded-lg border border-border bg-bg-muted/50 px-3 py-2 text-sm text-text outline-none focus:border-conjur-cyan/50'

  return (
    <>
      <motion.div className="fixed inset-0 bg-black/50 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 pointer-events-none">
        <form onSubmit={submit} className="pointer-events-auto w-full max-w-lg bg-bg-card border border-border rounded-2xl p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-text flex items-center gap-2"><Plus size={17} className="text-conjur-cyan" /> {t('pcloud.create_title')}</h3>
            <button type="button" onClick={onClose} className="text-text-muted hover:text-text"><X size={18} /></button>
          </div>
          <p className="text-xs font-mono text-text-muted">{t('pcloud.safe')}: <span className="text-conjur-cyan">{safe}</span></p>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <label className="text-xs text-text-muted">{t('pcloud.platform')}</label>
              <select required value={form.platformId} onChange={e => set('platformId', e.target.value)} className={field}>
                <option value="">{t('pcloud.select_platform')}</option>
                {platforms.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-muted">{t('pcloud.col_user')}</label>
              <input required value={form.userName} onChange={e => set('userName', e.target.value)} className={field} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-muted">{t('pcloud.col_address')}</label>
              <input required value={form.address} onChange={e => set('address', e.target.value)} className={field} placeholder="host / db.example.com" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-muted">{t('pcloud.name')}</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} className={field} placeholder="optional" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-muted">{t('pcloud.secret_type')}</label>
              <select value={form.secretType} onChange={e => set('secretType', e.target.value)} className={field}>
                <option value="password">password</option>
                <option value="key">key</option>
              </select>
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-xs text-text-muted">{t('pcloud.secret')}</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={form.secret} onChange={e => set('secret', e.target.value)}
                  className={field + ' pr-10 font-mono'} autoComplete="new-password" />
                <button type="button" tabIndex={-1} onClick={() => setShowPw(s => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <label className="col-span-2 flex items-center gap-2 text-sm text-text-2">
              <input type="checkbox" checked={form.auto} onChange={e => set('auto', e.target.checked)} className="accent-conjur-cyan" />
              {t('pcloud.auto_mgmt')}
            </label>
          </div>

          {err && <p className="text-sm text-conjur-red">{err}</p>}
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm text-text-2 hover:text-text">{t('pcloud.cancel')}</button>
            <button type="submit" disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg bg-conjur-cyan/90 px-4 py-2 text-sm font-semibold text-[#04121e] hover:bg-conjur-cyan disabled:opacity-40">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              {busy ? t('pcloud.creating') : t('pcloud.create')}
            </button>
          </div>
        </form>
      </motion.div>
    </>
  )
}

// ─── live call log ──────────────────────────────────────────────────────────────
function CallLog({ log }: { log: LogEntry[] }) {
  const { t } = useTranslation()
  return (
    <section className="section-card space-y-4">
      <div className="flex items-center gap-2">
        <Terminal size={16} className="text-conjur-cyan" />
        <h2 className="font-bold text-text">{t('pcloud.calllog_title')}</h2>
      </div>
      <p className="text-xs text-text-muted">{t('pcloud.calllog_hint')}</p>
      {log.length === 0 ? (
        <p className="text-sm text-text-muted italic">{t('pcloud.calllog_empty')}</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {log.map(e => (
            <div key={e.id} className="rounded-lg border border-border bg-bg-muted/30 p-3 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-text flex items-center gap-2">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${e.ok ? 'bg-spring' : 'bg-conjur-red'}`} />
                  {e.action}
                </span>
                <span className="font-mono text-text-muted">{e.time}</span>
              </div>
              {e.error && <p className="mt-1 text-conjur-red">{e.error}</p>}
              <ol className="mt-2 space-y-1">
                {e.trace.map((tr, i) => (
                  <li key={i} className="flex items-center gap-2 font-mono text-[11px] text-text-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      tr.status >= 200 && tr.status < 300 ? 'bg-spring/10 text-spring'
                        : tr.status === 0 ? 'bg-slate-500/10 text-text-muted' : 'bg-conjur-red/10 text-conjur-red'}`}>
                      {tr.method}
                    </span>
                    <span className="text-conjur-cyan">{tr.status || '—'}</span>
                    <span className="text-text-muted truncate">{tr.url}</span>
                    <span className="ml-auto text-text-muted/60 shrink-0">{tr.ms}ms</span>
                  </li>
                ))}
              </ol>
              <p className="mt-1 text-[10px] text-text-muted/70">{t('pcloud.calllog_stepline', { step: e.trace.map(x => x.step).join(' → ') })}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ─── static "how it works" ──────────────────────────────────────────────────────
function HowItWorks() {
  const { t } = useTranslation()
  const steps = t('pcloud.how_steps', { returnObjects: true }) as Array<{ title: string; call: string; desc: string }>
  return (
    <section className="section-card space-y-5">
      <div>
        <h2 className="font-bold text-text text-lg">{t('pcloud.how_title')}</h2>
        <p className="text-sm text-text-2 mt-1 max-w-3xl leading-relaxed">{t('pcloud.how_intro')}</p>
      </div>
      <ol className="space-y-3">
        {(Array.isArray(steps) ? steps : []).map((s, i) => (
          <li key={i} className="flex gap-4 rounded-xl border border-border bg-bg-muted/30 p-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-conjur-cyan/15 text-conjur-cyan text-sm font-bold">{i + 1}</span>
            <div className="min-w-0 space-y-1">
              <p className="font-semibold text-text text-sm">{s.title}</p>
              <code className="inline-flex items-center gap-2 rounded-md bg-bg-base/60 border border-border px-2 py-1 font-mono text-[11px] text-conjur-cyan break-all">
                <ArrowRight size={11} className="shrink-0" />{s.call}
              </code>
              <p className="text-[13px] text-text-2 leading-relaxed">{s.desc}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="text-xs text-text-muted flex items-start gap-1.5 leading-relaxed">
        <ShieldCheck size={13} className="text-conjur-cyan mt-0.5 shrink-0" /> {t('pcloud.how_note')}
      </p>
    </section>
  )
}
