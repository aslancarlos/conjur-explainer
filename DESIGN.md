# DESIGN.md: demo.minha.cloud

The design contract for everything served under **demo.minha.cloud** (this repo).
Read it before building or changing any page, component, diagram or animation.

**Source of truth, in order:** this file → tokens in `src/index.css` + `tailwind.config.js` → existing components.
If code and this file disagree, fix the code or update this file in the same PR: never let them drift.

> Supersedes `docs/IDIRA-REDESIGN.md` (May 2026), whose palette values are out of date.

---

## 1. Principles

1. **Technically true first.** This is a sales-engineering demo. Every flow, name and number must match the product docs or the real demo environment. Cite sources on the page. Never invent defaults or metrics.
2. **Colour carries meaning, never decoration.** Status, data flow and ownership each have reserved colours (§3). If a colour doesn't mean something, use a neutral.
3. **One idea per view.** Highlight the 1-2 elements that matter in the current step; everything else stays calm and readable.
4. **Motion explains cause → effect.** Animate what moves in the real system (a request, a credential, a status flip). Nothing loops for decoration.
5. **Works for everyone.** WCAG AA contrast in both themes, keyboard operable, screen-reader narrated, reduced-motion safe, 390 px phones without horizontal scroll.

---

## 2. Brand & themes

- Visual language follows Palo Alto Networks **IDIRA**. The top bar shows the **official "IDIRA by Palo Alto Networks" lockup** (`src/assets/brand/idira-logo-light.png` on light backgrounds, `idira-logo-dark.png` on dark: the official dark artwork ships on solid black and was converted to alpha by un-compositing it from black, which is exact: re-composited on black it differs by ≤ 6/255, the JPEG noise floor). Only margins were cropped; never recolour or redraw the mark, and don't rely on `mix-blend-mode` over the translucent top bar (it shows a box). In running text the brand reads `Palo Alto Networks | IDIRA`.
- Two themes, user-selectable (`useTheme()`, persisted in `localStorage('idira-theme')`, applied as `data-theme` + `.dark` on `<html>` before paint).
- **Always-dark zones** ignore the theme: the hero band and the live-flow band (`bg-[#070c1c]`). Text inside them uses `text-white` / `text-slate-300/90`.
- Official art: `src/assets/brand/security-layers-blue.png` (hero backdrop), `idira-icon-color.png`. Don't recolour or crop them.

---

## 3. Colour system

Always use **semantic tokens** via Tailwind classes. **No raw hex in new component code** (the only exceptions are the always-dark band backgrounds above).

### 3.1 Surfaces & text (theme-aware)

| Token (Tailwind) | CSS var | Light | Dark | Use |
|---|---|---|---|---|
| `bg-bg-base` | `--rgb-bg` | `255 255 255` | `17 24 40` | Page background |
| `bg-bg-muted` | `--rgb-bg-alt` | `243 246 255` | `16 28 56` | Section tint, diagram nodes |
| `bg-bg-card` / `surface` | `--rgb-surface` | `255 255 255` | `20 35 71` | Cards, player, chips |
| `border-border` / `line` | `--rgb-line` | `222 228 245` | `36 58 120` | Borders, dividers, tracks |
| `text-text` | `--rgb-text` | `11 15 25` | `240 244 255` | Primary text |
| `text-text-2` | `--rgb-text-2` | `42 51 68` | `201 214 255` | Body / secondary |
| `text-text-muted` | `--rgb-text-muted` | `91 100 120` | `150 165 210` | Labels, captions (≥ 5.5:1) |

### 3.2 Semantic tones. *what a signal means* (theme-aware, AA as text)

| Token | Light | Dark | Reserved meaning |
|---|---|---|---|
| `tone-success` | `4 120 87` | `0 204 102` | Active, healthy, ready, done |
| `tone-warning` | `161 98 7` | `255 184 0` | Pending, stale, in grace period, rotation due |
| `tone-danger` | `185 28 28` | `255 122 89` | Error, failed, blocked |
| `tone-live` | `14 116 144` | `74 209 240` | **Data plane**: requests, credentials, sync |
| `tone-accent` | `30 72 217` | `143 168 255` | **Control plane**. Policy, rotation commands |

### 3.3 Domain colours: *who owns a component* (diagrams)

