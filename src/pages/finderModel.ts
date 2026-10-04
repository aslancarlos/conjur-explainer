/**
 * Solution finder model (pure data + rules, no React).
 *
 * Step 1 picks ENVIRONMENTS. Step 2 shows only the DETAIL groups of the picked
 * environments (AWS -> EC2, Lambda, EKS...; Azure -> VMs, AKS, DevOps, Key
 * Vault...). Step 3 picks GOALS (what the customer wants to solve); a goal is
 * only enabled when the details make it meaningful.
 *
 * Rules: every recommendation (RECS) has one or more `when` clauses. A clause
 * matches when at least one of its `any` detail ids is selected AND one of its
 * `goals` is selected (or inferred). Goals are inferred from the details when
 * the user picks "Not sure" or no goal at all. Products are ranked by how many
 * selected details their included recommendations cover; products with no
 * recommendation go to "Why not", with the goal that would enable them when
 * the details already fit. Every recommendation points to an existing page
 * whose copy is the source of the reason shown to the user.
 *
 * Canonical case: only Azure + Azure Key Vault -> Secrets Hub; Secrets Manager
 * is not recommended (nothing reads secrets at run time).
 */
export type Prod = 'sm' | 'swa' | 'cp' | 'shub'
export type EnvId = 'aws' | 'azure' | 'gcp' | 'k8s' | 'onprem' | 'mainframe' | 'cicd' | 'ai' | 'pam' | 'other'
export type GoalId = 'hardcoded' | 'vault_gov' | 'legacy_pam' | 'workload_id' | 'ai' | 'dynamic' | 'rotation' | 'audit'

export const PRODUCTS: Array<{ key: Prod; navKey: string }> = [
  { key: 'sm', navKey: 'secretsmanager' },
  { key: 'swa', navKey: 'swa' },
  { key: 'cp', navKey: 'cp' },
  { key: 'shub', navKey: 'secretshub' },
]

export const ENVS: EnvId[] = ['aws', 'azure', 'gcp', 'k8s', 'onprem', 'mainframe', 'cicd', 'ai', 'pam', 'other']

/** Step 2 groups. A detail may appear in two groups (Azure DevOps): same id, same meaning. */
export const DETAIL_GROUPS: Array<{ env: EnvId | 'apps'; details: string[] }> = [
  { env: 'aws', details: ['aws_ec2', 'aws_lambda', 'aws_eks', 'aws_ecs', 'aws_sm'] },
  { env: 'azure', details: ['az_vm', 'az_aks', 'az_app', 'azdo', 'az_kv'] },
  { env: 'gcp', details: ['gcp_ce', 'gcp_gke', 'gcp_run', 'gcp_sm'] },
  { env: 'k8s', details: ['k8s_openshift', 'k8s_other'] },
  { env: 'onprem', details: ['op_linux', 'op_windows', 'op_appservers', 'op_legacy', 'op_cf', 'op_db', 'op_hcv', 'op_iot'] },
  { env: 'mainframe', details: ['mf_zos'] },
  { env: 'cicd', details: ['ci_jenkins', 'ci_gitlab', 'ci_gha', 'azdo', 'ci_bitbucket', 'ci_circleci', 'ci_octopus', 'ci_ansible', 'ci_terraform', 'ci_puppet'] },
  { env: 'ai', details: ['ai_agents', 'ai_mcp'] },
  { env: 'pam', details: ['pam_pc', 'pam_sh'] },
  { env: 'apps', details: ['app_java', 'app_dotnet', 'app_python', 'app_mulesoft'] },
]
/**
 * Colour technology logos, self-hosted SVGs in public/icons/tech: brand
 * logos from SVG Logos (CC0), generic concepts from Flat Color Icons (MIT)
 * or Fluent UI color icons (MIT). See THIRD_PARTY_NOTICES.md.
 */
