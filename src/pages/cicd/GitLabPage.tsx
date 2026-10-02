import GitLabFlow from '../../components/flow/specs/cicd/GitLabFlow'
import CiToolPage from './CiToolPage'

const DOCS = [
  { key: 'doc_saas', href: 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/integrations/gitlab.htm' },
  { key: 'doc_sh', href: 'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/integrations/gitlab.htm' },
  { key: 'doc_saas_uc', href: 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/operations/services/cjr-authn-jwt-uc.htm' },
  { key: 'doc_saas_jwt', href: 'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/operations/services/cjr-authn-jwt-lp.htm' },
]

/** CI/CD use case: GitLab CI with the authn-jwt-gitlab image (JWT from GitLab ID tokens). */
export default function GitLabPage() {
  return <CiToolPage ns="ci_gitlab" Flow={GitLabFlow} docs={DOCS} />
}
