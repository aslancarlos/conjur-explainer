/**
 * Network and prerequisites catalog for the solution finder.
 *
 * Every flow and requirement carries the doc it comes from (a file in the
 * docs mirror plus its docs.cyberark.com URL) and a confidence:
 *   documented: the port / endpoint / requirement is written in that doc
 *   inferred:   it follows from the doc or the standard protocol but the doc
 *               does not spell it out (the note says what is assumed)
 *
 * Flows and requirements are keyed on INTEGRATION ids: the recommendation
 * ids of src/pages/SolutionFinderPage.tsx (RECS: 'k8sArch', 'jenkins',
 * 'awsIam', 'shubPc', 'zos', 'mcp' ...) plus a few context keys for the
 * compute service or store in use ('aws-lambda', 'shub-akv' ...).
 * ADAPTER maps any page id (old tiles, new environment/detail ids) to these
 * keys, so the page can change its ids without touching the catalog.
 *
 * resolve({ recs, have, edition, pam }) returns the subset for a selection.
 */

export type Edition = 'saas' | 'selfhosted'
export type PamBackend = 'privilegecloud' | 'selfhosted'
export type FlowEdition = Edition | 'both'
export type Confidence = 'documented' | 'inferred'
export type Product = 'sm' | 'swa' | 'cp' | 'shub' | 'customer' | 'external'
export type NodeKind = 'workload' | 'agent' | 'idira-service' | 'platform' | 'store' | 'network'
export type Direction = 'outbound' | 'inbound' | 'internal' | 'external'

export type ZoneId =
  | 'customer-k8s' | 'customer-dc' | 'customer-mainframe' | 'customer-ai'
  | 'cicd-saas' | 'cloud-aws' | 'cloud-azure' | 'cloud-gcp' | 'ai-saas'
  | 'idira-saas'

/** Customer-owned zones: traffic leaving them is "outbound", entering them "inbound". */
export const CUSTOMER_ZONES: ZoneId[] = ['customer-k8s', 'customer-dc', 'customer-mainframe', 'customer-ai']

export interface Zone { id: ZoneId; label: string; labelKey: string; customer: boolean }

export const ZONES: Zone[] = [
  { id: 'customer-k8s', label: 'Customer: Kubernetes / OpenShift', labelKey: 'zone_k8s', customer: true },
  { id: 'customer-dc', label: 'Customer: data center / VMs', labelKey: 'zone_dc', customer: true },
  { id: 'customer-mainframe', label: 'Customer: mainframe', labelKey: 'zone_mainframe', customer: true },
  { id: 'customer-ai', label: 'Customer: AI agents and developer tools', labelKey: 'zone_ai', customer: true },
  { id: 'cicd-saas', label: 'CI/CD platforms (SaaS)', labelKey: 'zone_cicd', customer: false },
  { id: 'cloud-aws', label: 'AWS', labelKey: 'zone_aws', customer: false },
  { id: 'cloud-azure', label: 'Microsoft Azure', labelKey: 'zone_azure', customer: false },
  { id: 'cloud-gcp', label: 'Google Cloud', labelKey: 'zone_gcp', customer: false },
  { id: 'ai-saas', label: 'AI providers', labelKey: 'zone_ai_saas', customer: false },
  { id: 'idira-saas', label: 'IDIRA SaaS (Palo Alto Networks)', labelKey: 'zone_idira', customer: false },
]

export interface DocSource { path: string; url: string }

const DOCS = 'https://docs.cyberark.com'
const src = (path: string, url: string): DocSource => ({ path, url: url.startsWith('http') ? url : `${DOCS}${url}` })

/** Doc sources (path relative to the docs mirror root). */
export const S = {
  edgeFw: src('secrets-manager-saas/conjurcloud/edge/ccl-edge-support.md', '/secrets-manager-saas/latest/en/content/conjurcloud/edge/ccl-edge-support.htm'),
  edgeInstall: src('secrets-manager-saas/conjurcloud/edge/ccl-edge-install.md', '/secrets-manager-saas/latest/en/content/conjurcloud/edge/ccl-edge-install.htm'),
  sysReq: src('secrets-manager-saas/conjurcloud/ccl-sys-req.md', '/secrets-manager-saas/latest/en/content/conjurcloud/ccl-sys-req.htm'),
  shPorts: src('secrets-manager-sh/deployment/dap/dap-before-deploy-vm.md', '/secrets-manager-sh/latest/en/content/deployment/dap/dap-before-deploy-vm.htm'),
  shK8sFollower: src('secrets-manager-sh/integrations/k8s-ocp/k8s-conjfollower.md', '/secrets-manager-sh/latest/en/content/integrations/k8s-ocp/k8s-conjfollower.htm'),
  k8sJwt: src('secrets-manager-saas/integrations/k8s-ocp/k8s-jwt-authn.md', '/secrets-manager-saas/latest/en/content/integrations/k8s-ocp/k8s-jwt-authn.htm'),
  secretless: src('secrets-manager-sh/integrations/k8s-ocp/k8s-secretless-sidecar.md', '/secrets-manager-sh/latest/en/content/integrations/k8s-ocp/k8s-secretless-sidecar.htm'),
  swaLb: src('secrets-manager-saas/conjurcloud/ccl-swa-loadbalancer.md', '/secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-loadbalancer.htm'),
  swaAws: src('secrets-manager-saas/conjurcloud/ccl-swa-aws.md', '/secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-aws.htm'),
  swaAzure: src('secrets-manager-saas/conjurcloud/ccl-swa-azure.md', '/secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-azure.htm'),
  swaIid: src('secrets-manager-saas/conjurcloud/ccl-swa-node-attestation-aws-iid.md', '/secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-node-attestation-aws-iid.htm'),
  swaClaude: src('secrets-manager-saas/conjurcloud/ccl-swa-claude.md', '/secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-claude.htm'),
  swaAi: src('secrets-manager-saas/operations/authn/authenticate-ai-spiffe.md', '/secrets-manager-saas/latest/en/content/operations/authn/authenticate-ai-spiffe.htm'),
  mcp: src('secrets-manager-saas/conjurcloud/cc-mcp-server.md', '/secrets-manager-saas/latest/en/content/conjurcloud/cc-mcp-server.htm'),
  userApi: src('secrets-manager-saas/developer/conjur_api_authenticate_user.md', '/secrets-manager-saas/latest/en/content/developer/conjur_api_authenticate_user.htm'),
  apiKey: src('secrets-manager-saas/operations/authn/authn-default.md', '/secrets-manager-saas/latest/en/content/operations/authn/authn-default.htm'),
  awsIam: src('secrets-manager-saas/operations/authn/authenticate-awsiam-overview.md', '/secrets-manager-saas/latest/en/content/operations/authn/authenticate-awsiam-overview.htm'),
  azureAuthn: src('secrets-manager-saas/operations/authn/authenticate-azure-config.md', '/secrets-manager-saas/latest/en/content/operations/authn/authenticate-azure-config.htm'),
  gcpAuthn: src('secrets-manager-saas/operations/authn/authenticate-gcp-config.md', '/secrets-manager-saas/latest/en/content/operations/authn/authenticate-gcp-config.htm'),
  jwtGuide: src('secrets-manager-saas/operations/services/cjr-authn-jwt-guidelines.md', '/secrets-manager-saas/latest/en/content/operations/services/cjr-authn-jwt-guidelines.htm'),
  dynAws: src('secrets-manager-saas/operations/dynamic-secrets-aws.md', '/secrets-manager-saas/latest/en/content/operations/dynamic-secrets-aws.htm'),
  dynGcp: src('secrets-manager-saas/operations/dynamic-secrets-gcp.md', '/secrets-manager-saas/latest/en/content/operations/dynamic-secrets-gcp.htm'),
  jenkins: src('secrets-manager-saas/integrations/jenkins.md', '/secrets-manager-saas/latest/en/content/integrations/jenkins.htm'),
  gitlab: src('secrets-manager-saas/integrations/gitlab.md', '/secrets-manager-saas/latest/en/content/integrations/gitlab.htm'),
  gha: src('secrets-manager-saas/integrations/github-actions.md', '/secrets-manager-saas/latest/en/content/integrations/github-actions.htm'),
  azdo: src('secrets-manager-saas/integrations/azure-devops-extension.md', '/secrets-manager-saas/latest/en/content/integrations/azure-devops-extension.htm'),
  bitbucket: src('secrets-manager-saas/integrations/bitbucket-pipeline-e2e.md', '/secrets-manager-saas/latest/en/content/integrations/bitbucket-pipeline-e2e.htm'),
  circleci: src('secrets-manager-saas/integrations/circle-ci.md', '/secrets-manager-saas/latest/en/content/integrations/circle-ci.htm'),
  octopus: src('secrets-manager-saas/integrations/octopus.md', '/secrets-manager-saas/latest/en/content/integrations/octopus.htm'),
  ansible: src('secrets-manager-saas/integrations/ansible.md', '/secrets-manager-saas/latest/en/content/integrations/ansible.htm'),
  terraform: src('secrets-manager-saas/integrations/terraform_provider.md', '/secrets-manager-saas/latest/en/content/integrations/terraform_provider.htm'),
  python: src('secrets-manager-saas/integrations/python.md', '/secrets-manager-saas/latest/en/content/integrations/python.htm'),
  mulesoft: src('secrets-manager-saas/integrations/mulesoft.md', '/secrets-manager-saas/latest/en/content/integrations/mulesoft.htm'),
  puppet: src('secrets-manager-sh/integrations/puppet.md', '/secrets-manager-sh/latest/en/content/integrations/puppet.htm'),
  cf: src('secrets-manager-sh/integrations/cloud-foundry.md', '/secrets-manager-sh/latest/en/content/integrations/cloud-foundry.htm'),
  sync: src('secrets-manager-saas/conjur/cv_configursynchronizer.md', '/secrets-manager-saas/latest/en/content/conjur/cv_configursynchronizer.htm'),
  cpInstall: src('credential-providers/cp-and-ascp/silent-installation-windows.md', '/credential-providers/latest/en/content/cp and ascp/silent-installation-windows.htm'),
  ccpInstall: src('credential-providers/ccp/ccp-installation.md', '/credential-providers/latest/en/content/ccp/ccp-installation.htm'),
  zosConf: src('credential-providers/cp-for-zos/local-zos-credential-provider-configuration-file.md', '/credential-providers/latest/en/content/cp for zos/local-zos-credential-provider-configuration-file.htm'),
  shubConnReq: src('setup/ispss-deployment/deployment/deploy-cm_requirements.md', '/setup/latest/en/content/ispss-deployment/deployment/deploy-cm_requirements.htm'),
  shubArch: src('secrets-hub-privilege-cloud/secretshubcontent/sh-architecture-diagram.md', '/secrets-hub-privilege-cloud/latest/en/secretshubcontent/sh-architecture-diagram/'),
  shubIps: src('secrets-hub-privilege-cloud/secretshubcontent/sh-network-hardening.md', '/secrets-hub-privilege-cloud/latest/en/secretshubcontent/sh-network-hardening/'),
  shubPamsh: src('secrets-hub-pam-sh/secretshubcontent/sh-connect-pam-sh.md', '/secrets-hub-pam-sh/latest/en/secretshubcontent/sh-connect-pam-sh/'),
  shubSupport: src('secrets-hub-pam-sh/secretshubcontent/sh-support.md', '/secrets-hub-pam-sh/latest/en/secretshubcontent/sh-support/'),
  shubHcv: src('secrets-hub-privilege-cloud/secretshubcontent/sh-add-hashi-secret-store.md', '/secrets-hub-privilege-cloud/latest/en/secretshubcontent/sh-add-hashi-secret-store/'),
  shubAws: src('secrets-hub-privilege-cloud/secretshubcontent/aws-config.md', '/secrets-hub-privilege-cloud/latest/en/secretshubcontent/aws-config/'),
  shubGcp: src('secrets-hub-privilege-cloud/secretshubcontent/sh-gcp-add-secret-store.md', '/secrets-hub-privilege-cloud/latest/en/secretshubcontent/sh-gcp-add-secret-store/'),
  awsIamCfg: src('secrets-manager-saas/operations/authn/authenticate-awsiam-config.md', '/secrets-manager-saas/latest/en/content/operations/authn/authenticate-awsiam-config.htm'),
  azureOvw: src('secrets-manager-saas/operations/authn/authenticate-azure-overview.md', '/secrets-manager-saas/latest/en/content/operations/authn/authenticate-azure-overview.htm'),
  shubReqSh: src('secrets-hub-pam-sh/secretshubcontent/sh-requirements.md', '/secrets-hub-pam-sh/latest/en/secretshubcontent/sh-requirements/'),
} as const