const LOGO_IDS = ['aws', 'azure', 'gcp', 'k8s', 'onprem', 'mainframe', 'cicd', 'ai', 'pam', 'other', 'aws_ec2', 'aws_lambda', 'aws_eks', 'aws_ecs', 'aws_sm', 'az_vm', 'az_aks', 'az_app', 'azdo', 'az_kv', 'gcp_ce', 'gcp_gke', 'gcp_run', 'gcp_sm', 'k8s_openshift', 'k8s_other', 'op_linux', 'op_windows', 'op_appservers', 'op_legacy', 'op_cf', 'op_db', 'op_hcv', 'op_iot', 'mf_zos', 'ci_jenkins', 'ci_gitlab', 'ci_gha', 'ci_bitbucket', 'ci_circleci', 'ci_octopus', 'ci_ansible', 'ci_terraform', 'ci_puppet', 'ai_agents', 'ai_mcp', 'pam_pc', 'pam_sh', 'app_java', 'app_dotnet', 'app_python', 'app_mulesoft']
export const LOGO: Record<string, string> = Object.fromEntries(LOGO_IDS.map(id => [id, `/icons/tech/${id}.svg`]))

/** The applications group appears when any compute environment is picked. */
export const APPS_ENVS: EnvId[] = ['aws', 'azure', 'gcp', 'k8s', 'onprem']
export const DETAILS = [...new Set(DETAIL_GROUPS.flatMap(g => g.details))]
/** Context details describe the PAM in place; they are not counted as items to cover. */
export const CONTEXT = new Set(['pam_pc', 'pam_sh'])

const K8S = ['aws_eks', 'az_aks', 'gcp_gke', 'k8s_openshift', 'k8s_other']
const VMS = ['aws_ec2', 'az_vm', 'gcp_ce', 'op_linux', 'op_windows']
const SERVERLESS = ['aws_lambda', 'aws_ecs', 'az_app', 'gcp_run']
const CICD = ['ci_jenkins', 'ci_gitlab', 'ci_gha', 'azdo', 'ci_bitbucket', 'ci_circleci', 'ci_octopus', 'ci_ansible', 'ci_terraform', 'ci_puppet']
const APPS = ['app_java', 'app_dotnet', 'app_python', 'app_mulesoft']
export const STORES = ['aws_sm', 'az_kv', 'gcp_sm', 'op_hcv']
const LEGACY = ['op_appservers', 'op_legacy', 'mf_zos']
const AI = ['ai_agents', 'ai_mcp']
const AWS_ANY = ['aws_ec2', 'aws_lambda', 'aws_eks', 'aws_ecs']
const GCP_ANY = ['gcp_ce', 'gcp_gke', 'gcp_run']

/** Goals and the details that make each one meaningful (enabled when any is selected). */
export const GOALS: Array<{ id: GoalId; enabledBy: string[] | 'any' }> = [
  { id: 'hardcoded', enabledBy: [...K8S, ...VMS, ...SERVERLESS, ...CICD, ...APPS, 'op_cf', 'op_db', 'op_iot', ...LEGACY, ...AI] },
  { id: 'vault_gov', enabledBy: STORES },
  { id: 'legacy_pam', enabledBy: [...LEGACY, ...VMS, 'op_db'] },
  { id: 'workload_id', enabledBy: [...K8S, 'aws_ec2', 'az_vm', 'gcp_ce', 'op_linux'] },
  { id: 'ai', enabledBy: AI },
  { id: 'dynamic', enabledBy: [...AWS_ANY, ...GCP_ANY] },
  { id: 'rotation', enabledBy: [...LEGACY, ...VMS, 'op_db', ...STORES] },
  { id: 'audit', enabledBy: 'any' },
]

interface Clause { any: string[]; goals: GoalId[] }
export interface Rec {
  to: string
  product: Prod
  when: Clause[]
  /** Secrets Hub source: kept only when that PAM is picked (or when no PAM is picked). */
  pam?: 'pc' | 'sh'
  /** Reading path position: overviews first, capabilities last. */
  kind?: 'overview' | 'capability'
}
const W = (any: string[], goals: GoalId[]): Clause => ({ any, goals })

