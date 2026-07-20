import { useTranslation } from 'react-i18next'

/**
 * CommandCenterFlow — hero centrepiece in the IDIRA "Command Center" style.
 * Seven workloads → their auth method → IDIRA (authn-jwt / authn-iam feed
 * policy · vault · CPM rotation · Dual Accounts) → the database they populate.
 * A token animates the full path per workload. Official IDIRA palette.
 */

const IDIRA_BLUE = '#265bff'
const CYAN = '#4ad1f0'
const PERI = '#7c8cff'
const ORANGE = '#fa582d'
const LILAC = '#a9b6ff'

// IDIRA is a wider box with two internal columns:
// authenticators on the LEFT (IL) feed policy/vault/rotation on the RIGHT (IR)
const IL = 766          // authenticators column
const IR = 892          // policy/vault/rotation column
const HDR = (IL + IR) / 2
// right column (policy → vault → CPM → Dual) with equal 88px gaps
const POLICY_Y = 224
const VAULT_Y = 312
const CPM_Y = 400
const DUAL_Y = 488
// authenticators are stacked vertically and centred in the IDIRA box
const BOX_TOP = POLICY_Y - 40
const BOX_BOTTOM = DUAL_Y + 40
const AUTHN_JWT_Y = (BOX_TOP + BOX_BOTTOM) / 2 - 44   // 312
const AUTHN_IAM_Y = (BOX_TOP + BOX_BOTTOM) / 2 + 44   // 400
const TX = 1082
const DB_Y = 312

interface WL { key: string; name: string; color: string; y: number; method: string }
const WX = 300
// ordered top→bottom grouped by auth method so links never cross
const WORKLOADS: WL[] = [
  { key: 'gha',     name: 'GitHub Actions', color: '#007bff', y: 100, method: 'oidc' },
  { key: 'spring',  name: 'Spring Boot',    color: '#4ad1f0', y: 168, method: 'jwt' },
  { key: 'eso',     name: 'ESO Shop',       color: '#3d9bff', y: 236, method: 'jwt' },
  { key: 'jenkins', name: 'Jenkins',        color: '#00c0e8', y: 304, method: 'jwt' },
  { key: 'csi',     name: 'CSI Driver',     color: '#265bff', y: 372, method: 'jwt' },
  { key: 'dotnet',  name: '.NET',           color: '#7c8cff', y: 440, method: 'sidecar' },
  { key: 'ansible', name: 'Ansible',        color: '#fa582d', y: 508, method: 'iam' },
]

const MX = 570
const METHODS: Record<string, { label: string; y: number; color: string; entry: number }> = {
  oidc:    { label: 'OIDC',    y: 130, color: '#007bff', entry: AUTHN_JWT_Y },
  jwt:     { label: 'JWT',     y: 250, color: CYAN,      entry: AUTHN_JWT_Y },
  sidecar: { label: 'Sidecar', y: 420, color: PERI,      entry: AUTHN_JWT_Y },
  iam:     { label: 'IAM',     y: 500, color: ORANGE,    entry: AUTHN_IAM_Y },
}