export interface NetNode {
  id: string
  zone: ZoneId
  kind: NodeKind
  product: Product
  label: string          // short technical label (English, also used in exports)
  labelKey: string       // i18n key suffix for UI
  details?: string       // one short line under the label
  docUrl?: string
}

export interface NetFlow {
  id: string
  from: string
  to: string
  port: string           // '443', '8443', '1999', 'n/a' (unix socket / local) ...
  protocol: string
  endpoint: string
  purpose: string
  requiredFor: string[]  // integration keys (any match includes the flow)
  edition: FlowEdition   // Secrets Manager edition
  pam?: PamBackend       // only for this PAM back end (Credential Providers, Secrets Hub, sync)
  unlessAny?: string[]   // skipped when any of these keys is present (generic vs specific variants)
  source: DocSource
  confidence: Confidence
  note?: string
  /** Forces the direction, e.g. link-local metadata calls that never cross a firewall. */
  directionOverride?: Direction
}

export interface Requirement {
  id: string
  node: string           // component it applies to
  category: 'version' | 'install' | 'permission' | 'config' | 'network' | 'sizing'
  text: string
  requiredFor: string[]
  edition: FlowEdition
  pam?: PamBackend
  source: DocSource
  confidence: Confidence
  note?: string
}

// ---------------------------------------------------------------------------
// Nodes
// ---------------------------------------------------------------------------

export const NODES: NetNode[] = [
  // Customer Kubernetes
  { id: 'k8s-app', zone: 'customer-k8s', kind: 'workload', product: 'customer', label: 'Application pods', labelKey: 'n_k8s_app', details: 'service account JWT' },
  { id: 'k8s-api', zone: 'customer-k8s', kind: 'platform', product: 'customer', label: 'Kubernetes API (JWKS)', labelKey: 'n_k8s_api', details: 'service account issuer' },
  { id: 'sp', zone: 'customer-k8s', kind: 'agent', product: 'sm', label: 'Provider / ESO / CSI', labelKey: 'n_sp', details: 'sidecar, init, operator' },
  { id: 'secretless', zone: 'customer-k8s', kind: 'agent', product: 'sm', label: 'Secretless Broker', labelKey: 'n_secretless', details: 'sidecar, localhost proxy' },
  { id: 'swa-agent', zone: 'customer-k8s', kind: 'agent', product: 'swa', label: 'SWA Agent', labelKey: 'n_swa_agent', details: 'node attestation, SVIDs' },
  { id: 'swa-server', zone: 'customer-k8s', kind: 'idira-service', product: 'swa', label: 'SWA Server', labelKey: 'n_swa_server', details: 'API TCP 8443' },
  { id: 'sm-follower-k8s', zone: 'customer-k8s', kind: 'idira-service', product: 'sm', label: 'Follower in Kubernetes', labelKey: 'n_follower_k8s', details: 'read replica (Self-Hosted)' },

  // Customer data center
  { id: 'vm-app', zone: 'customer-dc', kind: 'workload', product: 'customer', label: 'VM / server workloads', labelKey: 'n_vm', details: 'API key, certificate, Summon' },
  { id: 'cicd-self', zone: 'customer-dc', kind: 'workload', product: 'customer', label: 'Jenkins and automation', labelKey: 'n_cicd_self', details: 'Ansible, Terraform, Puppet' },
  { id: 'platform-apps', zone: 'customer-dc', kind: 'workload', product: 'customer', label: 'Platform apps', labelKey: 'n_platform_apps', details: 'CF, MuleSoft, Python' },
  { id: 'appserver', zone: 'customer-dc', kind: 'workload', product: 'customer', label: 'App servers + ASCP', labelKey: 'n_appserver', details: 'Tomcat, JBoss, WebSphere' },
  { id: 'legacy-app', zone: 'customer-dc', kind: 'workload', product: 'customer', label: 'Windows / legacy apps', labelKey: 'n_legacy', details: 'SDK or REST to CCP' },
  { id: 'cp-agent', zone: 'customer-dc', kind: 'agent', product: 'cp', label: 'Credential Provider', labelKey: 'n_cp', details: 'local cache, Vault TCP 1858' },
  { id: 'ccp', zone: 'customer-dc', kind: 'agent', product: 'cp', label: 'Central CP (CCP)', labelKey: 'n_ccp', details: 'IIS 10, AIMWebService' },
  { id: 'db', zone: 'customer-dc', kind: 'store', product: 'customer', label: 'Databases', labelKey: 'n_db', details: 'targets of rotation' },
  { id: 'iot', zone: 'customer-dc', kind: 'workload', product: 'customer', label: 'IoT devices', labelKey: 'n_iot', details: 'no dedicated integration' },
  { id: 'hcv', zone: 'customer-dc', kind: 'store', product: 'customer', label: 'HashiCorp Vault', labelKey: 'n_hcv', details: 'Secrets Hub target, 1.2x' },
  { id: 'admins', zone: 'customer-dc', kind: 'workload', product: 'customer', label: 'Admins and users', labelKey: 'n_admins', details: 'browser, CLI' },
  { id: 'sm-lb', zone: 'customer-dc', kind: 'network', product: 'sm', label: 'Leader load balancer', labelKey: 'n_sm_lb', details: 'TLS 443, health 444' },
  { id: 'sm-leader', zone: 'customer-dc', kind: 'idira-service', product: 'sm', label: 'Leader + Standbys', labelKey: 'n_sm_leader', details: 'Self-Hosted cluster' },
  { id: 'sm-follower', zone: 'customer-dc', kind: 'idira-service', product: 'sm', label: 'Followers', labelKey: 'n_sm_follower', details: 'read replicas, API 443' },
  { id: 'pam-vault', zone: 'customer-dc', kind: 'idira-service', product: 'cp', label: 'Digital Vault (PAM)', labelKey: 'n_vault', details: 'TCP 1858' },
  { id: 'pvwa', zone: 'customer-dc', kind: 'idira-service', product: 'cp', label: 'PVWA', labelKey: 'n_pvwa', details: 'PAM 11.5+ for Secrets Hub' },
  { id: 'cpm', zone: 'customer-dc', kind: 'idira-service', product: 'cp', label: 'CPM', labelKey: 'n_cpm', details: 'rotates passwords' },
  { id: 'synchronizer', zone: 'customer-dc', kind: 'agent', product: 'sm', label: 'Vault Synchronizer', labelKey: 'n_sync', details: 'PAM to Secrets Manager' },
  { id: 'shub-connector', zone: 'customer-dc', kind: 'agent', product: 'shub', label: 'Secrets Hub connector', labelKey: 'n_shub_conn', details: 'Windows, outbound MQTT' },

  // Mainframe
  { id: 'zos-job', zone: 'customer-mainframe', kind: 'workload', product: 'customer', label: 'Batch jobs (JCL)', labelKey: 'n_zos_job', details: 'Java or C/C++ SDK' },
  { id: 'zos-cp', zone: 'customer-mainframe', kind: 'agent', product: 'cp', label: 'z/OS Credential Provider', labelKey: 'n_zos_cp', details: 'started task, port 18923' },

  // Customer AI
  { id: 'ai-agent', zone: 'customer-ai', kind: 'workload', product: 'customer', label: 'AI agent runtime', labelKey: 'n_ai_agent', details: 'SPIFFE identity' },
  { id: 'mcp', zone: 'customer-ai', kind: 'agent', product: 'sm', label: 'MCP server container', labelKey: 'n_mcp', details: 'used by AI coding tools' },

  // CI/CD SaaS
  { id: 'gha', zone: 'cicd-saas', kind: 'platform', product: 'external', label: 'GitHub Actions', labelKey: 'n_gha', details: 'OIDC ID token' },
  { id: 'gitlab', zone: 'cicd-saas', kind: 'platform', product: 'external', label: 'GitLab CI/CD', labelKey: 'n_gitlab', details: 'ID token (JWT)' },
  { id: 'azdo', zone: 'cicd-saas', kind: 'platform', product: 'external', label: 'Azure DevOps', labelKey: 'n_azdo', details: 'Entra ID token' },
  { id: 'bitbucket', zone: 'cicd-saas', kind: 'platform', product: 'external', label: 'Bitbucket Pipelines', labelKey: 'n_bitbucket', details: 'OIDC token' },
  { id: 'circleci', zone: 'cicd-saas', kind: 'platform', product: 'external', label: 'CircleCI', labelKey: 'n_circleci', details: 'OIDC token' },
  { id: 'octopus', zone: 'cicd-saas', kind: 'platform', product: 'external', label: 'Octopus Deploy', labelKey: 'n_octopus', details: 'OIDC token' },

  // AWS
  { id: 'aws-app', zone: 'cloud-aws', kind: 'workload', product: 'customer', label: 'AWS workloads', labelKey: 'n_aws_app', details: 'IAM role' },
  { id: 'aws-ec2', zone: 'cloud-aws', kind: 'workload', product: 'customer', label: 'EC2 instances', labelKey: 'n_aws_ec2', details: 'instance IAM role' },
  { id: 'aws-lambda', zone: 'cloud-aws', kind: 'workload', product: 'customer', label: 'Lambda functions', labelKey: 'n_aws_lambda', details: 'execution IAM role' },
  { id: 'aws-ecs', zone: 'cloud-aws', kind: 'workload', product: 'customer', label: 'ECS tasks', labelKey: 'n_aws_ecs', details: 'task IAM role' },
  { id: 'aws-imds', zone: 'cloud-aws', kind: 'platform', product: 'external', label: 'Instance metadata (IMDS)', labelKey: 'n_aws_imds', details: '169.254.169.254' },
  { id: 'aws-sts', zone: 'cloud-aws', kind: 'platform', product: 'external', label: 'AWS STS', labelKey: 'n_aws_sts', details: 'sts.amazonaws.com' },
  { id: 'aws-sm', zone: 'cloud-aws', kind: 'store', product: 'customer', label: 'AWS Secrets Manager', labelKey: 'n_aws_sm', details: 'Secrets Hub target' },

  // Azure
  { id: 'azure-app', zone: 'cloud-azure', kind: 'workload', product: 'customer', label: 'Azure workloads', labelKey: 'n_azure_app', details: 'managed identity' },
  { id: 'azure-vm', zone: 'cloud-azure', kind: 'workload', product: 'customer', label: 'Azure VMs', labelKey: 'n_azure_vm', details: 'managed identity' },
  { id: 'azure-func', zone: 'cloud-azure', kind: 'workload', product: 'customer', label: 'Functions / App Service', labelKey: 'n_azure_func', details: 'managed identity' },
  { id: 'azure-imds', zone: 'cloud-azure', kind: 'platform', product: 'external', label: 'Instance metadata (IMDS)', labelKey: 'n_azure_imds', details: '169.254.169.254' },
  { id: 'entra', zone: 'cloud-azure', kind: 'platform', product: 'external', label: 'Microsoft Entra ID', labelKey: 'n_entra', details: 'login.microsoftonline.com' },
  { id: 'akv', zone: 'cloud-azure', kind: 'store', product: 'customer', label: 'Azure Key Vault', labelKey: 'n_akv', details: 'Secrets Hub target' },

  // Google Cloud
  { id: 'gcp-app', zone: 'cloud-gcp', kind: 'workload', product: 'customer', label: 'Google Cloud workloads', labelKey: 'n_gcp_app', details: 'service account' },
  { id: 'gcp-gce', zone: 'cloud-gcp', kind: 'workload', product: 'customer', label: 'Compute Engine VMs', labelKey: 'n_gcp_gce', details: 'service account' },
  { id: 'gcp-func', zone: 'cloud-gcp', kind: 'workload', product: 'customer', label: 'Cloud Functions / Run', labelKey: 'n_gcp_func', details: 'service account' },
  { id: 'gcp-iam', zone: 'cloud-gcp', kind: 'platform', product: 'external', label: 'Google IAM', labelKey: 'n_gcp_iam', details: 'tokens, service account keys' },
  { id: 'gsm', zone: 'cloud-gcp', kind: 'store', product: 'customer', label: 'GCP Secret Manager', labelKey: 'n_gsm', details: 'Secrets Hub target' },

  // AI providers
  { id: 'anthropic', zone: 'ai-saas', kind: 'platform', product: 'external', label: 'Claude API', labelKey: 'n_anthropic', details: 'api.anthropic.com' },

  // IDIRA SaaS
  { id: 'sm-saas', zone: 'idira-saas', kind: 'idira-service', product: 'sm', label: 'Secrets Manager (SaaS)', labelKey: 'n_sm_saas', details: '*.secretsmgr.cyberark.cloud' },
  { id: 'identity', zone: 'idira-saas', kind: 'idira-service', product: 'sm', label: 'Identity', labelKey: 'n_identity', details: '*.id.cyberark.cloud' },
  { id: 'shub', zone: 'idira-saas', kind: 'idira-service', product: 'shub', label: 'Secrets Hub', labelKey: 'n_shub', details: 'static IPs per region' },
  { id: 'pcloud', zone: 'idira-saas', kind: 'idira-service', product: 'cp', label: 'Privilege Cloud (Vault)', labelKey: 'n_pcloud', details: 'PAM as a service' },
  { id: 'iot-broker', zone: 'idira-saas', kind: 'network', product: 'external', label: 'IoT broker (AWS IoT)', labelKey: 'n_iot_broker', details: '*.iot.<region>.amazonaws.com' },
]

