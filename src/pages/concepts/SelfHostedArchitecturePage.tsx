import { useTranslation } from 'react-i18next'
import { Check, Crown, Copy, ExternalLink, Server } from 'lucide-react'
import ConceptLayout from '../../components/concepts/ConceptLayout'
import ShArchFlow from '../../components/flow/specs/ShArchFlow'

// Official sources (secrets-manager-sh docs) for every fact on this page.
const DOCS = [
  { key: 'doc_arch',     href: 'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/deployment/cjr-architecture.htm' },
  { key: 'doc_cluster',  href: 'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/deployment/highavailability/cluster-guidelines.htm' },
  { key: 'doc_k8s',      href: 'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/integrations/k8s-ocp/k8s-k8sfollower-ovw.htm' },
  { key: 'doc_vsync',    href: 'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/conjur/cv_overview.htm' },
] as const

const ROLES = [
  { key: 'leader', Icon: Crown },
  { key: 'standby', Icon: Copy },
  { key: 'follower', Icon: Server },
] as const

const COMPONENTS = ['leader', 'sync', 'async', 'dr', 'raft', 'follower', 'k8sfollower', 'clb', 'flb', 'vsync', 'kms', 'siem'] as const

const PORTS: Array<{ port: string; who: 'ls' | 'f' | 'both'; key: string }> = [
  { port: '443',  who: 'both', key: 'port_443' },
  { port: '444',  who: 'both', key: 'port_444' },
  { port: '1999', who: 'ls',   key: 'port_1999' },
  { port: '5432', who: 'ls',   key: 'port_5432' },
  { port: '22',   who: 'both', key: 'port_22' },
]

const th = 'px-4 sm:px-6 py-3'
const td = 'px-4 sm:px-6 py-4 leading-relaxed text-text-2'

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-text">{title}</h2>
      {sub && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-2">{sub}</p>}
      <div className="mt-5">{children}</div>
    </section>
  )
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map(it => (
        <li key={it} className="flex gap-2.5 text-sm leading-relaxed text-text-2">
          <Check size={16} strokeWidth={2.2} className="mt-0.5 shrink-0 text-tone-accent" aria-hidden="true" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  )
}

/** Concepts: how a Secrets Manager Self-Hosted deployment is built. */
export default function SelfHostedArchitecturePage() {
  const { t } = useTranslation()
  const p = (k: string) => t(`sharch.${k}`)
  const list = (k: string) => t(`sharch.${k}`, { returnObjects: true }) as string[]

  return (
    <ConceptLayout title={p('title')} subtitle={p('subtitle')}>
      {/* The three roles, at a glance (same pattern as the SaaS page) */}
      <section className="grid gap-4 md:grid-cols-3">
        {ROLES.map(({ key, Icon }) => (
          <div key={key} className="rounded-2xl border border-border bg-bg-card p-5">
            <Icon size={20} className="text-domain-idira" aria-hidden="true" />
            <h2 className="mt-3 text-base font-semibold text-text">{p(`roles.${key}_title`)}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-text-2">{p(`roles.${key}_desc`)}</p>
          </div>
        ))}
      </section>

      <ShArchFlow />

      <Section title={p('components_title')} sub={p('components_sub')}>
        <div className="overflow-x-auto rounded-2xl border border-border bg-bg-card">
          <table className="w-full min-w-[560px] text-left text-sm">
            <caption className="sr-only">{p('components_title')}</caption>
            <thead className="bg-bg-muted text-xs font-semibold uppercase tracking-wider text-text-muted">
              <tr><th scope="col" className={th}>{p('col_component')}</th><th scope="col" className={th}>{p('col_role')}</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {COMPONENTS.map(c => (
                <tr key={c} className="align-top">
                  <th scope="row" className="px-4 sm:px-6 py-4 font-semibold text-text whitespace-nowrap">{p(`c_${c}`)}</th>
                  <td className={td}>{p(`c_${c}_desc`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title={p('ports_title')} sub={p('ports_sub')}>
        <div className="overflow-x-auto rounded-2xl border border-border bg-bg-card">
          <table className="w-full min-w-[560px] text-left text-sm">
            <caption className="sr-only">{p('ports_title')}</caption>
            <thead className="bg-bg-muted text-xs font-semibold uppercase tracking-wider text-text-muted">
              <tr>
                <th scope="col" className={th}>{p('col_port')}</th>
                <th scope="col" className={th}>{p('col_nodes')}</th>
                <th scope="col" className={th}>{p('col_purpose')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {PORTS.map(r => (
                <tr key={r.port} className="align-top">
                  <th scope="row" className="px-4 sm:px-6 py-4"><code className="rounded bg-bg-muted px-1.5 py-0.5 font-mono text-xs text-text">{r.port}</code></th>
                  <td className={`${td} whitespace-nowrap`}>{p(`who_${r.who}`)}</td>
                  <td className={td}>{p(r.key)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title={p('lb_title')} sub={p('lb_sub')}>
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-border bg-bg-card p-6">
            <h3 className="text-base font-semibold text-text">{p('lb_cluster_title')}</h3>
            <p className="mt-2 mb-4 text-sm leading-relaxed text-text-2">{p('lb_cluster_desc')}</p>
            <Bullets items={list('lb_cluster_items')} />
          </article>
          <article className="rounded-2xl border border-border bg-bg-card p-6">
            <h3 className="text-base font-semibold text-text">{p('lb_follower_title')}</h3>
            <p className="mt-2 mb-4 text-sm leading-relaxed text-text-2">{p('lb_follower_desc')}</p>
            <Bullets items={list('lb_follower_items')} />
          </article>
        </div>
      </Section>

      <Section title={p('bp_title')}>
        <div className="rounded-2xl border border-border bg-bg-card p-6"><Bullets items={list('bp_items')} /></div>
      </Section>

      <Section title={p('docs_title')}>
        <ul className="flex flex-col gap-1">
          {DOCS.map(d => (
            <li key={d.key}>
              <a href={d.href} target="_blank" rel="noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-tone-accent hover:underline underline-offset-4">
                {p(d.key)}<ExternalLink size={13} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </Section>
    </ConceptLayout>
  )
}
