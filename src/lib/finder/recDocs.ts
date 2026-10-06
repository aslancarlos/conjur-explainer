/**
 * Official documentation per recommendation (RECS id in src/pages/finderModel.ts),
 * for the prerequisites the customer receives. Every URL is a docs.cyberark.com
 * page checked against the docs mirror (title = the page title there); the
 * edition comes from the URL (secrets-manager-saas / secrets-manager-sh) and
 * `key` limits an entry to one integration key (a Secrets Hub target store).
 * Generated from the links each page already cites plus the integration guides.
 */
import type { Edition } from './netCatalog'

export const DOCS_BASE = 'https://docs.cyberark.com/'

export interface RecDoc { title: string; url: string; key?: string }

export const REC_DOCS: Record<string, RecDoc[]> = {
  k8sArch: [
    { title: "Workloads in Secrets Manager", url: "secrets-manager-saas/latest/en/content/get%20started/key_concepts/machine_identity.html" },
    { title: "Secrets in Secrets Manager", url: "secrets-manager-saas/latest/en/content/get%20started/key_concepts/secrets.html" },
    { title: "JWT-based Kubernetes authentication", url: "secrets-manager-saas/latest/en/content/integrations/k8s-ocp/k8s-jwt-authn.htm" },
    { title: "Secrets Provider for Kubernetes", url: "secrets-manager-saas/latest/en/content/integrations/k8s-ocp/cjr-k8s-jwt-sp-lp.htm" },
    { title: "JWT-based Kubernetes authentication", url: "secrets-manager-sh/latest/en/content/integrations/k8s-ocp/k8s-jwt-authn.htm" },
    { title: "Secrets Provider for Kubernetes", url: "secrets-manager-sh/latest/en/content/integrations/k8s-ocp/cjr-k8s-jwt-sp-lp.htm" },
  ],
  sdk: [
    { title: "Secrets Manager Java API", url: "secrets-manager-saas/latest/en/content/developer/conjur-api-java.html" },
    { title: "App owner: Set up workloads", url: "secrets-manager-saas/latest/en/content/integrations/k8s-ocp/k8s-jwt-set-up-apps.htm" },
    { title: "Secrets Manager Java API", url: "secrets-manager-sh/latest/en/content/developer/conjur-api-java.html" },
    { title: "Set up workloads (JWT-based authentication)", url: "secrets-manager-sh/latest/en/content/integrations/k8s-ocp/k8s-jwt-set-up-apps.htm" },
  ],
  sidecar: [
    { title: "Secrets Provider - Init container/Sidecar", url: "secrets-manager-saas/latest/en/content/integrations/k8s-ocp/cjr-k8s-jwt-sp-ic-lp.htm" },
    { title: "Secrets Provider - Init container/Sidecar - Push-to-File mode", url: "secrets-manager-saas/latest/en/content/integrations/k8s-ocp/cjr-k8s-jwt-sp-ic-p2f.htm" },
    { title: "Secrets Manager .NET API", url: "secrets-manager-sh/latest/en/content/developer/conjur-api-dotnet.html" },
    { title: "Secrets Provider - Init container/Sidecar", url: "secrets-manager-sh/latest/en/content/integrations/k8s-ocp/cjr-k8s-jwt-sp-ic-lp.htm" },
    { title: "Secrets Provider - Init container/Sidecar - Push-to-File mode", url: "secrets-manager-sh/latest/en/content/integrations/k8s-ocp/cjr-k8s-jwt-sp-ic-p2f.htm" },
  ],
  eso: [
    { title: "Secrets Manager Provider for External Secrets Operator", url: "secrets-manager-saas/latest/en/content/integrations/k8s-ocp/k8s-jwt-secrets-store-eso.htm" },
    { title: "Secrets Manager Provider for External Secrets Operator", url: "secrets-manager-sh/latest/en/content/integrations/k8s-ocp/k8s-jwt-secrets-store-eso.htm" },
  ],
  csi: [
    { title: "Secrets Manager Provider for Secrets Store CSI Driver", url: "secrets-manager-saas/latest/en/content/integrations/k8s-ocp/k8s-jwt-secrets-store-csi-driver.htm" },
    { title: "Secrets Manager Provider for Secrets Store CSI Driver", url: "secrets-manager-sh/latest/en/content/integrations/k8s-ocp/k8s-jwt-secrets-store-csi-driver.htm" },
  ],
  spmodes: [
    { title: "Secrets Provider configuration reference", url: "secrets-manager-saas/latest/en/content/integrations/k8s-ocp/cjr-k8s-secrets-provider-ref.htm" },
    { title: "Secrets Provider for Kubernetes", url: "secrets-manager-saas/latest/en/content/integrations/k8s-ocp/cjr-k8s-jwt-sp-lp.htm" },
    { title: "Secrets Provider configuration reference", url: "secrets-manager-sh/latest/en/content/integrations/k8s-ocp/cjr-k8s-secrets-provider-ref.htm" },
    { title: "Secrets Provider for Kubernetes", url: "secrets-manager-sh/latest/en/content/integrations/k8s-ocp/cjr-k8s-jwt-sp-lp.htm" },
  ],
  reloader: [
    { title: "Configure automatic application restart with Reloader for Kubernetes", url: "secrets-manager-saas/latest/en/content/integrations/k8s-ocp/k8s-configure-reloader.htm" },
    { title: "Configure automatic application restart with Reloader for Kubernetes", url: "secrets-manager-sh/latest/en/content/integrations/k8s-ocp/k8s-configure-reloader.htm" },
  ],
  secretless: [
    { title: "Secretless Broker Sidecar", url: "secrets-manager-sh/latest/en/content/integrations/k8s-ocp/k8s-secretless-sidecar.htm" },
    { title: "Secretless System Requirements", url: "secrets-manager-sh/latest/en/content/scl_systemreq.htm" },
    { title: "Secretless Service Connectors", url: "secrets-manager-sh/latest/en/content/references/connectors/scl_connectors_overview.htm" },
  ],
  jenkins: [
    { title: "Jenkins", url: "secrets-manager-saas/latest/en/content/integrations/jenkins.htm" },
    { title: "Jenkins", url: "secrets-manager-sh/latest/en/content/integrations/jenkins.htm" },
  ],
  gitlab: [
    { title: "GitLab", url: "secrets-manager-saas/latest/en/content/integrations/gitlab.htm" },
    { title: "Authenticate JWT", url: "secrets-manager-saas/latest/en/content/operations/services/cjr-authn-jwt-lp.htm" },
    { title: "Use-case example: Using JWT authentication to integrate Secrets Manager and GitLab", url: "secrets-manager-saas/latest/en/content/operations/services/cjr-authn-jwt-uc.htm" },
    { title: "GitLab", url: "secrets-manager-sh/latest/en/content/integrations/gitlab.htm" },
  ],
  azdo: [
    { title: "Azure DevOps step-by-step guide", url: "secrets-manager-saas/latest/en/content/integrations/azure-devops-extension-e2e.htm" },
    { title: "Azure DevOps", url: "secrets-manager-saas/latest/en/content/integrations/azure-devops-extension.htm" },
    { title: "Azure DevOps step-by-step guide", url: "secrets-manager-sh/latest/en/content/integrations/azure-devops-extension-e2e.htm" },
    { title: "Azure DevOps", url: "secrets-manager-sh/latest/en/content/integrations/azure-devops-extension.htm" },
  ],
  gha: [
    { title: "GitHub Actions", url: "secrets-manager-saas/latest/en/content/integrations/github-actions.htm" },
    { title: "Use-case example: Using JWT authentication to integrate GitHub actions", url: "secrets-manager-saas/latest/en/content/operations/services/cjr-authn-jwt-github-uc.htm" },
    { title: "GitHub Actions", url: "secrets-manager-sh/latest/en/content/integrations/github-actions.htm" },
    { title: "Use-case example: Using JWT authentication to integrate GitHub actions", url: "secrets-manager-sh/latest/en/content/operations/services/cjr-authn-jwt-github-uc.htm" },
  ],
  bitbucket: [
    { title: "Bitbucket", url: "secrets-manager-saas/latest/en/content/integrations/bitbucket-pipeline-e2e.htm" },
    { title: "Authenticate JWT", url: "secrets-manager-saas/latest/en/content/operations/services/cjr-authn-jwt-lp.htm" },
    { title: "Bitbucket", url: "secrets-manager-sh/latest/en/content/integrations/bitbucket-pipeline-e2e.htm" },
  ],
  circleci: [
    { title: "CircleCI", url: "secrets-manager-saas/latest/en/content/integrations/circle-ci.htm" },
    { title: "Authenticate JWT", url: "secrets-manager-saas/latest/en/content/operations/services/cjr-authn-jwt-lp.htm" },
    { title: "CircleCI", url: "secrets-manager-sh/latest/en/content/integrations/circle-ci.htm" },
  ],
  octopus: [
    { title: "Octopus", url: "secrets-manager-saas/latest/en/content/integrations/octopus.htm" },
    { title: "Authenticate JWT", url: "secrets-manager-saas/latest/en/content/operations/services/cjr-authn-jwt-lp.htm" },
    { title: "Octopus", url: "secrets-manager-sh/latest/en/content/integrations/octopus.htm" },
  ],
  ansible: [
    { title: "Ansible", url: "secrets-manager-saas/latest/en/content/integrations/ansible.html" },
    { title: "Ansible", url: "secrets-manager-sh/latest/en/content/integrations/ansible.html" },
  ],
  terraform: [
    { title: "Terraform", url: "secrets-manager-saas/latest/en/content/integrations/terraform_provider.htm" },
    { title: "Terraform", url: "secrets-manager-sh/latest/en/content/integrations/terraform.htm" },
    { title: "Secrets Manager Terraform Provider", url: "secrets-manager-sh/latest/en/content/integrations/terraform_provider.htm" },
    { title: "Terraform with the Summon utility", url: "secrets-manager-sh/latest/en/content/integrations/terraform_summon.htm" },
  ],
  puppet: [
    { title: "Puppet", url: "secrets-manager-sh/latest/en/content/integrations/puppet.html" },
  ],
  cf: [
    { title: "Cloud Foundry", url: "secrets-manager-sh/latest/en/content/integrations/cloud-foundry.html" },
    { title: "Install and Configure Conjur Service Broker for VMware Tanzu", url: "secrets-manager-sh/latest/en/content/integrations/tanzu/tanzu-install-service-broker.htm" },
    { title: "Service Broker for VMware Tanzu", url: "secrets-manager-sh/latest/en/content/integrations/tanzu/tanzu-service-broker.htm" },
    { title: "Use Conjur Service Broker for VMware Tanzu", url: "secrets-manager-sh/latest/en/content/integrations/tanzu/tanzu-use-conjur-service-broker.htm" },
    { title: "VMware Tanzu", url: "secrets-manager-sh/latest/en/content/integrations/tanzu/tanzu.htm" },
  ],
  mulesoft: [
    { title: "MuleSoft", url: "secrets-manager-saas/latest/en/content/integrations/mulesoft.htm" },
    { title: "MuleSoft", url: "secrets-manager-sh/latest/en/content/integrations/mulesoft.htm" },
  ],
  python: [
    { title: "Secrets Manager AWS IAM Client for Python", url: "secrets-manager-saas/latest/en/content/integrations/aws-iam-python.htm" },
    { title: "Secrets Manager Python API", url: "secrets-manager-saas/latest/en/content/integrations/python.htm" },
    { title: "Conjur AWS IAM Client for Python", url: "secrets-manager-sh/latest/en/content/integrations/aws-iam-python.htm" },
    { title: "Secrets Manager Python API", url: "secrets-manager-sh/latest/en/content/integrations/python.htm" },
  ],
  awsIam: [
    { title: "Set up AWS resources in Secrets Manager", url: "secrets-manager-saas/latest/en/content/operations/authn/authenticate-awsiam-appid.htm" },
    { title: "Configure the AWS IAM authenticator", url: "secrets-manager-saas/latest/en/content/operations/authn/authenticate-awsiam-config.htm" },
    { title: "Authenticate AWS workloads with AWS IAM Authenticator", url: "secrets-manager-saas/latest/en/content/operations/authn/authenticate-awsiam-overview.htm" },
    { title: "Authenticate workloads to Secrets Manager - SaaS", url: "secrets-manager-saas/latest/en/content/operations/authn/authn-lp.htm" },
    { title: "AWS IAM Authenticator", url: "secrets-manager-sh/latest/en/content/operations/services/aws_iam_authenticator.htm" },
  ],
  azureMi: [
    { title: "Authenticate using Azure Authenticator", url: "secrets-manager-saas/latest/en/content/developer/conjur_api_azure_authenticator.htm" },
    { title: "Set up Azure resources in Secrets Manager", url: "secrets-manager-saas/latest/en/content/operations/authn/authenticate-azure-appid.htm" },
    { title: "Configure an Azure Authenticator", url: "secrets-manager-saas/latest/en/content/operations/authn/authenticate-azure-config.htm" },
    { title: "Authenticate Azure workloads with Azure Authenticator", url: "secrets-manager-saas/latest/en/content/operations/authn/authenticate-azure-overview.htm" },
    { title: "Azure Authenticator", url: "secrets-manager-sh/latest/en/content/operations/services/azure_authn.htm" },
  ],
  gcpId: [
    { title: "Authenticate using GCP Authenticator", url: "secrets-manager-saas/latest/en/content/developer/conjur_api_gcp_authenticator.htm" },
    { title: "Set up GCP resources in Secrets Manager", url: "secrets-manager-saas/latest/en/content/operations/authn/authenticate-gcp-appid.htm" },
    { title: "Configure the GCP authenticator", url: "secrets-manager-saas/latest/en/content/operations/authn/authenticate-gcp-config.htm" },
    { title: "Authenticate GCP resources", url: "secrets-manager-saas/latest/en/content/operations/authn/authenticate-gcp-lp.htm" },
    { title: "GCP Authenticator", url: "secrets-manager-sh/latest/en/content/operations/services/cjr-gcp-authn.htm" },
  ],
  dynamic: [
    { title: "Manage dynamic secret resources", url: "secrets-manager-saas/latest/en/content/conjurcloud/ccl-dynamic-secrets.htm" },
    { title: "Manage issuers", url: "secrets-manager-saas/latest/en/content/conjurcloud/ccl-issuers.htm" },
    { title: "Create AWS dynamic secrets", url: "secrets-manager-saas/latest/en/content/operations/dynamic-secrets-aws.htm" },
    { title: "Create GCP dynamic secrets", url: "secrets-manager-saas/latest/en/content/operations/dynamic-secrets-gcp.htm" },
    { title: "Create AWS dynamic secrets", url: "secrets-manager-sh/latest/en/content/operations/dynamic-secrets-aws.htm" },
  ],
  apiKey: [
    { title: "Workload authentication in Secrets Manager", url: "secrets-manager-saas/latest/en/content/conjurcloud/ccl-authentication.htm" },
    { title: "Authenticate workload (host) using API key", url: "secrets-manager-saas/latest/en/content/developer/conjur_api_api-key-authn.htm" },
    { title: "API key", url: "secrets-manager-saas/latest/en/content/operations/authn/authn-default.htm" },
    { title: "Secrets Manager Default Authenticator", url: "secrets-manager-sh/latest/en/content/operations/services/default_authn.htm" },
  ],
  cert: [
    { title: "Authenticate with a client certificate", url: "secrets-manager-saas/latest/en/content/developer/api-cert-authn.htm" },
    { title: "Client certificate authentication step-by-step guide", url: "secrets-manager-saas/latest/en/content/operations/authn/authn-cert/authn-cert-step-by-step.htm" },
    { title: "Configure client certificate authentication", url: "secrets-manager-saas/latest/en/content/operations/authn/authn-cert/authn-cert.htm" },
    { title: "Authenticate with a client certificate", url: "secrets-manager-sh/latest/en/content/developer/api-cert-authn.htm" },
    { title: "Certificate authenticator", url: "secrets-manager-sh/latest/en/content/operations/authn/authn-cert/authn-cert.htm" },
  ],
  summon: [
    { title: "Terraform", url: "secrets-manager-sh/latest/en/content/integrations/terraform.htm" },
    { title: "Terraform with the Summon utility", url: "secrets-manager-sh/latest/en/content/integrations/terraform_summon.htm" },
    { title: "Summon-inject secrets", url: "secrets-manager-sh/latest/en/content/tools/summon.html" },
  ],
  rotation: [
    { title: "Idira Vault Synchronizer", url: "secrets-manager-sh/latest/en/content/conjur/cv_synchronizer-lp.htm" },
    { title: "Dual accounts", url: "secrets-manager-saas/latest/en/content/conjurcloud/cc_dual-accounts-link.htm" },
    { title: "Best practices for static secrets", url: "secrets-manager-saas/latest/en/content/conjurcloud/ccl-static-secrets.htm" },
    { title: "Synchronize Safes and accounts from Privilege Cloud/PAM - Self-Hosted", url: "secrets-manager-saas/latest/en/content/conjurcloud/cl_addaccount.htm" },
    { title: "Secrets rotation", url: "secrets-manager-sh/latest/en/content/operations/services/rotate-secrets.htm" },
    { title: "Rotate secrets", url: "secrets-manager-sh/latest/en/content/operations/services/rotation-secrets.html" },
  ],
  mcp: [
    { title: "Secrets Manager MCP server", url: "secrets-manager-saas/latest/en/content/conjurcloud/cc-mcp-server.htm" },
    { title: "Manage users", url: "secrets-manager-saas/latest/en/content/conjurcloud/cl_usermanage.htm" },
  ],
  audit: [
    { title: "Generate activities reports", url: "secrets-manager-saas/latest/en/content/audit/isp_activities-reports.htm" },
    { title: "View system activities", url: "secrets-manager-saas/latest/en/content/audit/isp_system-activities.htm" },
    { title: "Secrets Manager activity", url: "secrets-manager-saas/latest/en/content/conjurcloud/ccl-audit-lp.htm" },
    { title: "Secrets Manager architecture and deployment reference", url: "secrets-manager-sh/latest/en/content/deployment/cjr-architecture.htm" },
    { title: "Splunk", url: "secrets-manager-sh/latest/en/content/integrations/splunk.html" },
    { title: "Audit log file rotation", url: "secrets-manager-sh/latest/en/content/operations/services/audit/cjr-logrotate-util.htm" },
    { title: "Audit event reference", url: "secrets-manager-sh/latest/en/content/operations/services/audit/dap-audit-events.htm" },
    { title: "Audit log structure", url: "secrets-manager-sh/latest/en/content/operations/services/audit/dap-auditlog-structure.htm" },
    { title: "Integrate audit logs with third-party software", url: "secrets-manager-sh/latest/en/content/operations/services/audit/dap-integrate-logs-thirdparty-sw.htm" },
    { title: "Audit service", url: "secrets-manager-sh/latest/en/content/operations/services/audit/dap-overview-audit-service.htm" },
    { title: "SIEM integration API", url: "audit-and-reports/latest/en/content/audit/isp_siem-integration-api.htm" },
    { title: "Secrets Manager - SaaS audit events", url: "audit-and-reports/latest/en/content/audit/product-audits/isp-conjur-audit.htm" },
    { title: "ReIntegrate Audit with third-party SIEM applications", url: "setup/latest/en/content/siem-integration/siem-export-3rd-party.htm" },
    { title: "Integrate Audit with Splunk", url: "setup/latest/en/content/siem-integration/siem-export-splunk.htm" },
  ],
  swaArch: [
    { title: "Secrets Manager support and scope", url: "secrets-manager-saas/latest/en/content/conjurcloud/ccl-support.htm" },
    { title: "Authenticate Secure Workload Access workloads with AWS", url: "secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-aws.htm" },
    { title: "Authenticate Secure Workload Access workloads with Azure", url: "secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-azure.htm" },
    { title: "Authenticate Secure Workload Access workloads with Google Cloud", url: "secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-gcp.htm" },
    { title: "Get started with Secure Workload Access on Kubernetes", url: "secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-getstarted-k8.htm" },
    { title: "Secure Workload Access Helm chart values reference", url: "secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-helm-values.htm" },
    { title: "Install a Secure Workload Access agent on a machine", url: "secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-install-agent-machine.htm" },
    { title: "Install Secure Workload Access on Kubernetes with Helm", url: "secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-install-helm.htm" },
    { title: "Configure JWT requirements for Secure Workload Access integrations", url: "secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-jwt.htm" },
    { title: "Expose the Secure Workload Access Server through a load balancer", url: "secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-loadbalancer.htm" },
    { title: "Configure OIDC issuer values for Secure Workload Access integrations", url: "secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-oidc.htm" },
    { title: "Understand SPIFFE workload identities", url: "secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-overview.htm" },
    { title: "Integrate Secure Workload Access with Secrets Manager JWT authentication", url: "secrets-manager-saas/latest/en/content/operations/services/cjr-authn-jwt-swa.htm" },
    { title: "Attest SWA Agent nodes with Kubernetes PSAT", url: "secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-node-attestation-k8s-psat.htm" },
    { title: "Troubleshoot Secure Workload Access", url: "secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-troubleshooting.htm" },
  ],
  svid: [
    { title: "Understand SPIFFE workload identities", url: "secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-overview.htm" },
    { title: "Get started with Secure Workload Access on Kubernetes", url: "secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-getstarted-k8.htm" },
    { title: "Install Secure Workload Access on Kubernetes with Helm", url: "secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-install-helm.htm" },
    { title: "Expose the Secure Workload Access Server through a load balancer", url: "secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-loadbalancer.htm" },
    { title: "Attest SWA Agent nodes with Kubernetes PSAT", url: "secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-node-attestation-k8s-psat.htm" },
    { title: "Install a Secure Workload Access agent on a machine", url: "secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-install-agent-machine.htm" },
    { title: "Attest SWA Agent nodes with X.509 proof-of-possession", url: "secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-node-attestation-x509pop.htm" },
  ],
  swaS3: [
    { title: "Understand SPIFFE workload identities", url: "secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-overview.htm" },
    { title: "Authenticate Secure Workload Access workloads with AWS", url: "secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-aws.htm" },
    { title: "Configure OIDC issuer values for Secure Workload Access integrations", url: "secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-oidc.htm" },
    { title: "Expose the Secure Workload Access Server through a load balancer", url: "secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-loadbalancer.htm" },
    { title: "Attest SWA Agent nodes with AWS IID (EC2)", url: "secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-node-attestation-aws-iid.htm" },
    { title: "Install Secure Workload Access on Kubernetes with Helm", url: "secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-install-helm.htm" },
  ],
  swaAi: [
    { title: "Secrets Manager support and scope", url: "secrets-manager-saas/latest/en/content/conjurcloud/ccl-support.htm" },
    { title: "Authenticate Secure Workload Access workloads with the Claude API", url: "secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-claude.htm" },
    { title: "Authenticate Gemini Enterprise agents with Secure Workload Access", url: "secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-gemini-enterprise.htm" },
    { title: "Configure OIDC issuer values for Secure Workload Access integrations", url: "secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-oidc.htm" },
    { title: "Authenticate AI agents with JWT SVIDs (SPIFFE)", url: "secrets-manager-saas/latest/en/content/operations/authn/authenticate-ai-spiffe.htm" },
    { title: "Authenticate JWT", url: "secrets-manager-saas/latest/en/content/operations/services/cjr-authn-jwt-lp.htm" },
    { title: "Expose the Secure Workload Access Server through a load balancer", url: "secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-loadbalancer.htm" },
  ],
  cpAgent: [
    { title: "Authentication process", url: "credential-providers/latest/en/content/cp%20and%20ascp/authentication-process.htm" },
    { title: "Build the environment for the Credential Provider", url: "credential-providers/latest/en/content/cp%20and%20ascp/building-cp-environment.htm" },
    { title: "Caching", url: "credential-providers/latest/en/content/cp%20and%20ascp/configuring-caching.htm" },
    { title: "Recommendations for best performance and limitations", url: "credential-providers/latest/en/content/cp%20and%20ascp/cps_capacity-best-practices.htm" },
    { title: "Credential Provider audit trail", url: "credential-providers/latest/en/content/cp%20and%20ascp/monitoring-cp-auditing.htm" },
    { title: "Credential Provider", url: "credential-providers/latest/en/content/cp%20and%20ascp/sysreq-credential-provider.htm" },
    { title: "Application Password SDKs", url: "credential-providers/latest/en/content/cp%20and%20ascp/working-with-application-password-sdk.htm" },
    { title: "Credential Provider (CP)", url: "credential-providers/latest/en/content/landingpages/lp_cp.htm" },
    { title: "Secrets Manager Credential Providers integration", url: "setup/latest/en/content/ispss-deployment/privilege%20cloud/privcloud-cp-integration.htm" },
    { title: "System Requirements", url: "credential-providers/latest/en/content/cp%20and%20ascp/aam-cp-system-requirements.htm" },
  ],
  ascp: [
    { title: "Application authentication methods", url: "credential-providers/latest/en/content/cp%20and%20ascp/application-authentication-methods-general.htm" },
    { title: "Caching", url: "credential-providers/latest/en/content/cp%20and%20ascp/configuring-caching.htm" },
    { title: "Recommendations for best performance and limitations", url: "credential-providers/latest/en/content/cp%20and%20ascp/cps_capacity-best-practices.htm" },
    { title: "Configure dual accounts", url: "credential-providers/latest/en/content/cp%20and%20ascp/cv_automatic_dual_account.htm" },
    { title: "JDBC Driver Proxy for JBoss/Wildfly", url: "credential-providers/latest/en/content/cp%20and%20ascp/jboss-proxymoduleconfig.htm" },
    { title: "JDBC Driver for WebSphere Classic", url: "credential-providers/latest/en/content/cp%20and%20ascp/jdbc-driver-for-websphere-classic.htm" },
    { title: "Application Server Credential Provider (ASCP)", url: "credential-providers/latest/en/content/cp%20and%20ascp/lp_ascp.htm" },
    { title: "Application Server Credential Provider", url: "credential-providers/latest/en/content/cp%20and%20ascp/sysreq-application-server-credential-provider.htm" },
    { title: "JDBC Driver Proxy for Tomcat", url: "credential-providers/latest/en/content/cp%20and%20ascp/tomcat-jdbc-proxy-config.htm" },
    { title: "JDBC Driver Proxy for Weblogic", url: "credential-providers/latest/en/content/cp%20and%20ascp/weblogic_jdbcdrivemodel.htm" },
  ],
  ccp: [
    { title: "Central Credential Provider (CCP)", url: "credential-providers/latest/en/content/landingpages/lp_cpp.htm" },
    { title: "Central Credential Provider environment", url: "credential-providers/latest/en/content/ccp/the-central-credential-provider-environment.htm" },
    { title: "Install the Central Credential Provider (CCP)", url: "credential-providers/latest/en/content/ccp/ccp-installation.htm" },
    { title: "Load balance the Central Credential Provider", url: "credential-providers/latest/en/content/ccp/load-balancing-the-central-credential-provider.htm" },
    { title: "Call the Central Credential Provider Web Service from Your Application Code", url: "credential-providers/latest/en/content/ccp/calling-the-central-credential-provider-web-service-from-your-application-code.htm" },
  ],
  zos: [
    { title: "Application authentication methods", url: "credential-providers/latest/en/content/cp%20and%20ascp/application-authentication-methods-general.htm" },
    { title: "Recommendations for best performance and limitations", url: "credential-providers/latest/en/content/cp%20and%20ascp/cps_capacity-best-practices.htm" },
    { title: "Install the z/OS Credential Provider", url: "credential-providers/latest/en/content/cp%20for%20zos/installing-the-zos-cp.htm" },
    { title: "z/OS Credential Provider", url: "credential-providers/latest/en/content/cp%20for%20zos/configuring-the-zos-provider.htm" },
    { title: "Install the Central Credential Provider", url: "credential-providers/latest/en/content/cp%20for%20zos/installing-the-central-credential-provider.htm" },
  ],
  dual: [
    { title: "Idira Vault Synchronizer", url: "secrets-manager-sh/latest/en/content/conjur/cv_synchronizer-lp.htm" },
    { title: "Synchronize Safes and accounts from Privilege Cloud/PAM - Self-Hosted", url: "secrets-manager-saas/latest/en/content/conjurcloud/cl_addaccount.htm" },
    { title: "Configure dual accounts", url: "credential-providers/latest/en/content/cp%20and%20ascp/cv_automatic_dual_account.htm" },
    { title: "Manage dual accounts", url: "credential-providers/latest/en/content/cp%20and%20ascp/cv_managing-dual-accounts.htm" },
  ],
  shubPc: [
    { title: "Secrets Hub architecture", url: "secrets-hub-privilege-cloud/latest/en/secretshubcontent/sh-architecture-diagram/" },
    { title: "Connector requirements", url: "secrets-hub-privilege-cloud/latest/en/secretshubcontent/sh-requirements/" },
    { title: "Secure your environment using Secrets Hub static IPs", url: "secrets-hub-privilege-cloud/latest/en/secretshubcontent/sh-network-hardening/" },
    { title: "AWS secret stores", url: "secrets-hub-privilege-cloud/latest/en/secretshubcontent/aws-sync-targets/", key: 'shub-aws' },
    { title: "Give Secrets Hub permissions to access AWS", url: "secrets-hub-privilege-cloud/latest/en/secretshubcontent/aws-config/", key: 'shub-aws' },
    { title: "Resources added to AWS for Secrets Hub", url: "secrets-hub-privilege-cloud/latest/en/secretshubcontent/aws-resources/", key: 'shub-aws' },
    { title: "Microsoft Azure secret stores", url: "secrets-hub-privilege-cloud/latest/en/secretshubcontent/sh-azure-sync-targets/", key: 'shub-akv' },
    { title: "Give Secrets Hub permissions to access Azure Key Vault", url: "secrets-hub-privilege-cloud/latest/en/secretshubcontent/sh-azure-federated-authentication/", key: 'shub-akv' },
    { title: "Resources added to Azure for Secrets Hub", url: "secrets-hub-privilege-cloud/latest/en/secretshubcontent/azure-resources/", key: 'shub-akv' },
    { title: "GCP secret stores", url: "secrets-hub-privilege-cloud/latest/en/secretshubcontent/sh-gcp-secret-store/", key: 'shub-gsm' },
    { title: "Give Secrets Hub permissions to access GCP Secret Manager", url: "secrets-hub-privilege-cloud/latest/en/secretshubcontent/sh-gcp-configure-role/", key: 'shub-gsm' },
    { title: "Add a GCP secret store", url: "secrets-hub-privilege-cloud/latest/en/secretshubcontent/sh-gcp-add-secret-store/", key: 'shub-gsm' },
    { title: "HashiCorp secret stores", url: "secrets-hub-privilege-cloud/latest/en/secretshubcontent/sh-hashicorp-secret-stores/", key: 'shub-hcv' },
    { title: "Add a HashiCorp secret store", url: "secrets-hub-privilege-cloud/latest/en/secretshubcontent/sh-add-hashi-secret-store/", key: 'shub-hcv' },
  ],
  shubSh: [
    { title: "Secrets Hub architecture", url: "secrets-hub-pam-sh/latest/en/secretshubcontent/sh-architecture-diagram/" },
    { title: "Connect Secrets Hub to PAM - Self-Hosted", url: "secrets-hub-pam-sh/latest/en/secretshubcontent/sh-connect-pam-sh/" },
    { title: "Connector requirements", url: "secrets-hub-pam-sh/latest/en/secretshubcontent/sh-requirements/" },
    { title: "Secure your environment using Secrets Hub static IPs", url: "secrets-hub-pam-sh/latest/en/secretshubcontent/sh-network-hardening/" },
    { title: "AWS secret stores", url: "secrets-hub-pam-sh/latest/en/secretshubcontent/aws-sync-targets/", key: 'shub-aws' },
    { title: "Give Secrets Hub permissions to access AWS", url: "secrets-hub-pam-sh/latest/en/secretshubcontent/aws-config/", key: 'shub-aws' },
    { title: "Resources added to AWS for Secrets Hub", url: "secrets-hub-pam-sh/latest/en/secretshubcontent/aws-resources/", key: 'shub-aws' },
    { title: "Microsoft Azure secret stores", url: "secrets-hub-pam-sh/latest/en/secretshubcontent/sh-azure-sync-targets/", key: 'shub-akv' },
    { title: "Give Secrets Hub permissions to access Azure Key Vault", url: "secrets-hub-pam-sh/latest/en/secretshubcontent/sh-azure-federated-authentication/", key: 'shub-akv' },
    { title: "Resources added to Azure for Secrets Hub", url: "secrets-hub-pam-sh/latest/en/secretshubcontent/azure-resources/", key: 'shub-akv' },
    { title: "GCP secret stores", url: "secrets-hub-pam-sh/latest/en/secretshubcontent/sh-gcp-secret-store/", key: 'shub-gsm' },
    { title: "Give Secrets Hub permissions to access GCP Secret Manager", url: "secrets-hub-pam-sh/latest/en/secretshubcontent/sh-gcp-configure-role/", key: 'shub-gsm' },
    { title: "Add a GCP secret store", url: "secrets-hub-pam-sh/latest/en/secretshubcontent/sh-gcp-add-secret-store/", key: 'shub-gsm' },
    { title: "HashiCorp secret stores", url: "secrets-hub-pam-sh/latest/en/secretshubcontent/sh-hashicorp-secret-stores/", key: 'shub-hcv' },
    { title: "Add a HashiCorp secret store", url: "secrets-hub-pam-sh/latest/en/secretshubcontent/sh-add-hashi-secret-store/", key: 'shub-hcv' },
  ],
}

