import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Check, ExternalLink, Fingerprint, KeyRound, ScrollText, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// Building blocks of the Concepts pages. Wording follows the Secrets Manager
// SaaS docs ("Key concepts": secrets, workloads; policy reference; SWA).

export const CONCEPT_DOCS = {
  secret:   'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/get%20started/key_concepts/secrets.html',
  identity: 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/get%20started/key_concepts/machine_identity.html',
}

/** Definition card: what it is, examples, how IDIRA handles it, docs link. */
export function ConceptCard({ kind }: { kind: 'secret' | 'identity' }) {
  const { t } = useTranslation()
  const Icon = kind === 'secret' ? KeyRound : Fingerprint
  const examples = t(`fundamentals.${kind}.examples`, { returnObjects: true }) as string[]
  const points = t(`fundamentals.${kind}.points`, { returnObjects: true }) as string[]
  return (
    <article className="flex flex-col rounded-2xl border border-border bg-bg-card p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-idira-blue/10 text-tone-accent" aria-hidden="true">
          <Icon size={22} strokeWidth={1.8} />
        </span>
        <h2 className="text-xl font-semibold text-text">{t('concepts.definition')}</h2>
      </div>
      <p className="mt-4 text-base leading-relaxed text-text-2">{t(`fundamentals.${kind}.def`)}</p>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-text-muted">{t('fundamentals.examples_label')}</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {examples.map(e => (
          <li key={e} className="rounded-md border border-border bg-bg-muted px-2.5 py-1 font-mono text-xs text-text-2">{e}</li>
        ))}
      </ul>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-text-muted">{t('fundamentals.in_idira')}</p>
      <ul className="mt-2 space-y-2.5">
        {points.map(p => (
          <li key={p} className="flex gap-2.5 text-sm leading-relaxed text-text-2">
            <Check size={16} strokeWidth={2.2} className="mt-0.5 shrink-0 text-tone-accent" aria-hidden="true" />
            <span>{p}</span>
          </li>
        ))}
      </ul>

      <a href={CONCEPT_DOCS[kind]} target="_blank" rel="noreferrer"
        className="mt-6 inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold text-tone-accent hover:underline underline-offset-4">
        {t(`fundamentals.${kind}.doc`)}<ExternalLink size={13} aria-hidden="true" />
      </a>
    </article>
  )
}

const STEPS: Array<{ key: 'prove' | 'authorize' | 'deliver'; Icon: LucideIcon }> = [
  { key: 'prove',     Icon: Fingerprint },
  { key: 'authorize', Icon: ScrollText },
  { key: 'deliver',   Icon: KeyRound },
]

/** Prove → authorize → deliver, closing with "no secret zero". */
export function FitPanel() {
  const { t } = useTranslation()
  return (
    <div className="rounded-2xl border border-border bg-bg-muted/50 p-6 sm:p-8">
      <h2 className="text-xl font-semibold text-text">{t('fundamentals.fit_title')}</h2>
      <ol className="mt-5 grid gap-5 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.key} className="relative flex gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-bg-card text-tone-accent" aria-hidden="true">
              <s.Icon size={17} strokeWidth={1.9} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text">
                <span className="font-mono text-text-muted">{i + 1}.</span> {t(`fundamentals.steps.${s.key}.title`)}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-text-2">{t(`fundamentals.steps.${s.key}.desc`)}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-6 flex gap-2.5 border-t border-border pt-5 text-sm leading-relaxed text-text">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-tone-accent" aria-hidden="true" />
        <span><strong className="font-semibold">{t('fundamentals.zero_title')}</strong> {t('fundamentals.zero_desc')}</span>
      </p>
    </div>
  )
}

const ROWS = ['question', 'example', 'issuer', 'lifetime', 'leak', 'idira'] as const

