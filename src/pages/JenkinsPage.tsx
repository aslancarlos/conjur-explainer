import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react'

interface JStep {
  litEdges: string[]
  hiNodes: string[]
  showSetup: boolean
  showJwt: boolean
  showCode: boolean
  showMask: boolean
}

const STEPS: JStep[] = [
  { litEdges: [],                                             hiNodes: ['jenkins','plugin','job','jwks','conjur','authn','vault','dev'], showSetup: false, showJwt: false, showCode: false, showMask: false },
  { litEdges: [],                                             hiNodes: ['plugin','conjur','authn','vault'],                             showSetup: true,  showJwt: false, showCode: false, showMask: false },
  { litEdges: ['dev-job'],                                    hiNodes: ['dev','job'],                                                   showSetup: false, showJwt: false, showCode: true,  showMask: false },
  { litEdges: ['job-plugin'],                                 hiNodes: ['job','plugin'],                                                showSetup: false, showJwt: true,  showCode: true,  showMask: false },
  { litEdges: ['plugin-authn','authn-jwks','jwks-authn'],     hiNodes: ['plugin','authn','jwks','jenkins'],                            showSetup: false, showJwt: true,  showCode: false, showMask: false },
  { litEdges: ['authn-vault'],                                hiNodes: ['authn','vault','conjur'],                                      showSetup: false, showJwt: false, showCode: false, showMask: false },
  { litEdges: ['vault-plugin','plugin-job'],                  hiNodes: ['vault','plugin','job'],                                        showSetup: false, showJwt: false, showCode: false, showMask: false },
  { litEdges: [],                                             hiNodes: ['job','dev'],                                                   showSetup: false, showJwt: false, showCode: true,  showMask: true  },
]

const CK: Record<string, string> = {
  cyan:   '#22d3ee',
  purple: '#a78bfa',
  gold:   '#f59e0b',
  green:  '#4ade80',
}

interface Edge { id: string; d: string; ck: string; label: string; lx: number; ly: number }
const EDGES: Edge[] = [
  { id: 'dev-job',      d: 'M 330,400 C 275,400 275,265 230,265',      ck: 'cyan',   label: 'trigger',  lx: 272, ly: 333 },
  { id: 'job-plugin',   d: 'M 127,178 C 127,163 127,153 127,153',      ck: 'purple', label: 'request',  lx: 100, ly: 165 },
  { id: 'plugin-authn', d: 'M 230,105 L 650,105',                       ck: 'purple', label: 'POST jwt', lx: 440, ly:  97 },
  { id: 'authn-jwks',   d: 'M 682,58 C 682,28 535,18 535,15',          ck: 'gold',   label: 'JWKS?',    lx: 610, ly:  28 },
  { id: 'jwks-authn',   d: 'M 535,75 C 535,96 660,118 660,120',        ck: 'green',  label: 'pub keys', lx: 592, ly: 105 },
  { id: 'authn-vault',  d: 'M 752,153 C 752,162 752,170 752,178',      ck: 'purple', label: 'verify ✓', lx: 768, ly: 165 },
  { id: 'vault-plugin', d: 'M 752,313 C 752,400 127,400 127,153',      ck: 'green',  label: 'secret',   lx: 440, ly: 408 },
  { id: 'plugin-job',   d: 'M 127,153 C 127,163 127,178 127,178',      ck: 'cyan',   label: 'env var',  lx: 152, ly: 165 },
]

