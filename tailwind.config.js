/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // NavBar builds each item's dot color at runtime via
  // `item.color.replace('text-', 'bg-')`, so `bg-ansible` never appears as a
  // literal for the JIT to find. Other accents (bg-spring, bg-conjur-gold…) are
  // used literally elsewhere; this one isn't — safelist it so the dot renders.
  safelist: ['bg-ansible', 'bg-csi'],
  theme: {
    extend: {
      colors: {
        // ─── IDIRA theme tokens (driven by CSS variables, swap on dark) ─
        // bg.base / bg.card / bg.muted are kept as object form so existing
        // utility classes like `bg-bg-base` keep working unchanged.
        bg: {
          base:  'rgb(var(--rgb-bg) / <alpha-value>)',
          card:  'rgb(var(--rgb-surface) / <alpha-value>)',
          muted: 'rgb(var(--rgb-bg-alt) / <alpha-value>)',
        },
        border:    'rgb(var(--rgb-line) / <alpha-value>)',
        surface:   'rgb(var(--rgb-surface) / <alpha-value>)',
        line:      'rgb(var(--rgb-line) / <alpha-value>)',
        text:      'rgb(var(--rgb-text) / <alpha-value>)',
        'text-2':  'rgb(var(--rgb-text-2) / <alpha-value>)',
        'text-muted': 'rgb(var(--rgb-text-muted) / <alpha-value>)',

        // ─── Semantic tones (theme-aware, AA-safe as text/stroke/fill) ──
        tone: {
          accent:  'rgb(var(--rgb-tone-accent) / <alpha-value>)',
          live:    'rgb(var(--rgb-tone-live) / <alpha-value>)',
          success: 'rgb(var(--rgb-tone-success) / <alpha-value>)',
          warning: 'rgb(var(--rgb-tone-warning) / <alpha-value>)',
          danger:  'rgb(var(--rgb-tone-danger) / <alpha-value>)',
        },
        // ─── Domain colours: who owns a component (never status) ───────
        domain: {
          idira: 'rgb(var(--rgb-domain-idira) / <alpha-value>)',
          cp:    'rgb(var(--rgb-domain-cp) / <alpha-value>)',
          k8s:   'rgb(var(--rgb-domain-k8s) / <alpha-value>)',
          svc:   'rgb(var(--rgb-domain-svc) / <alpha-value>)',
        },

        // ─── Brand accents (constant in both themes) ───────────────────
        idira: {
          blue:        '#265bff',
          'blue-2':    '#1e48d9',
          'blue-deep': '#1a3bb8',
          orange:      '#fa582d',
          magenta:     '#ff2d8a',
          cyan:        '#4ad1f0',
          gold:        '#ffb800',
          deep:        '#091d58',
          navy:        '#131b2b',
        },

        // ─── Per-workload accents ──────────────────────────────────────
        // Demo brand accents: theme-aware for text/icons/tints (AA in both themes);
        // *-solid are fixed darker fills for buttons with white text (>= 4.5:1).
        spring:  'rgb(var(--rgb-spring) / <alpha-value>)',
        dotnet:  'rgb(var(--rgb-dotnet) / <alpha-value>)',
        gh:      'rgb(var(--rgb-gh) / <alpha-value>)',
        eso:     'rgb(var(--rgb-eso) / <alpha-value>)',
        ansible: 'rgb(var(--rgb-ansible) / <alpha-value>)',
        csi:     'rgb(var(--rgb-csi) / <alpha-value>)',
        'spring-solid':  '#167832',
        'dotnet-solid':  '#5a3fd0',
        'gh-solid':      '#265bff',
        'eso-solid':     '#c2410c',
        'ansible-solid': '#b91c1c',
        'csi-solid':     '#255ad2',

        // ─── Legacy CyberArk-era names kept as aliases on IDIRA tones ──
        // theme-aware (AA in both themes): vivid on dark, deeper on light
        conjur: {
          red:  'rgb(var(--rgb-conjur-red) / <alpha-value>)',
          cyan: 'rgb(var(--rgb-conjur-cyan) / <alpha-value>)',
          gold: 'rgb(var(--rgb-conjur-gold) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans:    ['Onest', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Onest', 'system-ui', '-apple-system', 'sans-serif'],
        mono:    ['IBM Plex Mono', 'ui-monospace', 'SF Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-up':    'fadeUp 0.6s ease forwards',
        'shimmer':    'shimmer 14s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: { to: { backgroundPosition: '200% 0' } },
      },
      boxShadow: {
        'idira-blue': '0 12px 40px -8px rgba(38, 91, 255, 0.35)',
        // Elevation scale (DESIGN.md §15): card < raised < overlay
        card:    '0 1px 2px rgb(11 15 25 / 0.06), 0 1px 3px rgb(11 15 25 / 0.08)',
        raised:  '0 8px 24px -6px rgb(11 15 25 / 0.18)',
        overlay: '0 24px 64px -12px rgb(0 0 0 / 0.45)',
      },
      // Motion tokens: fast (hover, press), base (state change), slow (panels, dialogs)
      transitionDuration: { fast: '150ms', base: '200ms', slow: '300ms' },
      transitionTimingFunction: { idira: 'cubic-bezier(0.2, 0.7, 0.2, 1)' },
      // Layering scale: content 0 to 20, chrome 40 to 50, overlays 60 to 70, skip link 100
      zIndex: { raised: '10', sticky: '20', sidebar: '40', header: '50', drawer: '60', modal: '70', skip: '100' },
    },
  },
  plugins: [],
}