| Token | Light | Dark | Owns |
|---|---|---|---|
| `domain-idira` | `38 91 255` | `110 143 255` | IDIRA platform: Vault, accounts, CPM, Secrets Manager |
| `domain-cp` | `96 72 214` | `167 150 250` | Credential Provider / application path |
| `domain-k8s` | `194 65 12` | `255 138 92` | Kubernetes / ESO path, workloads running in a cluster |
| `domain-svc` | `190 24 93` | `244 114 182` | Target services and cloud providers (databases, AWS STS, S3) |

Rules:
- Domain colour appears **only** on the icon chip, a 3 px top stripe and lane labels. Card fill and body text stay neutral.
- **Never** use a status colour (success/warning/danger) as a domain or decoration. Green means active, nothing else.
- Control plane shares IDIRA blue on purpose: control originates in the platform.
- Add a new domain only with a new CSS var pair, AA check (§14) and a row here.

### 3.4 Brand constants & workload accents (theme-independent)

Heroes use `.hero-band` (navy `idira-navy` #131b2b to `idira-deep` #091d58); large section callouts add `.callout-section` to `.callout-*`.

Aligned with the official palette of paloaltonetworks.com/idira (Oct 2026): primary blue `#265BFF`, cyan `#4AD1F0` / `#00C0E8`, navy `#131B2B` to `#091D58`, cards `#142347` with a `rgba(38,91,255,.5)` border, soft text `#C9D6FF`, green `#00CC66`, orange `#FA582D`. The official font (TT Hoves) is licensed; the site keeps Onest.

| Token | Hex | Use |
|---|---|---|
| `idira-blue` | `#265bff` | Primary buttons, selection, links on dark |
| `idira-blue-2` / `-deep` | `#1e48d9` / `#1a3bb8` | Hover / pressed (darker, keeps white text AA); focus ring `#5b82ff` |
| `idira-cyan` · `idira-gold` · `idira-orange` · `idira-magenta` · `idira-deep` | `#4ad1f0` · `#ffb800` · `#fa582d` · `#ff2d8a` · `#091d58` | Brand accents on dark bands, gradients |
| `spring` `dotnet` `gh` `eso` `ansible` `csi` | `#2d8a3e` `#6048d6` `#0067ff` `#fa582d` `#ee0000` `#326ce5` | Identity of each integration page (nav dots, page badge). Not for text on light backgrounds without an AA check. |

---

**Demo brand accents** (`spring`, `dotnet`, `gh`, `eso`, `ansible`, `csi`, and the legacy `conjur-red/cyan/gold`) are theme-aware tokens (`--rgb-*` in `index.css`): deeper on light, brighter on dark, AA (4.5:1) on both. Use them for text, icons and `/10` tints. A filled button with white text uses the fixed `*-solid` fill (`bg-spring-solid text-white`), never `bg-spring text-white`. No raw hex or Tailwind palette colours (`text-green-400`, `text-slate-500`) in components; status is `tone-*`.

## 4. Typography

- **Onest** (400, 500, 600, 700 and 900, the weights the code uses) for UI and display; **IBM Plex Mono** (400-600) for identifiers, paths, code, step counters. Loaded once in `index.html` with `display=swap`.
- Use mono for anything the reader might copy: `data/vault/<safe>/dbuser_dual/password`, `eso-shop-db-creds`, `refreshInterval: 1m`.

| Role | Classes |
|---|---|
| Hero title | `font-semibold tracking-[-0.03em] leading-[1.02] text-[clamp(34px,5.2vw,60px)]` (home: up to 80 px) + accent words in `.idira-shimmer` |
| Page title (h1, PageHeader) | `text-3xl sm:text-4xl font-bold` |
| Section title (h2) | `text-xl font-semibold` (full scale in 15.2) |
| Card / step title | `text-base sm:text-lg font-semibold` |
| Body | `text-base leading-relaxed text-text-2`, measure `max-w-[62ch]`-`[75ch]` |
| Small / caption | `text-sm` / `text-xs` (12 px floor. Never smaller for readable text) |
| Badge | `.badge` (uppercase, `text-xs`, tracking-wide) |

In SVG diagrams the minimum is **11 user units** at a render scale ≥ 1 (≈ 12 px), node titles 14-15, values 12-13 mono.
Headings are sequential (`h1` once per page → `h2` → `h3`).

---

## 5. Layout & spacing

- 4 px grid (Tailwind scale). Section rhythm: `py-24 px-6` (use `px-4 sm:px-6` for dense explainers).
- Containers: explainer pages `max-w-5xl`, home `max-w-7xl`, prose `max-w-2xl`.
- Radius and elevation: see 15.4 (cards `rounded-2xl`, panels/code `rounded-xl`, primary buttons and pills `rounded-full`, icon buttons `rounded-lg`, SVG nodes `rx=12`).
- Breakpoints: Tailwind defaults. **640 px (`sm`) is where diagrams switch between the wide and narrow layouts.**
- Never cause horizontal scroll: long identifiers get `[overflow-wrap:anywhere]`; flex children holding text get `min-w-0`.
- Fixed navbar is 56 px (`main` has `pt-14`).

---

## 6. App shell & navigation

Console-style shell, aligned with sinfonia.minha.cloud (`src/components/shell/`):

| Part | Spec |
|---|---|
| Top bar | Fixed, `h-14`, theme-aware (`bg-bg-card/90` + blur + `.nav-iridescent` line), like sinfonia.minha.cloud. Left: sidebar toggle (≥ lg collapses, < lg opens drawer) · official logo (36 px tall). Right: `/api` status · EN/PT/ES · theme. (`tone="dark"` variants of `ApiStatus`/`ThemeToggle`/`LanguageSwitcher` exist for always-dark surfaces) |
| Sidebar (≥ 1024 px) | Left, fixed under the top bar, `w-60` (240 px) or `w-16` icons-only, choice persisted in `localStorage('idira-sidebar-collapsed')`. Theme-aware (`bg-bg-card`, `border-r border-border`). Rows 36 px (mouse) |
| Drawer (< 1024 px) | Same navigation, slides from the left (`w-[min(20rem,85vw)]`), 55 % scrim, focus moves to Close, Esc / scrim / navigation close it, focus returns to the menu button, page scroll locked. Rows 44 px (touch); language switch in its footer |
| Groups | Organised like the CyberArk docs: by **how a workload gets its secret**: Home · **Identity & access** (authn-jwt, policy, SWA) · **Kubernetes** (Spring Boot, Secrets Provider, ESO, CSI) · **CI/CD & automation** (GitHub Actions, Jenkins, Ansible) · **Credential lifecycle** (Dual Accounts, Secrets Hub) · Tools. Single source: `src/lib/nav.ts` (also feeds the home catalogue via `DEMO_GROUPS`) |
| Group by | Segmented **Use case \| Product** switch at the top of the sidebar/drawer and in the home catalogue. One shared preference (`useNavView`, `localStorage('idira-nav-view')`). Product view: Secrets Manager · Secure Workload Access · Secrets Hub · PAM & Credential Providers (each item's `product` in `lib/nav.ts`), Tools stay last. Long product names wrap, never truncate |
| Group disclosure | Each group header is a button (chevron + label, `aria-expanded`/`aria-controls`) that shows/hides its items; hidden groups show their item count. State persisted in `localStorage('idira-nav-groups')`; the group holding the current page always opens. Icon rail shows every item, no headers |
| Current page | Tinted row + 3 px `idira-blue` left bar + `aria-current="page"` |
| Icons | One per page, coloured with the page accent only if it reaches 3:1 in **both** themes; otherwise a theme-aware token (`domain-idira`, `domain-cp`, `text-text-2`) |

Content column gets `lg:pl-60` / `lg:pl-16`; `main` keeps `pt-14`. Never add a second fixed bar or global keyboard listeners.

A returning visitor's locale (pt/es) is loaded **before** the first render (`localeReady` in `src/i18n.ts`), so no component flashes English.

---

## 7. Page anatomy

**Home stays clean:** hero ("Every workload, its own identity", CTAs open the first two Concepts pages) → **see it live** (`IdentityFlows`: two paths on one GSAP timeline. Path 1: Kubernetes ServiceAccount JWT → IDIRA Secrets Manager authn-jwt → access token → policy → vault → MySQL. Path 2: IDIRA SWA SVID → AWS STS AssumeRoleWithWebIdentity → temporary credentials → S3, no secret. Lazy-loaded so GSAP stays off the first paint) → **"Learn the concepts"** cards → compact demo links (same use case / product switch). Teaching content lives on the Concepts pages; demo detail on the demo pages.

**Concepts pages** (`/concepts/*`, menu group *Concepts*, right under Home in both grouping views): a learning trail rendered by `ConceptLayout` (compact dark hero band with "Concepts · n/5", content, previous/next links in the order of the group in `lib/nav.ts`):

| Route | Content |
|---|---|
| `/concepts/secrets` | Definition card (examples, how IDIRA stores it, docs link) + why static secrets are a risk (NIST / MITRE) |
| `/concepts/machine-identity` | Definition card + identity each platform already issues → IDIRA authenticator → demo |
| `/concepts/secret-vs-identity` | Comparison table (stacked on phones) + prove → authorize → deliver + "no secret zero" + guarantees |
| `/concepts/kubernetes` | Kubernetes architecture walkthrough |
| `/concepts/glossary` | Docs terms as a definition list (anchors `#term-<key>`) |

Wording follows the Secrets Manager *Key concepts* docs; building blocks live in `src/components/concepts/ConceptPieces.tsx`.

**Explainer pages:**

```
┌ Hero band (always dark) ─────────────────────────────────────────┐
│ badge · h1 (lead + .idira-shimmer accent) · subtitle             │
│ security-layers art right-anchored + .hero-mesh + .hero-grid     │
└──────────────────────────────────────────────────────────────────┘
   ┌ Player / main card  (-mt-20, overlaps the band) ─────────────┐
   │ step header + transport · timeline · diagram · legend · text │
   └──────────────────────────────────────────────────────────────┘
   Concept cards (grid sm:grid-cols-2, icon tile + h3 + text)
   Sources (links to product docs)          Keyboard hint (sm+)
```

Hero band recipe (copy from `DualAccountsPage.tsx` / `Hero.tsx`):

```tsx
<header className="relative overflow-hidden bg-[#070c1c] text-white">
  <img src={securityLayers} alt="" aria-hidden="true"
    className="pointer-events-none absolute right-0 top-0 w-[95%] sm:w-[52%] max-w-[720px] h-auto
      opacity-40 sm:opacity-70 mix-blend-screen select-none" />
  <div className="hero-mesh pointer-events-none absolute inset-0 opacity-90" aria-hidden="true" />
  <div className="hero-grid pointer-events-none absolute inset-0" aria-hidden="true" />
  <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#070c1c] via-[#070c1c]/85 to-transparent" aria-hidden="true" />
  <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-14 pb-28 sm:pb-32">…</div>
</header>
```

---

**Demo / feature page header:** `src/components/PageHeader.tsx` (left aligned: badge, one `h1`, 16px lead at 70ch). Concepts pages use `ConceptLayout`'s hero band. Every page has exactly one `h1` and no skipped heading levels (the FlowPlayer step title is an `h2`).

**Navigation:** every sidebar group and submenu uses the same disclosure header (icon, label, down chevron, count when collapsed, items under a guide line); every group and submenu starts collapsed on each visit (nothing persisted, no auto-open); a collapsed group holding the current page gets a tinted header. Zones: Start here, Products, Resources. Use cases (Kubernetes, CI/CD, Platforms) are a submenu of Secrets Manager, not a group of their own. A run of two or more items sharing a `heading` is a collapsible submenu one level down: inside a group it gets an icon (`HEADINGS` in lib/nav, like Architecture and Capabilities); inside a submenu it is a third level without icon (Kubernetes, CI/CD, Platforms, Workloads). A heading with a single item is not a submenu: the item is listed directly. Every level is collapsed by default. Labels must not repeat a zone name (pt Capabilities is "Funcionalidades", not "Recursos").

**Audience:** desktop only (no phone use). Keep layouts responsive, but QA targets desktop widths (1366 to 1440) and short screens (about 700px tall). Click targets stay 44px.

## 8. Components

| Component | Spec |
|---|---|
| `.section-card` | `bg-bg-card border border-border rounded-2xl p-8`. Concept card = icon tile (`h-10 w-10 rounded-lg bg-idira-blue/10 text-tone-accent`) + `h3` + text |
| `.badge` | Pill label; on dark bands `bg-idira-gold/10 text-idira-gold border-idira-gold/30` |
| `.code-block` | `bg-bg-muted border border-border rounded-xl p-4 font-mono text-sm overflow-x-auto` |
| Primary button | `h-11 min-w-11 rounded-md bg-idira-blue text-white hover:bg-idira-blue-2 active:bg-idira-blue-deep`. One per view |
| Secondary / icon button | `h-11 w-11 rounded-md border border-border text-text-2 hover:border-idira-blue hover:text-text`; disabled `opacity-40 cursor-not-allowed` |
| Home CTA | `.cta-diagonal` clip-path, home only |
| Legend | Two labelled groups: **Components** (domain swatches) · **Signals** (planes + status). Shapes differ (bar vs dot vs ring) so colour is never the only cue |

All interactive targets ≥ 44×44 px with ≥ 8 px spacing. Icon-only buttons need `aria-label` **and** `title`.

---

## 9. Iconography

- **lucide-react only** (currently 0.408). No emoji as icons or bullets.
- Sizes: 14 (inline/labels), 16 (chips), 18 (buttons), 20 (concept tiles). Stroke 1.75-2.
- Decorative icons get `aria-hidden="true"`; meaning lives in the adjacent text.
- In SVG, render lucide components as nested `<svg>` with `x/y/width/height`; colour via `currentColor` (`className="text-domain-k8s"`).
- Diagram node icon = **edge chip**: 12 r circle on the card's top edge (right side), `fill-surface` + domain stroke. Never beside the title (it breaks narrow layouts).
- Keep one icon per concept across the site (ESO → `RefreshCw`, K8s Secret → `KeySquare`, IDIRA/Secrets Manager → `Fingerprint`, ESO Shop → `ShoppingCart`, CPM → `CalendarClock`, DB → `Database`, Vault → `Vault`).

---

## 10. Animated diagrams (the pattern)

**Use the engine, don't hand-roll it.** Every step-by-step diagram is a `FlowSpec` (data) rendered by `src/components/flow/FlowPlayer.tsx`: nodes (`domain`, lucide `Icon`, title, sub, rows with cross-faded states), trust `zones`, `lanes`, typed edges (`identity`, `secret`, `access`, `control`), steps (`focus`, `fx`: `packet` / `set`), and a `wide` (980) plus `narrow` (360, vertical) layout. The player provides the timeline, controls, stepper, keyboard, narration, reduced motion and legend. Reference spec: `src/components/IdentityFlows.tsx`; page specs in `src/components/flow/specs/` or inline in the page. Give each spec a unique `id`. Card text must fit in en/pt/es at both layouts (≥14 px inner padding, label and value of a row never touching). `DualAccountsPage.tsx` is the original hand-built version the engine was extracted from.

**Ambient diagrams** (no step controls): no GSAP, no infinite loops. One journey at a time driven by a `requestAnimationFrame` token on `getPointAtLength`, a visible **Pause** button (WCAG 2.2.2), auto-pause on hover/focus, off-screen (IntersectionObserver) and hidden tabs, static under reduced motion, nodes link to their page, and a vertical chip/stepper variant below 640 px instead of sideways scrolling.

**When:** step-by-step explanations of a system flow → **GSAP** (`gsap` + `MotionPathPlugin`, own lazy chunk). Simple entrances, hovers, text crossfades → Framer Motion (already in the bundle). Don't mix both on the same element.

**Architecture**
- **One master timeline** per diagram, paused. Each step adds labels `sN` (start) and `sN_end` (beats done); the gap to the next label is reading time (autoplay only, ≈ 3.5 words/s, clamped 4-12 s).
- Steps are **data** (`STEPS[]` of `{ focus, end, fx[] }`); effects are `packet`, `set` (cross-fade a state group), `grace`, etc. Rendering is declarative JSX with `data-*` hooks (`data-ring`, `data-edge`, `data-edge-hi`, `data-pkt`, `data-k`/`data-v`).
- **Deterministic seeking is mandatory**: every state tween is an explicit `fromTo` against state tracked at build time, with `immediateRender: false`. When a tween scales/rotates, put `transformOrigin` (and `smoothOrigin: false`) in **both** `from` and `to`, or GSAP leaves a residual translate.
- Build inside `gsap.context(…, svg)` and `ctx.revert()` on cleanup; rebuild on layout / language / reduced-motion change and re-seek to the current step.
- Derive the current step from the playhead in `onUpdate` and write progress fills via refs (no React state per frame).

**Visual grammar**
- Identity diagrams show **trust zones** behind the cards (dashed outline, 6 % tint of the owner's domain colour: Kubernetes `domain-k8s`, IDIRA `domain-idira`, services & cloud `domain-svc`), a domain stripe + icon chip on every card, and a two-group legend (Zones · Flows).
- Identity diagrams use three packet kinds, each with icon + label + colour: **identity** (Fingerprint, `tone-accent`: JWT, SVID, access token), **secret / credential** (KeyRound, `tone-live`: DB password, temporary cloud credentials), **service access** (Plug, neutral). Show the legend under the diagram.
- Packets: pill with label, travels an edge in **1.0 s** `power1.inOut` via MotionPath; the edge overlay draws with dash-offset in sync. Data plane = `tone-live`, control plane = `tone-accent`.
- Current-step focus = neutral ring (`stroke-text-2/60`), not a colour.
- State changes cross-fade (0.25 s out / 0.3 s in); emphasis "pop" = scale 0.85→1, `back.out(2.2)`, 0.45 s.
- Two layouts (`WIDE` ≈ 980×500, `NARROW` 360 wide, vertical) chosen at 640 px. Short label variants use `_short` i18n keys.
- Labels over edges get a halo: `stroke-surface` + `paint-order: stroke`.

**Controls:** prev · play/pause (primary) · next · restart; segmented timeline that is click-to-replay and drag-to-scrub, exposed as `role="slider"` with `aria-valuenow/valuetext`; keyboard scoped to the player (← → Home End Space). Never global listeners.

**Motion tokens (UI):** micro 150-300 ms, text cross-fade 200 ms `easeOut`, theme transition 250 ms `cubic-bezier(.2,.7,.2,1)`. Animate `transform`/`opacity` only.

---

## 11. Accessibility checklist

- Contrast: text ≥ 4.5:1, large text/icons/meaningful strokes ≥ 3:1. **in both themes**.
- Visible focus (`:focus-visible` 2 px `#2589ff`), skip link present, logical tab order.
- Animated diagram: `role="img"` + `aria-label` that includes the current step title; narration in an `aria-live="polite"` region with a screen-reader-only "Step N of M: title".
- `prefers-reduced-motion`: jump to each step's end state (no packets), autoplay advances by reading time; global CSS already neutralises CSS animations.
- Colour is never the only signal (text labels, icons, dashed vs solid borders, legend shapes).

---

## 12. Content, i18n & data

- **Never use the em dash (U+2014) or the en dash (U+2013), in any language, anywhere:** UI copy, docs, comments, commits. Rewrite with a colon, comma, period or parentheses; use a hyphen for ranges (`1-5`) and compound words (`zero-downtime`). Check before merging: `rg -n "\x{2014}|\x{2013}" src DESIGN.md CLAUDE.md index.html` must return nothing.

- Three locales (`en`, `pt`, `es`) always updated together with identical keys/shape (`t(key, { returnObjects: true })` for arrays).
- No user-facing strings hard-coded in components, including SVG. Exceptions: literal identifiers (`dbuser_dual`, `CurrInd`, `refreshInterval: 1m`).
- Use the **real demo identifiers** where they exist (Safe, VirtualUserName, Secret names from the manifests). Mark illustrative values as such in review.
- Link the product docs a page is based on (see the sources row on `/dualaccounts`).

---

## 13. Performance

- Every page is a lazy route; heavy libraries get their own `manualChunks` entry (see `vite.config.ts`: `gsap`, `motion`, …) so they never load on other routes.
- Import images through Vite (hashed, cacheable). No layout shift: SVGs use `viewBox` + `w-full h-auto`.

---

## 14. QA before merge

1. `npx tsc --noEmit` and `npm run build` (CI runs the build on every PR).
2. Check light + dark, en + pt + es, 1280 px and 390 px.
3. For diagrams, run the in-browser checks used for `/dualaccounts`: no text overflowing its card, no text/icon-chip collisions, `document.documentElement.scrollWidth === innerWidth`, and a determinism test (seek to random times, then back to probe times; snapshots must match).
4. New colours: verify contrast with the WCAG formula against `surface` **and** `bg-alt` in both themes; record the values in §3.
5. After editing `tailwind.config.js`, **restart** `npm run dev`: the dev server does not pick up new utilities.

---

## 15. Design system reference

The single page to check before writing UI. Tokens live in `src/index.css` (CSS variables) and `tailwind.config.js`; primitives in `src/index.css` `@layer components`.

### 15.1 Colour
- Use only semantic tokens (`bg-bg-*`, `text-text*`, `border-border`, `tone-*`, `domain-*`, brand accents). Every text token passes AA on `bg`, `bg-alt` and `surface` in both themes (lowest: 4.77:1, verified Oct 2026).
- Raw hex is allowed only in: brand gradients (`Hero`, `ConceptLayout`, `DualAccountsPage` heroes, `.idira-shimmer`, `.hero-mesh`), the language flags (`LanguageSwitcher`) and exported files (`src/lib/finder/drawio.ts`, `exports.ts`), which leave the page and cannot read CSS variables.
- Status colours (success, warning, danger) carry meaning only and always come with an icon or text.

### 15.2 Type scale (Onest; IBM Plex Mono for anything copyable)

| Role | Classes | Use |
|---|---|---|
| Display | `text-[clamp(34px,5.2vw,60px)] font-semibold tracking-[-0.03em]` | Home and concept heroes only |
| H1 | `text-3xl sm:text-4xl font-bold` (PageHeader) | One per page |
| H2 | `text-xl font-semibold` | Page sections |
| H3 | `text-base font-semibold` | Card and table titles |
| Body | `text-base leading-relaxed text-text-2`, measure 62 to 75ch | Prose |
| Small | `text-sm` | Dense UI, card body, tables |
| Caption | `text-xs text-text-muted` | Metadata, helper text |
| Overline | `.text-overline` (12px, semibold, uppercase, tracking) | Eyebrows, sidebar section labels |
| Mono | `font-mono text-xs/text-sm` | Paths, ids, ports, step counters |

Floor: 12px for readable text on screen. Sub-12px sizes are allowed only in print output (`print:` report) and SVG labels at 11 user units with render scale at least 1. Weights: 400 body, 500 labels, 600 titles, 700 H1 only.

### 15.3 Spacing and layout
- 4px grid. Section tiers: page top `py-16`, between sections `mt-12` (`space-y-12`), inside a section `space-y-4`, card padding `.card` 24px (`p-6`), inset blocks 16px (`p-4`), large feature card 32px (`.section-card`).
- Containers: explainer pages `max-w-5xl`, wide pages and wizard `max-w-6xl`, home `max-w-7xl`, prose `max-w-[70ch]`.
- Sidebar 17rem (collapsed 4rem), top bar 56px.

### 15.4 Radius and elevation

| Element | Radius | Elevation |
|---|---|---|
| Chips, pills, primary/secondary buttons | `rounded-full` | none |
| Icon buttons, inputs, small controls | `rounded-lg` | none |
| Inset blocks, callouts, code | `rounded-xl` | none |
| Cards, panels, diagram player | `rounded-2xl` | `shadow-card` optional |
| Popovers, menus | `rounded-xl` | `shadow-raised` |
| Dialogs, drawer | `rounded-2xl` | `shadow-overlay` + scrim `bg-black/55` |

Avoid ad hoc radii (`rounded-[3px]`) and ad hoc shadows; borders do most of the separation work in this UI.

### 15.5 Motion
- Tokens: `duration-fast` 150ms (hover, press), `duration-base` 200ms (state changes, chevrons, tabs), `duration-slow` 300ms (panels, dialogs, drawer); easing `ease-idira` (cubic-bezier(0.2, 0.7, 0.2, 1)). Framer Motion uses the same values in seconds (0.15 / 0.2 / 0.3); entrance reveals may use 0.4 to 0.5.
- Exit faster than enter. Animate transform and opacity only. Diagrams (GSAP) are the one place for longer, meaningful sequences.
- `prefers-reduced-motion` is honoured globally in `index.css` and by `useReducedMotion` in components.

### 15.6 Layering (z-index)
`z-raised` 10 (sticky table headers, badges) · `z-sticky` 20 (in-page sticky bars) · `z-sidebar` 40 · `z-header` 50 (top bar, popovers) · `z-drawer` 60 · `z-modal` 70 · `z-skip` 100 (skip link). New stacking contexts isolate their children: do not reach for 9999.

### 15.7 Component primitives (`src/index.css`)

| Class | What it is |
|---|---|
| `.btn-primary` | Filled IDIRA blue pill, white text (5.2:1), 44px tall. One per view. |
| `.btn-secondary` | Bordered pill on surface; hover border blue. |
| `.btn-ghost` | Text button with tinted hover. |
| `.btn-icon` | 44px square icon button; always pair with `aria-label`. |
| `.chip` / `.chip-success` | 32px pill for metadata and availability; pair status with an icon. |
| `.card` / `.card-inset` / `.section-card` | Content card (p-6) / inset block (p-4) / feature card (p-8). |
| `.callout-info|warning|danger|success` | Icon + title + body; tone tints border and background, text stays neutral. |
| `.text-overline` | Eyebrow label. |
| `.badge`, `.code-block`, `.step-connector` | Existing helpers. |

Focus: every interactive element shows a 2px ring (`focus-visible:ring-2 ring-idira-blue`, offset 2 on filled buttons); the global `:focus-visible` outline (#5b82ff) is the fallback. Never remove a focus style without a replacement.

### 15.8 Do and don't
- Do keep one primary action per view; group secondary actions as `.btn-secondary` or `.btn-ghost`.
- Do collapse heavy reference content (tables, firewall rules, checklists) behind an explicit disclosure.
- Do give every icon-only control a label and every image `alt` (decorative: `alt=""`).
- Don't convey status by colour alone, use emoji as icons, mix icon packs at the same level, or let a sticky bar cover content.
- Don't truncate meaning: prefer wrapping; when truncating, expose the full text (title, dialog).

---

## 16. Known debt (fix opportunistically)

- Raw hex is now limited to the allowed places listed in 15.1 (93 occurrences in 6 files, Oct 2026).
- Sub-12px text on screen: `SideNav` section labels (11px), `ReleaseInfo` badge (11px), `LiveToolsSection` badge (10px), `GhaLiveRunner` link (11px), `NetworkTable` notes and badges (11px), `CommandPalette` kbd. Move to `text-xs` / `.text-overline`.
- Primary buttons are written inline in about 6 places with small differences (`rounded-md` vs `rounded-full`, hover token); adopt `.btn-primary`.
- Locale bundles are large (en inside the 528 kB entry chunk; pt 480 kB, es 492 kB) mostly because of the solution finder copy; split `finder*` into a lazily loaded i18n namespace.
- `CLAUDE.md` deploy section still shows `:latest`; production pins `aslancarlos/conjur-explainer:design2026rNN`.
- `docs/IDIRA-REDESIGN.md` palette is outdated: this file wins.
- Home copy disagrees on counts ("Eight live integration patterns" vs "Twelve patterns"); align with the real catalogue.

---

## Changelog

- 2026-10-03: design system reference (15): type scale roles, spacing tiers, radius/elevation, motion and z-index tokens, component primitives (`.btn-*`, `.chip`, `.card`, `.callout-*`, `.text-overline`); palette aligned with paloaltonetworks.com/idira; all token pairs re-verified AA.

- 2026-10-02: professional review pass. Theme-aware brand accents and `*-solid` fills (AA both themes), one `h1` per page, PageHeader for demo pages, 44px targets, unified menu headers (collapsed by default), friendly live-demo errors, CLS fix on lazy routes.

| Date | Change |
|---|---|
| 2026-09-30 | `domain-svc` token; identity diagram trust zones and domain-coloured cards. |
| 2026-09-30 | Concepts pages (`/concepts/*`) + lean home. |
| 2026-09-30 | Official IDIRA logo in a theme-aware top bar; Use case \| Product grouping; home Fundamentals section. |
| 2026-09-30 | App shell: left sidebar + drawer (§6), `lib/nav.ts`, ambient hero diagram rules (§10), locale preload. |
| 2026-09-30 | First version. Adds `tone-*` and `domain-*` tokens, the animated-diagram pattern, explainer page anatomy and QA checklist (from the `/dualaccounts` rebuild, PR #46). |
