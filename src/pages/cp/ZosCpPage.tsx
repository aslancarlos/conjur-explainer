import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import ZosCpFlow from '../../components/flow/specs/cp/ZosCpFlow'
import { PlatformChips, PlatformSwitch, usePlatform } from '../../components/cp/CpPieces'
import { DocLinks, LimitsCallout, RoleTable, Section } from '../../components/authn/AuthnPieces'

const BASE = 'https://docs.cyberark.com/credential-providers/latest/en/content/cp%20for%20zos/'
const DOCS = [
  { key: 'doc_solution', href: `${BASE}the-cyberark-aam-cp-solution-for-z-os.htm` },
  { key: 'doc_sysreq', href: `${BASE}system-requirements.htm` },
  { key: 'doc_sdk', href: `${BASE}zosapplicationpasswordsdk.htm` },
  { key: 'doc_java', href: `${BASE}working-with-the-java-application.htm` },
  { key: 'doc_conf', href: `${BASE}local-zos-credential-provider-configuration-file.htm` },
  { key: 'doc_tls', href: `${BASE}securing-communication-between-the-zos-provider-and-the-central-credential-provider.htm` },
  { key: 'doc_sync', href: `${BASE}synchronizing-automatic-password-changes-with-the-zos-credential-provider.htm` },
  { key: 'doc_manage', href: `${BASE}managing-the-zos-credential-provider.htm` },
  { key: 'doc_authn', href: 'https://docs.cyberark.com/credential-providers/latest/en/content/cp%20and%20ascp/application-authentication-methods-general.htm' },
  { key: 'doc_capacity', href: 'https://docs.cyberark.com/credential-providers/latest/en/content/cp%20and%20ascp/cps_capacity-best-practices.htm' },
] as const

/** Credential Providers: the Credential Provider for z/OS (mainframe LPAR, through the Central Credential Provider). */
export default function ZosCpPage() {
  const { t } = useTranslation()
  const [platform, setPlatform] = usePlatform()
  const p = (k: string) => t(`cp_zos.${k}`)
  const list = (k: string) => t(`cp_zos.${k}`, { returnObjects: true }) as string[]
  const pairs = (k: string) => t(`cp_zos.${k}`, { returnObjects: true }) as Array<[string, string]>
  const caps = t('cp_zos.caps', { returnObjects: true }) as Array<{ title: string; desc: string }>

  return (
    <section className="min-h-screen bg-bg-base px-6 py-16">
      <div className="mx-auto max-w-5xl space-y-10">
        <PageHeader badge={p('badge')} title={p('title')} subtitle={p('subtitle')}>
          <PlatformChips selfHosted saas />
        </PageHeader>

        <Section title={p('caps_title')} lead={p('caps_lead')}>
          <div className="grid gap-4 md:grid-cols-3">
            {caps.map(c => (
              <div key={c.title} className="card">
                <h3 className="text-base font-semibold text-text">{c.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-text-2">{c.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title={p('flow_title')} lead={p('flow_lead')}>
          <PlatformSwitch value={platform} onChange={setPlatform} />
          <ZosCpFlow platform={platform} />
        </Section>

        <Section title={p('roles_title')} lead={p('roles_lead')}>
          <RoleTable caption={p('roles_title')} colA={p('col_component')} colB={p('col_role')} rows={pairs('roles')} />
        </Section>

        <Section title={p('jcl_title')} lead={p('jcl_lead')}>
          <pre translate="no" className="code-block overflow-x-auto text-xs leading-relaxed" role="region" tabIndex={0} aria-label={p('jcl_title')}><code>{`//GETPASS  EXEC JVMPRC70,
// JAVACLS='-jar /APP_HOME_PATH/sdk/clipasswordsdk/clipasswordsdk.jar'
//STDENV   DD   DSN=USS.ENV.PARM(CLIPASS),DISP=SHR
//SYSIN    DD   *
request.setAppID=<app-id>
request.setQuery("PolicyID=<policy-id>;Username=<username>;Address=<address>")
password.getContent=
/*
//CREDOUT  DD   DSN=PASSWORD.FILE,DISP=(NEW,PASS,DELETE)`}</code></pre>
        </Section>

        <Section title={p('when_title')}>
          <ul className="grid gap-3 sm:grid-cols-2">
            {list('when').map(w => (
              <li key={w} className="flex gap-2.5 rounded-xl border border-border bg-bg-card px-4 py-3 text-sm leading-relaxed text-text-2">
                <Check size={16} className="mt-0.5 shrink-0 text-tone-accent" aria-hidden="true" /><span>{w}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title={p('diff_title')} lead={p('diff_lead')}>
          <RoleTable caption={p('diff_title')} colA={p('col_topic')} colB={p('col_detail')} rows={pairs('diff')} />
        </Section>

        <LimitsCallout title={p('limits_title')} items={list('limits')}
          source={{ label: p('limits_source'), href: DOCS[1].href }} />

        <Section title={p('config_title')} lead={p('config_lead')}>
          <RoleTable caption={p('config_title')} colA={p('col_param')} colB={p('col_reco')} rows={pairs('config')} />
        </Section>

        <DocLinks title={p('docs_title')} links={DOCS.map(d => ({ label: p(d.key), href: d.href }))} />
      </div>
    </section>
  )
}
