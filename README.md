# conjur-explainer

[![build](https://github.com/aslancarlos/conjur-explainer/actions/workflows/build.yml/badge.svg)](https://github.com/aslancarlos/conjur-explainer/actions/workflows/build.yml) [![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

Interactive single-page application that explains and demonstrates **IDIRA Secrets Manager** machine identity across four real integration patterns — all live and accessible from the same page.

> **2026-05-27 — rebrand & theme** · Visual language now follows [paloaltonetworks.com/idira](https://www.paloaltonetworks.com/idira): Onest typography + IBM Plex Mono, IDIRA palette (`#0067ff` blue / `#fa582d` orange / iridescent gradient), **dark + light theme** with user toggle in the nav (persists to `localStorage`, falls back to `prefers-color-scheme`). Skip-to-content link, visible focus rings, and `prefers-reduced-motion` support added (WCAG 2.4.1 / 2.3.3). See [`src/lib/useTheme.ts`](src/lib/useTheme.ts) and [`src/components/ThemeToggle.tsx`](src/components/ThemeToggle.tsx).

Live at: `https://demo.minha.cloud/`

---

## What this demonstrates

Each section of the page maps to a running workload that authenticates to IDIRA Secrets Manager via JWT and retrieves database credentials at runtime. No secrets are hardcoded or baked into images.

| Pattern | Workload | Path |
|---|---|---|
| Spring Boot + Secrets Manager SDK | Java app with `@Value` injection | `/springboot/dashboard` |
| .NET + Secrets Manager SDK | C# app with `IConfiguration` injection | `/dotnet/usuarios` |
| GitHub Actions + OIDC | CI/CD pipeline via `conjur-action` | External repo |
| ESO + IDIRA | Node.js app via External Secrets Operator | `/k8s-eso/` |

The page also links to live observability tools: Grafana, Kubernetes Dashboard, and the ESO Shop live dashboard.

---

## Architecture

```
Browser (SPA — served from nginx)
   │
   ├── fetches /springboot/checkit     → Spring Boot service (conjur namespace)
   └── fetches /k8s-eso/health         → ESO Shop service (eso-shop namespace)

All traffic enters via:
nginx Ingress (nginx-internal, demo.minha.cloud, TLS via cert-manager)
   │
   ├── /            → conjur-explainer   (conjur namespace, this app)
   ├── /springboot/ → springboot-app     (conjur namespace)
   ├── /dotnet/     → dotnet-app         (conjur namespace)
   ├── /k8s-eso/    → eso-shop           (eso-shop namespace)
   ├── /grafana     → grafana            (monitoring namespace)
   └── /dashboard/  → dashboard-proxy   (conjur namespace → kubernetes-dashboard namespace)
```

The SPA itself has no backend. All live status widgets call sibling services through the ingress using absolute paths that work because the app is hosted at the domain root.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Styling | Tailwind CSS 3 (custom design tokens) |
| Animations | Framer Motion 11 |
| Icons | Lucide React |
| i18n | react-i18next + i18next-browser-languagedetector |
| Container | Docker multi-stage (node:20-alpine build → nginx:alpine serve) |
| Orchestration | Kubernetes (EKS), namespace `conjur` |
| Ingress | nginx-internal, TLS from `k8scert` (cert-manager) |

---

## Project structure

```
├── src/
│   ├── main.tsx                    # Entry point, mounts App, initialises i18n
│   ├── App.tsx                     # Component composition — section render order
│   ├── i18n.ts                     # i18next setup (EN/PT/ES, browser lang detection)
│   ├── index.css                   # Global styles, Tailwind directives, shared classes
│   ├── locales/
│   │   ├── en.json                 # English (fallback language)
│   │   ├── pt.json                 # Portuguese
│   │   └── es.json                 # Spanish
│   └── components/
│       ├── NavBar.tsx              # Fixed top bar, anchor links, language switcher
│       ├── Hero.tsx                # Full-screen intro, CTA buttons, floating badges
│       ├── ProblemSection.tsx      # "Why Conjur?" — the problem statement
│       ├── ArchitectureDiagram.tsx # Interactive animated graph of the Conjur architecture
│       ├── SpringBootSection.tsx   # Pattern 1 — fetches /springboot/checkit live
│       ├── DotNetSection.tsx       # Pattern 2 — .NET integration walkthrough
│       ├── GitHubActionsSection.tsx# Pattern 3 — GitHub Actions OIDC/JWT
│       ├── ESOShopSection.tsx      # Pattern 4 — fetches /k8s-eso/health live
│       ├── LiveToolsSection.tsx    # Grid of links to all live running tools
│       ├── ComparisonTable.tsx     # 4-column comparison (Spring/. NET/GHA/ESO)
│       └── Footer.tsx
├── k8s/
│   ├── deployment.yaml             # 1 replica, conjur namespace, dockerhub-pull secret
│   ├── service.yaml                # ClusterIP, port 80
│   ├── ingress.yaml                # Serves / on demo.minha.cloud, nginx-internal
│   └── kubernetes-dashboard.yaml  # Full K8s Dashboard setup (multi-namespace manifest)
├── nginx.conf                      # SPA fallback: try_files → index.html, gzip enabled
├── Dockerfile                      # Multi-stage: node build → nginx serve
├── tailwind.config.js              # Custom color tokens and animations
├── vite.config.ts
└── package.json
```

---

## Design tokens

Custom colors defined in `tailwind.config.js`, used throughout all components:

| Token | Hex | Usage |
|---|---|---|
| `conjur-red` | `#d92b3a` | CyberArk brand red |
| `conjur-cyan` | `#00b4e0` | Conjur brand, primary highlights |
| `conjur-gold` | `#f59e0b` | Accents, comparison table |
| `spring` | `#6db33f` | Spring Boot section |
| `dotnet` | `#7b5cf6` | .NET section |
| `gh` | `#1f6feb` | GitHub Actions section |
| `eso` | `#f97316` | ESO Shop section |
| `bg-base` | `#050d1a` | Page background |
| `bg-card` | `#0c1828` | Card backgrounds |

---

## Local development

```bash
npm install
npm run dev        # Vite dev server on http://localhost:5173
```

The live status widgets (`SpringBootSection`, `ESOShopSection`) fetch `/springboot/checkit` and `/k8s-eso/health` with absolute paths. These will fail in local dev because the backend services only exist in the cluster. The widgets show an error state gracefully — this does not block development.

To proxy backend calls locally, add a `server.proxy` block to `vite.config.ts`:
```ts
server: {
  proxy: {
    '/springboot': 'https://demo.minha.cloud',
    '/k8s-eso':    'https://demo.minha.cloud',
  }
}
```

---

## Build and deploy

```bash
# Build and push the image
docker build --platform linux/amd64 -t aslancarlos/conjur-explainer:latest .
docker push aslancarlos/conjur-explainer:latest

# Restart the deployment
kubectl rollout restart deployment/conjur-explainer -n conjur
kubectl rollout status deployment/conjur-explainer -n conjur
```

The `dist/` folder is produced by `npm run build` inside the Docker build stage — it is not committed to the repository.

### First-time deployment

```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

The `dockerhub-pull` imagePullSecret must exist in the `conjur` namespace before deploying.

### Kubernetes Dashboard

`k8s/kubernetes-dashboard.yaml` is a standalone manifest that deploys the full K8s Dashboard setup. It creates resources in **two namespaces** (`kubernetes-dashboard` and `conjur`) in a single file:

- Kubernetes Dashboard v2.7.0 with `--enable-skip-login` and `--enable-insecure-login`
- Skip-login RBAC: `view` ClusterRole + secrets read-only + metrics read-only
- `dashboard-proxy` nginx pod in `conjur` namespace that injects `<base href="/dashboard/">` via `sub_filter`
- Ingress rule for `/dashboard/` path

```bash
kubectl apply -f k8s/kubernetes-dashboard.yaml
```

---

## i18n

Language detection order: browser language → `en` fallback. Language can be switched via the buttons in the NavBar, which calls `i18n.changeLanguage()` — no page reload.

Supported languages: `en`, `pt`, `es`. Translation files are in `src/locales/`.

Several translation keys return **arrays** used with `returnObjects: true`:
- `springboot.steps` — array of `{n, title, code, color}` objects
- `springboot.features` — array of `{title, desc}` objects
- `compare.rows` — array of 8 row objects (4 values each)
- `compare.best_for` — array of 4 `{title, desc}` objects
- `livetools.k8s_features` — array of feature strings

When adding keys that are arrays or objects, keep the same structure across all three locale files.

---

## Page sections

Sections are rendered in order in `App.tsx`. Each section component:
- Uses `useInView` (`framer-motion`) with `once: true` to trigger animations on first scroll into view
- Is independently translatable
- Has a `id` anchor matching the NavBar links

| Component | Anchor | Live fetch |
|---|---|---|
| Hero | — | — |
| ProblemSection | `#problem` | — |
| ArchitectureDiagram | `#architecture` | — |
| SpringBootSection | `#springboot` | `GET /springboot/checkit` |
| DotNetSection | `#dotnet` | — |
| GitHubActionsSection | `#gha` | — |
| ESOShopSection | `#esoshop` | `GET /k8s-eso/health` |
| LiveToolsSection | `#livetools` | — |
| ComparisonTable | `#compare` | — |
