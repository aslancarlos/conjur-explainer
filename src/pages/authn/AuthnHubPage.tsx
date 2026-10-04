import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Check, Fingerprint, KeyRound, Minus, ScrollText, CircleDot } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { DocLinks, LimitsCallout, Section } from '../../components/authn/AuthnPieces'

type Avail = 'yes' | 'no' | 'partial'

/** One row per authentication method; copy lives in authnhub.methods.<key>. */
const METHODS: Array<{ key: string; to: string; saas: Avail; sh: Avail }> = [
  { key: 'apikey', to: '/authn/api-key', saas: 'yes', sh: 'yes' },
  { key: 'jwt', to: '/jwt', saas: 'yes', sh: 'yes' },
  { key: 'iam', to: '/authn/aws-iam', saas: 'yes', sh: 'yes' },
  { key: 'azure', to: '/authn/azure', saas: 'yes', sh: 'yes' },
  { key: 'gcp', to: '/authn/gcp', saas: 'yes', sh: 'yes' },
  { key: 'cert', to: '/authn/certificate', saas: 'partial', sh: 'yes' },
  { key: 'k8s', to: '/authn/kubernetes', saas: 'no', sh: 'yes' },
  { key: 'spiffe', to: '/concepts/swa-architecture', saas: 'yes', sh: 'partial' },
  { key: 'users', to: '/authn/users', saas: 'yes', sh: 'yes' },
]

const DOCS = [
  { key: 'doc_saas_overview', href: 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/conjurcloud/ccl-authentication.htm' },
  { key: 'doc_saas_authn', href: 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/operations/authn/authn-config.htm' },
  { key: 'doc_saas_lp', href: 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/operations/authn/authn-lp.htm' },
  { key: 'doc_sh_types', href: 'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/operations/services/authentication-types.htm' },
  { key: 'doc_sh_support', href: 'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/operations/authn/cjr-authn-support.htm' },
] as const

function AvailCell({ v, label }: { v: Avail; label: string }) {
  const { t } = useTranslation()
  const text = t(`authnhub.avail_${v}`)
  const cls = v === 'yes' ? 'text-tone-success' : v === 'partial' ? 'text-tone-warning' : 'text-text-muted'
  const Icon = v === 'yes' ? Check : v === 'partial' ? CircleDot : Minus
  return (
    <span className={`inline-flex items-center gap-1.5 font-medium ${cls}`} title={`${label}: ${text}`}>
      <Icon size={15} aria-hidden="true" />{text}
    </span>
  )
}

/** Authentication methods overview: what an authenticator is and how the methods compare. */
export default function AuthnHubPage() {
  const { t } = useTranslation()
  const p = (k: string) => t(`authnhub.${k}`)
  const list = (k: string) => t(`authnhub.${k}`, { returnObjects: true }) as string[]
  const choose = t('authnhub.choose', { returnObjects: true }) as Array<{ q: string; a: string; to: string }>

  const STEPS = [
    { key: 'proof', Icon: Fingerprint },
    { key: 'token', Icon: KeyRound },
    { key: 'policy', Icon: ScrollText },
  ] as const

  return (
    <section className="min-h-screen bg-bg-base px-6 py-16">
      <div className="mx-auto max-w-6xl space-y-12">
        <PageHeader badge={p('badge')} title={p('title')} subtitle={p('subtitle')} />

        {/* What an authenticator does */}
        <Section title={p('what_title')} lead={p('what_lead')}>
          <ol className="grid gap-4 md:grid-cols-3">
            {STEPS.map(({ key, Icon }, i) => (
              <li key={key} className="card">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-domain-idira/30 bg-domain-idira/10 text-domain-idira">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <span className="font-mono text-xs text-text-muted">0{i + 1}</span>
                </div>
                <h3 className="mt-3 text-base font-semibold text-text">{p(`step_${key}_title`)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-text-2">{p(`step_${key}_desc`)}</p>
              </li>
            ))}
          </ol>
        </Section>

        {/* Comparison */}
        <Section title={p('compare_title')} lead={p('compare_lead')}>
          <div className="overflow-x-auto rounded-2xl border border-border bg-bg-card">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <caption className="sr-only">{p('compare_title')}</caption>
              <thead className="bg-bg-muted text-xs font-semibold uppercase tracking-wider text-text-muted">
                <tr>
                  {['col_method', 'col_who', 'col_proof', 'col_stored', 'col_saas', 'col_sh', 'col_limit'].map(c => (
                    <th key={c} scope="col" className="px-4 py-3 align-bottom">{p(c)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {METHODS.map(m => (
                  <tr key={m.key} className="align-top">
                    <th scope="row" className="px-4 py-4">
                      <Link to={m.to} className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-tone-accent hover:underline">
                        {p(`methods.${m.key}.name`)}<ArrowRight size={14} aria-hidden="true" />
                      </Link>
                      <span className="block font-mono text-xs text-text-muted">{p(`methods.${m.key}.id`)}</span>
                    </th>
                    <td className="px-4 py-4 leading-relaxed text-text-2">{p(`methods.${m.key}.who`)}</td>
                    <td className="px-4 py-4 leading-relaxed text-text-2">{p(`methods.${m.key}.proof`)}</td>
                    <td className="px-4 py-4 leading-relaxed text-text-2">{p(`methods.${m.key}.stored`)}</td>
                    <td className="px-4 py-4"><AvailCell v={m.saas} label={p('col_saas')} /></td>
                    <td className="px-4 py-4"><AvailCell v={m.sh} label={p('col_sh')} /></td>
                    <td className="px-4 py-4 leading-relaxed text-text-2">{p(`methods.${m.key}.limit`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-text-muted">{p('partial_note')}</p>
        </Section>

        {/* How to choose */}
        <Section title={p('choose_title')} lead={p('choose_lead')}>
          <ul className="grid gap-3 md:grid-cols-2">
            {choose.map(c => (
              <li key={c.q}>
                <Link to={c.to} className="flex h-full flex-col gap-1 rounded-xl border border-border bg-bg-card px-4 py-3 transition-colors hover:border-idira-blue">
                  <span className="text-sm font-semibold text-text">{c.q}</span>
                  <span className="inline-flex items-center gap-1.5 text-sm text-tone-accent">{c.a}<ArrowRight size={14} aria-hidden="true" /></span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        <LimitsCallout title={p('limits_title')} items={list('limits')}
          source={{ label: p('limits_source'), href: DOCS[3].href }} />

        <DocLinks title={p('docs_title')} links={DOCS.map(d => ({ label: p(d.key), href: d.href }))} />
      </div>
    </section>
  )
}