// ---------------------------------------------------------------------------
// Integration keys
// ---------------------------------------------------------------------------

const K8S = ['k8sArch', 'sdk', 'sidecar', 'eso', 'csi', 'spmodes', 'reloader']
const K8S_DELIVERY = ['sidecar', 'eso', 'csi', 'spmodes', 'reloader']
const SWA = ['swaArch', 'svid', 'swaS3', 'swaAi']
const CICD = ['gha', 'gitlab', 'azdo', 'bitbucket', 'circleci', 'octopus', 'jenkins', 'ansible', 'terraform', 'puppet']
const STORES = ['shub-aws', 'shub-akv', 'shub-gsm', 'shub-hcv']
const AWS_COMPUTE = ['aws-ec2', 'aws-lambda', 'aws-ecs']
const AZ_COMPUTE = ['azure-vm', 'azure-func']
const GCP_COMPUTE = ['gcp-gce', 'gcp-func']
/** Everything that talks to Secrets Manager (pulls in the Self-Hosted cluster core). */
const SM_KEYS = [...K8S, 'secretless', 'apiKey', 'cert', 'summon', 'iot', 'users', 'awsIam', 'azureMi', 'gcpId', 'dynamic-aws', 'dynamic-gcp',
  ...CICD, 'cf', 'mulesoft', 'python', 'rotation', 'swaAi', 'mcp', ...AWS_COMPUTE, ...AZ_COMPUTE, ...GCP_COMPUTE]

// ---------------------------------------------------------------------------
// Flows
// ---------------------------------------------------------------------------

const SM_TO = { saas: 'sm-saas', selfhosted: 'sm-follower' } as const
const SM_EP = { saas: '<subdomain>.secretsmgr.cyberark.cloud', selfhosted: '<follower-or-leader-lb-fqdn>' } as const
const SM_NOTE_SAAS = 'The tenant REST API uses HTTPS 443; the Edge firewall rules state this port explicitly for Secrets Manager.'

/** Workload to Secrets Manager (both editions). */
function smFlows(id: string, from: string, purpose: string, keys: string[], source: DocSource, opts: { onlySaas?: boolean; onlySh?: boolean; shTo?: string; unlessAny?: string[] } = {}): NetFlow[] {
  const out: NetFlow[] = []
  if (!opts.onlySh) out.push({
    id: `${id}-saas`, from, to: SM_TO.saas, port: '443', protocol: 'HTTPS (TLS)', endpoint: SM_EP.saas, purpose, requiredFor: keys, unlessAny: opts.unlessAny,
    edition: 'saas', source: S.edgeFw, confidence: 'inferred', note: `${SM_NOTE_SAAS} Integration doc: ${source.url}`,
  })
  if (!opts.onlySaas) out.push({
    id: `${id}-sh`, from, to: opts.shTo ?? SM_TO.selfhosted, port: '443', protocol: 'HTTPS (TLS)', endpoint: SM_EP.selfhosted, purpose, requiredFor: keys, unlessAny: opts.unlessAny,
    edition: 'selfhosted', source: S.shPorts, confidence: 'documented', note: 'Followers and the Leader load balancer expose the TLS API on 443.',
  })
  return out
}

