import { useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight, Check, Compass, Minus, Container, Workflow, Server, Cpu, Bot, Cloud,
  FileBadge, KeyRound, Database, Leaf, Hexagon, ShoppingCart, ShipWheel, Columns3, RefreshCcw, EyeOff,
  Github, Boxes, Blocks, GitBranch, Infinity as InfinityIcon, GitPullRequest, CircleDot, Rocket,
  Code, CloudUpload, Cog, Terminal, Timer, FileKey2, HardDrive, Globe, RefreshCw, Vault, TriangleAlert, MoveHorizontal,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { Section } from '../components/authn/AuthnPieces'
import { NAV } from '../lib/nav'

/**
 * /compare: products side by side, then the use cases and technologies of one
 * product at a time. Product colours match the sidebar (lib/nav.ts group.color).
 * State lives in the URL (?product=sm|swa|cp|shub&cat=...) so views deep-link.
 */
type ProductKey = 'sm' | 'swa' | 'cp' | 'shub'

interface Col { id: string; to: string; Icon: LucideIcon; avail: [boolean, boolean] }
interface Cat { key: string; cols: Col[] }
interface Product { key: ProductKey; navKey: string; to: string; color: string; availLabels: [string, string]; cats: Cat[] }

const SM_AV: [string, string] = ['SaaS', 'Self-Hosted']
const PAM_AV: [string, string] = ['PAM Self-Hosted', 'Privilege Cloud']

const PRODUCTS: Product[] = [
  {
    key: 'sm', navKey: 'secretsmanager', to: '/concepts/saas-architecture', color: 'text-domain-idira', availLabels: SM_AV,
    cats: [
      { key: 'k8s', cols: [
        { id: 'sdk', to: '/spring-boot', Icon: Leaf, avail: [true, true] },
        { id: 'sidecar', to: '/dotnet', Icon: Hexagon, avail: [true, true] },
        { id: 'eso', to: '/eso-shop', Icon: ShoppingCart, avail: [true, true] },
        { id: 'csi', to: '/csi', Icon: ShipWheel, avail: [true, true] },
        { id: 'spmodes', to: '/k8s/secrets-provider-modes', Icon: Columns3, avail: [true, true] },
        { id: 'reloader', to: '/k8s/reloader', Icon: RefreshCcw, avail: [true, true] },
        { id: 'secretless', to: '/k8s/secretless', Icon: EyeOff, avail: [false, true] },
      ] },
      { key: 'cicd', cols: [
        { id: 'gha', to: '/github-actions', Icon: Github, avail: [true, true] },
        { id: 'jenkins', to: '/jenkins', Icon: Server, avail: [true, true] },
        { id: 'ansible', to: '/ansible', Icon: Boxes, avail: [true, true] },
        { id: 'terraform', to: '/cicd/terraform', Icon: Blocks, avail: [true, true] },
        { id: 'gitlab', to: '/cicd/gitlab', Icon: GitBranch, avail: [true, true] },
        { id: 'azdo', to: '/cicd/azure-devops', Icon: InfinityIcon, avail: [true, true] },
        { id: 'bitbucket', to: '/cicd/bitbucket', Icon: GitPullRequest, avail: [true, true] },
        { id: 'circleci', to: '/cicd/circleci', Icon: CircleDot, avail: [true, true] },
        { id: 'octopus', to: '/cicd/octopus', Icon: Rocket, avail: [true, true] },
      ] },
      { key: 'platforms', cols: [
        { id: 'python', to: '/platforms/python-aws', Icon: Code, avail: [true, true] },
        { id: 'cf', to: '/platforms/cloud-foundry', Icon: CloudUpload, avail: [false, true] },
        { id: 'puppet', to: '/platforms/puppet', Icon: Cog, avail: [false, true] },
        { id: 'mulesoft', to: '/platforms/mulesoft', Icon: Workflow, avail: [true, true] },
      ] },
      { key: 'tools', cols: [
        { id: 'summon', to: '/sm/summon', Icon: Terminal, avail: [true, true] },
        { id: 'mcp', to: '/ai/mcp-server', Icon: Bot, avail: [true, false] },
        { id: 'dynamic', to: '/sm/dynamic-secrets', Icon: Timer, avail: [true, true] },
        { id: 'certs', to: '/sm/certificates', Icon: FileKey2, avail: [true, false] },
      ] },
    ],
  },
  {
    key: 'swa', navKey: 'swa', to: '/concepts/swa-architecture', color: 'text-tone-live', availLabels: SM_AV,
    cats: [{ key: 'swa', cols: [
      { id: 'mtls', to: '/svid', Icon: FileBadge, avail: [true, false] },
      { id: 'jwtsm', to: '/concepts/swa-architecture', Icon: KeyRound, avail: [true, false] },
      { id: 'aws', to: '/swa-s3', Icon: Database, avail: [true, false] },
      { id: 'ai', to: '/ai/swa-agents', Icon: Bot, avail: [true, false] },
    ] }],
  },
  {
    key: 'cp', navKey: 'cp', to: '/cp', color: 'text-domain-cp', availLabels: PAM_AV,
    cats: [{ key: 'cp', cols: [
      { id: 'cp', to: '/cp/credential-provider', Icon: HardDrive, avail: [true, true] },
      { id: 'ascp', to: '/cp/ascp', Icon: Database, avail: [true, true] },
      { id: 'ccp', to: '/cp/ccp', Icon: Globe, avail: [true, true] },
      { id: 'zos', to: '/cp/zos', Icon: Cpu, avail: [true, true] },
      { id: 'dual', to: '/dualaccounts', Icon: RefreshCw, avail: [true, true] },
    ] }],
  },
  {
    key: 'shub', navKey: 'secretshub', to: '/secretshub', color: 'text-domain-svc', availLabels: PAM_AV,
    cats: [
      { key: 'sources', cols: [
        { id: 'src_pc', to: '/secretshub', Icon: Cloud, avail: [false, true] },
        { id: 'src_pamsh', to: '/secretshub?env=pamsh', Icon: Server, avail: [true, false] },
      ] },
      { key: 'targets', cols: [
        { id: 't_aws', to: '/secretshub', Icon: Cloud, avail: [true, true] },
        { id: 't_azure', to: '/secretshub', Icon: Cloud, avail: [true, true] },
        { id: 't_gcp', to: '/secretshub', Icon: Cloud, avail: [true, true] },
        { id: 't_hcv', to: '/secretshub', Icon: Vault, avail: [true, true] },
      ] },
    ],
  },
]

const GLANCE_ROWS = ['problem', 'consumer', 'identity', 'where', 'editions', 'usecases', 'choose'] as const
const ROWS = ['identity', 'delivery', 'code', 'rotation', 'avail', 'limit', 'best'] as const

const GROUP = (navKey: string) => NAV.find(g => g.key === navKey)
const NAV_ITEM = (to: string) => NAV.flatMap(g => g.items).find(i => i.to === to)

/** Segmented radiogroup with roving focus (arrow keys move focus and selection). */
function Segmented<T extends string>({ label, value, onChange, options, size = 'md' }: {
  label: string; value: T; onChange: (v: T) => void
  options: Array<{ v: T; label: string; Icon?: LucideIcon; color?: string }>; size?: 'md' | 'sm'
}) {
  const ref = useRef<HTMLDivElement>(null)
  const onKey = (e: React.KeyboardEvent) => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return
    e.preventDefault()
    const i = options.findIndex(o => o.v === value)
    const n = e.key === 'Home' ? 0 : e.key === 'End' ? options.length - 1
      : (i + (e.key === 'ArrowRight' ? 1 : options.length - 1)) % options.length
    onChange(options[n].v)
    requestAnimationFrame(() => ref.current?.querySelectorAll<HTMLButtonElement>('[role=radio]')[n]?.focus())
  }
  return (
    <div ref={ref} role="radiogroup" aria-label={label} onKeyDown={onKey}
      className={`inline-flex flex-wrap gap-1 rounded-xl border border-border bg-bg-card p-1 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
      {options.map(o => {
        const on = value === o.v
        return (
          <button key={o.v} type="button" role="radio" aria-checked={on} tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.v)}
            className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-4 font-medium transition-colors duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue
              ${on ? 'bg-bg-muted text-text shadow-sm' : 'text-text-2 hover:text-text'}`}>
            {o.Icon && <o.Icon size={16} aria-hidden="true" className={on ? (o.color ?? 'text-domain-idira') : 'text-text-muted'} />}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function AvailChip({ ok, label }: { ok: boolean; label: string }) {
  const { t } = useTranslation()
  return (
    <span className={`inline-flex min-h-7 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 text-xs font-medium
      ${ok ? 'border-tone-success/40 bg-tone-success/10 text-tone-success' : 'border-border bg-bg-muted text-text-muted'}`}>
      {ok ? <Check size={13} aria-hidden="true" /> : <Minus size={13} aria-hidden="true" />}
      {label}
      <span className="sr-only">: {ok ? t('authnhub.available') : t('authnhub.not_available')}</span>
    </span>
  )
}

/** Sticky-first-column matrix. Scrolls horizontally inside its own frame only. */
function Matrix({ caption, corner, head, rows }: {
  caption: string; corner: string
  head: Array<{ key: string; node: React.ReactNode }>
  rows: Array<{ key: string; label: string; cells: React.ReactNode[] }>
}) {
  return (
    <div className="relative overflow-x-auto rounded-2xl border border-border bg-bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue" tabIndex={0} role="region" aria-label={caption}>
      <table className="w-full border-separate border-spacing-0 text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col" className="sticky left-0 z-20 min-w-[168px] w-[168px] border-b border-r border-border bg-bg-muted px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
              {corner}
            </th>
            {head.map(h => (
              <th key={h.key} scope="col" className="min-w-[196px] border-b border-border bg-bg-muted px-4 py-3 align-top">{h.node}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={r.key} className="align-top">
              <th scope="row" className={`sticky left-0 z-10 border-r border-border bg-bg-card px-4 py-3 text-xs font-semibold text-text ${ri < rows.length - 1 ? 'border-b' : ''}`}>
                {r.label}
              </th>
              {r.cells.map((c, ci) => (
                <td key={ci} className={`px-4 py-3 text-[13px] leading-relaxed text-text-2 ${ri < rows.length - 1 ? 'border-b border-border' : ''}`}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ComparePage() {
  const { t } = useTranslation()
  const p = (k: string) => t(`cmp.${k}`)
  const [params, setParams] = useSearchParams()

  const product = PRODUCTS.find(x => x.key === params.get('product')) ?? PRODUCTS[0]
  const cat = product.cats.find(c => c.key === params.get('cat')) ?? product.cats[0]
  const setView = (prod: ProductKey, catKey?: string) => {
    const next = new URLSearchParams(params)
    next.set('product', prod)
    if (catKey) next.set('cat', catKey); else next.delete('cat')
    setParams(next, { replace: true, preventScrollReset: true })
  }

  const productName = (pr: Product) => t(GROUP(pr.navKey)?.labelKey ?? '')
  const ProductIcon = (pr: Product) => GROUP(pr.navKey)?.Icon ?? Container

  return (
    <section className="min-h-screen bg-bg-base px-6 py-16">
      <div className="mx-auto max-w-6xl space-y-14">
        <PageHeader badge={p('badge')} title={p('title')} subtitle={p('subtitle')} />

        {/* 1. Products at a glance */}
        <Section title={p('glance_title')} lead={p('glance_lead')}>
          <Matrix
            caption={p('glance_title')}
            corner={p('corner_product')}
            head={PRODUCTS.map(pr => {
              const Icon = ProductIcon(pr)
              return {
                key: pr.key,
                node: (
                  <Link to={pr.to} className="group inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-semibold text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue">
                    <Icon size={18} aria-hidden="true" className={`shrink-0 ${pr.color}`} />
                    <span className="group-hover:underline underline-offset-4">{productName(pr)}</span>
                  </Link>
                ),
              }
            })}
            rows={GLANCE_ROWS.map(r => ({
              key: r, label: p(`glance_rows.${r}`),
              cells: PRODUCTS.map(pr => p(`glance.${pr.key}.${r}`)),
            }))}
          />
        </Section>

        {/* 2. Use cases and technologies of one product */}
        <Section title={p('detail_title')} lead={p('detail_lead')}>
          <div className="space-y-4">
            <Segmented label={p('product_label')} value={product.key}
              onChange={v => setView(v)}
              options={PRODUCTS.map(pr => ({ v: pr.key, label: productName(pr), Icon: ProductIcon(pr), color: pr.color }))} />

            {product.cats.length > 1 && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">{p('cat_label')}</span>
                <Segmented size="sm" label={p('cat_label')} value={cat.key}
                  onChange={v => setView(product.key, v)}
                  options={product.cats.map(c => ({ v: c.key, label: `${p(`cats.${c.key}`)} (${c.cols.length})` }))} />
              </div>
            )}

            <p className="max-w-[80ch] text-sm leading-relaxed text-text-2">{p(`cat_lead.${cat.key}`)}</p>
            {cat.cols.length > 4 && (
              <p className="inline-flex items-center gap-1.5 text-xs text-text-muted">
                <MoveHorizontal size={14} aria-hidden="true" />{t('cmp.scroll_hint', { count: cat.cols.length })}
              </p>
            )}

            {product.key === 'shub' && (
              <div role="note" className="flex gap-3 rounded-2xl border border-tone-warning/40 bg-tone-warning/10 p-4">
                <TriangleAlert size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-tone-warning" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-text">{p('shub_limits_title')}</p>
                  <ul className="list-disc space-y-0.5 pl-5 text-sm text-text-2">
                    {(t('cmp.shub_limits', { returnObjects: true }) as string[]).map(s => <li key={s}>{s}</li>)}
                  </ul>
                </div>
              </div>
            )}

            <Matrix
              caption={`${productName(product)}: ${p(`cats.${cat.key}`)}`}
              corner={p('corner_dimension')}
              head={cat.cols.map(c => {
                const nav = NAV_ITEM(c.to)
                const Icon = nav && c.to !== '/secretshub' && c.to !== '/concepts/swa-architecture' ? nav.Icon : c.Icon
                const cls = 'group inline-flex min-h-11 items-start gap-2 rounded-md py-1 text-sm font-semibold text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue'
                const inner = (
                  <>
                    <Icon size={16} aria-hidden="true" className={`mt-0.5 shrink-0 ${product.color}`} />
                    <span className="group-hover:underline underline-offset-4">{p(`col.${c.id}.name`)}</span>
                    <ArrowRight size={14} aria-hidden="true" className="mt-1 shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                  </>
                )
                // Sibling services outside the SPA (nav `href`) need a full page load.
                return { key: c.id, node: nav?.href ? <a href={nav.href} className={cls}>{inner}</a> : <Link to={c.to} className={cls}>{inner}</Link> }
              })}
              rows={ROWS.map(r => ({
                key: r,
                label: r === 'avail' ? p(`avail_row.${product.key}`) : p(`rows.${r}`),
                cells: cat.cols.map(c => r === 'avail'
                  ? <div className="flex flex-wrap gap-1.5">
                      <AvailChip ok={c.avail[0]} label={product.availLabels[0]} />
                      <AvailChip ok={c.avail[1]} label={product.availLabels[1]} />
                    </div>
                  : p(`col.${c.id}.${r}`)),
              }))}
            />
            <p className="text-xs text-text-muted">{p('source_note')}</p>
          </div>
        </Section>

        {/* 3. Solution finder lives on its own page */}
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <Compass size={22} aria-hidden="true" className="mt-0.5 shrink-0 text-domain-idira" />
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-text">{p('finder_cta_title')}</h2>
              <p className="text-sm leading-relaxed text-text-2">{p('finder_cta_desc')}</p>
            </div>
          </div>
          <Link to="/finder"
            className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-full bg-idira-blue px-5 text-sm font-semibold text-white transition-colors hover:bg-idira-blue-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base sm:self-center">
            {p('finder_cta_button')}<ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
