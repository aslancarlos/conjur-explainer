/// <reference types="vite/client" />

/** ISO timestamp of the production build (vite.config.ts define). */
declare const __BUILD_DATE__: string

/** Locale file reduced to the shell + home namespaces (vite.config.ts localeCore). */
declare module '*.json?core' {
  const value: Record<string, unknown>
  export default value
}
