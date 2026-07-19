import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Loader2, ShieldCheck, KeyRound, Server } from 'lucide-react'

interface ConfigPayload {
  provider: string
  tenant_id: string
  audience: string
  issuer: string
  jwks_uri: string
}

interface VerifyOk {
  valid: true
  issuer: string
  audience: string
  subject: string | null
  expires_at: number
  issued_at: number | null
  tenant_id: string | null
  app_id: string | null
  scopes: string[]
  roles: string[]
  claims: Record<string, unknown>
}

interface VerifyErr {
  valid: false
  code: string
  reason: string
}

type VerifyResult = VerifyOk | VerifyErr

interface Endpoint {
  method: 'GET' | 'POST'
  path: string
  descKey: string
}

const ENDPOINTS: Endpoint[] = [
  { method: 'GET',  path: '/api/health', descKey: 'jwtv.ep_health'  },
  { method: 'GET',  path: '/api/config', descKey: 'jwtv.ep_config'  },
  { method: 'POST', path: '/api/verify', descKey: 'jwtv.ep_verify'  },
  { method: 'GET',  path: '/api/docs',   descKey: 'jwtv.ep_docs'    },
]

const CLAIMS = [
  { key: 'iss', kind: 'standard', descKey: 'jwtv.claim_iss' },
  { key: 'aud', kind: 'standard', descKey: 'jwtv.claim_aud' },
  { key: 'exp', kind: 'standard', descKey: 'jwtv.claim_exp' },
  { key: 'nbf', kind: 'standard', descKey: 'jwtv.claim_nbf' },
  { key: 'iat', kind: 'standard', descKey: 'jwtv.claim_iat' },
  { key: 'tid', kind: 'entra',    descKey: 'jwtv.claim_tid' },
  { key: 'sig', kind: 'standard', descKey: 'jwtv.claim_sig' },
]

