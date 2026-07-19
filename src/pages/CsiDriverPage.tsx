import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'

interface CStep {
  litEdges: string[]
  hiNodes: string[]
  showSetup: boolean
  showJwt: boolean
  showCode: boolean
  showMask: boolean
}

// Node map: plugin box = CSI Driver + Conjur provider (the actor that mounts,
// authenticates and writes); job box = App + tmpfs Volume (the consumer);
// jwks(top) = projected ServiceAccount token; dev(bottom) = Browser.
const STEPS: CStep[] = [
  { litEdges: [],                                         hiNodes: ['pod','plugin','job','jwks','conjur','authn','vault','browser'], showSetup: false, showJwt: false, showCode: false, showMask: false },
  { litEdges: [],                                         hiNodes: ['plugin','conjur','authn','vault'],                              showSetup: true,  showJwt: false, showCode: false, showMask: false },
  { litEdges: ['dev-job'],                                hiNodes: ['browser','job'],                                                showSetup: false, showJwt: false, showCode: true,  showMask: false },
  { litEdges: ['job-plugin'],                             hiNodes: ['job','plugin'],                                                 showSetup: false, showJwt: true,  showCode: false, showMask: false },
  { litEdges: ['plugin-authn','authn-jwks','jwks-authn'], hiNodes: ['plugin','authn','jwks','pod'],                                  showSetup: false, showJwt: true,  showCode: false, showMask: false },
  { litEdges: ['authn-vault'],                            hiNodes: ['authn','vault','conjur'],                                       showSetup: false, showJwt: false, showCode: false, showMask: false },
  { litEdges: ['vault-plugin','plugin-job'],             hiNodes: ['vault','plugin','job'],                                         showSetup: false, showJwt: false, showCode: false, showMask: false },
  { litEdges: [],                                         hiNodes: ['job','browser'],                                                showSetup: false, showJwt: false, showCode: true,  showMask: true  },
]

const CK: Record<string, string> = {
  csi:    '#326ce5',
  purple: '#a78bfa',
  gold:   '#f59e0b',
  green:  '#4ade80',
}

interface Edge { id: string; d: string; ck: string; label: string; lx: number; ly: number }
const EDGES: Edge[] = [
  { id: 'dev-job',      d: 'M 330,400 C 275,400 275,265 230,265',      ck: 'csi',    label: 'GET /csidriver', lx: 268, ly: 333 },
  { id: 'job-plugin',   d: 'M 127,185 L 127,166',                       ck: 'csi',    label: 'mount',          lx: 100, ly: 176 },
  { id: 'plugin-authn', d: 'M 230,105 L 650,105',                       ck: 'purple', label: 'JWT sub=SA:csidriver', lx: 440, ly:  97 },
  { id: 'authn-jwks',   d: 'M 682,58 C 682,28 535,18 535,15',          ck: 'gold',   label: 'verify',         lx: 610, ly:  28 },
  { id: 'jwks-authn',   d: 'M 535,75 C 535,96 660,118 660,120',        ck: 'green',  label: 'SA token aud:conjur', lx: 585, ly: 105 },
  { id: 'authn-vault',  d: 'M 752,153 C 752,162 752,170 752,178',      ck: 'purple', label: 'authorize',      lx: 772, ly: 166 },
  { id: 'vault-plugin', d: 'M 752,313 C 752,405 127,405 127,166',      ck: 'green',  label: 'dbuser_dual',    lx: 440, ly: 413 },
  { id: 'plugin-job',   d: 'M 127,166 L 127,185',                       ck: 'green',  label: 'write tmpfs',    lx: 158, ly: 176 },
]