export const RECS: Record<string, Rec> = {
  k8sArch: { to: '/concepts/kubernetes', product: 'sm', kind: 'overview', when: [W(K8S, ['hardcoded'])] },
  sdk: { to: '/spring-boot', product: 'sm', when: [W([...K8S, 'app_java'], ['hardcoded'])] },
  sidecar: { to: '/dotnet', product: 'sm', when: [W([...K8S, 'app_dotnet'], ['hardcoded'])] },
  eso: { to: '/eso-shop', product: 'sm', when: [W(K8S, ['hardcoded'])] },
  csi: { to: '/csi', product: 'sm', when: [W(K8S, ['hardcoded'])] },
  spmodes: { to: '/k8s/secrets-provider-modes', product: 'sm', kind: 'capability', when: [W(K8S, ['hardcoded'])] },
  reloader: { to: '/k8s/reloader', product: 'sm', kind: 'capability', when: [W(K8S, ['hardcoded', 'rotation'])] },
  secretless: { to: '/k8s/secretless', product: 'sm', when: [W(['op_db'], ['hardcoded', 'rotation'])] },
  jenkins: { to: '/jenkins', product: 'sm', when: [W(['ci_jenkins'], ['hardcoded'])] },
  gitlab: { to: '/cicd/gitlab', product: 'sm', when: [W(['ci_gitlab'], ['hardcoded'])] },
  azdo: { to: '/cicd/azure-devops', product: 'sm', when: [W(['azdo'], ['hardcoded'])] },
  gha: { to: '/github-actions', product: 'sm', when: [W(['ci_gha'], ['hardcoded'])] },
  bitbucket: { to: '/cicd/bitbucket', product: 'sm', when: [W(['ci_bitbucket'], ['hardcoded'])] },
  circleci: { to: '/cicd/circleci', product: 'sm', when: [W(['ci_circleci'], ['hardcoded'])] },
  octopus: { to: '/cicd/octopus', product: 'sm', when: [W(['ci_octopus'], ['hardcoded'])] },
  ansible: { to: '/ansible', product: 'sm', when: [W(['ci_ansible'], ['hardcoded'])] },
  terraform: { to: '/cicd/terraform', product: 'sm', when: [W(['ci_terraform'], ['hardcoded'])] },
  puppet: { to: '/platforms/puppet', product: 'sm', when: [W(['ci_puppet'], ['hardcoded'])] },
  cf: { to: '/platforms/cloud-foundry', product: 'sm', when: [W(['op_cf'], ['hardcoded'])] },
  mulesoft: { to: '/platforms/mulesoft', product: 'sm', when: [W(['app_mulesoft'], ['hardcoded'])] },
  python: { to: '/platforms/python-aws', product: 'sm', when: [W(['app_python', 'aws_lambda'], ['hardcoded'])] },
  awsIam: { to: '/authn/aws-iam', product: 'sm', when: [W(['aws_ec2', 'aws_lambda', 'aws_ecs'], ['hardcoded'])] },
  azureMi: { to: '/authn/azure', product: 'sm', when: [W(['az_vm', 'az_app'], ['hardcoded'])] },
  gcpId: { to: '/authn/gcp', product: 'sm', when: [W(['gcp_ce', 'gcp_run'], ['hardcoded'])] },
  dynamic: { to: '/sm/dynamic-secrets', product: 'sm', kind: 'capability', when: [W([...AWS_ANY, ...GCP_ANY], ['dynamic'])] },
  apiKey: { to: '/authn/api-key', product: 'sm', when: [W(['op_linux', 'op_windows', 'op_iot'], ['hardcoded'])] },
  cert: { to: '/authn/certificate', product: 'sm', when: [W(['op_linux', 'op_iot'], ['hardcoded'])] },
  summon: { to: '/sm/summon', product: 'sm', kind: 'capability', when: [W(['op_linux'], ['hardcoded'])] },
  rotation: { to: '/sm/rotation', product: 'sm', kind: 'capability', when: [W(['op_db'], ['rotation'])] },
  mcp: { to: '/ai/mcp-server', product: 'sm', when: [W(AI, ['ai', 'hardcoded'])] },
  audit: { to: '/sm/audit', product: 'sm', kind: 'capability', when: [W([...K8S, ...VMS, ...SERVERLESS, ...CICD, ...APPS, 'op_cf', 'op_db'], ['audit'])] },
  swaArch: { to: '/concepts/swa-architecture', product: 'swa', kind: 'overview', when: [W([...K8S, 'aws_ec2', 'az_vm', 'gcp_ce', 'op_linux'], ['workload_id'])] },
  svid: { to: '/svid', product: 'swa', when: [W([...K8S, 'aws_ec2', 'az_vm', 'gcp_ce', 'op_linux'], ['workload_id'])] },
  swaS3: { to: '/swa-s3', product: 'swa', when: [W(['aws_eks', 'aws_ec2'], ['workload_id'])] },
  swaAi: { to: '/ai/swa-agents', product: 'swa', when: [W(['ai_agents'], ['ai'])] },
  cpAgent: { to: '/cp/credential-provider', product: 'cp', when: [W(['op_linux', 'op_windows', 'op_legacy', 'aws_ec2', 'az_vm', 'gcp_ce'], ['legacy_pam']), W(['op_legacy'], ['hardcoded'])] },
  ascp: { to: '/cp/ascp', product: 'cp', when: [W(['op_appservers'], ['legacy_pam', 'hardcoded'])] },
  ccp: { to: '/cp/ccp', product: 'cp', when: [W(['op_legacy', 'op_windows', 'op_appservers'], ['legacy_pam']), W(['op_legacy'], ['hardcoded'])] },
  zos: { to: '/cp/zos', product: 'cp', when: [W(['mf_zos'], ['legacy_pam', 'hardcoded'])] },
  dual: { to: '/dualaccounts', product: 'cp', kind: 'capability', when: [W([...LEGACY, 'op_db'], ['rotation'])] },
  shubPc: { to: '/secretshub', product: 'shub', pam: 'pc', when: [W(STORES, ['vault_gov', 'rotation', 'audit'])] },
  shubSh: { to: '/secretshub?env=pamsh', product: 'shub', pam: 'sh', when: [W(STORES, ['vault_gov', 'rotation', 'audit'])] },
}