/** Titles of the docs cited by the network catalog (netCatalog.ts S), from the docs mirror. */
export const DOC_TITLES: Record<string, string> = {
  "credential-providers/latest/en/content/ccp/ccp-installation.htm": "Install the Central Credential Provider (CCP)",
  "credential-providers/latest/en/content/cp and ascp/silent-installation-windows.htm": "Silent installation",
  "credential-providers/latest/en/content/cp for zos/local-zos-credential-provider-configuration-file.htm": "Local z/OS Credential Provider configuration file",
  "secrets-hub-pam-sh/latest/en/secretshubcontent/sh-connect-pam-sh/": "Connect Secrets Hub to PAM - Self-Hosted",
  "secrets-hub-pam-sh/latest/en/secretshubcontent/sh-requirements/": "Connector requirements",
  "secrets-hub-pam-sh/latest/en/secretshubcontent/sh-support/": "Secrets Hub support and scope",
  "secrets-hub-privilege-cloud/latest/en/secretshubcontent/aws-config/": "Give Secrets Hub permissions to access AWS",
  "secrets-hub-privilege-cloud/latest/en/secretshubcontent/sh-add-hashi-secret-store/": "Add a HashiCorp secret store",
  "secrets-hub-privilege-cloud/latest/en/secretshubcontent/sh-architecture-diagram/": "Secrets Hub architecture",
  "secrets-hub-privilege-cloud/latest/en/secretshubcontent/sh-gcp-add-secret-store/": "Add a GCP secret store",
  "secrets-hub-privilege-cloud/latest/en/secretshubcontent/sh-network-hardening/": "Secure your environment using Secrets Hub static IPs",
  "secrets-manager-saas/latest/en/content/conjur/cv_configursynchronizer.htm": "Vault Synchronizer configuration files",
  "secrets-manager-saas/latest/en/content/conjurcloud/cc-mcp-server.htm": "Secrets Manager MCP server",
  "secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-aws.htm": "Authenticate Secure Workload Access workloads with AWS",
  "secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-azure.htm": "Authenticate Secure Workload Access workloads with Azure",
  "secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-claude.htm": "Authenticate Secure Workload Access workloads with the Claude API",
  "secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-loadbalancer.htm": "Expose the Secure Workload Access Server through a load balancer",
  "secrets-manager-saas/latest/en/content/conjurcloud/ccl-swa-node-attestation-aws-iid.htm": "Attest SWA Agent nodes with AWS IID (EC2)",
  "secrets-manager-saas/latest/en/content/conjurcloud/ccl-sys-req.htm": "System requirements for Secrets Manager components",
  "secrets-manager-saas/latest/en/content/conjurcloud/edge/ccl-edge-install.htm": "Install Secrets Manager Edge",
  "secrets-manager-saas/latest/en/content/conjurcloud/edge/ccl-edge-support.htm": "Secrets Manager Edge security best practices and support",
  "secrets-manager-saas/latest/en/content/developer/conjur_api_authenticate_user.htm": "Authenticate user",
  "secrets-manager-saas/latest/en/content/integrations/ansible.html": "Ansible",
  "secrets-manager-saas/latest/en/content/integrations/azure-devops-extension.htm": "Azure DevOps",
  "secrets-manager-saas/latest/en/content/integrations/bitbucket-pipeline-e2e.htm": "Bitbucket",
  "secrets-manager-saas/latest/en/content/integrations/circle-ci.htm": "CircleCI",
  "secrets-manager-saas/latest/en/content/integrations/github-actions.htm": "GitHub Actions",
  "secrets-manager-saas/latest/en/content/integrations/gitlab.htm": "GitLab",
  "secrets-manager-saas/latest/en/content/integrations/jenkins.htm": "Jenkins",
  "secrets-manager-saas/latest/en/content/integrations/k8s-ocp/k8s-jwt-authn.htm": "JWT-based Kubernetes authentication",
  "secrets-manager-saas/latest/en/content/integrations/mulesoft.htm": "MuleSoft",
  "secrets-manager-saas/latest/en/content/integrations/octopus.htm": "Octopus",
  "secrets-manager-saas/latest/en/content/integrations/python.htm": "Secrets Manager Python API",
  "secrets-manager-saas/latest/en/content/integrations/terraform_provider.htm": "Terraform",
  "secrets-manager-saas/latest/en/content/operations/authn/authenticate-ai-spiffe.htm": "Authenticate AI agents with JWT SVIDs (SPIFFE)",
  "secrets-manager-saas/latest/en/content/operations/authn/authenticate-awsiam-config.htm": "Configure the AWS IAM authenticator",
  "secrets-manager-saas/latest/en/content/operations/authn/authenticate-awsiam-overview.htm": "Authenticate AWS workloads with AWS IAM Authenticator",
  "secrets-manager-saas/latest/en/content/operations/authn/authenticate-azure-config.htm": "Configure an Azure Authenticator",
  "secrets-manager-saas/latest/en/content/operations/authn/authenticate-azure-overview.htm": "Authenticate Azure workloads with Azure Authenticator",
  "secrets-manager-saas/latest/en/content/operations/authn/authenticate-gcp-config.htm": "Configure the GCP authenticator",
  "secrets-manager-saas/latest/en/content/operations/authn/authn-default.htm": "API key",
  "secrets-manager-saas/latest/en/content/operations/dynamic-secrets-aws.htm": "Create AWS dynamic secrets",
  "secrets-manager-saas/latest/en/content/operations/dynamic-secrets-gcp.htm": "Create GCP dynamic secrets",
  "secrets-manager-saas/latest/en/content/operations/services/cjr-authn-jwt-guidelines.htm": "Important guidelines for configuring JWT authentication",
  "secrets-manager-sh/latest/en/content/deployment/dap/dap-before-deploy-vm.htm": "Deploy a Secrets Manager container image",
  "secrets-manager-sh/latest/en/content/integrations/cloud-foundry.html": "Cloud Foundry",
  "secrets-manager-sh/latest/en/content/integrations/k8s-ocp/k8s-conjfollower.htm": "Secrets Manager Follower inside OpenShift/Kubernetes cluster",
  "secrets-manager-sh/latest/en/content/integrations/k8s-ocp/k8s-secretless-sidecar.htm": "Secretless Broker Sidecar",
  "secrets-manager-sh/latest/en/content/integrations/puppet.html": "Puppet",
  "setup/latest/en/content/ispss-deployment/deployment/deploy-cm_requirements.htm": "Connector Management requirements",
}