export const FLOWS: NetFlow[] = [
  // ---- Kubernetes ----
  ...smFlows('k8s-authn', 'k8s-app', 'Authenticate with the service account JWT (authn-jwt) and fetch secrets (SDK in the app)', ['k8sArch', 'sdk'], S.k8sJwt, { shTo: 'sm-follower-k8s' }),
  ...smFlows('sp-fetch', 'sp', 'Secrets Provider, ESO or CSI provider authenticates and fetches secrets', K8S_DELIVERY, S.k8sJwt, { shTo: 'sm-follower-k8s' }),
  { id: 'k8s-jwks', from: 'sm-saas', to: 'k8s-api', port: '443', protocol: 'HTTPS', endpoint: '<cluster-issuer>/openid/v1/jwks', purpose: 'Secrets Manager reads the cluster JWKS (jwks-uri). Not needed when the public-keys variable is used instead.', requiredFor: K8S, edition: 'both', source: S.k8sJwt, confidence: 'documented', note: 'Optional inbound: if Service Account Issuer Discovery is unreachable, configure public-keys and no inbound rule is needed.' },
  { id: 'k8s-follower-repl', from: 'sm-follower-k8s', to: 'sm-lb', port: '5432', protocol: 'TCP (PostgreSQL replication)', endpoint: '<leader-lb-fqdn>', purpose: 'Follower replicates data from the Leader', requiredFor: [...K8S, 'secretless'], edition: 'selfhosted', source: S.shPorts, confidence: 'documented' },
  { id: 'k8s-follower-audit', from: 'sm-follower-k8s', to: 'sm-lb', port: '1999', protocol: 'TCP (syslog-ng audit)', endpoint: '<leader-lb-fqdn>', purpose: 'Audit events streamed from the Follower to the Leader', requiredFor: [...K8S, 'secretless'], edition: 'selfhosted', source: S.shPorts, confidence: 'documented' },
  { id: 'k8s-follower-api', from: 'sm-follower-k8s', to: 'sm-lb', port: '443', protocol: 'HTTPS (TLS)', endpoint: '<leader-lb-fqdn>', purpose: 'Follower API calls and authentication to the Leader', requiredFor: [...K8S, 'secretless'], edition: 'selfhosted', source: S.shK8sFollower, confidence: 'inferred', note: 'The Kubernetes Follower guide connects to the Leader over its TLS endpoint; port 443 per the Leader port table.' },
  { id: 'secretless-db', from: 'secretless', to: 'db', port: '<db-port>', protocol: 'Database protocol (e.g. PostgreSQL, MySQL)', endpoint: '<database-host>', purpose: 'Broker opens the connection to the target with the credential; the app connects to localhost', requiredFor: ['secretless'], edition: 'selfhosted', source: S.secretless, confidence: 'documented' },
  ...smFlows('secretless-fetch', 'secretless', 'Secretless Broker fetches the target credential', ['secretless'], S.secretless, { onlySh: true, shTo: 'sm-follower-k8s' }),

  // ---- SWA ----
  { id: 'swa-agent-server', from: 'swa-agent', to: 'swa-server', port: '8443', protocol: 'TCP (TLS)', endpoint: '<swa-server-lb>:8443', purpose: 'Agents reach the SWA Server API (attestation and SVID issuance)', requiredFor: SWA, edition: 'saas', source: S.swaLb, confidence: 'documented', note: 'Port 8443 must be reachable from every node or host that runs an SWA Agent.' },
  { id: 'swa-server-sm', from: 'swa-server', to: 'sm-saas', port: '443', protocol: 'HTTPS (TLS)', endpoint: SM_EP.saas, purpose: 'SWA Server registers with the trust domain hosted in Secrets Manager SaaS', requiredFor: SWA, edition: 'saas', source: S.swaLb, confidence: 'inferred', note: 'SWA is a Secrets Manager SaaS capability; HTTPS 443 to the tenant as for every tenant API call.' },
  { id: 'swa-workload-api', from: 'k8s-app', to: 'swa-agent', port: 'n/a', protocol: 'Unix socket (Workload API)', endpoint: '/run/swa-agent/api.sock', purpose: 'Workload asks the local agent for an X.509-SVID or JWT-SVID', requiredFor: ['svid', 'swaS3', 'swaArch'], edition: 'saas', source: S.swaAws, confidence: 'documented' },
  { id: 'swa-aws-sts', from: 'k8s-app', to: 'aws-sts', port: '443', protocol: 'HTTPS', endpoint: 'sts.amazonaws.com', purpose: 'AssumeRoleWithWebIdentity with a JWT-SVID (audience sts.amazonaws.com)', requiredFor: ['swaS3'], edition: 'saas', source: S.swaAws, confidence: 'documented' },
  { id: 'swa-aws-iid', from: 'swa-agent', to: 'aws-imds', directionOverride: 'internal', port: '80', protocol: 'HTTP (instance metadata)', endpoint: '169.254.169.254', purpose: 'Node attestation with the AWS instance identity document', requiredFor: ['swaS3'], edition: 'saas', source: S.swaIid, confidence: 'documented', note: 'Link-local metadata service, never leaves the host.' },
  { id: 'swa-mtls', from: 'k8s-app', to: 'vm-app', port: '<service-port>', protocol: 'mTLS (X.509-SVID)', endpoint: '<peer-service>', purpose: 'Service-to-service mutual TLS with X.509-SVIDs', requiredFor: ['svid'], edition: 'saas', source: S.swaLb, confidence: 'inferred', note: 'Port depends on the service; SVIDs only replace the certificates.' },

  // ---- VMs, IoT, humans ----
  ...smFlows('vm-fetch', 'vm-app', 'API key or certificate authentication, Summon or SDK fetch', ['apiKey', 'cert', 'summon'], S.apiKey),
  ...smFlows('iot-fetch', 'iot', 'Certificate or API key authentication (no dedicated IoT integration documented)', ['iot'], S.apiKey),
  { id: 'users-identity', from: 'admins', to: 'identity', port: '443', protocol: 'HTTPS', endpoint: '<tenant>.id.cyberark.cloud', purpose: 'Users sign in through Identity (UI, CLI)', requiredFor: ['users'], edition: 'saas', source: S.userApi, confidence: 'inferred', note: 'Endpoint documented; port is the HTTPS default.' },
  ...smFlows('users-sm', 'admins', 'UI, CLI and REST API access', ['users'], S.userApi),

  // ---- Self-Hosted cluster core ----
  { id: 'sh-follower-repl', from: 'sm-follower', to: 'sm-lb', port: '5432', protocol: 'TCP (PostgreSQL replication)', endpoint: '<leader-lb-fqdn>', purpose: 'Followers replicate data from the Leader', requiredFor: SM_KEYS, edition: 'selfhosted', source: S.shPorts, confidence: 'documented' },
  { id: 'sh-follower-audit', from: 'sm-follower', to: 'sm-lb', port: '1999', protocol: 'TCP (syslog-ng audit)', endpoint: '<leader-lb-fqdn>', purpose: 'Audit stream from Followers to the Leader', requiredFor: SM_KEYS, edition: 'selfhosted', source: S.shPorts, confidence: 'documented' },
  { id: 'sh-lb-leader', from: 'sm-lb', to: 'sm-leader', port: '443, 444, 5432, 1999', protocol: 'TCP (TLS API, HTTP health, replication, audit)', endpoint: '<leader>, <standby>', purpose: 'Load balancer forwards API, health checks, replication and audit to Leader and Standbys (Leader and Standbys also talk to each other on 5432 and 443 for replication and auto-failover)', requiredFor: SM_KEYS, edition: 'selfhosted', source: S.shPorts, confidence: 'documented' },

  // ---- AWS: authn-iam per compute service ----
  ...smFlows('aws-authn', 'aws-app', 'authn-iam: signed AWS request with the IAM role identity', ['awsIam'], S.awsIam, { unlessAny: AWS_COMPUTE }),
  ...smFlows('ec2-authn', 'aws-ec2', 'authn-iam from EC2: the instance role signs the request (host ID <AccountID>/<RoleName>)', ['aws-ec2'], S.awsIamCfg),
  ...smFlows('lambda-authn', 'aws-lambda', 'authn-iam from Lambda: the execution role signs the request', ['aws-lambda'], S.awsIam),
  ...smFlows('ecs-authn', 'aws-ecs', 'authn-iam from ECS: the task role signs the request', ['aws-ecs'], S.awsIam),
  { id: 'aws-authn-sts', from: 'sm-saas', to: 'aws-sts', port: '443', protocol: 'HTTPS', endpoint: 'sts.amazonaws.com', purpose: 'Secrets Manager validates the signed request (GetCallerIdentity)', requiredFor: ['awsIam', ...AWS_COMPUTE], edition: 'both', source: S.awsIam, confidence: 'inferred', note: 'authn-iam validation calls AWS STS; the global endpoint is used.' },

  // ---- Azure: authn-azure ----
  ...smFlows('azure-authn', 'azure-app', 'authn-azure: managed identity token', ['azureMi'], S.azureAuthn, { unlessAny: AZ_COMPUTE }),
  ...smFlows('azvm-authn', 'azure-vm', 'authn-azure from a VM: managed identity token', ['azure-vm'], S.azureOvw),
  ...smFlows('azfunc-authn', 'azure-func', 'authn-azure from Functions / App Service: managed identity token', ['azure-func'], S.azureOvw),
  { id: 'azure-imds-token', from: 'azure-app', to: 'azure-imds', directionOverride: 'internal', port: '80', protocol: 'HTTP (instance metadata)', endpoint: '169.254.169.254', purpose: 'Workload gets its managed identity token from the Azure Instance Metadata Service', requiredFor: ['azureMi'], unlessAny: AZ_COMPUTE, edition: 'both', source: S.azureAuthn, confidence: 'documented', note: 'Link-local metadata endpoint.' },
  { id: 'azvm-imds', from: 'azure-vm', to: 'azure-imds', directionOverride: 'internal', port: '80', protocol: 'HTTP (instance metadata)', endpoint: '169.254.169.254', purpose: 'VM gets its managed identity token from IMDS', requiredFor: ['azure-vm'], edition: 'both', source: S.azureAuthn, confidence: 'documented', note: 'Link-local metadata endpoint.' },

  // ---- Google Cloud: authn-gcp ----
  ...smFlows('gcp-authn', 'gcp-app', 'authn-gcp: Google identity token', ['gcpId'], S.gcpAuthn, { unlessAny: GCP_COMPUTE }),
  ...smFlows('gce-authn', 'gcp-gce', 'authn-gcp from Compute Engine: instance identity token of the service account', ['gcp-gce'], S.gcpAuthn),
  ...smFlows('gcf-authn', 'gcp-func', 'authn-gcp from Cloud Functions (documented) or Cloud Run (same identity token, not listed)', ['gcp-func'], S.gcpAuthn),

  // ---- Dynamic secrets ----
  { id: 'dyn-aws', from: 'sm-saas', to: 'aws-sts', port: '443', protocol: 'HTTPS', endpoint: 'sts.amazonaws.com', purpose: 'Dynamic secrets: Secrets Manager requests temporary AWS credentials (assume role / federation token)', requiredFor: ['dynamic-aws'], edition: 'both', source: S.dynAws, confidence: 'inferred', note: 'The doc names AWS STS methods; the endpoint and port are the AWS defaults.' },
  { id: 'dyn-gcp', from: 'sm-saas', to: 'gcp-iam', port: '443', protocol: 'HTTPS', endpoint: 'Google IAM APIs', purpose: 'Dynamic secrets: Secrets Manager issues GCP tokens or service account keys (SaaS only)', requiredFor: ['dynamic-gcp'], edition: 'saas', source: S.dynGcp, confidence: 'inferred', note: 'Endpoint and port are the Google API defaults.' },

  // ---- CI/CD SaaS ----
  ...smFlows('gha-fetch', 'gha', 'Runner authenticates with the GitHub OIDC token and fetches secrets', ['gha'], S.gha),
  { id: 'gha-jwks', from: 'sm-saas', to: 'gha', port: '443', protocol: 'HTTPS', endpoint: 'token.actions.githubusercontent.com', purpose: 'Secrets Manager reads the GitHub OIDC JWKS', requiredFor: ['gha'], edition: 'both', source: S.jwtGuide, confidence: 'documented' },
  ...smFlows('gitlab-fetch', 'gitlab', 'Job authenticates with its ID token and fetches each secret', ['gitlab'], S.gitlab),
  { id: 'gitlab-jwks', from: 'sm-saas', to: 'gitlab', port: '443', protocol: 'HTTPS', endpoint: '<gitlab-host>/oauth/discovery/keys', purpose: 'Secrets Manager reads the GitLab JWKS', requiredFor: ['gitlab'], edition: 'both', source: S.gitlab, confidence: 'documented', note: 'For self-managed GitLab this is an inbound rule to your GitLab server.' },
  ...smFlows('azdo-fetch', 'azdo', 'Pipeline task authenticates with the Entra ID token and fetches secrets', ['azdo'], S.azdo),
  { id: 'azdo-jwks', from: 'sm-saas', to: 'entra', port: '443', protocol: 'HTTPS', endpoint: 'login.windows.net/common/discovery/keys', purpose: 'Secrets Manager reads the Entra ID JWKS (issuer sts.windows.net)', requiredFor: ['azdo'], edition: 'both', source: S.azdo, confidence: 'documented' },
  ...smFlows('bb-fetch', 'bitbucket', 'Pipe authenticates with the Bitbucket OIDC token and fetches secrets', ['bitbucket'], S.bitbucket),
  { id: 'bb-jwks', from: 'sm-saas', to: 'bitbucket', port: '443', protocol: 'HTTPS', endpoint: 'api.bitbucket.org/2.0/workspaces/<workspace>/pipelines-config/identity/oidc', purpose: 'Secrets Manager reads the Bitbucket OIDC keys', requiredFor: ['bitbucket'], edition: 'both', source: S.bitbucket, confidence: 'documented' },
  ...smFlows('circle-fetch', 'circleci', 'Orb authenticates with the CircleCI OIDC token and fetches secrets', ['circleci'], S.circleci),
  { id: 'circle-jwks', from: 'sm-saas', to: 'circleci', port: '443', protocol: 'HTTPS', endpoint: 'oidc.circleci.com/org/<org-id>', purpose: 'Secrets Manager reads the CircleCI OIDC keys', requiredFor: ['circleci'], edition: 'both', source: S.circleci, confidence: 'documented' },
  ...smFlows('octo-fetch', 'octopus', 'Step template authenticates with the Octopus OIDC token and fetches secrets', ['octopus'], S.octopus),
  { id: 'octo-jwks', from: 'sm-saas', to: 'octopus', port: '443', protocol: 'HTTPS', endpoint: '<company>.octopus.app', purpose: 'Secrets Manager reads the Octopus OIDC keys', requiredFor: ['octopus'], edition: 'both', source: S.octopus, confidence: 'documented' },

  // ---- Customer-hosted CI/CD and automation ----
  ...smFlows('jenkins-fetch', 'cicd-self', 'Jenkins plugin authenticates with its JWT and fetches secrets', ['jenkins'], S.jenkins),
  { id: 'jenkins-jwks', from: 'sm-saas', to: 'cicd-self', port: '443', protocol: 'HTTPS', endpoint: '<jenkins-url>/jwtauth/conjur-jwk-set', purpose: 'Secrets Manager reads the Jenkins JWKS (only if Jenkins is reachable; otherwise use public-keys)', requiredFor: ['jenkins'], edition: 'both', source: S.jenkins, confidence: 'documented', note: 'Inbound to Jenkins. The doc offers jwks-uri for public Jenkins, public-keys otherwise.' },
  ...smFlows('ansible-fetch', 'cicd-self', 'Ansible lookup plugin fetches secrets from the control node', ['ansible'], S.ansible),
  ...smFlows('tf-fetch', 'cicd-self', 'Terraform provider authenticates and reads secrets during plan and apply', ['terraform'], S.terraform),
  ...smFlows('puppet-fetch', 'cicd-self', 'Puppet agent fetches the secret with its own identity (Deferred function)', ['puppet'], S.puppet, { onlySh: true }),

  // ---- Platform apps ----
  ...smFlows('cf-fetch', 'platform-apps', 'Cloud Foundry service broker and buildpack fetch secrets', ['cf'], S.cf, { onlySh: true }),
  ...smFlows('mule-fetch', 'platform-apps', 'Mule connector authenticates with an API key and retrieves secrets', ['mulesoft'], S.mulesoft),
  ...smFlows('python-fetch', 'platform-apps', 'Python SDK authenticates and fetches secrets', ['python'], S.python),

  // ---- Credential Providers (PAM back end decides the Vault) ----
  { id: 'cp-vault', from: 'cp-agent', to: 'pam-vault', port: '1858', protocol: 'TCP (Vault protocol, encrypted)', endpoint: '<vault-address>', purpose: 'Credential Provider retrieves credentials and refreshes its cache', requiredFor: ['cpAgent', 'ascp'], edition: 'both', pam: 'selfhosted', source: S.cpInstall, confidence: 'documented', note: 'Default Vault port 1858.' },
  { id: 'cp-pcloud', from: 'cp-agent', to: 'pcloud', port: '1858', protocol: 'TCP (Vault protocol, encrypted)', endpoint: '<privilege-cloud-vault-address>', purpose: 'Credential Provider retrieves credentials from Privilege Cloud', requiredFor: ['cpAgent', 'ascp'], edition: 'both', pam: 'privilegecloud', source: S.cpInstall, confidence: 'inferred', note: 'Same Vault protocol and default port; confirm the Privilege Cloud Vault address for your tenant.' },
  { id: 'appserver-cp', from: 'appserver', to: 'cp-agent', port: 'n/a', protocol: 'Local (ASCP on the same host)', endpoint: 'localhost', purpose: 'ASCP data source asks the local Credential Provider', requiredFor: ['ascp'], edition: 'both', source: S.cpInstall, confidence: 'inferred', note: 'ASCP runs with the Credential Provider on the application server.' },
  { id: 'legacy-ccp', from: 'legacy-app', to: 'ccp', port: '443', protocol: 'HTTPS (REST)', endpoint: 'https://<CCP>/AIMWebService/api/Accounts', purpose: 'Application requests the password from the CCP web service', requiredFor: ['ccp'], edition: 'both', source: S.ccpInstall, confidence: 'inferred', note: 'CCP runs on IIS; HTTPS default port, check the IIS binding.' },
  { id: 'ccp-vault', from: 'ccp', to: 'pam-vault', port: '1858', protocol: 'TCP (Vault protocol, encrypted)', endpoint: '<vault-address>', purpose: 'CCP uses the Credential Provider installed on the IIS host to reach the Vault', requiredFor: ['ccp', 'zos'], edition: 'both', pam: 'selfhosted', source: S.cpInstall, confidence: 'documented' },
  { id: 'ccp-pcloud', from: 'ccp', to: 'pcloud', port: '1858', protocol: 'TCP (Vault protocol, encrypted)', endpoint: '<privilege-cloud-vault-address>', purpose: 'CCP reaches Privilege Cloud (can share the Privilege Cloud Connector host)', requiredFor: ['ccp', 'zos'], edition: 'both', pam: 'privilegecloud', source: S.ccpInstall, confidence: 'inferred', note: 'Default Vault port assumed for Privilege Cloud.' },
  { id: 'zos-sdk', from: 'zos-job', to: 'zos-cp', port: '18923', protocol: 'TCP (local SDK)', endpoint: 'same LPAR', purpose: 'Job calls the z/OS Credential Provider through the SDK', requiredFor: ['zos'], edition: 'both', source: S.zosConf, confidence: 'documented' },
  { id: 'zos-ccp', from: 'zos-cp', to: 'ccp', port: '443', protocol: 'HTTPS (optional client certificate)', endpoint: 'https://<CCP>', purpose: 'z/OS provider reaches the Vault through the Central Credential Provider', requiredFor: ['zos'], edition: 'both', source: S.zosConf, confidence: 'inferred', note: 'HTTPS documented; the port depends on the IIS binding.' },

  // ---- Databases, rotation, PAM sync ----
  { id: 'cpm-db', from: 'cpm', to: 'db', port: '<db-port>', protocol: 'Database protocol', endpoint: '<database-host>', purpose: 'CPM rotates and verifies the database passwords (Dual Accounts alternate two accounts)', requiredFor: ['dual', 'rotation'], edition: 'both', source: S.sync, confidence: 'inferred', note: 'Port is the database listener.' },
  { id: 'cpm-vault', from: 'cpm', to: 'pam-vault', port: '1858', protocol: 'TCP (Vault protocol, encrypted)', endpoint: '<vault-address>', purpose: 'CPM reads and updates accounts in the Vault', requiredFor: ['dual', 'rotation'], edition: 'both', pam: 'selfhosted', source: S.cpInstall, confidence: 'inferred', note: 'Default Vault port.' },
  { id: 'sync-vault', from: 'synchronizer', to: 'pam-vault', port: '1858', protocol: 'TCP (Vault protocol, encrypted)', endpoint: '<vault-address>', purpose: 'Vault Synchronizer reads accounts from the Safes', requiredFor: ['rotation'], edition: 'saas', pam: 'selfhosted', source: S.sync, confidence: 'documented', note: 'Synchronizer setting Port, default 1858.' },
  ...smFlows('sync-sm', 'synchronizer', 'Vault Synchronizer pushes the synced accounts to Secrets Manager', ['rotation'], S.sync, { onlySaas: true }).map(f => ({ ...f, pam: 'selfhosted' as const })),

  // ---- Secrets Hub: targets ----
  { id: 'shub-aws', from: 'shub', to: 'aws-sm', port: '443', protocol: 'HTTPS (AWS Secrets Manager API)', endpoint: 'secretsmanager.<region>.amazonaws.com', purpose: 'Secrets Hub writes secrets to AWS Secrets Manager (one-way sync) using an IAM role it assumes', requiredFor: ['shub-aws'], edition: 'both', source: S.shubAws, confidence: 'inferred', note: 'Endpoint is the AWS API default. Allowlist the two static Secrets Hub IPs of your region if the store is restricted; private accounts need a connector.' },
  { id: 'shub-akv', from: 'shub', to: 'akv', port: '443', protocol: 'HTTPS (Azure Key Vault API, federated identity)', endpoint: '<vault-name>.vault.azure.net', purpose: 'Secrets Hub writes secrets to Azure Key Vault', requiredFor: ['shub-akv'], edition: 'both', source: S.shubArch, confidence: 'inferred', note: 'Endpoint is the Azure API default. Key Vaults with public access disabled need a connector.' },
  { id: 'shub-gsm', from: 'shub', to: 'gsm', port: '443', protocol: 'HTTPS (GCP Secret Manager API)', endpoint: 'secretmanager.googleapis.com', purpose: 'Secrets Hub writes secrets to GCP Secret Manager', requiredFor: ['shub-gsm'], edition: 'both', source: S.shubGcp, confidence: 'inferred', note: 'Endpoint is the Google API default.' },
  { id: 'shub-conn-hcv', from: 'shub-connector', to: 'hcv', port: '8200', protocol: 'HTTPS (Vault API, KV v2)', endpoint: '<hashicorp-vault-host>', purpose: 'Connector writes secrets to HashiCorp Vault (Open Source or Enterprise 1.2x) in the private network', requiredFor: ['shub-hcv'], edition: 'both', source: S.shubSupport, confidence: 'inferred', note: 'Version and KV v2 documented; 8200 is the HashiCorp default listener, use yours.' },
  { id: 'shub-conn-broker', from: 'shub-connector', to: 'iot-broker', port: '443', protocol: 'MQTT over TLS (outbound, long-lived)', endpoint: 'a3vvqcp8z371p3-ats.iot.<region>.amazonaws.com', purpose: 'Connector keeps an outbound connection to the platform; bypass TLS inspection for this host', requiredFor: ['shub-hcv', 'shubSh'], edition: 'both', source: S.shubConnReq, confidence: 'documented', note: 'The FQDN and the MQTT outbound connection are documented; 443 is the documented proxy/HTTPS path.' },
  // ---- Secrets Hub: source (PAM back end) ----
  { id: 'shub-conn-pvwa', from: 'shub-connector', to: 'pvwa', port: '443', protocol: 'HTTPS', endpoint: 'https://<pvwa-or-lb>/passwordvault', purpose: 'Secrets Hub reads accounts from PAM Self-Hosted (11.5 or later) through a dedicated connector pool', requiredFor: ['shubSh'], edition: 'both', pam: 'selfhosted', source: S.shubPamsh, confidence: 'documented', note: 'Verify trust with Invoke-WebRequest to the PVWA URL; only one PVWA load balancer is supported.' },
  { id: 'shub-pcloud', from: 'shub', to: 'pcloud', port: 'n/a', protocol: 'Platform internal', endpoint: 'same tenant', purpose: 'Secrets Hub reads accounts from Privilege Cloud Safes', requiredFor: ['shubPc'], edition: 'both', pam: 'privilegecloud', source: S.shubArch, confidence: 'inferred', note: 'Both services run in the IDIRA SaaS platform; no customer rule.' },

  // ---- AI ----
  ...smFlows('ai-sm', 'ai-agent', 'Agent authenticates to Secrets Manager with a JWT-SVID (aud: conjur) and fetches secrets', ['swaAi'], S.swaAi, { onlySaas: true }),
  { id: 'ai-anthropic', from: 'ai-agent', to: 'anthropic', port: '443', protocol: 'HTTPS', endpoint: 'api.anthropic.com', purpose: 'Agent exchanges a JWT-SVID for a Claude API token (workload identity federation)', requiredFor: ['swaAi'], edition: 'saas', source: S.swaClaude, confidence: 'documented' },
  { id: 'ai-swa', from: 'ai-agent', to: 'swa-agent', port: 'n/a', protocol: 'Unix socket (Workload API)', endpoint: '/run/swa-agent/api.sock', purpose: 'Agent gets its SVID from the local SWA Agent', requiredFor: ['swaAi'], edition: 'saas', source: S.swaAws, confidence: 'documented' },
  ...smFlows('mcp-sm', 'mcp', 'MCP server calls the Secrets Manager API on behalf of the signed-in developer', ['mcp'], S.mcp, { onlySaas: true }),
  { id: 'mcp-identity', from: 'mcp', to: 'identity', port: '443', protocol: 'HTTPS', endpoint: '<tenant>.id.cyberark.cloud', purpose: 'Developer signs in with a dedicated Identity user', requiredFor: ['mcp'], edition: 'saas', source: S.mcp, confidence: 'inferred', note: 'Endpoint documented; HTTPS default port.' },
]

