import CiOidcPage from './CiOidcPage'
import CircleCiFlow from '../../components/flow/specs/cicd/CircleCiFlow'

/** /cicd/circleci: CircleCI jobs fetch secrets with the Conjur orb over OIDC (authn-jwt). */
export default function CircleCiPage() {
  return (
    <CiOidcPage ns="ci_circleci" Flow={CircleCiFlow} saas selfHosted docs={[
      'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/integrations/circle-ci.htm',
      'https://docs.cyberark.com/secrets-manager-sh/latest/en/content/integrations/circle-ci.htm',
      'https://circleci.com/docs/guides/permissions-authentication/openid-connect-tokens/',
      'https://docs.cyberark.com/secrets-manager-saas/latest/en/content/operations/services/cjr-authn-jwt-lp.htm',
    ]} />
  )
}