/** Title for a docs.cyberark.com URL, or the URL path when unknown. */
export const docTitle = (url: string): string => {
  const rel = decodeURI(url.replace(DOCS_BASE, ''))
  const twin = rel.includes('secrets-manager-sh/') ? rel.replace('secrets-manager-sh/', 'secrets-manager-saas/') : rel.replace('secrets-manager-saas/', 'secrets-manager-sh/')
  const find = (r: string) => DOC_TITLES[r] ?? Object.values(REC_DOCS).flat().find(d => decodeURI(d.url) === r)?.title
  return find(rel) ?? find(twin) ?? rel
}

/** Catalog doc paths (after /content/) published for both editions: swapped to the edition in use. */
const BOTH_EDITIONS = new Set([
  "conjur/cv_configursynchronizer.htm",
  "integrations/ansible.html",
  "integrations/azure-devops-extension.htm",
  "integrations/bitbucket-pipeline-e2e.htm",
  "integrations/circle-ci.htm",
  "integrations/github-actions.htm",
  "integrations/gitlab.htm",
  "integrations/jenkins.htm",
  "integrations/k8s-ocp/k8s-jwt-authn.htm",
  "integrations/mulesoft.htm",
  "integrations/octopus.htm",
  "integrations/python.htm",
  "integrations/terraform_provider.htm",
  "operations/dynamic-secrets-aws.htm",
  "operations/services/cjr-authn-jwt-guidelines.htm",
])