export interface Selection { envs: string[]; details: string[]; goals: string[]; unsure: boolean }

/** Details hidden by an unpicked environment do not count. */
export function effectiveDetails(sel: Selection): string[] {
  return DETAILS.filter(d => sel.details.includes(d) && DETAIL_GROUPS.some(g =>
    g.details.includes(d) && (g.env === 'apps' ? APPS_ENVS.some(e => sel.envs.includes(e)) : sel.envs.includes(g.env))))
}

export function goalEnabled(goal: GoalId, details: string[]): boolean {
  const g = GOALS.find(x => x.id === goal)!
  return g.enabledBy === 'any' ? details.some(d => !CONTEXT.has(d)) : g.enabledBy.some(d => details.includes(d))
}

/** Goals used for matching: the picked (enabled) ones, or inferred ones when "Not sure" or none. */
export function inferGoals(details: string[]): GoalId[] {
  const has = (ids: string[]) => ids.some(d => details.includes(d))
  const out: GoalId[] = []
  if (has([...K8S, ...VMS, ...SERVERLESS, ...CICD, ...APPS, 'op_cf', 'op_db', 'op_iot', 'mf_zos', 'op_appservers', 'op_legacy', 'ai_mcp'])) out.push('hardcoded')
  if (has(STORES)) out.push('vault_gov')
  if (has(LEGACY)) out.push('legacy_pam')
  if (has(AI)) out.push('ai')
  return out
}