// ---------------------------------------------------------------------------
// Requirements
// ---------------------------------------------------------------------------

export const REQUIREMENTS: Requirement[] = [
  // Secrets Manager general
  { id: 'r-sm-saas-tenant', node: 'sm-saas', category: 'config', text: 'An IDIRA Secrets Manager SaaS tenant; note its subdomain (<subdomain>.secretsmgr.cyberark.cloud). The account name is always "conjur".', requiredFor: SM_KEYS, edition: 'saas', source: S.sysReq, confidence: 'documented' },
  { id: 'r-sm-sh-ports', node: 'sm-leader', category: 'network', text: 'Self-Hosted cluster ports: 443 (TLS API/UI), 444 (HTTP health), 5432 (replication), 1999 (audit stream); 22 for SSH management is optional.', requiredFor: SM_KEYS, edition: 'selfhosted', source: S.shPorts, confidence: 'documented' },
  { id: 'r-sm-admin', node: 'sm-saas', category: 'permission', text: 'An admin able to load policy and create/enable authenticators (JWT, IAM, Azure, GCP, certificate).', requiredFor: SM_KEYS, edition: 'both', source: S.jwtGuide, confidence: 'documented' },
  { id: 'r-sm-sh-allowlist', node: 'sm-leader', category: 'config', text: 'Each authenticator must be enabled on the server (authenticators allowlist in conjur.yml or CONJUR_AUTHENTICATORS).', requiredFor: SM_KEYS, edition: 'selfhosted', source: S.shPorts, confidence: 'inferred', note: 'Stated in the Self-Hosted authenticator guides.' },
  { id: 'r-edge', node: 'sm-saas', category: 'network', text: 'Optional Edge on premises: outbound HTTPS 443 to <subdomain>.secretsmgr.cyberark.cloud and to axx7fsdfugbqd-ats.iot.<region>.amazonaws.com; inbound only from permitted subnets (443 API, 444 health).', requiredFor: SM_KEYS, edition: 'saas', source: S.edgeFw, confidence: 'documented' },

  // Kubernetes
  { id: 'r-k8s-jwt', node: 'k8s-api', category: 'config', text: 'JWT authenticator per cluster (EKS, AKS, GKE, OpenShift or other): jwks-uri reachable by Secrets Manager, or public-keys set from the cluster JWKS when the issuer is not reachable; issuer and audience configured.', requiredFor: K8S, edition: 'both', source: S.k8sJwt, confidence: 'documented' },
  { id: 'r-k8s-sa', node: 'k8s-app', category: 'config', text: 'A service account per application; the workload identity in policy maps to namespace / service account claims.', requiredFor: K8S, edition: 'both', source: S.k8sJwt, confidence: 'documented' },
  { id: 'r-k8s-install', node: 'sp', category: 'install', text: 'Install the chosen delivery method: Secrets Provider (Helm, sidecar/init/standalone), External Secrets Operator, or Secrets Store CSI Driver with the provider.', requiredFor: K8S_DELIVERY, edition: 'both', source: S.k8sJwt, confidence: 'documented' },
  { id: 'r-k8s-follower', node: 'sm-follower-k8s', category: 'install', text: 'Kubernetes Follower (Helm/operator) with network reach to the Leader load balancer on 443, 5432 and 1999.', requiredFor: K8S, edition: 'selfhosted', source: S.shK8sFollower, confidence: 'documented' },
  { id: 'r-secretless', node: 'secretless', category: 'install', text: 'Secretless Broker sidecar with a secretless.yml listing connectors (PostgreSQL, MySQL, HTTP, SSH...) and credential sources.', requiredFor: ['secretless'], edition: 'selfhosted', source: S.secretless, confidence: 'documented' },

  // SWA
  { id: 'r-swa-8443', node: 'swa-server', category: 'network', text: 'SWA Server API on TCP 8443 behind a load balancer, reachable from every node or host running an SWA Agent (raise the firewall change early).', requiredFor: SWA, edition: 'saas', source: S.swaLb, confidence: 'documented' },
  { id: 'r-swa-agent', node: 'swa-agent', category: 'install', text: 'SWA Agent on each node (DaemonSet) or host, with server.address set to <lb>:8443; workloads use the Workload API socket /run/swa-agent/api.sock.', requiredFor: SWA, edition: 'saas', source: S.swaLb, confidence: 'documented' },
  { id: 'r-swa-aws', node: 'aws-sts', category: 'config', text: 'AWS IAM OIDC provider for the SWA trust domain issuer and a role trust policy for the SPIFFE ID (audience sts.amazonaws.com).', requiredFor: ['swaS3'], edition: 'saas', source: S.swaAws, confidence: 'documented' },
  { id: 'r-swa-saas-only', node: 'swa-server', category: 'config', text: 'Secure Workload Access is a Secrets Manager SaaS capability; there is no Self-Hosted equivalent.', requiredFor: SWA, edition: 'both', source: S.swaLb, confidence: 'documented' },

  // Clouds
  { id: 'r-aws-iam', node: 'aws-app', category: 'config', text: 'authn-iam: workload host ID is <AccountID>/<RoleName>; the workload signs the request with its IAM role credentials (EC2 instance role, Lambda execution role, ECS task role).', requiredFor: ['awsIam', ...AWS_COMPUTE], edition: 'both', source: S.awsIamCfg, confidence: 'documented', note: 'The doc example uses EC2; Lambda and ECS use the same role-based signing.' },
  { id: 'r-azure', node: 'azure-app', category: 'config', text: 'authn-azure: system or user-assigned managed identity (documented for Azure VMs and Azure Functions); workload annotations for subscription, resource group and identity.', requiredFor: ['azureMi', ...AZ_COMPUTE], edition: 'both', source: S.azureOvw, confidence: 'documented', note: 'App Service uses the same managed identity mechanism but is not listed.' },
  { id: 'r-gcp', node: 'gcp-app', category: 'config', text: 'authn-gcp: Compute Engine instance or Cloud Function service account (Google recommends a user-managed service account); workload annotations for project and service account.', requiredFor: ['gcpId', ...GCP_COMPUTE], edition: 'both', source: S.gcpAuthn, confidence: 'documented', note: 'Cloud Run is not listed in the doc.' },
  { id: 'r-k8s-managed', node: 'k8s-api', category: 'config', text: 'Managed Kubernetes (EKS, AKS, GKE): authenticate pods with the JWT authenticator and the cluster OIDC issuer rather than the cloud authenticators.', requiredFor: ['aws-eks', 'azure-aks', 'gcp-gke'], edition: 'both', source: S.k8sJwt, confidence: 'inferred', note: 'Follows the Kubernetes JWT guide; the cloud-specific clusters are not named there.' },
  { id: 'r-dyn', node: 'sm-saas', category: 'config', text: 'Dynamic secrets: an issuer with permission to assume the target role (AWS) or create tokens/keys (GCP, SaaS only); TTLs set per secret.', requiredFor: ['dynamic-aws', 'dynamic-gcp'], edition: 'both', source: S.dynAws, confidence: 'documented' },

  // CI/CD
  { id: 'r-gha', node: 'gha', category: 'config', text: 'Workflow permission id-token: write; JWT authenticator with issuer https://token.actions.githubusercontent.com and repository/workflow annotations.', requiredFor: ['gha'], edition: 'both', source: S.gha, confidence: 'documented' },
  { id: 'r-gitlab', node: 'gitlab', category: 'version', text: 'GitLab 15.11.2+, Runner 15.8.2+, CLI v9.x; ID token aud equal to the authenticator audience; images for Alpine, Ubuntu or UBI-FIPS.', requiredFor: ['gitlab'], edition: 'both', source: S.gitlab, confidence: 'documented' },
  { id: 'r-azdo', node: 'azdo', category: 'config', text: 'Azure DevOps extension with an Azure Resource Manager service connection; secrets.yml in the triggering repository.', requiredFor: ['azdo'], edition: 'both', source: S.azdo, confidence: 'documented' },
  { id: 'r-bb', node: 'bitbucket', category: 'config', text: 'Bitbucket Cloud with oidc: true on the step; workload name equals the repository UUID; delete secrets.env if load_secrets.sh is not used.', requiredFor: ['bitbucket'], edition: 'both', source: S.bitbucket, confidence: 'documented' },
  { id: 'r-circle', node: 'circleci', category: 'config', text: 'Audience equal to the CircleCI organization ID; PEM certificate when the server certificate is self-signed.', requiredFor: ['circleci'], edition: 'both', source: S.circleci, confidence: 'documented' },
  { id: 'r-octo', node: 'octopus', category: 'config', text: 'Generic OIDC account in Octopus; token sub and audience (conjur) must match the workload annotations.', requiredFor: ['octopus'], edition: 'both', source: S.octopus, confidence: 'documented' },
  { id: 'r-jenkins', node: 'cicd-self', category: 'install', text: 'Jenkins plugin with JWT; JWKS from <jenkins-url>/jwtauth/conjur-jwk-set (jwks-uri) or public-keys when Jenkins is not reachable.', requiredFor: ['jenkins'], edition: 'both', source: S.jenkins, confidence: 'documented' },
  { id: 'r-ansible', node: 'cicd-self', category: 'install', text: 'Ansible collection / lookup plugin on the control node with an identity for the control node.', requiredFor: ['ansible'], edition: 'both', source: S.ansible, confidence: 'documented' },
  { id: 'r-tf', node: 'cicd-self', category: 'version', text: 'Terraform 0.13+; use ephemeral resources (1.10+) or write-only arguments (1.11+) to keep values out of the state; never put api_key in .tf files.', requiredFor: ['terraform'], edition: 'both', source: S.terraform, confidence: 'documented' },
  { id: 'r-puppet', node: 'cicd-self', category: 'version', text: 'Puppet module with Deferred functions (Puppet 6+); the agent fetches with its own identity. Self-Hosted only.', requiredFor: ['puppet'], edition: 'selfhosted', source: S.puppet, confidence: 'inferred', note: 'The doc points to the module README for details.' },

  // Platforms
  { id: 'r-cf', node: 'platform-apps', category: 'install', text: 'Service Broker and buildpack (Summon) on Cloud Foundry / Tanzu; app identity uses the Leader, space identity a Follower. Self-Hosted only.', requiredFor: ['cf'], edition: 'selfhosted', source: S.cf, confidence: 'documented' },
  { id: 'r-mule', node: 'platform-apps', category: 'config', text: 'Mule connector with API key authentication (only method supported); Retrieve secret operation.', requiredFor: ['mulesoft'], edition: 'both', source: S.mulesoft, confidence: 'documented' },
  { id: 'r-python', node: 'platform-apps', category: 'config', text: 'Python SDK; with AWS IAM the access token lasts 5 to 8 minutes and is not renewed automatically by the client.', requiredFor: ['python'], edition: 'both', source: S.python, confidence: 'documented' },
  { id: 'r-vm', node: 'vm-app', category: 'config', text: 'VM workloads: prefer certificate authentication or an attested method; an API key is a secret zero (rotate it, restrict by IP/CIDR in Self-Hosted).', requiredFor: ['apiKey', 'cert', 'summon', 'iot'], edition: 'both', source: S.apiKey, confidence: 'documented' },

  // Credential Providers
  { id: 'r-cp', node: 'cp-agent', category: 'install', text: 'Credential Provider installed on the application host with access to the Vault on TCP 1858; application defined with authentication (allowed machines, OS user, path, hash or certificate).', requiredFor: ['cpAgent', 'ascp'], edition: 'both', source: S.cpInstall, confidence: 'documented' },
  { id: 'r-ccp', node: 'ccp', category: 'install', text: 'Central Credential Provider on Windows with IIS 10 (IIS 6 compatibility), ASP.NET 4.x and the Credential Provider; same domain as requesting apps for Windows domain user authentication.', requiredFor: ['ccp', 'zos'], edition: 'both', source: S.ccpInstall, confidence: 'documented' },
  { id: 'r-zos', node: 'zos-cp', category: 'version', text: 'z/OS 2.5, 3.1 or 3.2 with Java 8; IPv4 only; one provider per LPAR running as UID 0; clocks in UTC; Vault 12.2+ (Privilege Cloud 14.2+).', requiredFor: ['zos'], edition: 'both', source: S.zosConf, confidence: 'documented' },

  // Databases / sync
  { id: 'r-sync', node: 'synchronizer', category: 'install', text: 'Vault Synchronizer on Windows with access to the Vault (default 1858) and a dedicated Safe per Synchronizer when several connect to one Vault.', requiredFor: ['rotation'], edition: 'saas', pam: 'selfhosted', source: S.sync, confidence: 'documented' },
  { id: 'r-dual', node: 'cpm', category: 'config', text: 'Dual Accounts: two accounts per target and a rotation group so apps never read a password being changed.', requiredFor: ['dual'], edition: 'both', source: S.sync, confidence: 'inferred', note: 'See the Dual Accounts page of the PAM docs.' },

  // Secrets Hub
  { id: 'r-shub-conn', node: 'shub-connector', category: 'sizing', text: 'Connector host: Windows Server 2016, 2019, 2022 or 2025; 8 cores, 8 GB RAM; System Administrator role in Identity Administration to add connectors.', requiredFor: ['shub-hcv', 'shubSh'], edition: 'both', source: S.shubConnReq, confidence: 'documented' },
  { id: 'r-shub-pamsh', node: 'pvwa', category: 'version', text: 'PAM Self-Hosted source: version 11.5 or later, a dedicated connector pool, the PVWA URL (one load balancer only), and a Secrets Hub service user created by a Vault user with Add Users and Update Users (its password is then rotated by Secrets Hub). Up to 1000 Safes from 12.1 (150 up to 12.0), 500 accounts per Safe.', requiredFor: ['shubSh'], edition: 'both', pam: 'selfhosted', source: S.shubSupport, confidence: 'documented' },
  { id: 'r-shub-pcloud', node: 'pcloud', category: 'config', text: 'Privilege Cloud source: Secrets Hub reads the Safes of the same tenant; add the Secrets Hub user to each Safe to sync.', requiredFor: ['shubPc'], edition: 'both', pam: 'privilegecloud', source: S.shubArch, confidence: 'inferred', note: 'Safe membership is how Secrets Hub reaches accounts in both sources.' },
  { id: 'r-shub-ips', node: 'shub', category: 'network', text: 'Restrict target stores to the two static Secrets Hub IPs of your region, or use a connector for private stores.', requiredFor: ['shub-aws', 'shub-akv', 'shub-gsm'], edition: 'both', source: S.shubIps, confidence: 'documented' },
  { id: 'r-shub-aws', node: 'aws-sm', category: 'permission', text: 'AWS: the IAM role and policy Secrets Hub assumes, created with the provided CloudFormation or Terraform; private accounts need a connector.', requiredFor: ['shub-aws'], edition: 'both', source: S.shubAws, confidence: 'documented' },
  { id: 'r-shub-akv', node: 'akv', category: 'config', text: 'Azure: Secrets Hub authenticates with federated identity (client secret not supported when onboarding a tenant); private Key Vaults need a connector and network peering across subscriptions.', requiredFor: ['shub-akv'], edition: 'both', source: S.shubArch, confidence: 'documented' },
  { id: 'r-shub-gsm', node: 'gsm', category: 'permission', text: 'GCP: a service account with permissions on Secret Manager in the target project, added as a secret store.', requiredFor: ['shub-gsm'], edition: 'both', source: S.shubGcp, confidence: 'documented' },
  { id: 'r-shub-hcv', node: 'hcv', category: 'version', text: 'HashiCorp Vault Open Source or Enterprise 1.2x, KV secrets engine version 2, reached through a connector.', requiredFor: ['shub-hcv'], edition: 'both', source: S.shubSupport, confidence: 'documented' },

  // AI
  { id: 'r-ai', node: 'ai-agent', category: 'config', text: 'Agent identity from SWA (JWT-SVID); Secrets Manager JWT authenticator trusting the trust domain JWKS; Claude API workload identity federation configured for the SPIFFE ID.', requiredFor: ['swaAi'], edition: 'saas', source: S.swaClaude, confidence: 'documented' },
  { id: 'r-mcp', node: 'mcp', category: 'config', text: 'MCP server (beta) as a container run by the AI tool; dedicated Identity user for the developer; SaaS only.', requiredFor: ['mcp'], edition: 'saas', source: S.mcp, confidence: 'documented' },
  { id: 'r-users', node: 'admins', category: 'config', text: 'Users authenticate through Identity (SaaS) or the configured user authenticators (Self-Hosted: password, LDAP, OIDC).', requiredFor: ['users'], edition: 'both', source: S.userApi, confidence: 'documented' },
]

