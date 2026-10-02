import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, CircleCheck, CircleDashed, ExternalLink, Cloud } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Confidence, Direction, Resolved } from '../../lib/finder/netCatalog'
import { nodeById } from '../../lib/finder/netCatalog'
import { numberedFlows } from '../../lib/finder/exports'

/**
 * Network flows in diagram-number order (the No. column matches the badges on
 * the architecture drawing), with direction and confidence shown as icon +
 * text, plus the consolidated firewall rules. Strings come in through
 * `labels` so the parent decides the language.
 */
export interface NetworkTableLabels {
  flowsTitle: string
  rulesTitle: string
  number: string
  direction: string
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
  shortDirections?: Record<Direction, string>   // compact labels for table rows
  empty: string
  zones?: Record<string, string>
}

export const DEFAULT_TABLE_LABELS: NetworkTableLabels = {
  flowsTitle: 'Network flows',
  rulesTitle: 'Consolidated firewall rules',
  number: 'No.',
  direction: 'Direction',
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

const DIR_ICON: Record<Direction, { Icon: LucideIcon; cls: string; badge: string }> = {
  outbound: { Icon: ArrowUpRight, cls: 'text-domain-idira', badge: 'bg-domain-idira' },
  inbound: { Icon: ArrowDownLeft, cls: 'text-tone-danger', badge: 'bg-tone-danger' },
  internal: { Icon: ArrowLeftRight, cls: 'text-text-2', badge: 'bg-text-2' },
  external: { Icon: Cloud, cls: 'text-text-muted', badge: 'bg-text-muted' },
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

/** The numbered flows table only (also used by the print report). */
export function FlowsTable({ resolved, labels = DEFAULT_TABLE_LABELS, print = false }: { resolved: Resolved; labels?: NetworkTableLabels; print?: boolean }) {
  const flows = numberedFlows(resolved)
  const cell = print ? 'px-2 py-1.5 align-top' : 'px-3 py-2.5 align-top'
  return (
    <table className={`w-full text-left ${print ? 'border-collapse text-[10.5px] text-black' : 'min-w-[980px] text-xs'}`}>
      <thead className={print ? '' : 'bg-bg-card'}>
        <tr className={print ? 'border-b border-black/40' : 'border-b border-border text-text-muted'}>
          {[labels.number, labels.direction, labels.source, labels.destination, labels.endpoint, labels.port, labels.protocol, labels.purpose, ''].map((h, i) => (
            <th key={i} scope="col" className={`${cell} font-semibold ${print ? '' : 'uppercase tracking-wider'}`}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {flows.map(f => {
          const { Icon, cls, badge } = DIR_ICON[f.direction]
          return (
            <tr key={f.id} className={print ? 'break-inside-avoid border-b border-black/15' : 'border-t border-border/60'}>
              <td className={cell}>
                {print
                  ? <span className="font-bold">{f.no}</span>
                  : <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold tabular-nums text-bg-base ${badge}`}>{f.no}</span>}
              </td>
              <td className={cell}>
                <span className={`inline-flex items-center gap-1 ${print ? '' : 'whitespace-nowrap text-text-2'}`}>
                  {!print && <Icon size={13} aria-hidden="true" className={cls} />}{(labels.shortDirections ?? labels.directions)[f.direction]}
                </span>
              </td>
              <td className={`${cell} font-medium ${print ? '' : 'text-text'}`}>{nodeById(f.from).label}</td>
              <td className={`${cell} ${print ? '' : 'text-text'}`}>{nodeById(f.to).label}</td>
              <td className={`${cell} font-mono break-all ${print ? '' : 'min-w-[170px] text-text-2'}`}>{f.endpoint}</td>
              <td className={`${cell} font-mono font-semibold whitespace-nowrap ${print ? '' : 'text-text'}`}>{f.port}</td>
              <td className={`${cell} ${print ? '' : 'text-text-2'}`}>{f.protocol}</td>
              <td className={`${cell} leading-relaxed ${print ? '' : 'min-w-[260px] text-text-2'}`}>
                {f.purpose}
                {f.note && <span className={`mt-1 block text-[11px] ${print ? 'text-black/70' : 'text-text-muted'}`}>{f.note}</span>}
              </td>
              <td className={cell}>
                {print
                  ? <span className="whitespace-nowrap">{f.confidence === 'documented' ? labels.documented : labels.inferred}</span>
                  : (
                    <div className="flex flex-col items-start gap-1.5">
                      <ConfidenceBadge c={f.confidence} labels={labels} note={f.note} />
                      <a href={f.source.url} target="_blank" rel="noreferrer"
                        className="inline-flex min-h-6 items-center gap-1 rounded text-[11px] font-medium text-text-2 underline underline-offset-2 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue">
                        {labels.doc}<ExternalLink size={11} aria-hidden="true" />
                      </a>
                    </div>
                  )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

/** Consolidated firewall rules, one card per direction and source zone. */
export function FirewallRules({ resolved, labels = DEFAULT_TABLE_LABELS, print = false }: { resolved: Resolved; labels?: NetworkTableLabels; print?: boolean }) {
  return (
    <div className={print ? 'space-y-2' : 'grid gap-3 md:grid-cols-2'}>
      {resolved.firewallRules.map(g => {
        const { Icon, cls } = DIR_ICON[g.direction]
        return (
          <div key={`${g.direction}-${g.sourceZone}`} className={print ? 'break-inside-avoid border border-black/25 p-2' : 'rounded-xl border border-border bg-bg-card p-4'}>
            <p className={`mb-1 inline-flex items-center gap-1.5 text-sm font-semibold ${print ? 'text-[11px]' : 'text-text'}`}>
              {!print && <Icon size={15} aria-hidden="true" className={cls} />}{labels.directions[g.direction]}
            </p>
            <p className={`mb-2 text-xs ${print ? 'text-[10.5px] text-black/70' : 'text-text-muted'}`}>{labels.from}: {labels.zones?.[g.sourceZone] ?? g.sourceLabel}</p>
            <ul className="space-y-1.5">
              {g.rules.map((r, i) => (
                <li key={i} className={`flex flex-wrap items-baseline gap-x-2 gap-y-1 ${print ? 'text-[10.5px]' : 'text-xs text-text-2'}`}>
                  {print && <span aria-hidden="true" className="inline-block h-2.5 w-2.5 shrink-0 border border-black" />}
                  <span className={`font-mono font-semibold ${print ? '' : 'text-text'}`}>{r.protocol.replace(/\s*\(.*\)$/, '')} {r.port}</span>
                  <span className="font-mono break-all">{r.endpoint}</span>
                  <span className={print ? 'text-black/70' : 'text-text-muted'}>({r.destination})</span>
                  {r.confidence === 'inferred' && (print ? <span>[{labels.inferred}]</span> : <ConfidenceBadge c="inferred" labels={labels} />)}
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

export default function NetworkTable({ resolved, labels = DEFAULT_TABLE_LABELS }: { resolved: Resolved; labels?: NetworkTableLabels }) {
  if (!resolved.flows.length) return <p className="text-sm text-text-2">{labels.empty}</p>
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-text">{labels.flowsTitle}</h4>
        <div className="max-h-[560px] overflow-auto rounded-xl border border-border [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10">
          <FlowsTable resolved={resolved} labels={labels} />
        </div>
      </section>
      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-text">{labels.rulesTitle}</h4>
        <FirewallRules resolved={resolved} labels={labels} />
      </section>
    </div>
  )
}
