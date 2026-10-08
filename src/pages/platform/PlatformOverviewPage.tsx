import { useTranslation } from 'react-i18next'
import { ArrowRight, ExternalLink } from 'lucide-react'
import { Link } from '../../lib/router'
import ConceptLayout from '../../components/concepts/ConceptLayout'
import PlatformStarFlow from '../../components/flow/specs/PlatformStarFlow'

/** Colour icons from public/icons (same set as the solution finder and the sidebar). */
const BENEFITS = [
  { key: 'one', logo: '/icons/tech/pam.svg' },
  { key: 'rotate', logo: '/icons/nav/rotation.svg' },
  { key: 'choose', logo: '/icons/nav/g_usecases.svg' },
] as const

/** Every consumer of the Vault, in diagram order, with the page that explains it. */
const PRODUCTS = [
  { key: 'smsaas', to: '/concepts/saas-architecture', domain: 'bg-domain-idira', logo: '/icons/nav/c_saas.svg' },
  { key: 'smsh',   to: '/concepts/self-hosted-architecture', domain: 'bg-domain-idira', logo: '/icons/nav/c_sh.svg' },
  { key: 'shub',   to: '/secretshub', domain: 'bg-domain-svc', logo: '/icons/nav/g_shub.svg' },
  { key: 'cp',     to: '/cp/credential-provider', domain: 'bg-domain-cp', logo: '/icons/nav/cp_cp.svg' },
  { key: 'ascp',   to: '/cp/ascp', domain: 'bg-domain-cp', logo: '/icons/tech/op_appservers.svg' },
  { key: 'ccp',    to: '/cp/ccp', domain: 'bg-domain-cp', logo: '/icons/nav/ccp.svg' },
] as const

const COLS = ['how', 'who', 'when'] as const

const DOCS = [
  ['smsaas', 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/conjurcloud/cl_addaccount.htm'],
  ['vsync', 'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/conjur/cv_overview.htm'],
  ['shub_pc', 'https://docs.cyberark.com/secrets-hub-privilege-cloud/latest/en'],
  ['shub_sh', 'https://docs.cyberark.com/secrets-hub-pam-sh/latest/en'],
  ['cp', 'https://docs.cyberark.com/credential-providers/latest/en/content/ccp/aam-cp-offerings.htm'],
  ['cache', 'https://docs.cyberark.com/credential-providers/latest/en/content/cp%20and%20ascp/configuring-caching.htm'],
] as const

/** Colour logo on a light rounded slot, legible in both themes (as in the solution finder). */
function LogoSlot({ src, size }: { src: string; size: number }) {
  const pad = size >= 28 ? 6 : 4
  return (
    <span aria-hidden="true" className="inline-flex shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-black/5"
      style={{ width: size + pad * 2, height: size + pad * 2 }}>
      <img src={src} alt="" width={size} height={size} decoding="async" />
    </span>
  )
}

/**
 * Platform overview: one PAM Vault in the center, every Secrets Manager,
 * Secrets Hub and Credential Provider consumer around it, all reading the same
 * account (DESIGN.md §7, §10).
 */
export default function PlatformOverviewPage() {
  const { t } = useTranslation()
  const p = (k: string) => t(`platform.${k}`)

  return (
    <ConceptLayout title={p('title')} subtitle={p('subtitle')}>
      <section className="grid gap-4 md:grid-cols-3">
        {BENEFITS.map(({ key, logo }) => (
          <div key={key} className="card">
            <LogoSlot src={logo} size={28} />
            <h2 className="mt-3 text-base font-semibold text-text">{p(`benefits.${key}_title`)}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-text-2">{p(`benefits.${key}_desc`)}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="platform-flow">
        <h2 id="platform-flow" className="text-xl font-semibold text-text">{p('flow_title')}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-2">{p('flow_intro')}</p>
        <div className="mt-5"><PlatformStarFlow /></div>
      </section>

      <section aria-labelledby="platform-table">
        <h2 id="platform-table" className="text-xl font-semibold text-text">{p('table_title')}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-2">{p('table_intro')}</p>
        <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-bg-card">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{p('table_title')}</caption>
            <thead className="bg-bg-muted text-xs font-semibold uppercase tracking-wider text-text-muted">
              <tr>
                <th scope="col" className="px-5 py-3">{p('col_product')}</th>
                {COLS.map(c => <th key={c} scope="col" className="px-5 py-3">{p(`col_${c}`)}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {PRODUCTS.map(({ key, to, domain, logo }) => (
                <tr key={key} className="align-top">
                  <th scope="row" className="px-5 py-4">
                    <span className="flex items-start gap-3">
                      <span className="relative">
                        <LogoSlot src={logo} size={22} />
                        <span className={`absolute -left-2 top-1.5 h-4 w-1 rounded-full ${domain}`} aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold text-text">{p(`products.${key}.name`)}</span>
                        <Link to={to} className="mt-1 inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-tone-accent hover:underline">
                          {p('open_page')}<ArrowRight size={13} aria-hidden="true" />
                        </Link>
                      </span>
                    </span>
                  </th>
                  {COLS.map(c => (
                    <td key={c} className="px-5 py-4 leading-relaxed text-text-2">{p(`products.${key}.${c}`)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="callout-info callout-section" aria-labelledby="platform-dual">
        <h2 id="platform-dual" className="text-base font-semibold text-text">{p('dual_title')}</h2>
        <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-text-2">{p('dual_desc')}</p>
        <Link to="/dualaccounts" className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-tone-accent hover:underline">
          {p('dual_link')}<ArrowRight size={14} aria-hidden="true" />
        </Link>
      </section>

      <section aria-labelledby="platform-docs">
        <h2 id="platform-docs" className="text-xl font-semibold text-text">{p('docs_title')}</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {DOCS.map(([key, href]) => (
            <li key={key}>
              <a href={href} target="_blank" rel="noopener noreferrer"
                className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-border bg-bg-card px-4 py-2.5 text-sm font-medium text-text hover:bg-bg-muted transition-colors">
                {p(`docs.${key}`)}
                <ExternalLink size={14} className="shrink-0 text-text-muted" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </ConceptLayout>
  )
}
