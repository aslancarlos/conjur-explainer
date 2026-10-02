import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, CircleCheck, CircleDashed, ExternalLink, Cloud } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Confidence, Direction, Resolved } from '../../lib/finder/netCatalog'
import { nodeById } from '../../lib/finder/netCatalog'

/**
 * Network flows grouped by direction (sticky header, confidence badge with
 * icon + text) and the consolidated firewall rules. Strings come in through
 * `labels` so the parent decides the language.
 */
export interface NetworkTableLabels {
  flowsTitle: string
  rulesTitle: string
  source: string
  destination: string
  endpoint: string
  port: string
  protocol: string
  purpose: string
  doc: string
  from: string                // "From"
  documented: string
  inferred: string
  directions: Record<Direction, string>
  empty: string
}

export const DEFAULT_TABLE_LABELS: NetworkTableLabels = {
  flowsTitle: 'Network flows',
  rulesTitle: 'Consolidated firewall rules',
  source: 'Source',
  destination: 'Destination',
  endpoint: 'Endpoint',
  port: 'Port',
  protocol: 'Protocol',
  purpose: 'Purpose',
  doc: 'Doc',
  from: 'From',
  documented: 'Documented',
  inferred: 'Inferred',
  directions: { outbound: 'Outbound from your network', inbound: 'Inbound to your network', internal: 'Inside your network', external: 'Between providers (no rule on your side)' },
  empty: 'Select items to see the network flows.',
}

const DIR_ICON: Record<Direction, { Icon: LucideIcon; cls: string }> = {
  outbound: { Icon: ArrowUpRight, cls: 'text-domain-idira' },
  inbound: { Icon: ArrowDownLeft, cls: 'text-tone-danger' },
  internal: { Icon: ArrowLeftRight, cls: 'text-text-2' },
  external: { Icon: Cloud, cls: 'text-text-muted' },
}

function ConfidenceBadge({ c, labels, note }: { c: Confidence; labels: NetworkTableLabels; note?: string }) {
  const ok = c === 'documented'
  return (
    <span title={note} className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium
      ${ok ? 'border-tone-success/40 bg-tone-success/10 text-tone-success' : 'border-tone-warning/40 bg-tone-warning/10 text-tone-warning'}`}>
      {ok ? <CircleCheck size={12} aria-hidden="true" /> : <CircleDashed size={12} aria-hidden="true" />}
      {ok ? labels.documented : labels.inferred}
    </span>
  )
}

export default function NetworkTable({ resolved, labels = DEFAULT_TABLE_LABELS }: { resolved: Resolved; labels?: NetworkTableLabels }) {
  if (!resolved.flows.length) return <p className="text-sm text-text-2">{labels.empty}</p>
  const order: Direction[] = ['outbound', 'inbound', 'internal', 'external']
  const groups = order.map(d => ({ d, flows: resolved.flows.filter(f => f.direction === d) })).filter(g => g.flows.length)

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h3 className="text-base font-semibold text-text">{labels.flowsTitle}</h3>
        <div className="max-h-[560px] overflow-auto rounded-xl border border-border">
          <table className="w-full min-w-[960px] text-left text-xs">
            <thead className="sticky top-0 z-10 bg-bg-card">
              <tr className="border-b border-border text-text-muted">
                {[labels.source, labels.destination, labels.endpoint, labels.port, labels.protocol, labels.purpose, ''].map((h, i) => (
                  <th key={i} scope="col" className="px-3 py-2.5 font-semibold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            {groups.map(g => {
              const { Icon, cls } = DIR_ICON[g.d]
              return (
                <tbody key={g.d}>
                  <tr className="bg-bg-muted/60">
                    <th colSpan={7} scope="rowgroup" className="px-3 py-2 text-left text-xs font-semibold text-text">
                      <span className="inline-flex items-center gap-1.5"><Icon size={14} aria-hidden="true" className={cls} />{labels.directions[g.d]} ({g.flows.length})</span>
                    </th>
                  </tr>
                  {g.flows.map(f => (
                    <tr key={f.id} className="border-t border-border/60 align-top">
                      <td className="px-3 py-2.5 font-medium text-text">{nodeById(f.from).label}</td>
                      <td className="px-3 py-2.5 text-text">{nodeById(f.to).label}</td>
                      <td className="px-3 py-2.5 font-mono text-text-2 break-all">{f.endpoint}</td>
                      <td className="px-3 py-2.5 font-mono font-semibold text-text whitespace-nowrap">{f.port}</td>
                      <td className="px-3 py-2.5 text-text-2">{f.protocol}</td>
                      <td className="px-3 py-2.5 leading-relaxed text-text-2">{f.purpose}{f.note && <span className="mt-1 block text-[11px] text-text-muted">{f.note}</span>}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col items-start gap-1.5">
                          <ConfidenceBadge c={f.confidence} labels={labels} note={f.note} />
                          <a href={f.source.url} target="_blank" rel="noreferrer"
                            className="inline-flex min-h-6 items-center gap-1 text-[11px] font-medium text-text-2 underline underline-offset-2 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue rounded">
                            {labels.doc}<ExternalLink size={11} aria-hidden="true" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              )
            })}
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-semibold text-text">{labels.rulesTitle}</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {resolved.firewallRules.map(g => {
            const { Icon, cls } = DIR_ICON[g.direction]
            return (
              <div key={`${g.direction}-${g.sourceZone}`} className="rounded-xl border border-border bg-bg-card p-4">
                <p className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-text">
                  <Icon size={15} aria-hidden="true" className={cls} />{labels.directions[g.direction]}
                </p>
                <p className="mb-2 text-xs text-text-muted">{labels.from}: {g.sourceLabel}</p>
                <ul className="space-y-1.5">
                  {g.rules.map((r, i) => (
                    <li key={i} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs text-text-2">
                      <span className="font-mono font-semibold text-text">{r.protocol.replace(/\s*\(.*\)$/, '')} {r.port}</span>
                      <span className="font-mono break-all">{r.endpoint}</span>
                      {r.confidence === 'inferred' && <ConfidenceBadge c="inferred" labels={labels} />}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
