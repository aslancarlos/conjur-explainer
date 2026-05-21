# CLAUDE.md

## Build and deploy

Images must target `linux/amd64` — the EKS nodes do not run ARM.

```bash
# Build + push
docker build --platform linux/amd64 -t aslancarlos/conjur-explainer:latest .
docker push aslancarlos/conjur-explainer:latest

# Deploy
kubectl rollout restart deployment/conjur-explainer -n conjur
kubectl rollout status deployment/conjur-explainer -n conjur
```

Local dev:
```bash
npm install
npm run dev    # Vite on http://localhost:5173
```

Type-check without building:
```bash
npx tsc --noEmit
```

## Architecture decisions

**`vite.config.ts` has `base: '/'`** — the app is served at the domain root (`demo.minha.cloud/`). Do not change this. If `base` were set to a sub-path, all asset paths and client-side navigation would break.

**nginx `try_files` for SPA routing** — `nginx.conf` uses `try_files $uri $uri/ /index.html`. This is what makes deep-link refreshes work. Do not remove it.

**Live fetch calls use absolute paths** — `SpringBootSection` fetches `/springboot/checkit` and `ESOShopSection` fetches `/k8s-eso/health`. These paths resolve correctly in production because the app sits at the domain root and sibling services are on the same domain under their own path prefixes. In local dev they will return errors; this is expected and the components show a graceful error state.

**Animations trigger once on scroll** — all section components use `useInView(ref, { once: true, margin: '-80px' })`. Animations fire once when the section first enters the viewport. The `once: true` flag is important — removing it causes re-animation on scroll-up.

**Translation arrays require `returnObjects: true`** — keys like `springboot.steps`, `compare.rows`, `livetools.k8s_features` are arrays in the JSON. Always access them with:
```ts
const steps = t('springboot.steps', { returnObjects: true }) as Array<{...}>
```
If you forget `returnObjects: true`, i18next returns a comma-joined string instead of the array.

**`kubernetes-dashboard.yaml` spans two namespaces** — the file creates resources in both `kubernetes-dashboard` and `conjur`. Apply it with a single `kubectl apply -f`. The `sub_filter` injection approach is used because `configuration-snippet` annotations are blocked by the nginx admission webhook (CVE-2021-25742 hardening on this cluster).

## Key files

| File | What to know |
|---|---|
| `src/App.tsx` | Controls section render order. To add a section, import and place it here. |
| `src/i18n.ts` | Initialises i18next once. `fallbackLng: 'en'`. Language detection uses the browser's `navigator.language`. |
| `tailwind.config.js` | All color tokens live here. Add new pattern colors here before using them in components. |
| `src/index.css` | Shared component classes: `.section-card`, `.badge`, `.code-block`, `.step-connector`. Check here before creating new CSS. |
| `k8s/kubernetes-dashboard.yaml` | Large multi-resource, multi-namespace manifest. Contains the real skip-login RBAC and the nginx proxy ConfigMap. Do not regenerate the admin-user token secret — it is already bound. |

## Adding a new pattern section

1. Create `src/components/XyzSection.tsx` following the existing section structure:
   - `useRef` + `useInView` with `once: true, margin: '-80px'`
   - `useTranslation()` for all text
   - Section wrapped in `<section id="xyz">`
2. Add a color token to `tailwind.config.js` if the pattern needs one
3. Add the NavBar link in `NavBar.tsx` with the matching `hover:text-<color>` class and responsive visibility class (`hidden sm:block`, `hidden md:block`, etc.)
4. Add translation keys to all three locale files: `src/locales/en.json`, `pt.json`, `es.json`
5. Import and place the component in `App.tsx`

## Adding a translation key

All three locale files (`en.json`, `pt.json`, `es.json`) must stay in sync — add the key to all three at the same time. If a value is an array of objects, use the same shape across all three files.

Keys that return objects or arrays must be read with `returnObjects: true`. Plain string keys do not need it.

## What not to do

- **Do not add `configuration-snippet` to any ingress** — the admission webhook rejects them on this cluster.
- **Do not change `ingressClassName`** — must stay `nginx-internal`, not `nginx`.
- **Do not commit `dist/`** — it is produced by the Docker build stage and excluded by `.gitignore` and `.dockerignore`.
- **Do not set `base` in `vite.config.ts` to a sub-path** — the app is at the domain root; a sub-path base would break asset resolution.
- **Do not hardcode live service URLs in components** — use absolute paths (`/springboot/checkit`) so they work regardless of the browser's current route.
- **Do not add a `<Router>` or client-side routing library** — this is a single scrollable page. Navigation is anchor-based (`#springboot`, `#dotnet`, etc.).

## Shared CSS classes (src/index.css)

Before writing inline Tailwind for a new card or code block, check if one of these already covers it:

| Class | Use |
|---|---|
| `.section-card` | Dark card with border and padding |
| `.badge` | Small inline label/tag |
| `.code-block` | Monospace dark box for code snippets |
| `.step-connector` | Vertical line between numbered steps |
