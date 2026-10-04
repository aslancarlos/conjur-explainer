/**
 * N-column comparison table (first column is the row header), same look as
 * RoleTable in AuthnPieces. Used by the Kubernetes pages for deployment-option
 * and mode matrices.
 */
export default function MatrixTable({ caption, cols, rows }: { caption: string; cols: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idira-blue" tabIndex={0} role="region" aria-label={caption}>
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-bg-muted text-xs font-semibold uppercase tracking-wider text-text-muted">
          <tr>{cols.map(c => <th key={c} scope="col" className="px-5 py-3">{c}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map(([head, ...cells]) => (
            <tr key={head} className="align-top">
              <th scope="row" className="px-5 py-4 font-semibold text-text whitespace-nowrap">{head}</th>
              {cells.map((c, i) => <td key={i} className="px-5 py-4 leading-relaxed text-text-2">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
