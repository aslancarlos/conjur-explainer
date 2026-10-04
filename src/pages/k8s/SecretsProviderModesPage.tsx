import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, KeyRound } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import ModeSwitch from '../../components/k8s/ModeSwitch'
import MatrixTable from '../../components/k8s/MatrixTable'
import SecretsProviderModesFlow, { type SpMode } from '../../components/flow/specs/k8s/SecretsProviderModesFlow'
import { DocLinks, LimitsCallout, RoleTable, Section, SupportChips } from '../../components/authn/AuthnPieces'

// Official sources (Secrets Manager SaaS and Self-Hosted docs) for every fact on this page.
const SAAS = 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/integrations/k8s-ocp'
const SH = 'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/integrations/k8s-ocp'
const DOCS = [
  { key: 'doc_overview', href: `${SAAS}/cjr-k8s-jwt-sp-lp.htm` },
  { key: 'doc_k8s', href: `${SAAS}/cjr-k8s-jwt-sp-ic.htm` },
  { key: 'doc_p2f', href: `${SAAS}/cjr-k8s-jwt-sp-ic-p2f.htm` },
  { key: 'doc_job', href: `${SAAS}/cjr-k8s-jwt-sp-ac.htm` },
  { key: 'doc_standalone', href: `${SAAS}/cjr-k8s-jwt-sp-standalone.htm` },
  { key: 'doc_ref', href: `${SAAS}/cjr-k8s-secrets-provider-ref.htm` },
  { key: 'doc_sh_overview', href: `${SH}/cjr-k8s-jwt-sp-lp.htm` },
  { key: 'doc_sh_convert', href: `${SH}/cjr-k8s-secrets-provider-update-mode.htm` },
] as const

/** Secrets Provider for Kubernetes: deployment options and the two destinations. */
export default function SecretsProviderModesPage() {
  const { t } = useTranslation()
  const [mode, setMode] = useState<SpMode>('k8s')
  const p = (k: string) => t(`k8s_spmodes.${k}`)
  const list = (k: string) => t(`k8s_spmodes.${k}`, { returnObjects: true }) as string[]
  const pairs = (k: string) => t(`k8s_spmodes.${k}`, { returnObjects: true }) as Array<[string, string]>
  const rows = (k: string) => t(`k8s_spmodes.${k}`, { returnObjects: true }) as string[][]

  return (
    <section className="min-h-screen bg-bg-base px-6 py-16">
      <div className="mx-auto max-w-5xl space-y-10">
        <PageHeader badge={p('badge')} title={p('title')} subtitle={p('subtitle')}>
          <SupportChips saas selfHosted />
        </PageHeader>

        <Section title={p('flow_title')} lead={p('flow_lead')}>
          <div className="space-y-4">
            <ModeSwitch label={p('mode_label')} value={mode} onChange={setMode} options={[
              { v: 'k8s', label: p('mode_k8s'), Icon: KeyRound },
              { v: 'p2f', label: p('mode_p2f'), Icon: FileText },
            ]} />
            <p className="max-w-[70ch] text-sm leading-relaxed text-text-2">{p(`mode_note_${mode}`)}</p>
            <SecretsProviderModesFlow mode={mode} />
          </div>
        </Section>

        <Section title={p('deploy_title')} lead={p('deploy_lead')}>
          <MatrixTable caption={p('deploy_title')} cols={list('deploy_cols')} rows={rows('deploy')} />
        </Section>

        <Section title={p('dest_title')} lead={p('dest_lead')}>
          <MatrixTable caption={p('dest_title')} cols={list('dest_cols')} rows={rows('dest')} />
        </Section>

        <Section title={p('roles_title')} lead={p('roles_lead')}>
          <RoleTable caption={p('roles_title')} colA={p('col_component')} colB={p('col_role')} rows={pairs('roles')} />
        </Section>

        <Section title={p('caps_title')}>
          <RoleTable caption={p('caps_title')} colA={p('col_capability')} colB={p('col_detail')} rows={pairs('caps')} />
        </Section>

        <Section title={p('when_title')}>
          <ul className="grid gap-3 sm:grid-cols-2">
            {list('when').map(w => (
              <li key={w} className="rounded-xl border border-border bg-bg-card px-4 py-3 text-sm leading-relaxed text-text-2">{w}</li>
            ))}
          </ul>
        </Section>

        <Section title={p('diff_title')}>
          <RoleTable caption={p('diff_title')} colA={p('col_topic')} colB={p('col_detail')} rows={pairs('diff')} />
        </Section>

        <LimitsCallout title={p('limits_title')} items={list('limits')}
          source={{ label: p('limits_source'), href: DOCS[0].href }} />

        <DocLinks title={p('docs_title')} links={DOCS.map(d => ({ label: p(d.key), href: d.href }))} />
      </div>
    </section>
  )
}
