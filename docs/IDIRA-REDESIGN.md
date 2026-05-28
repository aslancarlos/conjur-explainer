# IDIRA Redesign — UX & Visual Language

**Date:** 2026-05-27
**Scope:** Full reskin of `demo.minha.cloud` (this repo) following the visual language of [paloaltonetworks.com/idira](https://www.paloaltonetworks.com/idira), plus a user-selectable dark / light theme and a pass of WCAG-aligned accessibility fixes.

---

## 1. Why this happened

- Align the public portfolio with the Palo Alto Networks IDIRA visual identity (transition context: focus on NHI / Machine Identity).
- Remove generic AI-aesthetic patterns (Inter font, dark-only, no theme choice).
- Close a small set of real a11y gaps before they become an audit problem.
- Document everything in-repo so future contributors can extend the system without guessing.

The change is non-destructive: existing components keep their class names (`bg-bg-card`, `text-conjur-cyan`, etc.). What changed is the *values* those classes resolve to, plus a small theme-token layer on top.

---

## 2. UX evaluation summary

Audited against the [UI/UX Pro Max framework](../README.md), priority CRITICAL → HIGH:

| Issue | Where | Standard violated | Fix |
|---|---|---|---|
| Contrast of muted text fails WCAG AA | old `slate-500` on dark bg ≈ 4.0:1 | WCAG 1.4.3 (≥ 4.5:1) | New `--rgb-text-muted: 139 150 173` (dark) / `91 100 120` (light) — both ≥ 4.6:1 |
| Theme not user-selectable | hardcoded dark-only | Material `color-dark-mode` / Apple HIG | New `useTheme()` + `<ThemeToggle/>`; `data-theme="light|dark"` |
| No `prefers-reduced-motion` | conic spin 40s, shimmer 12s, hero-mesh 25s | WCAG 2.3.3 | Media query disables all animations when user prefers reduced |
| No skip-to-content link | nav sticky | WCAG 2.4.1 | `<a class="skip-link" href="#main">` injected before `#root` |
| Invisible focus rings on dark surfaces | default browser style | WCAG 2.4.7 | `:focus-visible` 2px outline (#2589ff) with 3px offset |
| Mobile nav hidden completely | `display:none` < 920px | nav-hierarchy / discoverability | Existing hamburger drawer was already in place — verified, kept |

---

## 3. Design system

### Surfaces (semantic, theme-aware)

| Token | Light | Dark |
|---|---|---|
| `--rgb-bg`         | `255 255 255` | `5 13 26` |
| `--rgb-bg-alt`     | `245 247 251` | `12 24 40` |
| `--rgb-surface`    | `255 255 255` | `15 30 48` |
| `--rgb-line`       | `228 232 240` | `26 48 80` |
| `--rgb-text`       | `11 15 25`    | `226 232 240` |
| `--rgb-text-2`     | `42 51 68`    | `200 210 226` |
| `--rgb-text-muted` | `91 100 120`  | `139 150 173` |

Consumed via Tailwind as `bg-bg`, `bg-surface`, `text-text`, etc.

### Brand accents (constant across themes)

| Token | Hex | Use |
|---|---|---|
| `idira.blue`       | `#0067ff` | Primary CTA, links, focus |
| `idira.blue-2`     | `#2589ff` | Focus ring on dark |
| `idira.blue-deep`  | `#0048b8` | Active / pressed |
| `idira.orange`     | `#fa582d` | Warning, danger, PANW signature |
| `idira.magenta`    | `#ff2d8a` | Hero gradient mid-stop |
| `idira.cyan`       | `#00d4ff` | "Live" indicators, on-deep accents |
| `idira.gold`       | `#ffb800` | Gradient tail |
| `idira.deep`       | `#001236` | Hero / promise band background |

### Per-workload accents

| Token | Hex | Used by |
|---|---|---|
| `spring` | `#2d8a3e` | Spring Boot integration |
| `dotnet` | `#6048d6` | .NET integration |
| `gh`     | `#0067ff` | GitHub Actions / OIDC |
| `eso`    | `#fa582d` | External Secrets Operator |

### Legacy aliases (kept for back-compat)

| Old | New value | Notes |
|---|---|---|
| `conjur-red`  | `#fa582d` (was `#d92b3a`) | Orange now reads as "danger / signature" |
| `conjur-cyan` | `#00d4ff` (was `#00b4e0`) | Brighter cyan, matches IDIRA palette |
| `conjur-gold` | `#ffb800` (was `#f59e0b`) | Saturated gold for gradient tails |

### Typography

| Family | Weights | Use |
|---|---|---|
| **Onest** (variable) | 300–900 | Display + body |
| **IBM Plex Mono** | 400, 500, 600 | Code, labels, technical data |

Loaded once in [`index.html`](../index.html) via Google Fonts with `display=swap`. Variable Onest lets us animate weight smoothly in headings without loading extra files.

### Iridescent shimmer

Used on headline accent words: linear-gradient `cyan → blue-2 → magenta → orange-2`, 200% background-size, animated to 200% position over 12s. CSS class: `.idira-shimmer`. Disabled by `prefers-reduced-motion`.

---

## 4. Theme system

### Files

```
src/lib/useTheme.ts          — React hook (state + persistence + listener)
src/components/ThemeToggle.tsx — Sun/moon button used in NavBar
index.html                   — Pre-render init script (anti-FOWT)
src/index.css                — :root + [data-theme="light|dark"] tokens
```

### Lifecycle

1. **Page load** (before paint): inline `<script>` in `<head>` reads `localStorage('idira-theme')`. Falls back to `prefers-color-scheme`. Sets `<html data-theme="…">` and `<html class="dark">` *before* React mounts. Prevents the flash-of-wrong-theme (FOWT).
2. **React mounts**: `useTheme()` reads the same value and stores it in state.
3. **User clicks toggle**: `useTheme.toggle()` flips between `'light'` ⇄ `'dark'`, persists to `localStorage`, mutates `<html>` attributes.
4. **System changes preference**: `matchMedia` listener updates the theme — but only if the user has never made an explicit choice (i.e. no localStorage entry).

### `useTheme()` API

```ts
import { useTheme } from './lib/useTheme'

function Component() {
  const { theme, toggle, setTheme } = useTheme()
  // theme: 'light' | 'dark'
  // toggle(): flip
  // setTheme(t): set explicitly (also persists)
}
```

### Why CSS variables instead of class-based dark mode

Tailwind's `dark:` modifier is class-based and works fine, but coupling every utility to a duplicate dark variant gets verbose. CSS variables let us:
- Define each semantic token once (`bg-bg`, `text-text`, etc.)
- Swap the *value* on `[data-theme]` change
- Have one source of truth, easier to extend later (e.g. per-tenant theming)

The `dark:` modifier still works on top — useful for one-off accent shifts.

---

## 5. Accessibility additions

- **Skip-to-content** — first focusable element on every page, translates the user past the sticky nav. Hidden visually until focused.
- **Focus rings** — every interactive element shows a 2px solid `#2589ff` outline with 3px offset on `:focus-visible`. Mouse focus is not styled (no visual noise for sighted users).
- **Reduced motion** — `@media (prefers-reduced-motion: reduce)` collapses every animation/transition to 0.01ms. Tested on macOS "Reduce motion" + iOS Smart Invert.
- **Color contrast** — body / muted text recalculated against light + dark backgrounds; all pairs ≥ 4.5:1 (AA) verified with web-aim contrast checker.
- **Touch targets** — `<ThemeToggle/>` is `w-11 h-11` = 44×44 px, meets Apple HIG.
- **Aria semantics** — toggle has `aria-pressed` + descriptive `aria-label` that swaps based on current theme.

---

## 6. Text rebrand

Applied across all i18n locales (`src/locales/en.json`, `pt.json`, `es.json`):

| Old | New |
|---|---|
| `CyberArk` | `IDIRA` |
| `CyberArk Conjur Cloud` | `IDIRA Secrets Manager` |
| `Conjur Cloud` | `Secrets Manager` |
| `Conjur` (capitalized) | `Secrets Manager` |
| `cyberark.cloud` (display only) | `idira.cloud` |
| `conjur-sdk-springboot` (display only) | `idira-sdk-springboot` |

**Not changed** — lowercase `conjur` in code blocks: it remains the on-the-wire identifier in YAML keys (`provider.conjur`), API paths (`/api/authn-jwt/.../conjur/authenticate`), namespaces (`namespace: conjur`), and ConfigMap data keys. These are technical strings the actual product still emits and consumes.

Also unchanged: GitHub repo URLs (`github.com/aslancarlos/conjur-explainer`, `aslancarlos/conjur-action`) — these are external identifiers that have to keep working.

---

## 7. For developers

### Add a new component that respects the theme

```tsx
// ✅ Use semantic tokens (theme-aware)
<div className="bg-surface text-text border border-border">

// ✅ Reach for brand accents when you need IDIRA color
<button className="bg-idira-blue text-white">

// ❌ Avoid hardcoded colors — they don't swap on theme change
<div className="bg-[#0c1828] text-[#e2e8f0]">
```

### Test both themes

```bash
# In Chrome DevTools, toggle "Rendering → Emulate prefers-color-scheme"
# Or click the sun/moon in the app NavBar
```

### Add a new translation

In each locale file, keep "IDIRA" / "Secrets Manager" for the human-readable product names and `conjur` lowercase for any technical identifier. If you're unsure, default to "Secrets Manager".

---

## 8. Verification

```bash
# Build (Vite)
npm install --legacy-peer-deps
npm run build
# → 1935 modules transformed · ✓ built in <1s

# Lint i18n
grep -E "CyberArk|Conjur" src/locales/*.json
# → only lowercase 'conjur' should remain (technical identifiers)

# Visual check: open in both themes
npm run dev
# → click sun/moon in the nav, verify all surfaces and accents swap
```

CI on every push: `.github/workflows/build.yml` runs `npm ci --legacy-peer-deps` + `npm run build`.

---

## 9. Related repos

- [`machine-identity-explainer`](https://github.com/aslancarlos/machine-identity-explainer) — same design system, same theme architecture, focuses on open standards (SPIFFE/SPIRE/mTLS).
- [`k8s-eso-shop`](https://github.com/aslancarlos/k8s-eso-shop) — same design language ported to EJS instead of React (vanilla theme toggle).

The three sites share `--rgb-*` token names, font choices, and brand accents. Differences are in framework idioms only (React hooks vs. inline JS).
