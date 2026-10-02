import { useTranslation } from 'react-i18next'
import PageHeader from '../../components/PageHeader'
import CertAuthnFlow from '../../components/flow/specs/authn/CertAuthnFlow'
import { DocLinks, LimitsCallout, RoleTable, Section, SupportChips } from '../../components/authn/AuthnPieces'

const DOCS = [
  { key: 'doc_saas', href: 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/operations/authn/authn-cert/authn-cert.htm' },
  { key: 'doc_saas_api', href: 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/developer/api-cert-authn.htm' },
  { key: 'doc_saas_steps', href: 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/operations/authn/authn-cert/authn-cert-step-by-step.htm' },
  { key: 'doc_sh', href: 'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/operations/authn/authn-cert/authn-cert.htm' },
  { key: 'doc_sh_api', href: 'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/developer/api-cert-authn.htm' },
] as const

/** Authentication methods: client certificate authenticator (authn-cert). */
export default function CertAuthnPage() {
  const { t } = useTranslation()
  const p = (k: string) => t(`authn_cert.${k}`)
  const list = (k: string) => t(`authn_cert.${k}`, { returnObjects: true }) as string[]
  const rows = t('authn_cert.roles', { returnObjects: true }) as Array<[string, string]>

  return (
    <section className="min-h-screen bg-bg-base px-6 py-16">
      <div className="mx-auto max-w-5xl space-y-10">
        <PageHeader badge={p('badge')} title={p('title')} subtitle={p('subtitle')}>
          <SupportChips saas selfHosted />
          <p className="text-sm text-text-muted">{p('support_note')}</p>
        </PageHeader>

        <CertAuthnFlow />

        <Section title={p('roles_title')} lead={p('roles_lead')}>
          <RoleTable caption={p('roles_title')} colA={p('col_component')} colB={p('col_role')} rows={rows} />
        </Section>

        <Section title={p('annot_title')} lead={p('annot_lead')}>
          <RoleTable caption={p('annot_title')} colA={p('col_annotation')} colB={p('col_validates')}
            rows={t('authn_cert.annotations', { returnObjects: true }) as Array<[string, string]>} />
        </Section>

        <Section title={p('when_title')}>
          <ul className="grid gap-3 sm:grid-cols-2">
            {list('when').map(w => (
              <li key={w} className="rounded-xl border border-border bg-bg-card px-4 py-3 text-sm leading-relaxed text-text-2">{w}</li>
            ))}
          </ul>
        </Section>

        <LimitsCallout title={p('limits_title')} items={list('limits')}
          source={{ label: p('limits_source'), href: DOCS[0].href }} />

        <Section title={p('diff_title')}>
          <RoleTable caption={p('diff_title')} colA={p('col_topic')} colB={p('col_detail')}
            rows={t('authn_cert.diff', { returnObjects: true }) as Array<[string, string]>} />
        </Section>

        <DocLinks title={p('docs_title')} links={DOCS.map(d => ({ label: p(d.key), href: d.href }))} />
      </div>
    </section>
  )
}
