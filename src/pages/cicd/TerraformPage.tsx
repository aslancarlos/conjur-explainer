import TerraformFlow from '../../components/flow/specs/cicd/TerraformFlow'
import CiToolPage from './CiToolPage'

const DOCS = [
  { key: 'doc_saas', href: 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/integrations/terraform_provider.htm' },
  { key: 'doc_sh_overview', href: 'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/integrations/terraform.htm' },
  { key: 'doc_sh', href: 'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/integrations/terraform_provider.htm' },
  { key: 'doc_sh_summon', href: 'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/integrations/terraform_summon.htm' },
  { key: 'doc_github', href: 'https://github.com/cyberark/terraform-provider-conjur' },
]

/** CI/CD use case: Terraform with the Secrets Manager provider (and Summon on Self-Hosted). */
export default function TerraformPage() {
  return <CiToolPage ns="ci_terraform" Flow={TerraformFlow} docs={DOCS} />
}