export interface Evaluation {
  details: string[]          // effective details, in model order
  items: string[]            // details to cover (no PAM context)
  goals: GoalId[]            // goals used for matching
  inferred: boolean          // goals came from inference
  recs: string[]             // included recommendation ids, in reading-path order
  byRec: Record<string, string[]>   // rec -> selected details that triggered it
  products: Array<{ key: Prod; items: string[]; recs: string[] }>   // ranked, main first
  coverage: Record<string, Prod[]>  // item -> products that cover it
  whyNot: Array<{ key: Prod; enableGoals: GoalId[] }>   // not recommended; goals that would enable it
  needsPam: Prod[]           // recommended products that need PAM while no PAM was picked
  notes: Array<'iot' | 'stores' | 'other'>
}

export function evaluate(sel: Selection): Evaluation {
  const details = effectiveDetails(sel)
  const items = details.filter(d => !CONTEXT.has(d))
  const picked = (sel.goals as GoalId[]).filter(g => goalEnabled(g, details))
  const inferred = sel.unsure || picked.length === 0
  const goals = inferred ? inferGoals(details) : picked
  const pams = (['pc', 'sh'] as const).filter(p => details.includes(`pam_${p}`))

  const byRec: Record<string, string[]> = {}
  for (const [id, r] of Object.entries(RECS)) {
    if (r.pam && pams.length && !pams.includes(r.pam)) continue
    const hit = new Set<string>()
    r.when.forEach(c => { if (c.goals.some(g => goals.includes(g))) c.any.forEach(d => { if (items.includes(d)) hit.add(d) }) })
    if (hit.size) byRec[id] = items.filter(d => hit.has(d))
  }

  // Reading path: overviews, then per item in model order, capabilities last.
  const ids = Object.keys(byRec)
  const recs: string[] = []
  const push = (id: string) => { if (!recs.includes(id)) recs.push(id) }
  ids.filter(id => RECS[id].kind === 'overview').forEach(push)
  items.forEach(d => ids.filter(id => !RECS[id].kind && byRec[id].includes(d)).forEach(push))
  ids.filter(id => RECS[id].kind === 'capability').forEach(push)

  const coverage: Record<string, Prod[]> = {}
  items.forEach(d => { coverage[d] = PRODUCTS.map(p => p.key).filter(p => recs.some(id => RECS[id].product === p && byRec[id].includes(d))) })
  const products = PRODUCTS
    .map((p, order) => ({ key: p.key, order, items: items.filter(d => coverage[d].includes(p.key)), recs: recs.filter(id => RECS[id].product === p.key) }))
    .filter(p => p.recs.length)
    .sort((a, b) => b.items.length - a.items.length || a.order - b.order)
    .map(({ key, items: it, recs: rs }) => ({ key, items: it, recs: rs }))

  const whyNot = PRODUCTS.filter(p => !products.some(x => x.key === p.key)).map(p => {
    const enableGoals = new Set<GoalId>()
    Object.values(RECS).filter(r => r.product === p.key).forEach(r => r.when.forEach(c => {
      if (c.any.some(d => items.includes(d))) c.goals.filter(g => !goals.includes(g)).forEach(g => enableGoals.add(g))
    }))
    return { key: p.key, enableGoals: [...enableGoals] }
  })

  const notes: Evaluation['notes'] = []
  if (items.includes('op_iot')) notes.push('iot')
  if (products.some(p => p.key === 'shub')) notes.push('stores')
  if (sel.envs.includes('other')) notes.push('other')

  return {
    details, items, goals, inferred, recs, byRec, products, coverage, whyNot, notes,
    needsPam: pams.length ? [] : products.map(p => p.key).filter(p => p === 'cp' || p === 'shub'),
  }
}