// ---------------------------------------------------------------------------
// Adapter: page ids -> integration keys. Update this map when the page ids change.
// ---------------------------------------------------------------------------

export const ADAPTER: Record<string, string[]> = {
  // new environment / detail ids
  'aws.ec2': ['aws-ec2'], 'aws.lambda': ['aws-lambda'], 'aws.ecs': ['aws-ecs'], 'aws.eks': ['aws-eks'],
  'aws.secretsmanager': ['shub-aws'],
  'azure.vm': ['azure-vm'], 'azure.appservice': ['azure-func'], 'azure.functions': ['azure-func'], 'azure.aks': ['azure-aks'],
  'azure.keyvault': ['shub-akv'], 'azure.devops': ['azdo'],
  'gcp.gce': ['gcp-gce'], 'gcp.run': ['gcp-func'], 'gcp.functions': ['gcp-func'], 'gcp.gke': ['gcp-gke'], 'gcp.secretmanager': ['shub-gsm'],
  'onprem.hashicorp': ['shub-hcv'], 'onprem.iot': ['iot'],
  'pam.privilegecloud': ['pam:privilegecloud'], 'pam.selfhosted': ['pam:selfhosted'],
  'cicd.jenkins': ['jenkins'], 'cicd.gitlab': ['gitlab'], 'cicd.github': ['gha'], 'cicd.bitbucket': ['bitbucket'], 'cicd.circleci': ['circleci'],
  'cicd.octopus': ['octopus'], 'cicd.ansible': ['ansible'], 'cicd.terraform': ['terraform'], 'cicd.puppet': ['puppet'],
  // current tile ids
  awssm: ['shub-aws'], akv: ['shub-akv'], gsm: ['shub-gsm'], hcv: ['shub-hcv'], iot: ['iot'],
}