export default function CsiDriverPage() {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(true)
  const cur = STEPS[step]
  const total = STEPS.length

  const next = useCallback(() => setStep(s => (s + 1) % total), [total])
  const prev = useCallback(() => setStep(s => (s - 1 + total) % total), [total])

  useEffect(() => {
    if (!playing) return
    const id = setInterval(next, 2800)
    return () => clearInterval(id)
  }, [playing, next])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === ' ') { e.preventDefault(); setPlaying(p => !p) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev])

  const litEdge = (id: string) => cur.litEdges.includes(id)
  const hi      = (id: string) => cur.hiNodes.includes(id)
  const ns = (id: string, c: string) => hi(id) ? c : '#1e293b'
  const nf = (id: string, c: string) => hi(id) ? c + '12' : '#0f172a'

  const CONFIG: Array<[string, string, string]> = [
    ['CSI_ROTATION_INTERVAL', '2m0s', 'rotationPollInterval'],
    ['CSI_ROTATION_ENABLED', 'true', '--enable-secret-rotation'],
    ['CSI_PROVIDER_HEALTHCHECK', '2m', '--provider-health-check-interval'],
    ['CSI_REQUIRES_REPUBLISH', 'false', 'CSIDriver spec.requiresRepublish'],
    ['CSI_TOKEN_AUDIENCE', 'conjur', 'CSIDriver spec.tokenRequests'],
    ['CSI_VOLUME_MODE', 'Ephemeral (tmpfs)', 'volumeLifecycleModes'],
    ['CONJUR_APPLIANCE', 'your-tenant.secretsmgr.cyberark.cloud/api', 'SecretProviderClass'],
    ['CONJUR_ACCOUNT', 'conjur', 'SecretProviderClass'],
    ['CONJUR_AUTHN_ID', 'authn-jwt/your-cluster', 'SecretProviderClass'],
    ['CONJUR_CFG_VERSION', '0.2.0', 'conjur.org/configurationVersion'],
  ]

  return (
    <section className="min-h-screen bg-bg-base px-4 py-16 flex flex-col items-center">

      {/* Header */}
      <div className="w-full max-w-4xl text-center mb-6">
        <span className="badge mb-4">{t('csi.badge')}</span>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('csi.title')}</h1>
        <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          {t('csi.subtitle')}
        </p>
      </div>

      {/* Live demo button */}
      <a
        href="/csidriver/"
        className="inline-flex items-center gap-2 mb-10 px-6 py-3 rounded-full bg-csi text-white font-semibold hover:bg-csi/85 transition-colors shadow-lg"
      >
        {t('csi.cta')}
        <ExternalLink size={16} />
      </a>

      {/* SVG Diagram */}
      <div className="w-full max-w-5xl bg-bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-3 border-b border-border flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          <span className="ml-2 text-xs text-slate-500 font-mono">
            secrets-store.csi.k8s.io · conjur provider · step {step + 1}/{total}
          </span>
        </div>

        <svg viewBox="0 0 880 460" className="w-full h-auto select-none" style={{ fontFamily: 'ui-monospace, monospace' }}>
          <defs>
            {Object.entries(CK).map(([k, v]) => (
              <marker key={k} id={`arr-${k}`} viewBox="0 0 10 10" refX="9" refY="5"
                markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill={v} />
              </marker>
            ))}
          </defs>

          {/* ── Kubernetes Pod frame ── */}
          <rect x={10} y={15} width={235} height={315} rx={14}
            stroke={ns('pod','#326ce5')} strokeWidth={1.5} fill={hi('pod') ? '#326ce508' : 'transparent'}
            style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
          <text x={127} y={44} textAnchor="middle" fontSize={10} fontWeight="700"
            fill={hi('pod') ? '#326ce5' : '#64748b'} style={{ transition: 'fill 0.4s' }}>
            KUBERNETES · POD
          </text>
          <text x={127} y={57} textAnchor="middle" fontSize={8.5} fill="#475569">EKS your-cluster · ns conjur · SA csidriver</text>

          {/* CSI Driver + Provider box (actor) */}
          <rect x={25} y={65} width={205} height={100} rx={8}
            stroke={ns('plugin','#a78bfa')} strokeWidth={1.5} fill={nf('plugin','#a78bfa')}
            style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
          <text x={127} y={89} textAnchor="middle" fontSize={10} fontWeight="700"
            fill={hi('plugin') ? '#a78bfa' : '#94a3b8'} style={{ transition: 'fill 0.4s' }}>
            ⚙️ CSI Driver + Provider
          </text>
          <text x={127} y={104} textAnchor="middle" fontSize={8.5} fill="#64748b">secrets-store + conjur · kube-system</text>

          <AnimatePresence>
            {cur.showJwt && (
              <motion.g key="jwt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <rect x={35} y={112} width={185} height={44} rx={5} fill="#a78bfa18" stroke="#a78bfa44" strokeWidth={1} />
                <text x={127} y={126} textAnchor="middle" fontSize={7.5} fontWeight="700" fill="#a78bfa">projected SA JWT · aud:conjur</text>
                <text x={127} y={138} textAnchor="middle" fontSize={7} fill="#94a3b8">sub: system:serviceaccount:</text>
                <text x={127} y={149} textAnchor="middle" fontSize={7} fill="#94a3b8">conjur:csidriver → authn-jwt/your-cluster</text>
              </motion.g>
            )}
          </AnimatePresence>
          {!cur.showJwt && (
            <text x={127} y={133} textAnchor="middle" fontSize={8.5} fill="#64748b">mounts volume · authenticates</text>
          )}

          {/* App + Volume box (consumer) */}
          <rect x={25} y={185} width={205} height={135} rx={8}
            stroke={ns('job','#326ce5')} strokeWidth={1.5} fill={nf('job','#326ce5')}
            style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
          <text x={127} y={207} textAnchor="middle" fontSize={10} fontWeight="700"
            fill={hi('job') ? '#67aaff' : '#94a3b8'} style={{ transition: 'fill 0.4s' }}>
            🐍 App + 📁 Volume (tmpfs)
          </text>
          <text x={127} y={222} textAnchor="middle" fontSize={8.5} fill="#64748b">python:3.12 · /mnt/conjur-csi-volume</text>

          <AnimatePresence mode="wait">
            {cur.showMask ? (
              <motion.g key="mask" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <rect x={35} y={230} width={185} height={80} rx={5} fill="#326ce510" stroke="#326ce533" strokeWidth={1} />
                <text x={127} y={245} textAnchor="middle" fontSize={7.5} fontWeight="700" fill="#67aaff">PAGE · /csidriver</text>
                <text x={127} y={259} textAnchor="middle" fontSize={7.5} fill="#94a3b8">username: db-user</text>
                <text x={127} y={272} textAnchor="middle" fontSize={7.5} fill="#94a3b8">password: ••••••••  (?reveal=1)</text>
                <text x={127} y={285} textAnchor="middle" fontSize={7.5} fill="#94a3b8">address:  db-host</text>
                <text x={127} y={300} textAnchor="middle" fontSize={7} fill="#4ade80">auto-refresh 5s · rotates ≤ 2 min</text>
              </motion.g>
            ) : cur.showCode ? (
              <motion.g key="code" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <rect x={35} y={230} width={185} height={80} rx={5} fill="#1e293b" stroke="#334155" strokeWidth={1} />
                <text x={127} y={244} textAnchor="middle" fontSize={7.5} fontWeight="700" fill="#64748b">/mnt/conjur-csi-volume/</text>
                <text x={46} y={259} textAnchor="start" fontSize={7.5} fill="#67aaff">username.txt</text>
                <text x={46} y={272} textAnchor="start" fontSize={7.5} fill="#67aaff">password.txt</text>
                <text x={46} y={285} textAnchor="start" fontSize={7.5} fill="#67aaff">address.txt</text>
                <text x={127} y={300} textAnchor="middle" fontSize={7} fill="#64748b">tmpfs · readOnly · no K8s Secret</text>
              </motion.g>
            ) : (
              <motion.g key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <text x={127} y={262} textAnchor="middle" fontSize={8.5} fill="#64748b">reads *.txt each request</text>
                <text x={127} y={278} textAnchor="middle" fontSize={8.5} fill="#64748b">renders values on the page</text>
                <text x={127} y={294} textAnchor="middle" fontSize={8} fill="#475569">secret never leaves the volume</text>
              </motion.g>
            )}
          </AnimatePresence>

          {/* ── Projected SA Token (top center) ── */}
          <rect x={330} y={15} width={210} height={62} rx={8}
            stroke={ns('jwks','#f59e0b')} strokeWidth={1.5} fill={nf('jwks','#f59e0b')}
            style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
          <text x={435} y={38} textAnchor="middle" fontSize={10} fontWeight="700"
            fill={hi('jwks') ? '#f59e0b' : '#94a3b8'} style={{ transition: 'fill 0.4s' }}>
            🔑 Projected SA Token
          </text>
          <text x={435} y={52} textAnchor="middle" fontSize={8.5} fill="#64748b">downwardAPI /conjur/podinfo</text>
          <text x={435} y={66} textAnchor="middle" fontSize={8} fill={hi('jwks') ? '#f59e0b88' : '#334155'}
            style={{ transition: 'fill 0.4s' }}>tokenRequests audience: conjur</text>

          {/* ── Browser (bottom center) ── */}
          <rect x={330} y={360} width={210} height={80} rx={10}
            stroke={ns('browser','#4ade80')} strokeWidth={1.5} fill={nf('browser','#4ade80')}
            style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
          <text x={435} y={385} textAnchor="middle" fontSize={10} fontWeight="700"
            fill={hi('browser') ? '#4ade80' : '#94a3b8'} style={{ transition: 'fill 0.4s' }}>
            🌐 Browser
          </text>
          <text x={435} y={400} textAnchor="middle" fontSize={8.5} fill="#64748b">demo.minha.cloud/csidriver</text>
          <text x={435} y={416} textAnchor="middle" fontSize={8}
            fill={hi('browser') ? '#4ade8099' : '#334155'} style={{ transition: 'fill 0.4s' }}>
            ingress nginx-internal · TLS
          </text>
          <text x={435} y={430} textAnchor="middle" fontSize={8} fill="#475569">rewrite /$2 → csidriver-service:80</text>

          {/* ── Conjur Cloud frame ── */}
          <rect x={635} y={15} width={235} height={315} rx={14}
            stroke={ns('conjur','#326ce5')} strokeWidth={1.5} fill={hi('conjur') ? '#326ce508' : 'transparent'}
            style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
          <text x={752} y={44} textAnchor="middle" fontSize={10} fontWeight="700"
            fill={hi('conjur') ? '#326ce5' : '#64748b'} style={{ transition: 'fill 0.4s' }}>
            CYBERARK CONJUR CLOUD
          </text>
          <text x={752} y={57} textAnchor="middle" fontSize={8.5} fill="#475569">your-tenant.secretsmgr.cyberark.cloud</text>

          {/* authn box */}
          <rect x={650} y={65} width={205} height={100} rx={8}
            stroke={ns('authn','#a78bfa')} strokeWidth={1.5} fill={nf('authn','#a78bfa')}
            style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
          <text x={752} y={89} textAnchor="middle" fontSize={10} fontWeight="700"
            fill={hi('authn') ? '#a78bfa' : '#94a3b8'} style={{ transition: 'fill 0.4s' }}>
            🔐 authn-jwt/your-cluster
          </text>
          <text x={752} y={104} textAnchor="middle" fontSize={8.5} fill="#64748b">JWT authenticator</text>

          <AnimatePresence>
            {cur.showSetup && (
              <motion.g key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <rect x={660} y={111} width={185} height={45} rx={5} fill="#a78bfa18" stroke="#a78bfa44" strokeWidth={1} />
                <text x={752} y={125} textAnchor="middle" fontSize={7.5} fontWeight="700" fill="#a78bfa">SecretProviderClass</text>
                <text x={752} y={138} textAnchor="middle" fontSize={7} fill="#94a3b8">applianceUrl · account · authnId</text>
                <text x={752} y={149} textAnchor="middle" fontSize={7} fill="#94a3b8">conjur.org/secrets file→var map</text>
              </motion.g>
            )}
          </AnimatePresence>
          {!cur.showSetup && (
            <text x={752} y={130} textAnchor="middle" fontSize={8.5} fill="#64748b">validates JWT · resolves workload</text>
          )}

          {/* vault box */}
          <rect x={650} y={185} width={205} height={135} rx={8}
            stroke={ns('vault','#4ade80')} strokeWidth={1.5} fill={nf('vault','#4ade80')}
            style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
          <text x={752} y={209} textAnchor="middle" fontSize={10} fontWeight="700"
            fill={hi('vault') ? '#4ade80' : '#94a3b8'} style={{ transition: 'fill 0.4s' }}>
            🗄 Vault · dbuser_dual
          </text>
          <text x={752} y={225} textAnchor="middle" fontSize={7.5} fill="#64748b">data/vault/demo-safe/</text>
          <text x={752} y={238} textAnchor="middle" fontSize={7.5} fill="#64748b">dbuser_dual/username</text>
          <text x={752} y={250} textAnchor="middle" fontSize={7.5} fill="#64748b">dbuser_dual/password</text>
          <text x={752} y={262} textAnchor="middle" fontSize={7.5} fill="#64748b">dbuser_dual/address</text>
          <text x={752} y={278} textAnchor="middle" fontSize={8}
            fill={hi('vault') ? '#4ade8099' : '#334155'} style={{ transition: 'fill 0.4s' }}>
            read/execute → SA:csidriver
          </text>
          <text x={752} y={292} textAnchor="middle" fontSize={8} fill="#475569">rotation reconciler · polls 2 min</text>

          {/* Progress bar */}
          <rect x={650} y={300} width={205} height={6} rx={3} fill="#1e293b" />
          <motion.rect x={650} y={300} height={6} rx={3} fill="#326ce5"
            animate={{ width: 205 * (step / (total - 1)) }}
            transition={{ duration: 0.4, ease: 'easeOut' }} />
          <text x={752} y={320} textAnchor="middle" fontSize={7.5} fill="#475569">
            {t('csi.step_of', { current: step + 1, total })}
          </text>

          {/* ── Edges ── */}
          {EDGES.map(e => (
            <g key={e.id}>
              <motion.path
                d={e.d} fill="none" stroke={CK[e.ck]}
                strokeDasharray={litEdge(e.id) ? '7 4' : '0'}
                markerEnd={litEdge(e.id) ? `url(#arr-${e.ck})` : undefined}
                animate={{ opacity: litEdge(e.id) ? 1 : 0, strokeWidth: litEdge(e.id) ? 2 : 0 }}
                transition={{ duration: 0.3 }}
              />
              <AnimatePresence>
                {litEdge(e.id) && (
                  <motion.text key={`lbl-${e.id}`}
                    x={e.lx} y={e.ly} textAnchor="middle" fontSize={8} fontWeight="700" fill={CK[e.ck]}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {e.label}
                  </motion.text>
                )}
              </AnimatePresence>
            </g>
          ))}
        </svg>
      </div>

      {/* Step description */}
      <div className="w-full max-w-5xl mt-6">
        <div className="bg-bg-card border border-border rounded-xl p-5 min-h-[110px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              {t('csi.step_of', { current: step + 1, total })}
            </span>
            <span className="text-[10px] font-mono text-slate-600">{t('csi.keyboard_hint')}</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={step}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
              <p className="text-sm font-semibold text-white mb-1">{t(`csi.s${step + 1}_title`)}</p>
              <p className="text-sm text-slate-400 leading-relaxed">{t(`csi.s${step + 1}_desc`)}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 mt-4">
          <button onClick={prev}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <button key={i} onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-6 bg-csi' : 'w-1.5 bg-slate-700 hover:bg-slate-500'
                }`} />
            ))}
          </div>
          <button onClick={() => setPlaying(p => !p)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button onClick={next}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Concept cards */}
      <div className="w-full max-w-5xl mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(n => (
          <div key={n} className="section-card">
            <p className="text-sm font-semibold text-white mb-2">{t(`csi.key${n}_title`)}</p>
            <p className="text-xs text-slate-400 leading-relaxed">{t(`csi.key${n}_desc`)}</p>
          </div>
        ))}
      </div>

      {/* Config reference table */}
      <div className="w-full max-w-5xl mt-6 bg-bg-card border border-border rounded-xl p-5">
        <p className="text-xs font-semibold text-slate-300 mb-1 uppercase tracking-widest font-mono">
          {t('csi.config_title')}
        </p>
        <p className="text-xs text-slate-500 mb-4">{t('csi.config_note')}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <tbody>
              {CONFIG.map(([k, v, src]) => (
                <tr key={k} className="border-t border-border/60">
                  <td className="py-2 pr-3 text-csi whitespace-nowrap">{k}</td>
                  <td className="py-2 pr-3 text-slate-200 whitespace-nowrap">{v}</td>
                  <td className="py-2 text-slate-500">{src}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Architecture reference */}
      <div className="w-full max-w-5xl mt-6 bg-bg-card border border-border rounded-xl p-5">
        <p className="text-xs font-semibold text-slate-300 mb-3 uppercase tracking-widest font-mono">
          {t('csi.arch_title')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="flex gap-3 items-start">
              <span className="text-csi font-mono text-xs font-bold mt-0.5 shrink-0">
                {String(n).padStart(2, '0')}
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-200">{t(`csi.arch${n}_title`)}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{t(`csi.arch${n}_desc`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <a
        href="/csidriver/"
        className="inline-flex items-center gap-2 mt-10 px-6 py-3 rounded-full bg-csi text-white font-semibold hover:bg-csi/85 transition-colors shadow-lg"
      >
        {t('csi.cta')}
        <ExternalLink size={16} />
      </a>
    </section>
  )
}
