import { useTranslation } from 'react-i18next'

// Terms as used in the Secrets Manager docs (Key concepts, policy reference,
// Secure Workload Access). Order: actors → proof → rules → secrets → lifecycle.
const TERMS = ['workload', 'host', 'authenticator', 'token', 'policy', 'variable', 'fetchers', 'dynamic', 'rotation', 'secretzero', 'spiffe', 'nhi'] as const

export default function Glossary() {
  const { t } = useTranslation()
  return (
    <section id="glossary" className="px-6 lg:px-10 py-20 md:py-24 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-tone-live">{t('glossary.kicker')}</p>
          <h2 className="mt-3 text-[clamp(26px,3.4vw,40px)] font-bold leading-tight tracking-[-0.02em] text-text">{t('glossary.title')}</h2>
          <p className="mt-4 text-base leading-relaxed text-text-2">{t('glossary.subtitle')}</p>
        </div>
        <dl className="mt-10 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {TERMS.map(k => (
            <div key={k} className="border-l-2 border-border pl-4">
              <dt className="font-mono text-sm font-semibold text-text">{t(`glossary.terms.${k}.term`)}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-text-2">{t(`glossary.terms.${k}.def`)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
