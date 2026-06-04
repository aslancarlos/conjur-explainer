import { type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useLocation } from 'react-router-dom'

/**
 * Subtle per-route enter transition. Re-keys on pathname so each page
 * fades/rises in on mount. Honours `prefers-reduced-motion`: when the user
 * opts out, the motion is skipped and content appears immediately.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const reduce = useReducedMotion()

  return (
    <motion.div
      key={pathname}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 0.7, 0.2, 1] }}
    >
      {children}
    </motion.div>
  )
}