/** Same topic under a different path in each edition: [SaaS path, Self-Hosted path]. */
const TWINS: Array<[string, string]> = [
  ['operations/authn/authn-default.htm', 'developer/conjur_api_api-key-authn.htm'],
  ['conjurcloud/cl_addaccount.htm', 'conjur/cv_synchronizer-lp.htm'],
]

/** The same doc in the edition in use, when that page exists for it. */
export const forEdition = (url: string, edition: Edition): string => {
  const m = url.match(/secrets-manager-(saas|sh)\/latest\/en\/content\/(.+)$/)
  if (!m) return url
  const want = edition === 'saas' ? 'secrets-manager-saas/' : 'secrets-manager-sh/'
  const twin = TWINS.find(t => t.includes(m[2]))
  if (twin) return url.replace(/secrets-manager-(saas|sh)\/latest\/en\/content\/.+$/, `${want}latest/en/content/${twin[edition === 'saas' ? 0 : 1]}`)
  if (!BOTH_EDITIONS.has(decodeURI(m[2])) && !BOTH_EDITIONS.has(m[2])) return url
  return url.replace(/secrets-manager-(saas|sh)\//, want)
}

/** docs.cyberark.com URL safe to paste in a text report (some paths have spaces). */
export const docHref = (url: string) => encodeURI(decodeURI(url))

/** Edition a doc belongs to, from its URL (null = edition-neutral). */
export const docEdition = (url: string): Edition | null =>
  url.includes('secrets-manager-saas/') ? 'saas' : url.includes('secrets-manager-sh/') ? 'selfhosted' : null

/** Main doc of each recommendation (path after /content/), listed first and used in the reading path. */
const PRIMARY: Record<string, string[]> = {
  k8sArch: ['integrations/k8s-ocp/k8s-jwt-authn.htm', 'integrations/k8s-ocp/cjr-k8s-jwt-sp-lp.htm'],
  sdk: ['developer/conjur-api-java.html'],
  sidecar: ['integrations/k8s-ocp/cjr-k8s-jwt-sp-ic-lp.htm'],
  spmodes: ['integrations/k8s-ocp/cjr-k8s-jwt-sp-lp.htm'],
  secretless: ['integrations/k8s-ocp/k8s-secretless-sidecar.htm'],
  azdo: ['integrations/azure-devops-extension.htm'],
  python: ['integrations/python.htm'],
  awsIam: ['operations/authn/authenticate-awsiam-overview.htm'],
  azureMi: ['operations/authn/authenticate-azure-overview.htm'],
  gcpId: ['operations/authn/authenticate-gcp-lp.htm'],
  apiKey: ['operations/authn/authn-default.htm'],
  cert: ['operations/authn/authn-cert/authn-cert.htm'],
  summon: ['tools/summon.html'],
  dynamic: ['conjurcloud/ccl-dynamic-secrets.htm'],
  rotation: ['conjurcloud/cl_addaccount.htm', 'conjur/cv_synchronizer-lp.htm'],
  audit: ['conjurcloud/ccl-audit-lp.htm'],
  swaArch: ['conjurcloud/ccl-swa-overview.htm', 'conjurcloud/ccl-swa-getstarted-k8.htm', 'conjurcloud/ccl-swa-install-helm.htm', 'conjurcloud/ccl-swa-loadbalancer.htm'],
  swaS3: ['conjurcloud/ccl-swa-aws.htm'],
  swaAi: ['operations/authn/authenticate-ai-spiffe.htm'],
  cpAgent: ['landingpages/lp_cp.htm', 'cp%20and%20ascp/aam-cp-system-requirements.htm'],
  ascp: ['cp%20and%20ascp/lp_ascp.htm', 'cp%20and%20ascp/sysreq-application-server-credential-provider.htm'],
  zos: ['cp%20for%20zos/configuring-the-zos-provider.htm', 'cp%20for%20zos/installing-the-zos-cp.htm'],
  dual: ['cp%20and%20ascp/cv_automatic_dual_account.htm', 'conjurcloud/cl_addaccount.htm', 'conjur/cv_synchronizer-lp.htm'],
}
const rank = (rec: string, url: string) => {
  const i = (PRIMARY[rec] ?? []).findIndex(p => url.endsWith(p))
  return i < 0 ? 1e3 : i
}

/**
 * Absolute docs for a recommendation, filtered by edition and by the integration
 * keys in play. A recommendation documented only for the other edition (Summon,
 * Secretless, Puppet, Cloud Foundry) keeps those docs instead of showing none.
 */
export function recDocs(rec: string, edition: Edition, keys: Set<string>): Array<{ title: string; url: string }> {
  const all = (REC_DOCS[rec] ?? []).filter(d => !d.key || keys.has(d.key))
  let list = all.filter(d => { const e = docEdition(d.url); return !e || e === edition })
  if (!list.some(d => docEdition(d.url) === edition)) list = [...list, ...all.filter(d => !list.includes(d))]
  return list
    .map((d, i) => ({ d, i })).sort((a, b) => rank(rec, a.d.url) - rank(rec, b.d.url) || a.i - b.i).map(x => x.d)
    .map(d => ({ title: d.title, url: docHref(d.url.startsWith('http') ? d.url : DOCS_BASE + d.url) }))
}