export default function JwtValidatorPage() {
  const { t } = useTranslation()
  const [health, setHealth]       = useState<'loading' | 'ok' | 'down'>('loading')
  const [config, setConfig]       = useState<ConfigPayload | null>(null)
  const [tokenInput, setTokenInput] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [result, setResult]       = useState<VerifyResult | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/health')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(() => { if (!cancelled) setHealth('ok') })
      .catch(() => { if (!cancelled) setHealth('down') })
    fetch('/api/config')
      .then(r => r.ok ? r.json() as Promise<ConfigPayload> : Promise.reject(r.status))
      .then(d => { if (!cancelled) setConfig(d) })
      .catch(() => { /* leave null */ })
    return () => { cancelled = true }
  }, [])

  const handleVerify = async () => {
    if (!tokenInput.trim()) return
    setVerifying(true)
    setResult(null)
    try {
      const r = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenInput.trim() }),
      })
      const data = await r.json() as VerifyResult
      setResult(data)
    } catch {
      setResult({ valid: false, code: 'network_error', reason: 'request failed' })
    } finally {
      setVerifying(false)
    }
  }

  const methodColor = (m: string) =>
    m === 'POST'
      ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
      : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'

  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto space-y-12">

        {/* Header */}
        <div className="text-center space-y-3">
          <span className="badge bg-conjur-cyan/10 text-conjur-cyan border border-conjur-cyan/30 inline-flex items-center gap-1.5">
            <ShieldCheck size={12} /> {t('jwtv.badge')}
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-text">{t('jwtv.title')}</h1>
          <p className="text-text-muted max-w-2xl mx-auto text-sm leading-relaxed">
            {t('jwtv.subtitle')}
          </p>
        </div>

        {/* Live status pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-mono">
          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${
            health === 'ok'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : health === 'down'
                ? 'bg-red-500/10 text-red-300 border-red-500/30'
                : 'bg-slate-500/10 text-text-muted border-slate-500/30'
          }`}>
            {health === 'loading' && <Loader2 size={12} className="animate-spin" />}
            {health === 'ok' && <CheckCircle2 size={12} />}
            {health === 'down' && <XCircle size={12} />}
            <span>/api/health — {health === 'ok' ? 'online' : health === 'down' ? 'offline' : '...'}</span>
          </span>
          {config && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-blue-500/10 text-blue-300 border-blue-500/30">
              <Server size={12} />
              <span>provider · {config.provider}</span>
            </span>
          )}
        </div>

        {/* What it does */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="section-card space-y-2">
              <h3 className="text-sm font-semibold text-text">{t(`jwtv.feat${n}_title`)}</h3>
              <p className="text-xs text-text-muted leading-relaxed">{t(`jwtv.feat${n}_desc`)}</p>
            </div>
          ))}
        </div>

        {/* Endpoints table */}
        <div className="section-card overflow-hidden">
          <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
            <KeyRound size={16} className="text-conjur-cyan" />
            {t('jwtv.endpoints_title')}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-text-muted border-b border-border">
                  <th className="py-2 pr-4 font-medium">{t('jwtv.table_method')}</th>
                  <th className="py-2 pr-4 font-medium">{t('jwtv.table_path')}</th>
                  <th className="py-2 font-medium">{t('jwtv.table_desc')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {ENDPOINTS.map(ep => (
                  <tr key={ep.path} className="hover:bg-bg-muted transition-colors">
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded border ${methodColor(ep.method)}`}>
                        {ep.method}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-conjur-cyan">{ep.path}</td>
                    <td className="py-3 text-xs text-text-muted">{t(ep.descKey)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Validations performed */}
        <div className="section-card">
          <h2 className="text-lg font-semibold text-text mb-4">{t('jwtv.checks_title')}</h2>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
            {CLAIMS.map(c => (
              <div key={c.key} className="flex items-start gap-3 text-xs">
                <span className="inline-block px-1.5 py-0.5 rounded font-mono font-semibold text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex-shrink-0 mt-0.5">
                  ✓ {c.key}
                </span>
                <span className="text-text-muted leading-relaxed">{t(c.descKey)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Try it */}
        <div className="section-card">
          <h2 id="jwtv-try-title" className="text-lg font-semibold text-text mb-1">{t('jwtv.try_title')}</h2>
          <p className="text-xs text-text-muted mb-4">{t('jwtv.try_subtitle')}</p>
          <label htmlFor="jwtv-token-input" className="sr-only">{t('jwtv.try_title')}</label>
          <textarea
            id="jwtv-token-input"
            value={tokenInput}
            onChange={e => setTokenInput(e.target.value)}
            placeholder="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ii4uLiJ9..."
            spellCheck={false}
            aria-labelledby="jwtv-try-title"
            className="w-full h-28 px-3 py-2 text-xs font-mono bg-bg-base/70 border border-border rounded-lg text-text-2 focus:border-conjur-cyan/50 focus:outline-none resize-y"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[10px] font-mono text-text-muted">
              POST https://demo.minha.cloud/api/verify
            </span>
            <button
              onClick={handleVerify}
              disabled={!tokenInput.trim() || verifying}
              aria-busy={verifying}
              className="px-4 min-h-[44px] rounded-lg text-xs font-semibold bg-conjur-cyan/15 text-conjur-cyan border border-conjur-cyan/40 hover:bg-conjur-cyan/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-1.5"
            >
              {verifying && <Loader2 size={12} className="animate-spin" aria-hidden="true" />}
              {t('jwtv.try_button')}
            </button>
          </div>

          {result && (
            <motion.div
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`mt-4 rounded-lg border p-4 ${
                result.valid
                  ? 'bg-emerald-500/5 border-emerald-500/30'
                  : 'bg-red-500/5 border-red-500/30'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                {result.valid
                  ? <CheckCircle2 size={16} className="text-emerald-500" aria-hidden="true" />
                  : <XCircle    size={16} className="text-red-500" aria-hidden="true" />}
                <span className={`text-sm font-semibold ${result.valid ? 'text-emerald-600 dark:text-emerald-300' : 'text-red-600 dark:text-red-300'}`}>
                  {result.valid ? t('jwtv.result_valid') : t('jwtv.result_invalid')}
                </span>
                {!result.valid && (
                  <code className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-300 border border-red-500/20">
                    {result.code}
                  </code>
                )}
              </div>
              <pre className="text-[11px] font-mono text-text-2 bg-bg-base/60 rounded p-3 overflow-x-auto leading-relaxed">
{JSON.stringify(result, null, 2)}
              </pre>
            </motion.div>
          )}
        </div>

        {/* Deployment info */}
        <div className="section-card space-y-3">
          <h2 className="text-lg font-semibold text-text">{t('jwtv.deploy_title')}</h2>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
            <Row label={t('jwtv.deploy_provider')}  value={config?.provider ?? '—'} mono />
            <Row label={t('jwtv.deploy_tenant')}    value={config?.tenant_id ?? '—'} mono />
            <Row label={t('jwtv.deploy_audience')}  value={config?.audience ?? '—'} mono />
            <Row label={t('jwtv.deploy_issuer')}    value={config?.issuer ?? '—'} mono />
            <Row label={t('jwtv.deploy_jwks')}      value={config?.jwks_uri ?? '—'} mono />
            <Row label={t('jwtv.deploy_namespace')} value="apigw" mono />
          </div>
        </div>

      </div>
    </section>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
      <span className="text-text-muted sm:w-32 flex-shrink-0">{label}</span>
      <span className={`text-text-2 ${mono ? 'font-mono break-all' : ''}`}>{value}</span>
    </div>
  )
}
