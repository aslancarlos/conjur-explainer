import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ExternalLink, Minus, TriangleAlert } from 'lucide-react'

/**
 * Shared building blocks for the authentication-method pages (one page per
 * Secrets Manager authenticator). Copy comes from each page's own i18n
 * namespace; these components only provide the consistent structure.
 */

/** "Available in SaaS / Self-Hosted" chips (icon + text, never colour alone). */
export function SupportChips({ saas, selfHosted }: { saas: boolean; selfHosted: boolean }) {
  const { t } = useTranslation()
  const chip = (ok: boolean, label: string) => (
    <span className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium
      ${ok ? 'border-tone-success/40 bg-tone-success/10 text-tone-success' : 'border-border bg-bg-muted text-text-muted'}`}>
      {ok ? <Check size={14} aria-hidden="true" /> : <Minus size={14} aria-hidden="true" />}
      <span translate="no">{label}</span>
      <span className="sr-only">: {ok ? t('authnhub.available') : t('authnhub.not_available')}</span>
    </span>
  )
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={t('authnhub.availability')}>
      {chip(saas, 'Secrets Manager SaaS')}
      {chip(selfHosted, 'Secrets Manager Self-Hosted')}
    </div>
  )
}

/** Section with an h2 and optional lead. */
export function Section({ title, lead, children }: { title: string; lead?: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-text">{title}</h2>
      {lead && <p className="max-w-[70ch] text-base leading-relaxed text-text-2">{lead}</p>}
      {children}
    </section>
  )
}

/** Prominent limitations / requirements callout (warning tone + icon + text). */
export function LimitsCallout({ title, items, source }: { title: string; items: string[]; source?: { label: string; href: string } }) {
  return (
    <section role="note" aria-label={title}
      className="callout-warning callout-section">
      <h2 className="flex items-center gap-2 text-xl font-semibold text-text">
        <TriangleAlert size={20} className="shrink-0 text-tone-warning" aria-hidden="true" />{title}
      </h2>
      <ul className="mt-4 space-y-2.5">
        {items.map(it => (
          <li key={it} className="flex gap-2.5 text-sm leading-relaxed text-text">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-tone-warning" aria-hidden="true" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
      {source && (
        <a href={source.href} target="_blank" rel="noopener noreferrer"
          className="mt-4 inline-flex min-h-11 items-center gap-1.5 rounded text-sm font-semibold text-tone-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue">
          {source.label}<ExternalLink size={14} aria-hidden="true" />
        </a>
      )}
    </section>
  )
}

/** Two-column component/role table (cards stack naturally on narrow widths). */
export function RoleTable({ caption, colA, colB, rows }: { caption: string; colA: string; colB: string; rows: Array<[string, string]> }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue" tabIndex={0} role="region" aria-label={caption}>
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-bg-muted text-xs font-semibold uppercase tracking-wider text-text-muted">
          <tr><th scope="col" className="px-5 py-3">{colA}</th><th scope="col" className="px-5 py-3">{colB}</th></tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map(([a, b]) => (
            <tr key={a} className="align-top">
              <th scope="row" className="px-5 py-4 font-semibold text-text whitespace-nowrap">{a}</th>
              <td className="px-5 py-4 leading-relaxed text-text-2">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Official documentation links. */
export function DocLinks({ title, links }: { title: string; links: Array<{ label: string; href: string }> }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-text">{title}</h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {links.map(l => (
          <li key={l.href}>
            <a href={l.href} target="_blank" rel="noopener noreferrer"
              className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-border bg-bg-card px-4 py-2 text-sm text-text-2 transition-colors hover:border-idira-blue hover:text-text">
              <span>{l.label}</span><ExternalLink size={14} aria-hidden="true" className="shrink-0 text-text-muted" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
