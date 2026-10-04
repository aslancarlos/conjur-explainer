import { forwardRef, type FocusEvent, type MouseEvent } from 'react'
import { Link as RouterLink, type LinkProps } from 'react-router-dom'
import { preloadRoute } from './routeLoaders'

/**
 * Router link with the native View Transition on by default (DESIGN.md §motion):
 * every in-app navigation cross-fades the page area while the shell stays put.
 * Browsers without the API simply navigate. Pass viewTransition={false} to opt out.
 * Hover or focus preloads the target page chunk and the full locale, so the
 * click usually commits without waiting on the network.
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { viewTransition = true, onMouseEnter, onFocus, ...props },
  ref,
) {
  const preload = () => {
    const to = props.to
    const href = typeof to === 'string' ? to : to.pathname
    if (href) preloadRoute(href)
  }
  return (
    <RouterLink
      ref={ref}
      viewTransition={viewTransition}
      onMouseEnter={(e: MouseEvent<HTMLAnchorElement>) => { preload(); onMouseEnter?.(e) }}
      onFocus={(e: FocusEvent<HTMLAnchorElement>) => { preload(); onFocus?.(e) }}
      {...props}
    />
  )
})