function seg(x1: number, y1: number, x2: number, y2: number) {
  if (x1 === x2) return `L ${x2} ${y2}`
  const dx = (x2 - x1) * 0.5
  return `C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
}
function curve(x1: number, y1: number, x2: number, y2: number) {
  return `M ${x1} ${y1} ${seg(x1, y1, x2, y2)}`
}
function chain(pts: Array<[number, number]>) {
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 1; i < pts.length; i++) d += ' ' + seg(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1])
  return d
}

// full path a secret travels: workload → method → authenticator → policy → vault → DB
function journey(w: WL): Array<[number, number]> {
  const m = METHODS[w.method]
  return [[WX + 12, w.y], [MX, m.y], [IL, m.entry], [IR, POLICY_Y], [IR, VAULT_Y], [TX - 20, DB_Y]]
}

function FlowToken({ w, delay }: { w: WL; delay: number }) {
  const d = chain(journey(w))
  return (
    <circle r={4} fill={w.color} style={{ filter: `drop-shadow(0 0 5px ${w.color})` }}>
      <animate attributeName="opacity" values="0;1;1;1;0" keyTimes="0;0.05;0.5;0.9;1" dur="4.4s" begin={`${delay}s`} repeatCount="indefinite" />
      <animateMotion path={d} dur="4.4s" begin={`${delay}s`} repeatCount="indefinite" />
    </circle>
  )
}

function RingNode({ x, y, color, r = 13, glyph }: { x: number; y: number; color: string; r?: number; glyph?: 'lock' | 'dot' }) {
  const s = r / 13
  return (
    <g>
      <circle cx={x} cy={y} r={r + 12} fill={color} opacity={0.12} />
      <circle cx={x} cy={y} r={r} fill="#0f1b3a" stroke={color} strokeWidth={1.75} />
      {glyph === 'lock' ? (
        <g stroke={color} strokeWidth={1.5} fill="none">
          <rect x={x - 4.5} y={y - 1} width={9} height={7.5} rx={1.4} fill={color} fillOpacity={0.9} stroke="none" />
          <path d={`M ${x - 3} ${y - 1} v -2.2 a 3 3 0 0 1 6 0 v 2.2`} />
        </g>
      ) : (
        <circle cx={x} cy={y} r={4 * s} fill={color} />
      )}
    </g>
  )
}

export default function CommandCenterFlow() {
  const { t } = useTranslation()

  return (
    <div className="w-full" aria-label={t('constellation.aria')} role="img">
      <svg viewBox="0 0 1240 600" className="w-full h-auto select-none" style={{ fontFamily: 'Onest, system-ui, sans-serif' }}>
        {/* Column headers */}
        {[
          [WX, t('ccflow.col_workloads')],
          [MX, t('ccflow.col_auth')],
          [HDR, 'IDIRA'],
          [TX, t('ccflow.col_delivery')],
        ].map(([x, label]) => (
          <text key={String(label)} x={x as number} y={40} textAnchor="middle" fontSize={12} fontWeight={700}
            fill="#8ea0c4" style={{ fontFamily: 'ui-monospace, monospace', letterSpacing: '0.14em' }}>
            {String(label).toUpperCase()}
          </text>
        ))}

        {/* Left metrics */}
        {[
          { v: '08', l: t('ccflow.m_workloads'), c: '#fff', y: 200 },
          { v: 'JWT', l: t('ccflow.m_auth'), c: CYAN, y: 310 },
          { v: '00', l: t('ccflow.m_rest'), c: ORANGE, y: 420 },
        ].map(m => (
          <g key={m.l}>
            <text x={40} y={m.y} fontSize={34} fontWeight={800} fill={m.c} className="tabular-nums">{m.v}</text>
            <text x={42} y={m.y + 20} fontSize={11} fill="#7488ac" style={{ fontFamily: 'ui-monospace, monospace' }}>{m.l}</text>
          </g>
        ))}

        {/* Links: workload → method */}
        {WORKLOADS.map(w => (
          <path key={`wl-${w.key}`} d={curve(WX + 14, w.y, MX - 14, METHODS[w.method].y)}
            fill="none" stroke={w.color} strokeOpacity={0.4} strokeWidth={1.4} />
        ))}

        {/* Links: method → IDIRA authenticator (left column) */}
        {Object.entries(METHODS).map(([k, m]) => (
          <path key={`m-${k}`} d={curve(MX + 14, m.y, IL - 16, m.entry)}
            fill="none" stroke={m.color} strokeOpacity={0.5} strokeWidth={2.2} />
        ))}

        {/* authenticators → policy (near-horizontal, converging) */}
        <path d={curve(IL + 16, AUTHN_JWT_Y, IR - 16, POLICY_Y)} fill="none" stroke={CYAN} strokeOpacity={0.5} strokeWidth={2} />
        <path d={curve(IL + 16, AUTHN_IAM_Y, IR - 16, POLICY_Y)} fill="none" stroke={ORANGE} strokeOpacity={0.5} strokeWidth={2} />

        {/* right spine: policy → vault → CPM rotation → Dual Accounts */}
        <line x1={IR} y1={POLICY_Y + 13} x2={IR} y2={VAULT_Y - 13} stroke={IDIRA_BLUE} strokeOpacity={0.5} strokeWidth={2} />
        <line x1={IR} y1={VAULT_Y + 13} x2={IR} y2={CPM_Y - 13} stroke={ORANGE} strokeOpacity={0.45} strokeWidth={2} strokeDasharray="4 4" />
        <line x1={IR} y1={CPM_Y + 13} x2={IR} y2={DUAL_Y - 13} stroke={LILAC} strokeOpacity={0.45} strokeWidth={2} strokeDasharray="4 4" />

        {/* vault → Databases (credential delivery) */}
        <path d={curve(IR + 16, VAULT_Y, TX - 24, DB_Y)} fill="none" stroke={IDIRA_BLUE} strokeOpacity={0.55} strokeWidth={2.6} />
        {/* CPM rotation → Databases (rotates the DB credential in place) */}
        <path d={curve(IR + 16, CPM_Y, TX - 24, DB_Y + 8)} fill="none" stroke={ORANGE} strokeOpacity={0.45} strokeWidth={2} strokeDasharray="5 5" />

        {/* IDIRA container box */}
        <rect x={IL - 44} y={BOX_TOP} width={(IR - IL) + 88} height={BOX_BOTTOM - BOX_TOP} rx={16}
          fill={IDIRA_BLUE} fillOpacity={0.05} stroke={IDIRA_BLUE} strokeOpacity={0.3} />

        {/* Animated tokens following the full path */}
        {WORKLOADS.map((w, i) => <FlowToken key={`tok-${w.key}`} w={w} delay={i * 0.55} />)}

        {/* CPM rotation pulse talking to the Database */}
        <circle r={3.5} fill={ORANGE} style={{ filter: `drop-shadow(0 0 4px ${ORANGE})` }}>
          <animate attributeName="opacity" values="0;1;1;0" dur="3s" repeatCount="indefinite" />
          <animateMotion path={curve(IR + 16, CPM_Y, TX - 24, DB_Y + 8)} dur="3s" repeatCount="indefinite" />
        </circle>

        {/* Workload nodes */}
        {WORKLOADS.map(w => (
          <g key={`node-${w.key}`}>
            <RingNode x={WX} y={w.y} color={w.color} r={12} />
            <text x={WX - 24} y={w.y + 4} textAnchor="end" fontSize={12.5} fontWeight={600} fill="#dbe4f4">{w.name}</text>
          </g>
        ))}

        {/* Method nodes */}
        {Object.values(METHODS).map(m => (
          <g key={`mn-${m.label}`}>
            <RingNode x={MX} y={m.y} color={m.color} r={13} />
            <text x={MX + 22} y={m.y + 4} textAnchor="start" fontSize={12.5} fontWeight={600} fill="#dbe4f4">{m.label}</text>
          </g>
        ))}

        {/* IDIRA authenticator nodes (left) */}
        {[
          { y: AUTHN_JWT_Y, label: 'authn-jwt', c: CYAN },
          { y: AUTHN_IAM_Y, label: 'authn-iam', c: ORANGE },
        ].map(n => (
          <g key={n.label}>
            <RingNode x={IL} y={n.y} color={n.c} r={13} glyph="lock" />
            <text x={IL} y={n.y - 21} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="#dbe4f4"
              style={{ fontFamily: 'ui-monospace, monospace' }}>{n.label}</text>
          </g>
        ))}

        {/* IDIRA policy / vault / rotation nodes (right) */}
        {[
          { y: POLICY_Y, label: 'policy', c: PERI, glyph: 'lock' as const },
          { y: VAULT_Y, label: 'vault', c: IDIRA_BLUE, glyph: 'lock' as const },
          { y: CPM_Y, label: 'CPM rotation', c: ORANGE, glyph: 'dot' as const },
          { y: DUAL_Y, label: 'Dual Accounts', c: LILAC, glyph: 'dot' as const },
        ].map(n => (
          <g key={n.label}>
            <RingNode x={IR} y={n.y} color={n.c} r={13} glyph={n.glyph} />
            <text x={IR} y={n.y - 21} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="#dbe4f4"
              style={{ fontFamily: 'ui-monospace, monospace' }}>{n.label}</text>
          </g>
        ))}

        {/* Rotation indicator around the CPM node */}
        <circle cx={IR} cy={CPM_Y} r={20} fill="none" stroke={ORANGE} strokeOpacity={0.6} strokeWidth={1.5} strokeDasharray="3 7">
          <animateTransform attributeName="transform" type="rotate" from={`0 ${IR} ${CPM_Y}`} to={`360 ${IR} ${CPM_Y}`} dur="7s" repeatCount="indefinite" />
        </circle>

        {/* Delivery — single, larger Databases node */}
        <RingNode x={TX} y={DB_Y} color={IDIRA_BLUE} r={22} />
        <text x={TX + 34} y={DB_Y - 2} textAnchor="start" fontSize={16} fontWeight={700} fill="#ffffff">Databases</text>
        <text x={TX + 34} y={DB_Y + 16} textAnchor="start" fontSize={10.5} fill="#8ea0c4"
          style={{ fontFamily: 'ui-monospace, monospace' }}>injected at runtime</text>
      </svg>
    </div>
  )
}
