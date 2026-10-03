import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { Section } from '../../components/authn/AuthnPieces'

/** Helpers shared by the AI pages: typed access to the page's i18n namespace. */
export function useNs(ns: string) {
  const { t } = useTranslation()
  const p = (k: string) => t(`${ns}.${k}`)
  const list = <T = string,>(k: string) => t(`${ns}.${k}`, { returnObjects: true }) as T[]
  return { p, list }
}

/** Two side-by-side bullet lists: good practices (check) and SaaS vs Self-Hosted (dot). */
export function WhenDiff({ ns }: { ns: string }) {
  const { p, list } = useNs(ns)
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Section title={p('when_title')}>
        <ul className="space-y-2.5">
          {list('when').map(it => (
            <li key={it} className="flex gap-2.5 text-sm leading-relaxed text-text-2">
              <Check size={16} strokeWidth={2.2} className="mt-0.5 shrink-0 text-domain-idira" aria-hidden="true" />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      </Section>
      <Section title={p('diff_title')}>
        <ul className="space-y-2.5">
          {list('diff').map(it => (
            <li key={it} className="flex gap-2.5 text-sm leading-relaxed text-text-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-domain-idira" aria-hidden="true" />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}

/** Numbered setup steps (ordered list, number badge + text). */
export function StepList({ items }: { items: string[] }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-2">
      {items.map((it, i) => (
        <li key={it} className="flex gap-3 rounded-xl border border-border bg-bg-card p-4">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-domain-idira/15 font-mono text-xs font-bold text-domain-idira" aria-hidden="true">
            {String(i + 1).padStart(2, '0')}
          </span>
          <span className="text-sm leading-relaxed text-text-2">{it}</span>
        </li>
      ))}
    </ol>
  )
}
