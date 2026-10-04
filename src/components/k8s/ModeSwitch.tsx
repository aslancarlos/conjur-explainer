import type { LucideIcon } from 'lucide-react'
import Segmented from '../Segmented'

/**
 * Two-option segmented control (radiogroup, 44px targets) used by the
 * Kubernetes pages to swap the diagram between two modes, e.g. Kubernetes
 * Secrets vs Push-to-File. Thin wrapper over the shared Segmented (roving
 * focus, arrow keys move focus and selection) with the Kubernetes accent.
 */
export default function ModeSwitch<T extends string>({ label, value, onChange, options }: {
  label: string
  value: T
  onChange: (v: T) => void
  options: Array<{ v: T; label: string; Icon: LucideIcon }>
}) {
  return (
    <Segmented label={label} value={value} onChange={onChange}
      options={options.map(o => ({ ...o, color: 'text-domain-k8s' }))} />
  )
}
