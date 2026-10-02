import type { ReactNode } from 'react'

/**
 * Standard header for demo / feature pages (DESIGN.md): left aligned, one
 * eyebrow badge, the page h1 and a 16px lead paragraph at reading width.
 * Concepts pages use ConceptLayout's hero band instead.
 */
export default function PageHeader({ badge, title, subtitle, children, className = '' }: {
  badge?: ReactNode; title: ReactNode; subtitle?: ReactNode; children?: ReactNode; className?: string
}) {
  return (
    <header className={`w-full space-y-3 ${className}`}>
      {badge && <span className="badge">{badge}</span>}
      <h1 className="text-3xl sm:text-4xl font-bold tracking-[-0.02em] text-text">{title}</h1>
      {subtitle && <p className="max-w-[70ch] text-base leading-relaxed text-text-2">{subtitle}</p>}
      {children}
    </header>
  )
}