/** Secret vs machine identity, stacked on phones, table from sm up. */
export function CompareTable() {
  const { t } = useTranslation()
  const head = (col: 'secret' | 'identity') => (
    <span className="inline-flex items-center gap-2 font-semibold text-text">
      {col === 'secret'
        ? <KeyRound size={16} className="text-tone-accent" aria-hidden="true" />
        : <Fingerprint size={16} className="text-tone-accent" aria-hidden="true" />}
      {t(`practice.col_${col}`)}
    </span>
  )
  return (
    <>
      <div className="grid gap-4 sm:hidden">
        {(['secret', 'identity'] as const).map(col => (
          <div key={col} className="card">
            <p>{head(col)}</p>
            <dl className="mt-3 space-y-3">
              {ROWS.map(r => (
                <div key={r}>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-text-muted">{t(`practice.rows.${r}.label`)}</dt>
                  <dd className="mt-0.5 text-sm leading-relaxed text-text-2">{t(`practice.rows.${r}.${col}`)}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
      <div className="hidden sm:block overflow-hidden rounded-2xl border border-border bg-bg-card">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{t('practice.compare_caption')}</caption>
          <thead className="bg-bg-muted">
            <tr>
              <th scope="col" className="w-1/4 px-6 py-3"><span className="sr-only">{t('practice.aspect')}</span></th>
              <th scope="col" className="px-6 py-3">{head('secret')}</th>
              <th scope="col" className="px-6 py-3">{head('identity')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ROWS.map(r => (
              <tr key={r} className="align-top">
                <th scope="row" className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted">{t(`practice.rows.${r}.label`)}</th>
                <td className="px-6 py-4 leading-relaxed text-text-2">{t(`practice.rows.${r}.secret`)}</td>
                <td className="px-6 py-4 leading-relaxed text-text-2">{t(`practice.rows.${r}.identity`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

const PLATFORMS: Array<{ key: string; authn: string; demos: Array<{ to: string; label: string; external?: boolean }> }> = [
  { key: 'k8s',     authn: 'authn-jwt', demos: [{ to: '/spring-boot', label: 'Spring Boot' }, { to: '/eso-shop', label: 'ESO' }, { to: '/csi', label: 'CSI' }] },
  { key: 'github',  authn: 'authn-jwt', demos: [{ to: '/github-actions', label: 'GitHub Actions' }] },
  { key: 'jenkins', authn: 'authn-jwt', demos: [{ to: '/jenkins', label: 'Jenkins' }] },
  { key: 'aws',     authn: 'authn-iam', demos: [{ to: '/ansible', label: 'Ansible' }] },
  { key: 'spiffe',  authn: 'Secure Workload Access', demos: [{ to: '/svid', label: 'SVID', external: true }, { to: '/swa-s3', label: 'SWA → AWS S3', external: true }] },
]

/** Which identity each platform already issues → IDIRA authenticator → demo. */
export function PlatformsTable() {
  const { t } = useTranslation()
  const link = 'inline-flex min-h-8 items-center gap-1 font-medium text-tone-accent hover:underline underline-offset-4'
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-bg-card">
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">{t('practice.platforms_title')}</caption>
        <thead className="bg-bg-muted text-xs font-semibold uppercase tracking-wider text-text-muted">
          <tr>
            <th scope="col" className="px-4 sm:px-6 py-3">{t('practice.p_platform')}</th>
            <th scope="col" className="px-4 sm:px-6 py-3">{t('practice.p_evidence')}</th>
            <th scope="col" className="px-4 sm:px-6 py-3">{t('practice.p_authn')}</th>
            <th scope="col" className="px-4 sm:px-6 py-3">{t('practice.p_see')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {PLATFORMS.map(p => (
            <tr key={p.key} className="align-top">
              <th scope="row" className="px-4 sm:px-6 py-4 font-semibold text-text">{t(`practice.platforms.${p.key}.name`)}</th>
              <td className="px-4 sm:px-6 py-4 leading-relaxed text-text-2">{t(`practice.platforms.${p.key}.evidence`)}</td>
              <td className="px-4 sm:px-6 py-4"><code className="rounded bg-bg-muted px-1.5 py-0.5 font-mono text-xs text-text">{p.authn}</code></td>
              <td className="px-4 sm:px-6 py-4">
                <ul className="flex flex-wrap gap-x-3 gap-y-1">
                  {p.demos.map(d => (
                    <li key={d.to}>
                      {d.external
                        ? <a href={d.to} className={link}>{d.label}<ArrowRight size={13} aria-hidden="true" /></a>
                        : <Link to={d.to} className={link}>{d.label}<ArrowRight size={13} aria-hidden="true" /></Link>}
                    </li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const TERMS = ['workload', 'host', 'authenticator', 'token', 'policy', 'variable', 'fetchers', 'dynamic', 'rotation', 'secretzero', 'spiffe', 'nhi'] as const

/** Glossary as a definition list. */
export function GlossaryList() {
  const { t } = useTranslation()
  return (
    <dl className="grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
      {TERMS.map(k => (
        <div key={k} id={`term-${k}`} tabIndex={-1} className="scroll-mt-20 border-l-2 border-border pl-4 rounded-r-md focus-visible:bg-bg-muted">
          <dt className="font-mono text-sm font-semibold text-text">{t(`glossary.terms.${k}.term`)}</dt>
          <dd className="mt-1.5 text-sm leading-relaxed text-text-2">{t(`glossary.terms.${k}.def`)}</dd>
        </div>
      ))}
    </dl>
  )
}
