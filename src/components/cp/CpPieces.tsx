import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Cloud, Minus, Server } from 'lucide-react'

/**
 * Shared pieces for the Credential Providers pages (CP, ASCP, CCP). Every
 * page explains the same product on two PAM back ends: PAM Self-Hosted (your
 * own Vault) and Privilege Cloud (SaaS). Section / LimitsCallout / RoleTable /
 * DocLinks come from components/authn/AuthnPieces.
 */
export type Platform = 'selfhosted' | 'saas'

/** Platform choice kept in the URL (?env=saas|selfhosted) so it can be deep-linked. */
export function usePlatform(defaultValue: Platform = 'selfhosted'): [Platform, (p: Platform) => void] {
  const read = (): Platform => {
    const v = new URLSearchParams(window.location.search).get('env')
    return v === 'saas' || v === 'selfhosted' ? v : defaultValue
  }
  const [platform, setPlatform] = useState<Platform>(read)
  useEffect(() => {
    const onPop = () => setPlatform(read())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const set = useCallback((p: Platform) => {
    const url = new URL(window.location.href)
    url.searchParams.set('env', p)
    window.history.replaceState(window.history.state, '', url)
    setPlatform(p)
  }, [])
  return [platform, set]
}

/** Segmented control: PAM Self-Hosted | Privilege Cloud (radiogroup, 44px targets). */
export function PlatformSwitch({ value, onChange }: { value: Platform; onChange: (p: Platform) => void }) {
  const { t } = useTranslation()
  const opts: Array<{ v: Platform; label: string; Icon: typeof Server }> = [
    { v: 'selfhosted', label: t('cphub.platform_sh'), Icon: Server },
    { v: 'saas', label: t('cphub.platform_saas'), Icon: Cloud },
  ]
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    onChange(value === 'selfhosted' ? 'saas' : 'selfhosted')
  }
  return (
    <div role="radiogroup" aria-label={t('cphub.platform_label')} onKeyDown={onKey}
      className="inline-flex rounded-xl border border-border bg-bg-card p-1">
      {opts.map(o => {
        const on = value === o.v
        return (
          <button key={o.v} type="button" role="radio" aria-checked={on} tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.v)}
            className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors duration-200
              ${on ? 'bg-bg-muted text-text shadow-sm' : 'text-text-2 hover:text-text'}`}>
            <o.Icon size={16} aria-hidden="true" className={on ? 'text-domain-idira' : 'text-text-muted'} />{o.label}
          </button>
        )
      })}
    </div>
  )
}

/** "Works with PAM Self-Hosted / Privilege Cloud" chips (icon + text, never colour alone). */
export function PlatformChips({ selfHosted, saas }: { selfHosted: boolean; saas: boolean }) {
  const { t } = useTranslation()
  const chip = (ok: boolean, label: string) => (
    <span className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium
      ${ok ? 'border-tone-success/40 bg-tone-success/10 text-tone-success' : 'border-border bg-bg-muted text-text-muted'}`}>
      {ok ? <Check size={14} aria-hidden="true" /> : <Minus size={14} aria-hidden="true" />}
      {label}
      <span className="sr-only">: {ok ? t('authnhub.available') : t('authnhub.not_available')}</span>
    </span>
  )
  return (
    <div className="flex flex-wrap gap-2" aria-label={t('authnhub.availability')}>
      {chip(selfHosted, t('cphub.platform_sh'))}
      {chip(saas, t('cphub.platform_saas'))}
    </div>
  )
}