export default function JenkinsPage() {
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

  return (
    <section className="min-h-screen bg-bg-base px-4 py-16 flex flex-col items-center">

      {/* Header */}
      <div className="w-full max-w-4xl text-center mb-10">
        <span className="badge mb-4">{t('jenkins.badge')}</span>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('jenkins.title')}</h1>
        <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          {t('jenkins.subtitle')}
        </p>
      </div>

      {/* SVG Diagram */}
      <div className="w-full max-w-5xl bg-bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-3 border-b border-border flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          <span className="ml-2 text-xs text-slate-500 font-mono">
            jenkins · conjur-credentials-plugin · step {step + 1}/{total}
          </span>
        </div>

        <svg viewBox="0 0 880 450" className="w-full h-auto select-none" style={{ fontFamily: 'ui-monospace, monospace' }}>
          <defs>
            {Object.entries(CK).map(([k, v]) => (
              <marker key={k} id={`arr-${k}`} viewBox="0 0 10 10" refX="9" refY="5"
                markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill={v} />
              </marker>
            ))}
          </defs>

          {/* ── Jenkins Server frame ── */}
          <rect x={10} y={15} width={235} height={315} rx={14}
            stroke={ns('jenkins','#f59e0b')} strokeWidth={1.5} fill={hi('jenkins') ? '#f59e0b08' : 'transparent'}
            style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
          <text x={127} y={44} textAnchor="middle" fontSize={10} fontWeight="700"
            fill={hi('jenkins') ? '#f59e0b' : '#64748b'} style={{ transition: 'fill 0.4s' }}>
            JENKINS SERVER
          </text>
          <text x={127} y={57} textAnchor="middle" fontSize={8.5} fill="#475569">CI/CD · v2.455+</text>

          {/* Plugin box */}
          <rect x={25} y={65} width={205} height={100} rx={8}
            stroke={ns('plugin','#a78bfa')} strokeWidth={1.5} fill={nf('plugin','#a78bfa')}
            style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
          <text x={127} y={89} textAnchor="middle" fontSize={10} fontWeight="700"
            fill={hi('plugin') ? '#a78bfa' : '#94a3b8'} style={{ transition: 'fill 0.4s' }}>
            🔌 Conjur Credentials Plugin
          </text>
          <text x={127} y={104} textAnchor="middle" fontSize={8.5} fill="#64748b">conjur-credentials v3.x</text>

          {/* JWT overlay in plugin box */}
          <AnimatePresence>
            {cur.showJwt && (
              <motion.g key="jwt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <rect x={35} y={112} width={185} height={44} rx={5} fill="#a78bfa18" stroke="#a78bfa44" strokeWidth={1} />
                <text x={127} y={126} textAnchor="middle" fontSize={7.5} fontWeight="700" fill="#a78bfa">JWT  iss:jenkins.acme.com</text>
                <text x={127} y={138} textAnchor="middle" fontSize={7.5} fill="#94a3b8">aud:cyberark-conjur  sub:Proj1/pipeline</text>
                <text x={127} y={150} textAnchor="middle" fontSize={7.5} fill="#64748b">exp:now+120s  signed by Jenkins key</text>
              </motion.g>
            )}
          </AnimatePresence>
          {!cur.showJwt && (
            <text x={127} y={133} textAnchor="middle" fontSize={8.5} fill="#64748b">generates JWT · fetches secrets</text>
          )}

          {/* Job box */}
          <rect x={25} y={185} width={205} height={135} rx={8}
            stroke={ns('job','#22d3ee')} strokeWidth={1.5} fill={nf('job','#22d3ee')}
            style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
          <text x={127} y={207} textAnchor="middle" fontSize={10} fontWeight="700"
            fill={hi('job') ? '#22d3ee' : '#94a3b8'} style={{ transition: 'fill 0.4s' }}>
            📋 Pipeline Job
          </text>
          <text x={127} y={222} textAnchor="middle" fontSize={8.5} fill="#64748b">Jenkinsfile · Project1/pipeline</text>

          {/* Code / mask overlay in job box */}
          <AnimatePresence mode="wait">
            {cur.showMask ? (
              <motion.g key="mask" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <rect x={35} y={230} width={185} height={80} rx={5} fill="#22d3ee10" stroke="#22d3ee33" strokeWidth={1} />
                <text x={127} y={245} textAnchor="middle" fontSize={7.5} fontWeight="700" fill="#22d3ee">BUILD LOG</text>
                <text x={127} y={259} textAnchor="middle" fontSize={7.5} fill="#94a3b8">+ deploy --db=***</text>
                <text x={127} y={272} textAnchor="middle" fontSize={7.5} fill="#94a3b8">+ git push https://***:***@github.com</text>
                <text x={127} y={285} textAnchor="middle" fontSize={7.5} fill="#4ade80">✓ Deploy successful</text>
                <text x={127} y={300} textAnchor="middle" fontSize={7} fill="#64748b">secret values masked automatically</text>
              </motion.g>
            ) : cur.showCode ? (
              <motion.g key="code" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <rect x={35} y={230} width={185} height={80} rx={5} fill="#1e293b" stroke="#334155" strokeWidth={1} />
                <text x={127} y={245} textAnchor="middle" fontSize={7.5} fontWeight="700" fill="#64748b">Jenkinsfile</text>
                <text x={42}  y={259} textAnchor="start"  fontSize={7.5} fill="#94a3b8">withCredentials([</text>
                <text x={42}  y={271} textAnchor="start"  fontSize={7.5} fill="#a78bfa">  conjurSecretCredential(</text>
                <text x={42}  y={283} textAnchor="start"  fontSize={7.5} fill="#94a3b8">    credentialsId: <tspan fill="#4ade80">'DB_PWD'</tspan>,</text>
                <text x={42}  y={295} textAnchor="start"  fontSize={7.5} fill="#94a3b8">    variable: <tspan fill="#22d3ee">'DB_PASSWORD'</tspan>)])</text>
              </motion.g>
            ) : (
              <motion.g key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <text x={127} y={258} textAnchor="middle" fontSize={8.5} fill="#64748b">withCredentials([ ])</text>
                <text x={127} y={274} textAnchor="middle" fontSize={8.5} fill="#64748b">env vars injected at runtime</text>
                <text x={127} y={290} textAnchor="middle" fontSize={8} fill="#475569">secrets never stored in Jenkinsfile</text>
              </motion.g>
            )}
          </AnimatePresence>

          {/* ── JWKS Endpoint (top center) ── */}
          <rect x={330} y={15} width={210} height={62} rx={8}
            stroke={ns('jwks','#f59e0b')} strokeWidth={1.5} fill={nf('jwks','#f59e0b')}
            style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
          <text x={435} y={38} textAnchor="middle" fontSize={10} fontWeight="700"
            fill={hi('jwks') ? '#f59e0b' : '#94a3b8'} style={{ transition: 'fill 0.4s' }}>
            🔑 JWKS Endpoint
          </text>
          <text x={435} y={52} textAnchor="middle" fontSize={8.5} fill="#64748b">jenkins/jwtauth/conjur-jwk-set</text>
          <text x={435} y={66} textAnchor="middle" fontSize={8} fill={hi('jwks') ? '#f59e0b88' : '#334155'}
            style={{ transition: 'fill 0.4s' }}>RSA public keys · Jenkins-signed</text>

          {/* ── Developer / Trigger (bottom center) ── */}
          <rect x={330} y={360} width={210} height={78} rx={10}
            stroke={ns('dev','#4ade80')} strokeWidth={1.5} fill={nf('dev','#4ade80')}
            style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
          <text x={435} y={385} textAnchor="middle" fontSize={10} fontWeight="700"
            fill={hi('dev') ? '#4ade80' : '#94a3b8'} style={{ transition: 'fill 0.4s' }}>
            👩‍💻 Developer
          </text>
          <text x={435} y={400} textAnchor="middle" fontSize={8.5} fill="#64748b">push to repo · manual trigger</text>
          <text x={435} y={414} textAnchor="middle" fontSize={8}
            fill={hi('dev') ? '#4ade8099' : '#334155'} style={{ transition: 'fill 0.4s' }}>
            no secrets in source code ✓
          </text>
          <text x={435} y={428} textAnchor="middle" fontSize={8} fill="#475569">Jenkinsfile uses Credential IDs only</text>

          {/* ── Secrets Manager frame ── */}
          <rect x={635} y={15} width={235} height={315} rx={14}
            stroke={ns('conjur','#22d3ee')} strokeWidth={1.5} fill={hi('conjur') ? '#22d3ee08' : 'transparent'}
            style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
          <text x={752} y={44} textAnchor="middle" fontSize={10} fontWeight="700"
            fill={hi('conjur') ? '#22d3ee' : '#64748b'} style={{ transition: 'fill 0.4s' }}>
            SECRETS MANAGER
          </text>
          <text x={752} y={57} textAnchor="middle" fontSize={8.5} fill="#475569">CyberArk · authn-jwt/jenkins</text>

          {/* JWT Auth box */}
          <rect x={650} y={65} width={205} height={100} rx={8}
            stroke={ns('authn','#a78bfa')} strokeWidth={1.5} fill={nf('authn','#a78bfa')}
            style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
          <text x={752} y={89} textAnchor="middle" fontSize={10} fontWeight="700"
            fill={hi('authn') ? '#a78bfa' : '#94a3b8'} style={{ transition: 'fill 0.4s' }}>
            🔐 JWT Authenticator
          </text>
          <text x={752} y={104} textAnchor="middle" fontSize={8.5} fill="#64748b">authn-jwt/jenkins webservice</text>

          {/* Setup config overlay in authn box */}
          <AnimatePresence>
            {cur.showSetup && (
              <motion.g key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <rect x={660} y={111} width={185} height={45} rx={5} fill="#a78bfa18" stroke="#a78bfa44" strokeWidth={1} />
                <text x={752} y={125} textAnchor="middle" fontSize={7.5} fontWeight="700" fill="#a78bfa">POLICY CONFIG</text>
                <text x={752} y={138} textAnchor="middle" fontSize={7.5} fill="#94a3b8">jwks-uri · token-app-property</text>
                <text x={752} y={151} textAnchor="middle" fontSize={7.5} fill="#94a3b8">issuer · audience: cyberark-conjur</text>
              </motion.g>
            )}
          </AnimatePresence>
          {!cur.showSetup && (
            <text x={752} y={130} textAnchor="middle" fontSize={8.5} fill="#64748b">validates JWT · resolves identity</text>
          )}

          {/* Vault box */}
          <rect x={650} y={185} width={205} height={135} rx={8}
            stroke={ns('vault','#4ade80')} strokeWidth={1.5} fill={nf('vault','#4ade80')}
            style={{ transition: 'stroke 0.4s, fill 0.4s' }} />
          <text x={752} y={209} textAnchor="middle" fontSize={10} fontWeight="700"
            fill={hi('vault') ? '#4ade80' : '#94a3b8'} style={{ transition: 'fill 0.4s' }}>
            🗄 Secrets Vault
          </text>
          <text x={752} y={224} textAnchor="middle" fontSize={8.5} fill="#64748b">jenkins_secrets/db_password</text>
          <text x={752} y={238} textAnchor="middle" fontSize={8.5} fill="#64748b">jenkins_secrets/api_key</text>
          <text x={752} y={252} textAnchor="middle" fontSize={8.5} fill="#64748b">jenkins_secrets/github_token</text>
          <text x={752} y={269} textAnchor="middle" fontSize={8}
            fill={hi('vault') ? '#4ade8099' : '#334155'} style={{ transition: 'fill 0.4s' }}>
            !permit: read/execute → jenkins layer
          </text>
          <text x={752} y={283} textAnchor="middle" fontSize={8} fill="#475569">policy-based · audited · rotated</text>

          {/* Progress bar */}
          <rect x={650} y={298} width={205} height={6} rx={3} fill="#1e293b" />
          <motion.rect x={650} y={298} height={6} rx={3} fill="#a78bfa"
            animate={{ width: 205 * (step / (total - 1)) }}
            transition={{ duration: 0.4, ease: 'easeOut' }} />
          <text x={752} y={318} textAnchor="middle" fontSize={7.5} fill="#475569">
            {t('jenkins.step_of', { current: step + 1, total })}
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
              {t('jenkins.step_of', { current: step + 1, total })}
            </span>
            <span className="text-[10px] font-mono text-slate-600">{t('jenkins.keyboard_hint')}</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={step}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
              <p className="text-sm font-semibold text-white mb-1">{t(`jenkins.s${step + 1}_title`)}</p>
              <p className="text-sm text-slate-400 leading-relaxed">{t(`jenkins.s${step + 1}_desc`)}</p>
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
                  i === step ? 'w-6 bg-purple-400' : 'w-1.5 bg-slate-700 hover:bg-slate-500'
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
            <p className="text-sm font-semibold text-white mb-2">{t(`jenkins.key${n}_title`)}</p>
            <p className="text-xs text-slate-400 leading-relaxed">{t(`jenkins.key${n}_desc`)}</p>
          </div>
        ))}
      </div>

      {/* Architecture reference */}
      <div className="w-full max-w-5xl mt-6 bg-bg-card border border-border rounded-xl p-5">
        <p className="text-xs font-semibold text-slate-300 mb-3 uppercase tracking-widest font-mono">
          {t('jenkins.arch_title')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="flex gap-3 items-start">
              <span className="text-purple-400 font-mono text-xs font-bold mt-0.5 shrink-0">
                {String(n).padStart(2, '0')}
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-200">{t(`jenkins.arch${n}_title`)}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{t(`jenkins.arch${n}_desc`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
