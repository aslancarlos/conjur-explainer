import { useTranslation } from 'react-i18next'
import { AlertTriangle, Cloud, ExternalLink, Globe, KeySquare, Server, Vault } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ShubEnv } from '../flow/specs/ShubFlow'

/** Docs base per PAM source; the pages share the same paths in both spaces. */
export const docsBase = (env: ShubEnv) =>
  env === 'saas' ? 'https://docs.cyberark.com/secrets-hub-privilege-cloud/latest/en' : 'https://docs.cyberark.com/secrets-hub-pam-sh/latest/en'

/** Segmented PAM source switch (segmented control, DESIGN.md tokens). */
export function EnvToggle({ env, onChange }: { env: ShubEnv; onChange: (e: ShubEnv) => void }) {
  const { t } = useTranslation()
  const opts: Array<{ v: ShubEnv; Icon: LucideIcon }> = [{ v: 'saas', Icon: Cloud }, { v: 'pamsh', Icon: Server }]
  return (
    <div className="flex flex-col items-center gap-2">
      <p id="shub-env-label" className="text-xs font-semibold uppercase tracking-wider text-text-muted">{t('secretshub.env.label')}</p>
      <div role="radiogroup" aria-labelledby="shub-env-label"
        className="inline-flex w-full max-w-md rounded-lg border border-border bg-bg-muted p-0.5"
        onKeyDown={e => {
          if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
          e.preventDefault()
          const next = env === 'saas' ? 'pamsh' : 'saas'
          onChange(next)
          ;(e.currentTarget.querySelector(`[data-env="${next}"]`) as HTMLButtonElement | null)?.focus()
        }}>
        {opts.map(o => {
          const on = env === o.v
          return (
            <button key={o.v} type="button" role="radio" aria-checked={on} tabIndex={on ? 0 : -1} data-env={o.v}
              onClick={() => onChange(o.v)}
              className={`flex flex-1 min-h-11 items-center justify-center gap-1.5 rounded-md px-4 text-sm font-semibold transition-colors duration-150
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue ${
                on ? 'bg-bg-card text-text shadow-sm ring-1 ring-border' : 'text-text-muted hover:text-text'}`}>
              <o.Icon size={15} strokeWidth={2} aria-hidden="true" />{t(`secretshub.env.${o.v}`)}
            </button>
          )
        })}
      </div>
      <p className="text-sm text-text-2 text-center max-w-xl" aria-live="polite">{t(`secretshub.env.hint_${env}`)}</p>
    </div>
  )
}

const TARGETS: Array<{ k: 'aws' | 'az' | 'gcp' | 'hcv'; name: string; Icon: LucideIcon }> = [
  { k: 'aws', name: 'AWS Secrets Manager', Icon: Cloud },
  { k: 'az', name: 'Azure Key Vault', Icon: KeySquare },
  { k: 'gcp', name: 'GCP Secret Manager', Icon: Globe },
  { k: 'hcv', name: 'HashiCorp Vault', Icon: Vault },
]

