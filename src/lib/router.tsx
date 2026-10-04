import { forwardRef } from 'react'
import { Link as RouterLink, type LinkProps } from 'react-router-dom'

/**
 * Router link with the native View Transition on by default (DESIGN.md §motion):
 * every in-app navigation cross-fades the page area while the shell stays put.
 * Browsers without the API simply navigate. Pass viewTransition={false} to opt out.
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link({ viewTransition = true, ...props }, ref) {
  return <RouterLink ref={ref} viewTransition={viewTransition} {...props} />
})