/** Cloud hints used to pick the right Secrets Hub store / dynamic-secrets cloud when none is explicit. */
const CLOUD_HINT: Array<{ test: RegExp; store: string; dynamic?: string }> = [
  { test: /^(aws|aws\..*|aws-.*)$/, store: 'shub-aws', dynamic: 'dynamic-aws' },
  { test: /^(azure|azure\..*|azure-.*)$/, store: 'shub-akv' },
  { test: /^(gcp|gcp\..*|gcp-.*)$/, store: 'shub-gsm', dynamic: 'dynamic-gcp' },
  { test: /^(hcv|onprem\.hashicorp|shub-hcv)$/, store: 'shub-hcv' },
]

export interface ResolveInput {
  recs?: string[]          // recommendation ids from the page (RECS keys)
  have?: string[]          // any page ids (environments, details, tiles); mapped through ADAPTER
  edition?: Edition        // Secrets Manager edition, default 'saas'
  pam?: PamBackend         // PAM back end; default from have ('pam.*'), else follows edition
}

/** Expands recs + have into the integration keys used by flows and requirements. */
export function expandKeys(input: ResolveInput): { keys: Set<string>; pam: PamBackend } {
  const keys = new Set<string>(input.recs ?? [])
  const have = input.have ?? []
  for (const h of have) (ADAPTER[h] ?? []).forEach(k => keys.add(k))
  const all = [...keys, ...have]
  // dynamic secrets: pick the cloud(s)
  if (keys.has('dynamic')) {
    const clouds = CLOUD_HINT.filter(c => c.dynamic && all.some(a => c.test.test(a))).map(c => c.dynamic!)
    ;(clouds.length ? clouds : ['dynamic-aws', 'dynamic-gcp']).forEach(k => keys.add(k))
  }
  // Secrets Hub: pick the target stores
  if ((keys.has('shubPc') || keys.has('shubSh')) && !STORES.some(s => keys.has(s))) {
    const stores = CLOUD_HINT.filter(c => all.some(a => c.test.test(a))).map(c => c.store)
    ;(stores.length ? stores : STORES).forEach(k => keys.add(k))
  }
  // PAM back end
  let pam: PamBackend = input.pam ?? (keys.has('pam:selfhosted') ? 'selfhosted' : keys.has('pam:privilegecloud') ? 'privilegecloud'
    : (input.edition ?? 'saas') === 'saas' ? 'privilegecloud' : 'selfhosted')
  if (!input.pam && keys.has('shubSh') && !keys.has('shubPc')) pam = 'selfhosted'
  if (!input.pam && keys.has('shubPc') && !keys.has('shubSh')) pam = 'privilegecloud'
  // a Secrets Hub store implies a source on the chosen PAM
  if (STORES.some(s => keys.has(s)) && !keys.has('shubPc') && !keys.has('shubSh')) keys.add(pam === 'selfhosted' ? 'shubSh' : 'shubPc')
  return { keys, pam }
}

