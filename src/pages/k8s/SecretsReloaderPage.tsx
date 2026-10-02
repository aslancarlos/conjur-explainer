import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarClock, Timer } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import ModeSwitch from '../../components/k8s/ModeSwitch'
import MatrixTable from '../../components/k8s/MatrixTable'
import ReloaderFlow, { type ReloadMode } from '../../components/flow/specs/k8s/ReloaderFlow'
import { DocLinks, LimitsCallout, RoleTable, Section, SupportChips } from '../../components/authn/AuthnPieces'

// Official sources (Secrets Manager SaaS and Self-Hosted docs) for every fact on this page.
const SAAS = 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/integrations/k8s-ocp'
const SH = 'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/integrations/k8s-ocp'
const DOCS = [
  { key: 'doc_reloader', href: `${SAAS}/k8s-configure-reloader.htm` },
  { key: 'doc_standalone', href: `${SAAS}/cjr-k8s-jwt-sp-standalone.htm` },
  { key: 'doc_job', href: `${SAAS}/cjr-k8s-jwt-sp-ac.htm` },
  { key: 'doc_sh_reloader', href: `${SH}/k8s-configure-reloader.htm` },
  { key: 'doc_upstream', href: 'https://github.com/stakater/Reloader' },
] as const

/** Reloader: rolling restart of workloads when a Kubernetes Secret changes. */
export default function SecretsReloaderPage() {
  const { t } = useTranslation()
  const [mode, setMode] = useState<ReloadMode>('standalone')
  const p = (k: string) => t(`k8s_reloader.${k}`)
  const list = (k: string) => t(`k8s_reloader.${k}`, { returnObjects: true }) as string[]
  const pairs = (k: string) => t(`k8s_reloader.${k}`, { returnObjects: true }) as Array<[string, string]>
  const rows = (k: string) => t(`k8s_reloader.${k}`, { returnObjects: true }) as string[][]

  return (
    <section className="min-h-screen bg-bg-base px-6 py-16">
      <div className="mx-auto max-w-5xl space-y-10">
        <PageHeader badge={p('badge')} title={p('title')} subtitle={p('subtitle')}>
          <SupportChips saas selfHosted />
        </PageHeader>

        <Section title={p('flow_title')} lead={p('flow_lead')}>
          <div className="space-y-4">
            <ModeSwitch label={p('mode_label')} value={mode} onChange={setMode} options={[
              { v: 'standalone', label: p('mode_standalone'), Icon: Timer },
              { v: 'job', label: p('mode_job'), Icon: CalendarClock },
            ]} />
            <p className="max-w-[70ch] text-sm leading-relaxed text-text-2">{p(`mode_note_${mode}`)}</p>
            <ReloaderFlow mode={mode} />
          </div>
        </Section>

        <Section title={p('roles_title')} lead={p('roles_lead')}>
          <RoleTable caption={p('roles_title')} colA={p('col_component')} colB={p('col_role')} rows={pairs('roles')} />
        </Section>

        <Section title={p('ann_title')} lead={p('ann_lead')}>
          <RoleTable caption={p('ann_title')} colA={p('col_annotation')} colB={p('col_behavior')} rows={pairs('ann')} />
        </Section>

        <Section title={p('cfg_title')} lead={p('cfg_lead')}>
          <RoleTable caption={p('cfg_title')} colA={p('col_value')} colB={p('col_detail')} rows={pairs('cfg')} />
        </Section>

        <Section title={p('modes_title')}>
          <MatrixTable caption={p('modes_title')} cols={list('modes_cols')} rows={rows('modes')} />
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