export function TargetsSummary() {
  const { t } = useTranslation()
  const s = (k: string) => t(`secretshub.targets.${k}`)
  return (
    <section aria-labelledby="shub-targets">
      <h2 id="shub-targets" className="text-xl font-semibold text-text">{s('title')}</h2>
      <p className="mt-1 text-sm text-text-2">{s('sub')}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TARGETS.map(({ k, name, Icon }) => (
          <div key={k} className="card">
            <p className="inline-flex items-center gap-2 font-semibold text-text">
              <Icon size={16} className="text-domain-svc shrink-0" aria-hidden="true" />{name}
            </p>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-text-muted">{s('trust')}</dt>
                <dd className="mt-0.5 text-text-2">{s(`${k}_trust`)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-text-muted">{s('connector')}</dt>
                <dd className={`mt-0.5 ${k === 'hcv' ? 'font-semibold text-tone-warning' : 'text-text-2'}`}>{s(`${k}_con`)}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </section>
  )
}

const LIMIT_GROUPS: Record<ShubEnv, Array<{ key: string; path: string }>> = {
  saas: [
    { key: 'general', path: '/secretshubcontent/sh-support/' },
    { key: 'saas', path: '/secretshubcontent/sh-support/' },
    { key: 'hcv', path: '/secretshubcontent/sh-add-hashi-secret-store/' },
    { key: 'aws', path: '/hometileslps/lp-tile3/' },
    { key: 'az', path: '/secretshubcontent/add-azure-stores-via-cce/' },
    { key: 'gcp', path: '/secretshubcontent/sh-set-gcp-replication-policy/' },
  ],
  pamsh: [
    { key: 'general', path: '/secretshubcontent/sh-support/' },
    { key: 'pamsh', path: '/secretshubcontent/sh-connect-pam-sh/' },
    { key: 'hcv', path: '/secretshubcontent/sh-add-hashi-secret-store/' },
    { key: 'aws', path: '/hometileslps/lp-tile3/' },
    { key: 'az', path: '/secretshubcontent/add-azure-stores-via-cce/' },
    { key: 'gcp', path: '/secretshubcontent/sh-set-gcp-replication-policy/' },
  ],
}

/** Warning callout: documented limitations, general + the selected PAM source. */
export function LimitsCallout({ env }: { env: ShubEnv }) {
  const { t } = useTranslation()
  const s = (k: string) => t(`secretshub.limits.${k}`)
  return (
    <section aria-labelledby="shub-limits" className="callout-warning callout-section border-2">
      <div className="flex items-start gap-3">
        <AlertTriangle size={22} strokeWidth={2.2} className="mt-0.5 shrink-0 text-tone-warning" aria-hidden="true" />
        <div>
          <h2 id="shub-limits" className="text-xl font-semibold text-text">{s('title')}</h2>
          <p className="mt-1 text-sm text-text-2">{s('sub')}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {LIMIT_GROUPS[env].map(({ key, path }) => {
          const items = t(`secretshub.limits.${key}.items`, { returnObjects: true }) as string[]
          return (
            <div key={key} className={`rounded-xl border border-border bg-bg-card p-4 ${key === 'general' ? 'md:col-span-2' : ''}`}>
              <h3 className="font-semibold text-text">{s(`${key}.title`)}</h3>
              <ul className={`mt-2 space-y-2 ${key === 'general' ? 'md:columns-2 md:gap-8 md:block' : ''}`}>
                {items.map(it => (
                  <li key={it} className="flex gap-2 text-sm leading-relaxed text-text-2 break-inside-avoid">
                    <AlertTriangle size={14} strokeWidth={2.2} className="mt-1 shrink-0 text-tone-warning" aria-hidden="true" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
              <a href={`${docsBase(env)}${path}`} target="_blank" rel="noopener noreferrer"
                className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-tone-accent hover:underline">
                {s('source')}<ExternalLink size={12} aria-hidden="true" />
              </a>
            </div>
          )
        })}
      </div>
    </section>
  )
}

const COMPONENTS: Record<ShubEnv, string[]> = {
  saas: ['pc', 'cpm_saas', 'hub', 'con_saas', 'aws', 'az', 'gcp', 'hcv', 'wl'],
  pamsh: ['vault', 'pvwa', 'cpm_pamsh', 'con_pamsh', 'hub', 'aws', 'az', 'gcp', 'hcv', 'wl'],
}

/** "Components and their role", following the selected scenario. */
export function ComponentsTable({ env }: { env: ShubEnv }) {
  const { t } = useTranslation()
  const s = (k: string) => t(`secretshub.comp.${k}`)
  const rows = COMPONENTS[env]
  return (
    <section aria-labelledby="shub-comp">
      <h2 id="shub-comp" className="text-xl font-semibold text-text">{s('title')}</h2>
      <p className="mt-1 text-sm text-text-2">{s('sub')}</p>
      {/* phones: cards */}
      <div className="mt-4 grid gap-3 md:hidden">
        {rows.map(c => (
          <div key={c} className="rounded-2xl border border-border bg-bg-card p-4">
            <p className="font-semibold text-text">{s(`${c}.name`)}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-text-2">{s(`${c}.role`)}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-text-muted">{s(`${c}.where`)}</p>
          </div>
        ))}
      </div>
      {/* tablet and up: table */}
      <div className="mt-4 hidden md:block overflow-hidden rounded-2xl border border-border bg-bg-card">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{s('title')}</caption>
          <thead className="bg-bg-muted text-xs font-semibold uppercase tracking-wider text-text-muted">
            <tr>
              <th scope="col" className="px-5 py-3">{s('col_component')}</th>
              <th scope="col" className="px-5 py-3">{s('col_role')}</th>
              <th scope="col" className="px-5 py-3">{s('col_where')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map(c => (
              <tr key={c} className="align-top">
                <th scope="row" className="px-5 py-4 font-semibold text-text whitespace-nowrap">{s(`${c}.name`)}</th>
                <td className="px-5 py-4 leading-relaxed text-text-2">{s(`${c}.role`)}</td>
                <td className="px-5 py-4 leading-relaxed text-text-2">{s(`${c}.where`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

const DOCS: Record<ShubEnv, Array<{ key: string; path: string }>> = {
  saas: [
    { key: 'arch', path: '/secretshubcontent/sh-architecture-diagram/' },
    { key: 'support', path: '/secretshubcontent/sh-support/' },
    { key: 'sync', path: '/hometileslps/lp-tile3/' },
    { key: 'hcv', path: '/secretshubcontent/sh-hashicorp-secret-stores/' },
    { key: 'connector', path: '/secretshubcontent/sh-requirements/' },
  ],
  pamsh: [
    { key: 'arch', path: '/secretshubcontent/sh-architecture-diagram/' },
    { key: 'connect', path: '/secretshubcontent/sh-connect-pam-sh/' },
    { key: 'support', path: '/secretshubcontent/sh-support/' },
    { key: 'sync', path: '/hometileslps/lp-tile3/' },
    { key: 'hcv', path: '/secretshubcontent/sh-hashicorp-secret-stores/' },
    { key: 'connector', path: '/secretshubcontent/sh-requirements/' },
  ],
}

export function DocsLinks({ env }: { env: ShubEnv }) {
  const { t } = useTranslation()
  return (
    <section aria-labelledby="shub-docs">
      <h2 id="shub-docs" className="text-xl font-semibold text-text">{t('secretshub.docs.title')}</h2>
      <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
        {DOCS[env].map(d => (
          <li key={d.key}>
            <a href={`${docsBase(env)}${d.path}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-tone-accent hover:underline">
              {t(`secretshub.docs.${d.key}`)}<ExternalLink size={13} aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
