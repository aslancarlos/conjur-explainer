import { useTranslation } from 'react-i18next'
import { Link } from '../../lib/router'
import {
  ArrowRight, BadgeCheck, Check, Cloud, Container, FileCode2, Flame, GitBranch, HardDrive, KeyRound,
  RefreshCcwDot, ScrollText, ShieldAlert, ShieldCheck, ShipWheel, Terminal, Variable, X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import ConceptLayout from '../../components/concepts/ConceptLayout'
import SecretZeroFlow from '../../components/flow/specs/concepts/SecretZeroFlow'
import { DocLinks, Section } from '../../components/authn/AuthnPieces'

const WHY: Array<[string, LucideIcon]> = [['leak', Flame], ['rotation', RefreshCcwDot], ['blast', ShieldAlert]]

const HIDES: Array<[string, LucideIcon]> = [
  ['env', Variable], ['config', FileCode2], ['image', Container], ['ci', GitBranch], ['scripts', Terminal], ['disk', HardDrive],
]

/** How IDIRA removes the bootstrap credential, each pointing to the page that explains it. */
const SOLVE: Array<[string, LucideIcon, string]> = [
  ['k8s', ShipWheel, '/authn/kubernetes'],
  ['cloud', Cloud, '/authn/aws-iam'],
  ['cicd', GitBranch, '/jwt'],
  ['swa', ShieldCheck, '/concepts/swa-architecture'],
  ['cp', BadgeCheck, '/cp/credential-provider'],
]

const ROWS = 5

const DOCS = [
  ['overview', 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/conjurcloud/cl_conjurcloudoverview.htm'],
  ['swa', 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-overview.htm'],
  ['azure_saas', 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/operations/authn/authenticate-azure-overview.htm'],
  ['azure_sh', 'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/operations/services/azure_authn.htm'],
  ['apikey', 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/operations/authn/authn-default.htm'],
  ['host', 'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/operations/policy/statement-ref-host.htm'],
] as const

/** Concepts: what secret zero is and how platform-attested identity removes it (DESIGN.md §7, §10). */
export default function SecretZeroPage() {
  const { t } = useTranslation()
  const c = (k: string) => t(`c_secretzero.${k}`)

  return (
    <ConceptLayout title={c('title')} subtitle={c('subtitle')}>
      {/* The problem, highlighted in red (icon + label, never colour alone) */}
      <section role="note" aria-labelledby="sz-problem"
        className="callout-danger callout-section border-2">
        <p className="inline-flex items-center gap-1.5 rounded-full border border-tone-danger/40 bg-tone-danger/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-tone-danger">
          <ShieldAlert size={14} aria-hidden="true" />{c('problem_badge')}
        </p>
        <h2 id="sz-problem" className="mt-3 text-xl font-semibold text-tone-danger">{c('problem_title')}</h2>
        <p className="mt-3 max-w-[72ch] text-base leading-relaxed text-text">{c('problem_desc')}</p>
        <p className="mt-3 max-w-[72ch] text-sm leading-relaxed text-text-2">{c('problem_regress')}</p>
        <blockquote className="mt-4 max-w-[72ch] border-l-4 border-tone-danger/60 pl-4 text-sm italic leading-relaxed text-text-2">
          {c('problem_quote')}
        </blockquote>
      </section>

      <section aria-labelledby="sz-flow">
        <h2 id="sz-flow" className="text-xl font-semibold text-text">{c('flow_title')}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-2">{c('flow_intro')}</p>
        <div className="mt-5"><SecretZeroFlow /></div>
      </section>

      <Section title={c('why_title')}>
        <div className="grid gap-4 md:grid-cols-3">
          {WHY.map(([k, Icon]) => (
            <div key={k} className="rounded-2xl border border-tone-danger/30 bg-bg-card p-5">
              <Icon size={20} className="text-tone-danger" aria-hidden="true" />
              <h3 className="mt-3 text-base font-semibold text-text">{c(`why.${k}_title`)}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-text-2">{c(`why.${k}_desc`)}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title={c('hides_title')} lead={c('hides_lead')}>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {HIDES.map(([k, Icon]) => (
            <li key={k} className="flex gap-3 rounded-xl border border-border bg-bg-card p-4">
              <Icon size={18} className="mt-0.5 shrink-0 text-tone-danger" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-text">{c(`hides.${k}_title`)}</p>
                <p className="mt-1 text-sm leading-relaxed text-text-2">{c(`hides.${k}_desc`)}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={c('solve_title')} lead={c('solve_lead')}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SOLVE.map(([k, Icon, to]) => (
            <Link key={k} to={to}
              className="group flex flex-col card transition-colors duration-200 hover:border-tone-success/50 hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue">
              <Icon size={20} className="text-tone-success" aria-hidden="true" />
              <h3 className="mt-3 text-base font-semibold text-text">{c(`solve.${k}_title`)}</h3>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-text-2">{c(`solve.${k}_desc`)}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-domain-idira">
                {c('learn_more')}<ArrowRight size={14} aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </Section>

      {/* Honest note: an API key is still a secret zero */}
      <section role="note" aria-labelledby="sz-apikey"
        className="callout-warning callout-section">
        <h2 id="sz-apikey" className="flex items-center gap-2 text-xl font-semibold text-text">
          <KeyRound size={20} className="shrink-0 text-tone-warning" aria-hidden="true" />{c('apikey_title')}
        </h2>
        <p className="mt-2 max-w-[72ch] text-sm leading-relaxed text-text-2">{c('apikey_desc')}</p>
        <ul className="mt-3 space-y-2">
          {(['rotate', 'restrict', 'prefer'] as const).map(k => (
            <li key={k} className="flex gap-2 text-sm leading-relaxed text-text">
              <ScrollText size={16} className="mt-0.5 shrink-0 text-tone-warning" aria-hidden="true" />{c(`apikey.${k}`)}
            </li>
          ))}
        </ul>
        <Link to="/authn/api-key" className="mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-domain-idira hover:underline">
          {c('apikey_link')}<ArrowRight size={14} aria-hidden="true" />
        </Link>
      </section>

      <Section title={c('table_title')}>
        <div className="overflow-x-auto rounded-2xl border border-border bg-bg-card">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{c('table_title')}</caption>
            <thead className="bg-bg-muted text-xs font-semibold uppercase tracking-wider text-text-muted">
              <tr>
                <th scope="col" className="px-5 py-3">{c('col_aspect')}</th>
                <th scope="col" className="px-5 py-3">
                  <span className="inline-flex items-center gap-1.5 text-tone-danger"><X size={14} aria-hidden="true" />{c('col_with')}</span>
                </th>
                <th scope="col" className="px-5 py-3">
                  <span className="inline-flex items-center gap-1.5 text-tone-success"><Check size={14} aria-hidden="true" />{c('col_without')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: ROWS }, (_, i) => (
                <tr key={i} className="border-t border-border align-top">
                  <th scope="row" className="px-5 py-3 font-semibold text-text">{c(`rows.r${i + 1}_aspect`)}</th>
                  <td className="px-5 py-3 leading-relaxed text-text-2">{c(`rows.r${i + 1}_with`)}</td>
                  <td className="px-5 py-3 leading-relaxed text-text-2">{c(`rows.r${i + 1}_without`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <DocLinks title={c('docs_title')} links={DOCS.map(([k, href]) => ({ label: c(`docs.${k}`), href }))} />
    </ConceptLayout>
  )
}
