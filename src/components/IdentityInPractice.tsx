import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Fingerprint, KeyRound } from 'lucide-react'

/**
 * Home: secret vs machine identity side by side, then which identity each
 * platform already issues and which IDIRA authenticator verifies it. Rows link
 * to the demo that shows it — the only demo references in the teaching part.
 */
const PLATFORMS: Array<{ key: string; authn: string; demos: Array<{ to: string; label: string }> }> = [
  { key: 'k8s',     authn: 'authn-jwt', demos: [{ to: '/spring-boot', label: 'Spring Boot' }, { to: '/eso-shop', label: 'ESO' }, { to: '/csi', label: 'CSI' }] },
  { key: 'github',  authn: 'authn-jwt', demos: [{ to: '/github-actions', label: 'GitHub Actions' }] },
  { key: 'jenkins', authn: 'authn-jwt', demos: [{ to: '/jenkins', label: 'Jenkins' }] },
  { key: 'aws',     authn: 'authn-iam', demos: [{ to: '/ansible', label: 'Ansible' }] },
  { key: 'spiffe',  authn: 'Secure Workload Access', demos: [{ to: '/swa-s3', label: 'SWA → AWS S3' }] },
]
const ROWS = ['question', 'example', 'issuer', 'lifetime', 'leak', 'idira'] as const

export default function IdentityInPractice() {
  const { t } = useTranslation()
  return (
    <section id="in-practice" className="px-6 lg:px-10 py-20 md:py-24 border-b border-border">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-tone-live">{t('practice.kicker')}</p>
          <h2 className="mt-3 text-[clamp(26px,3.4vw,40px)] font-bold leading-tight tracking-[-0.02em] text-text">{t('practice.title')}</h2>
          <p className="mt-4 text-base leading-relaxed text-text-2">{t('practice.subtitle')}</p>
        </div>

        {/* Secret vs identity — stacked on phones, table from sm up */}
        <div className="mt-10 grid gap-4 sm:hidden">
          {(['secret', 'identity'] as const).map(col => (
            <div key={col} className="rounded-2xl border border-border bg-bg-card p-5">
              <p className="inline-flex items-center gap-2 font-semibold text-text">
                {col === 'secret' ? <KeyRound size={16} className="text-tone-accent" aria-hidden="true" /> : <Fingerprint size={16} className="text-tone-accent" aria-hidden="true" />}
                {t(`practice.col_${col}`)}
              </p>
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
        <div className="mt-10 hidden sm:block overflow-hidden rounded-2xl border border-border bg-bg-card">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{t('practice.compare_caption')}</caption>
            <thead className="bg-bg-muted">
              <tr>
                <th scope="col" className="w-1/4 px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
                  <span className="sr-only">{t('practice.aspect')}</span>
                </th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-text">
                  <span className="inline-flex items-center gap-2 font-semibold"><KeyRound size={16} className="text-tone-accent" aria-hidden="true" />{t('practice.col_secret')}</span>
                </th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-text">
                  <span className="inline-flex items-center gap-2 font-semibold"><Fingerprint size={16} className="text-tone-accent" aria-hidden="true" />{t('practice.col_identity')}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ROWS.map(r => (
                <tr key={r} className="align-top">
                  <th scope="row" className="px-4 sm:px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-muted">{t(`practice.rows.${r}.label`)}</th>
                  <td className="px-4 sm:px-6 py-4 leading-relaxed text-text-2">{t(`practice.rows.${r}.secret`)}</td>
                  <td className="px-4 sm:px-6 py-4 leading-relaxed text-text-2">{t(`practice.rows.${r}.identity`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Identity per platform */}
        <h3 className="mt-14 text-lg font-semibold text-text">{t('practice.platforms_title')}</h3>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-2">{t('practice.platforms_subtitle')}</p>
        <div className="mt-5 overflow-x-auto rounded-2xl border border-border bg-bg-card">
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
                          {d.to === '/swa-s3'
                            ? <a href={d.to} className="inline-flex min-h-8 items-center gap-1 font-medium text-tone-accent hover:underline underline-offset-4">{d.label}<ArrowRight size={13} aria-hidden="true" /></a>
                            : <Link to={d.to} className="inline-flex min-h-8 items-center gap-1 font-medium text-tone-accent hover:underline underline-offset-4">{d.label}<ArrowRight size={13} aria-hidden="true" /></Link>}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