// ---------------------------------------------------------------------------
// Resolver
// ---------------------------------------------------------------------------

export interface FirewallRule {
  direction: Direction
  sourceZone: ZoneId
  sourceLabel: string
  rules: Array<{ port: string; protocol: string; destination: string; endpoint: string; purpose: string; confidence: Confidence }>
}

export interface Resolved {
  edition: Edition
  pam: PamBackend
  selected: string[]       // the input ids (recs + have), for titles and exports
  keys: string[]           // integration keys after expansion
  nodes: NetNode[]
  flows: Array<NetFlow & { direction: Direction }>
  requirements: Requirement[]
  firewallRules: FirewallRule[]
  zones: Zone[]
}

const NODE = Object.fromEntries(NODES.map(n => [n.id, n]))
const ZONE = Object.fromEntries(ZONES.map(z => [z.id, z]))
const isCustomer = (z: ZoneId) => ZONE[z].customer

const editionMatch = (e: FlowEdition, ed: Edition) => e === 'both' || e === ed

/** Customer side = a customer zone, or a customer-owned workload running in a cloud account. */
const customerSide = (id: string) => isCustomer(NODE[id].zone) || NODE[id].product === 'customer'

export function directionOf(f: Pick<NetFlow, 'from' | 'to' | 'directionOverride'>): Direction {
  if (f.directionOverride) return f.directionOverride
  const a = customerSide(f.from), b = customerSide(f.to)
  if (a && b) return 'internal'
  if (a && !b) return 'outbound'
  if (!a && b) return 'inbound'
  return 'external'
}

/** In Self-Hosted the "SaaS" side of a both-edition flow (e.g. JWKS reads) starts at the Follower. */
function adaptFlow(f: NetFlow, ed: Edition): NetFlow {
  if (ed === 'selfhosted' && f.edition === 'both' && f.from === 'sm-saas') return { ...f, from: 'sm-follower' }
  return f
}

/**
 * resolve({ recs, have, edition, pam }). For backwards compatibility,
 * resolve(ids, edition) treats ids as `have` (old tile ids map through ADAPTER
 * and LEGACY_TILES).
 */
export function resolve(input: ResolveInput | string[], edition: Edition = 'saas'): Resolved {
  const inp: ResolveInput = Array.isArray(input)
    ? { have: input, recs: input.flatMap(t => LEGACY_TILES[t] ?? []), edition }
    : { ...input, edition: input.edition ?? 'saas' }
  const ed = inp.edition!
  const { keys, pam } = expandKeys(inp)
  const want = (f: { requiredFor: string[]; edition: FlowEdition; pam?: PamBackend; unlessAny?: string[] }) =>
    editionMatch(f.edition, ed) && (!f.pam || f.pam === pam) && f.requiredFor.some(k => keys.has(k)) && !(f.unlessAny ?? []).some(k => keys.has(k))
  const flows = FLOWS.filter(want).map(f => adaptFlow(f, ed)).map(f => ({ ...f, direction: directionOf(f) }))
  const requirements = REQUIREMENTS.filter(want)
  // only nodes that take part in a flow are drawn
  const connected = new Set<string>(); flows.forEach(f => { connected.add(f.from); connected.add(f.to) })
  const nodes = NODES.filter(n => connected.has(n.id))
  const zoneIds = new Set(nodes.map(n => n.zone))
  const zones = ZONES.filter(z => zoneIds.has(z.id))

  // consolidated firewall rules (customer-relevant only)
  const groups = new Map<string, FirewallRule>()
  for (const f of flows) {
    if (f.direction === 'external' || f.port === 'n/a' || f.directionOverride) continue
    const srcZone = NODE[f.from].zone
    const key = `${f.direction}|${srcZone}`
    if (!groups.has(key)) groups.set(key, { direction: f.direction, sourceZone: srcZone, sourceLabel: ZONE[srcZone].label, rules: [] })
    const g = groups.get(key)!
    const dup = g.rules.find(r => r.port === f.port && r.endpoint === f.endpoint && r.protocol === f.protocol)
    if (dup) { if (!dup.purpose.includes(f.purpose)) dup.purpose += `; ${f.purpose}`; if (f.confidence === 'documented') dup.confidence = 'documented'; continue }
    g.rules.push({ port: f.port, protocol: f.protocol, destination: NODE[f.to].label, endpoint: f.endpoint, purpose: f.purpose, confidence: f.confidence })
  }
  const order: Direction[] = ['outbound', 'inbound', 'internal']
  const firewallRules = [...groups.values()].sort((a, b) => order.indexOf(a.direction) - order.indexOf(b.direction))

  const selected = [...new Set([...(inp.recs ?? []), ...(inp.have ?? [])])]
  return { edition: ed, pam, selected, keys: [...keys], nodes, flows, requirements, firewallRules, zones }
}

/** Old tile ids (current page) -> their recommendation ids, used only by the array form of resolve(). */
export const LEGACY_TILES: Record<string, string[]> = {
  k8s: ['k8sArch', 'sdk', 'sidecar', 'eso', 'csi', 'spmodes', 'reloader', 'swaArch'], vm: ['apiKey', 'cert', 'summon', 'cpAgent'], cf: ['cf'],
  aws: ['awsIam', 'dynamic', 'swaS3', 'shubPc', 'shubSh'], azure: ['azureMi', 'shubPc', 'shubSh'], gcp: ['gcpId', 'dynamic', 'shubPc', 'shubSh'],
  mainframe: ['zos'], appservers: ['ascp'], windows: ['cpAgent', 'ccp'], iot: ['cert', 'apiKey'],
  jenkins: ['jenkins'], gitlab: ['gitlab'], gha: ['gha'], azdo: ['azdo'], bitbucket: ['bitbucket'], circleci: ['circleci'], octopus: ['octopus'],
  ansible: ['ansible'], terraform: ['terraform'], puppet: ['puppet'], java: ['sdk'], dotnet: ['sidecar'], python: ['python'], mulesoft: ['mulesoft'],
  awssm: ['shubPc', 'shubSh'], akv: ['shubPc', 'shubSh'], gsm: ['shubPc', 'shubSh'], hcv: ['shubPc', 'shubSh'],
  databases: ['secretless', 'dynamic', 'dual', 'rotation'], humans: ['users'], mtls: ['swaArch', 'svid', 'cert'], aiagent: ['swaAi', 'mcp'], mcpserver: ['mcp'], other: [],
}

export const nodeById = (id: string) => NODE[id]
export const zoneById = (id: ZoneId) => ZONE[id]
