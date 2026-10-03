import type { LucideIcon } from 'lucide-react'

/**
 * Menu icon: a self-hosted colour SVG (SVG Logos / Flat Color Icons / Fluent color, see THIRD_PARTY_NOTICES.md)
 * on a small white rounded tile so dark logos stay legible in dark mode, or the
 * lucide fallback when the entry has no logo. Always decorative.
 */
export default function NavGlyph({ logo, Icon, size = 20, iconSize = 18, className = '', accent }: {
  logo?: string
  Icon?: LucideIcon
  size?: number          // tile size (px)
  iconSize?: number      // lucide fallback size (px)
  className?: string     // colour class for the lucide fallback
  accent?: string        // optional ring classes replacing the hairline (e.g. 'ring-[1.5px] ring-domain-idira/70')
}) {
  if (logo) {
    const img = Math.round(size * 0.8)
    return (
      <span aria-hidden="true" style={{ width: size, height: size }}
        className={`inline-flex shrink-0 items-center justify-center rounded-md bg-white/95 ${accent ?? 'ring-1 ring-black/10'}`}>
        <img src={logo} alt="" width={img} height={img} loading="lazy" decoding="async" style={{ width: img, height: img }} className="object-contain" />
      </span>
    )
  }
  return Icon ? <Icon size={iconSize} strokeWidth={1.9} aria-hidden="true" className={`shrink-0 ${className}`} /> : null
}
