import CiOidcPage from './CiOidcPage'
import BitbucketFlow from '../../components/flow/specs/cicd/BitbucketFlow'

/** /cicd/bitbucket: Bitbucket Pipelines fetch secrets with the Conjur Bitbucket Pipe over OIDC (authn-jwt). */
export default function BitbucketPage() {
  return (
    <CiOidcPage ns="ci_bitbucket" Flow={BitbucketFlow} saas selfHosted docs={[
      'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/integrations/bitbucket-pipeline-e2e.htm',
      'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/integrations/bitbucket-pipeline-e2e.htm',
      'https://github.com/cyberark/conjur-bitbucket-pipe',
      'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/operations/services/cjr-authn-jwt-lp.htm',
    ]} />
  )
}
