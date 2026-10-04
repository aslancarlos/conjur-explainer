import AzureDevOpsFlow from '../../components/flow/specs/cicd/AzureDevOpsFlow'
import CiToolPage from './CiToolPage'

const DOCS = [
  { key: 'doc_saas', href: 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/integrations/azure-devops-extension.htm' },
  { key: 'doc_saas_e2e', href: 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/integrations/azure-devops-extension-e2e.htm' },
  { key: 'doc_sh', href: 'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/integrations/azure-devops-extension.htm' },
  { key: 'doc_sh_e2e', href: 'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/integrations/azure-devops-extension-e2e.htm' },
  { key: 'doc_marketplace', href: 'https://marketplace.visualstudio.com/items?itemName=CyberArk.cyberark-conjur-credentials' },
]

/** CI/CD use case: Azure DevOps with the Idira Conjur Service Connector (JWT or API key). */
export default function AzureDevOpsPage() {
  return <CiToolPage ns="ci_azdo" Flow={AzureDevOpsFlow} docs={DOCS} />
}
